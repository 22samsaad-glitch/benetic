from __future__ import annotations
import uuid
from datetime import datetime

from pydantic import BaseModel


class TemplateCreate(BaseModel):
    name: str
    channel: str  # email, sms
    subject: str | None = None
    body: str


class TemplateUpdate(BaseModel):
    name: str | None = None
    channel: str | None = None
    subject: str | None = None
    body: str | None = None
    is_active: bool | None = None


class TemplateOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    channel: str
    subject: str | None
    body: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TemplatePreview(BaseModel):
    """Sample data for rendering a template preview."""
    first_name: str = "Jane"
    last_name: str = "Doe"
    email: str = "jane@example.com"
    phone: str = "+15551234567"
    source: str = "website"
    score: int = 75
    custom_fields: dict = {}


class TemplatePreviewOut(BaseModel):
    subject: str | None
    body: str
