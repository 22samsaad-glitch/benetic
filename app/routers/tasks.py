from __future__ import annotations
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_tenant, get_db
from app.models.task import Task
from app.models.tenant import Tenant
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskOut])
def list_tasks(
    assigned_to: uuid.UUID | None = None,
    status: str | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    q = db.query(Task).filter_by(tenant_id=tenant.id)
    if assigned_to:
        q = q.filter(Task.assigned_to == assigned_to)
    if status:
        q = q.filter(Task.status == status)
    return q.order_by(Task.due_at.asc().nullslast()).all()


@router.post("/", response_model=TaskOut, status_code=201)
def create_task(payload: TaskCreate, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    task = Task(tenant_id=tenant.id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter_by(id=task_id, tenant_id=tenant.id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(task_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    task = db.query(Task).filter_by(id=task_id, tenant_id=tenant.id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    task = db.query(Task).filter_by(id=task_id, tenant_id=tenant.id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()
