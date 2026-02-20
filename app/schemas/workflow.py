from __future__ import annotations
import uuid
from datetime import datetime

from pydantic import BaseModel


class WorkflowStepCreate(BaseModel):
    position: int
    step_type: str  # send_email, send_sms, delay, condition, assign_task, move_stage, send_scheduling_link
    config: dict = {}


class WorkflowStepOut(BaseModel):
    id: uuid.UUID
    position: int
    step_type: str
    config: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkflowCreate(BaseModel):
    name: str
    trigger_type: str  # on_lead_created, on_stage_changed, manual, scheduled
    trigger_config: dict = {}
    steps: list[WorkflowStepCreate] = []


class WorkflowUpdate(BaseModel):
    name: str | None = None
    trigger_type: str | None = None
    trigger_config: dict | None = None
    steps: list[WorkflowStepCreate] | None = None


class WorkflowOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    trigger_type: str
    trigger_config: dict
    is_active: bool
    steps: list[WorkflowStepOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowExecutionOut(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    lead_id: uuid.UUID
    current_step: int
    status: str
    next_run_at: datetime | None
    started_at: datetime
    completed_at: datetime | None
    error: str | None

    model_config = {"from_attributes": True}
