"""GDPR compliance endpoints — data export, deletion, and opt-out."""
from __future__ import annotations
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.dependencies import get_current_tenant, get_db
from app.models.lead import Lead, LeadEvent
from app.models.task import Task
from app.models.tenant import Tenant
from app.models.workflow import WorkflowExecution

router = APIRouter(prefix="/api/v1/gdpr", tags=["gdpr"])


@router.post("/export/{lead_id}")
def export_lead_data(
    lead_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Export all data associated with a lead (GDPR Subject Access Request)."""
    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    events = db.query(LeadEvent).filter_by(lead_id=lead.id).all()
    tasks = db.query(Task).filter_by(lead_id=lead.id).all()
    executions = db.query(WorkflowExecution).filter_by(lead_id=lead.id).all()

    data = {
        "lead": {
            "id": str(lead.id),
            "email": lead.email,
            "phone": lead.phone,
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "source": lead.source,
            "score": lead.score,
            "custom_fields": lead.custom_fields,
            "created_at": lead.created_at.isoformat(),
        },
        "events": [
            {"type": e.event_type, "data": e.metadata_, "at": e.created_at.isoformat()}
            for e in events
        ],
        "tasks": [
            {"title": t.title, "status": t.status, "created_at": t.created_at.isoformat()}
            for t in tasks
        ],
        "workflow_executions": [
            {"workflow_id": str(ex.workflow_id), "status": ex.status, "started_at": ex.started_at.isoformat()}
            for ex in executions
        ],
    }

    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f"attachment; filename=lead_{lead_id}_export.json"},
    )


@router.post("/delete/{lead_id}", status_code=204)
def delete_lead_data(
    lead_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Permanently delete a lead and all associated data (GDPR Right to Erasure)."""
    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    # Delete in dependency order
    db.query(WorkflowExecution).filter_by(lead_id=lead.id).delete()
    db.query(Task).filter_by(lead_id=lead.id).delete()
    db.query(LeadEvent).filter_by(lead_id=lead.id).delete()
    # Clear duplicate references pointing to this lead
    db.query(Lead).filter_by(duplicate_of=lead.id).update({"duplicate_of": None, "is_duplicate": False})
    db.delete(lead)
    db.commit()


@router.post("/opt-out/{lead_id}")
def opt_out_lead(
    lead_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Mark a lead as opted out — stops all automation."""
    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    lead.opted_out = True

    # Cancel all running workflow executions for this lead
    running = db.query(WorkflowExecution).filter_by(
        lead_id=lead.id, status="running"
    ).all()
    for ex in running:
        ex.status = "cancelled"

    db.commit()
    return {"status": "opted_out", "cancelled_workflows": len(running)}
