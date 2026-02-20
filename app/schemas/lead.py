from __future__ import annotations
import uuid
from datetime import datetime

from pydantic import BaseModel


class LeadCreate(BaseModel):
    email: str | None = None
    phone: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    source: str = "manual"
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    custom_fields: dict = {}
    stage_id: uuid.UUID | None = None
    assigned_to: uuid.UUID | None = None


class LeadUpdate(BaseModel):
    email: str | None = None
    phone: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    custom_fields: dict | None = None
    stage_id: uuid.UUID | None = None
    assigned_to: uuid.UUID | None = None


class LeadOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str | None
    phone: str | None
    first_name: str | None
    last_name: str | None
    source: str
    utm_source: str | None
    utm_medium: str | None
    utm_campaign: str | None
    score: int
    stage_id: uuid.UUID | None
    assigned_to: uuid.UUID | None
    custom_fields: dict
    is_duplicate: bool
    opted_out: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LeadMoveStage(BaseModel):
    stage_id: uuid.UUID


class LeadAssign(BaseModel):
    user_id: uuid.UUID


class LeadEventOut(BaseModel):
    id: uuid.UUID
    lead_id: uuid.UUID
    event_type: str
    metadata_: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class LeadListResponse(BaseModel):
    items: list[LeadOut]
    total: int
    page: int
    per_page: int
