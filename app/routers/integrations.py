from __future__ import annotations
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_current_tenant, get_db, require_role
from app.models.integration import IntegrationConfig
from app.models.tenant import Tenant, User
from app.integrations.email_sendgrid import SendGridProvider
from app.integrations.sms_twilio import TwilioProvider

router = APIRouter(prefix="/api/v1/integrations", tags=["integrations"])


class IntegrationCreate(BaseModel):
    provider: str  # sendgrid, resend, twilio, meta, google_ads
    credentials: dict = {}
    settings: dict = {}


class IntegrationUpdate(BaseModel):
    credentials: dict | None = None
    settings: dict | None = None
    is_active: bool | None = None


class IntegrationOut(BaseModel):
    id: uuid.UUID
    provider: str
    settings: dict
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_model(cls, obj: IntegrationConfig):
        return cls(
            id=obj.id,
            provider=obj.provider,
            settings=obj.settings,
            is_active=obj.is_active,
            created_at=obj.created_at.isoformat(),
        )


@router.get("/")
def list_integrations(tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    configs = db.query(IntegrationConfig).filter_by(tenant_id=tenant.id).all()
    # Don't expose credentials in list
    return [IntegrationOut.from_model(c) for c in configs]


@router.post("/", status_code=201)
def create_integration(
    payload: IntegrationCreate,
    tenant: Tenant = Depends(get_current_tenant),
    user: User = Depends(require_role("owner", "admin")),
    db: Session = Depends(get_db),
):
    existing = db.query(IntegrationConfig).filter_by(tenant_id=tenant.id, provider=payload.provider).first()
    if existing:
        raise HTTPException(409, f"Integration for {payload.provider} already exists. Use PUT to update.")

    config = IntegrationConfig(
        tenant_id=tenant.id,
        provider=payload.provider,
        credentials=payload.credentials,
        settings=payload.settings,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return IntegrationOut.from_model(config)


@router.put("/{integration_id}")
def update_integration(
    integration_id: uuid.UUID,
    payload: IntegrationUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    user: User = Depends(require_role("owner", "admin")),
    db: Session = Depends(get_db),
):
    config = db.query(IntegrationConfig).filter_by(id=integration_id, tenant_id=tenant.id).first()
    if not config:
        raise HTTPException(404, "Integration not found")

    if payload.credentials is not None:
        config.credentials = payload.credentials
    if payload.settings is not None:
        config.settings = payload.settings
    if payload.is_active is not None:
        config.is_active = payload.is_active

    db.commit()
    db.refresh(config)
    return IntegrationOut.from_model(config)


@router.delete("/{integration_id}", status_code=204)
def delete_integration(
    integration_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    user: User = Depends(require_role("owner", "admin")),
    db: Session = Depends(get_db),
):
    config = db.query(IntegrationConfig).filter_by(id=integration_id, tenant_id=tenant.id).first()
    if not config:
        raise HTTPException(404, "Integration not found")
    db.delete(config)
    db.commit()


@router.post("/{integration_id}/test")
def test_integration(
    integration_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Test that the integration credentials are valid."""
    config = db.query(IntegrationConfig).filter_by(id=integration_id, tenant_id=tenant.id).first()
    if not config:
        raise HTTPException(404, "Integration not found")

    success = False
    if config.provider == "sendgrid":
        api_key = config.credentials.get("api_key", "")
        provider = SendGridProvider(api_key=api_key)
        success = provider.test_connection()
    elif config.provider == "twilio":
        creds = config.credentials
        provider = TwilioProvider(
            account_sid=creds.get("account_sid", ""),
            auth_token=creds.get("auth_token", ""),
            from_phone=config.settings.get("from_phone", ""),
        )
        success = provider.test_connection()
    else:
        return {"status": "skipped", "message": f"No test available for {config.provider}"}

    return {"status": "ok" if success else "failed", "provider": config.provider}
