from __future__ import annotations
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_tenant, get_db
from app.models.lead import Lead
from app.models.tenant import Tenant
from app.models.workflow import Workflow, WorkflowExecution, WorkflowStep
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowExecutionOut,
    WorkflowOut,
    WorkflowUpdate,
)
try:
    from app.workers.tasks_workflow import execute_workflow_step
    _celery_available = True
except Exception:
    _celery_available = False

router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])


@router.get("/", response_model=list[WorkflowOut])
def list_workflows(tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return db.query(Workflow).filter_by(tenant_id=tenant.id).all()


@router.post("/", response_model=WorkflowOut, status_code=201)
def create_workflow(
    payload: WorkflowCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    workflow = Workflow(
        tenant_id=tenant.id,
        name=payload.name,
        trigger_type=payload.trigger_type,
        trigger_config=payload.trigger_config,
    )
    db.add(workflow)
    db.flush()

    for step_data in payload.steps:
        step = WorkflowStep(
            workflow_id=workflow.id,
            tenant_id=tenant.id,
            position=step_data.position,
            step_type=step_data.step_type,
            config=step_data.config,
        )
        db.add(step)

    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("/{workflow_id}", response_model=WorkflowOut)
def get_workflow(workflow_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter_by(id=workflow_id, tenant_id=tenant.id).first()
    if not wf:
        raise HTTPException(404, "Workflow not found")
    return wf


@router.put("/{workflow_id}", response_model=WorkflowOut)
def update_workflow(
    workflow_id: uuid.UUID,
    payload: WorkflowUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    wf = db.query(Workflow).filter_by(id=workflow_id, tenant_id=tenant.id).first()
    if not wf:
        raise HTTPException(404, "Workflow not found")

    if payload.name is not None:
        wf.name = payload.name
    if payload.trigger_type is not None:
        wf.trigger_type = payload.trigger_type
    if payload.trigger_config is not None:
        wf.trigger_config = payload.trigger_config

    # Replace steps if provided
    if payload.steps is not None:
        db.query(WorkflowStep).filter_by(workflow_id=wf.id).delete()
        for step_data in payload.steps:
            step = WorkflowStep(
                workflow_id=wf.id,
                tenant_id=tenant.id,
                position=step_data.position,
                step_type=step_data.step_type,
                config=step_data.config,
            )
            db.add(step)

    db.commit()
    db.refresh(wf)
    return wf


@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(workflow_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter_by(id=workflow_id, tenant_id=tenant.id).first()
    if not wf:
        raise HTTPException(404, "Workflow not found")
    db.delete(wf)  # CASCADE deletes steps
    db.commit()


@router.post("/{workflow_id}/activate", response_model=WorkflowOut)
def activate_workflow(workflow_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter_by(id=workflow_id, tenant_id=tenant.id).first()
    if not wf:
        raise HTTPException(404, "Workflow not found")
    if not wf.steps:
        raise HTTPException(400, "Cannot activate a workflow with no steps")
    wf.is_active = True
    db.commit()
    db.refresh(wf)
    return wf


@router.post("/{workflow_id}/deactivate", response_model=WorkflowOut)
def deactivate_workflow(workflow_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter_by(id=workflow_id, tenant_id=tenant.id).first()
    if not wf:
        raise HTTPException(404, "Workflow not found")
    wf.is_active = False
    db.commit()
    db.refresh(wf)
    return wf


@router.get("/{workflow_id}/executions", response_model=list[WorkflowExecutionOut])
def list_executions(
    workflow_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    return (
        db.query(WorkflowExecution)
        .filter_by(workflow_id=workflow_id, tenant_id=tenant.id)
        .order_by(WorkflowExecution.started_at.desc())
        .limit(100)
        .all()
    )


@router.post("/{workflow_id}/execute/{lead_id}", response_model=WorkflowExecutionOut, status_code=201)
def manual_trigger(
    workflow_id: uuid.UUID,
    lead_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Manually trigger a workflow for a specific lead."""
    wf = db.query(Workflow).filter_by(id=workflow_id, tenant_id=tenant.id).first()
    if not wf:
        raise HTTPException(404, "Workflow not found")

    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    execution = WorkflowExecution(
        workflow_id=wf.id,
        lead_id=lead.id,
        tenant_id=tenant.id,
        current_step=0,
        status="running",
        next_run_at=datetime.now(timezone.utc),
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    # Kick off first step (if Celery/Redis is available)
    if _celery_available:
        execute_workflow_step.delay(str(execution.id))

    return execution
