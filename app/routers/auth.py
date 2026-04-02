from __future__ import annotations
import re

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_db,
    hash_password,
    verify_password,
)
from app.models.pipeline import Pipeline, PipelineStage
from app.models.tenant import Tenant, User
from app.schemas.tenant import (
    LoginRequest,
    RefreshRequest,
    TenantOut,
    TenantRegister,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: TenantRegister, db: Session = Depends(get_db)):
    # Validate slug format
    if not re.match(r"^[a-z0-9-]+$", payload.slug):
        raise HTTPException(400, "Slug must contain only lowercase letters, numbers, and hyphens")

    # Check slug uniqueness
    if db.query(Tenant).filter_by(slug=payload.slug).first():
        raise HTTPException(409, "Slug already taken")

    # Check email uniqueness (global for simplicity)
    if db.query(User).filter_by(email=payload.owner_email).first():
        raise HTTPException(409, "Email already registered")

    # Create tenant
    tenant = Tenant(name=payload.business_name, slug=payload.slug)
    db.add(tenant)
    db.flush()

    # Create owner user
    user = User(
        tenant_id=tenant.id,
        email=payload.owner_email,
        password_hash=hash_password(payload.password),
        name=payload.owner_name,
        role="owner",
    )
    db.add(user)

    # Create default pipeline with standard stages
    pipeline = Pipeline(tenant_id=tenant.id, name="Sales Pipeline", is_default=True)
    db.add(pipeline)
    db.flush()

    for i, (name, terminal) in enumerate([
        ("New", False),
        ("Contacted", False),
        ("Meeting Booked", False),
        ("Qualified", False),
        ("Proposal", False),
        ("Won", True),
        ("Lost", True),
    ]):
        stage = PipelineStage(
            pipeline_id=pipeline.id,
            tenant_id=tenant.id,
            name=name,
            position=i,
            is_terminal=terminal,
        )
        db.add(stage)

    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(tenant.id), user.role),
        refresh_token=create_refresh_token(str(user.id), str(tenant.id)),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=payload.email, is_active=True).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(user.tenant_id), user.role),
        refresh_token=create_refresh_token(str(user.id), str(user.tenant_id)),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload.refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if data.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")

    user = db.query(User).filter_by(id=data["sub"], is_active=True).first()
    if not user:
        raise HTTPException(401, "User not found")

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(user.tenant_id), user.role),
        refresh_token=create_refresh_token(str(user.id), str(user.tenant_id)),
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/me/tenant", response_model=TenantOut)
def me_tenant(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter_by(id=user.tenant_id).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    return tenant


class TenantSettingsUpdate(BaseModel):
    settings: dict


@router.patch("/me/tenant/settings", response_model=TenantOut)
def update_tenant_settings(
    payload: TenantSettingsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Merge the given keys into the tenant's settings JSON."""
    tenant = db.query(Tenant).filter_by(id=user.tenant_id).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    merged = dict(tenant.settings or {})
    merged.update(payload.settings)
    tenant.settings = merged
    db.commit()
    db.refresh(tenant)
    return tenant
