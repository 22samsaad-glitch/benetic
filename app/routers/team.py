from __future__ import annotations
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.dependencies import get_current_tenant, get_db, hash_password, require_role
from app.models.tenant import Tenant, User
from app.schemas.tenant import UserOut

router = APIRouter(prefix="/api/v1/team", tags=["team"])


class InviteRequest(BaseModel):
    email: EmailStr
    name: str
    role: str = "member"  # member, admin
    password: str  # temporary password — in production, send an invite email instead


class UpdateRoleRequest(BaseModel):
    role: str


@router.get("/", response_model=list[UserOut])
def list_team(tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return db.query(User).filter_by(tenant_id=tenant.id).all()


@router.post("/invite", response_model=UserOut, status_code=201)
def invite_member(
    payload: InviteRequest,
    tenant: Tenant = Depends(get_current_tenant),
    user: User = Depends(require_role("owner", "admin")),
    db: Session = Depends(get_db),
):
    if payload.role not in ("member", "admin"):
        raise HTTPException(400, "Role must be 'member' or 'admin'")

    existing = db.query(User).filter_by(tenant_id=tenant.id, email=payload.email).first()
    if existing:
        raise HTTPException(409, "User with this email already exists")

    new_user = User(
        tenant_id=tenant.id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserOut)
def update_role(
    user_id: uuid.UUID,
    payload: UpdateRoleRequest,
    tenant: Tenant = Depends(get_current_tenant),
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter_by(id=user_id, tenant_id=tenant.id).first()
    if not target:
        raise HTTPException(404, "User not found")
    if target.role == "owner":
        raise HTTPException(400, "Cannot change the owner's role")
    target.role = payload.role
    db.commit()
    db.refresh(target)
    return target


@router.delete("/{user_id}", status_code=204)
def deactivate_member(
    user_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    user: User = Depends(require_role("owner", "admin")),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter_by(id=user_id, tenant_id=tenant.id).first()
    if not target:
        raise HTTPException(404, "User not found")
    if target.role == "owner":
        raise HTTPException(400, "Cannot deactivate the owner")
    target.is_active = False
    db.commit()
