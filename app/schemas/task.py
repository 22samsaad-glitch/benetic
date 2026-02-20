from __future__ import annotations
import uuid
from datetime import datetime

from pydantic import BaseModel


class TaskCreate(BaseModel):
    lead_id: uuid.UUID
    assigned_to: uuid.UUID | None = None
    title: str
    description: str | None = None
    due_at: datetime | None = None


class TaskUpdate(BaseModel):
    assigned_to: uuid.UUID | None = None
    title: str | None = None
    description: str | None = None
    due_at: datetime | None = None


class TaskOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    lead_id: uuid.UUID
    assigned_to: uuid.UUID | None
    title: str
    description: str | None
    due_at: datetime | None
    status: str
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
