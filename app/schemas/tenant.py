from __future__ import annotations
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class TenantRegister(BaseModel):
    business_name: str
    slug: str
    owner_name: str
    owner_email: EmailStr
    password: str


class TenantOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    webhook_key: str
    settings: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
