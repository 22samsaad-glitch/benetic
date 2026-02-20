"""
Public webhook endpoints for lead capture from all sources.
These endpoints do NOT require JWT auth — they use API key or signature verification.
"""
from __future__ import annotations
import hashlib
import hmac
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db
from app.models.tenant import Tenant
from app.schemas.webhook import MetaLeadPayload, WebhookLeadPayload, WebhookResponse
from app.services.lead_service import process_inbound_lead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


def _get_tenant_by_slug(slug: str, db: Session) -> Tenant:
    tenant = db.query(Tenant).filter_by(slug=slug).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    return tenant


def _verify_api_key(tenant: Tenant, api_key: str | None):
    if not api_key or api_key != tenant.webhook_key:
        raise HTTPException(401, "Invalid API key")


# ---------------------------------------------------------------------------
# Universal lead ingest
# ---------------------------------------------------------------------------

@router.post("/ingest/{tenant_slug}", response_model=WebhookResponse)
def universal_ingest(
    tenant_slug: str,
    payload: WebhookLeadPayload,
    x_api_key: str | None = Header(None),
    db: Session = Depends(get_db),
):
    """
    Universal lead capture endpoint. Accepts leads from website forms,
    landing pages, Zapier, or any custom integration.

    Requires X-API-Key header matching the tenant's webhook key.
    """
    tenant = _get_tenant_by_slug(tenant_slug, db)
    _verify_api_key(tenant, x_api_key)

    # Handle full name split
    first_name = payload.first_name
    last_name = payload.last_name
    if payload.name and not first_name:
        parts = payload.name.strip().split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else None

    if not payload.email and not payload.phone:
        raise HTTPException(400, "At least one of email or phone is required")

    source = payload.source or "website"

    lead, is_dup = process_inbound_lead(
        db=db,
        tenant=tenant,
        email=payload.email,
        phone=payload.phone,
        first_name=first_name,
        last_name=last_name,
        source=source,
        utm_source=payload.utm_source,
        utm_medium=payload.utm_medium,
        utm_campaign=payload.utm_campaign,
        utm_content=payload.utm_content,
        utm_term=payload.utm_term,
        custom_fields=payload.custom_fields,
        raw_payload=payload.model_dump(),
    )

    return WebhookResponse(
        status="ok",
        lead_id=str(lead.id),
        is_duplicate=is_dup,
        message="Lead received" if not is_dup else "Duplicate lead recorded",
    )


# ---------------------------------------------------------------------------
# Meta (Facebook/Instagram) Lead Ads
# ---------------------------------------------------------------------------

@router.get("/meta/verify")
def meta_verify(
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_verify_token: str = Query(alias="hub.verify_token", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
):
    """Meta webhook verification endpoint. Returns hub.challenge if token matches."""
    if hub_mode == "subscribe" and hub_verify_token == settings.META_APP_SECRET:
        return int(hub_challenge)
    raise HTTPException(403, "Verification failed")


@router.post("/meta/{tenant_slug}", response_model=WebhookResponse)
async def meta_lead_ads(
    tenant_slug: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Receives lead data from Meta Lead Ads.
    Verifies X-Hub-Signature-256 header if META_APP_SECRET is configured.
    """
    tenant = _get_tenant_by_slug(tenant_slug, db)
    body = await request.body()

    # Verify signature if app secret is set
    if settings.META_APP_SECRET:
        signature = request.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(
            settings.META_APP_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(403, "Invalid signature")

    payload = MetaLeadPayload.model_validate_json(body)

    # Process each lead entry from Meta's nested structure
    last_lead = None
    for entry in payload.entry:
        for change in entry.get("changes", []):
            value = change.get("value", {})
            # Meta sends field_data as list of {"name": "email", "values": ["foo@bar.com"]}
            field_data = {
                fd["name"]: fd["values"][0] if fd.get("values") else None
                for fd in value.get("field_data", [])
            }

            lead, is_dup = process_inbound_lead(
                db=db,
                tenant=tenant,
                email=field_data.get("email"),
                phone=field_data.get("phone_number"),
                first_name=field_data.get("first_name"),
                last_name=field_data.get("last_name"),
                source="meta_ads",
                custom_fields=field_data,
                raw_payload=entry,
            )
            last_lead = lead

    if not last_lead:
        return WebhookResponse(status="ok", message="No leads in payload")

    return WebhookResponse(
        status="ok",
        lead_id=str(last_lead.id),
        message="Meta lead(s) received",
    )


# ---------------------------------------------------------------------------
# Google Ads
# ---------------------------------------------------------------------------

@router.post("/google-ads/{tenant_slug}", response_model=WebhookResponse)
async def google_ads_webhook(
    tenant_slug: str,
    request: Request,
    x_api_key: str | None = Header(None),
    db: Session = Depends(get_db),
):
    """
    Receives leads from Google Ads lead form extensions or landing page webhooks.
    Uses X-API-Key for authentication.
    """
    tenant = _get_tenant_by_slug(tenant_slug, db)
    _verify_api_key(tenant, x_api_key)

    body = await request.json()

    # Google Ads lead form extensions send a flat structure
    # Normalize to our standard fields
    lead_data = body.get("lead_form_data", body)

    lead, is_dup = process_inbound_lead(
        db=db,
        tenant=tenant,
        email=lead_data.get("email"),
        phone=lead_data.get("phone_number") or lead_data.get("phone"),
        first_name=lead_data.get("first_name"),
        last_name=lead_data.get("last_name"),
        source="google_ads",
        utm_source=lead_data.get("utm_source", "google"),
        utm_medium=lead_data.get("utm_medium", "cpc"),
        utm_campaign=lead_data.get("utm_campaign") or lead_data.get("campaign_name"),
        custom_fields={k: v for k, v in lead_data.items() if k not in ("email", "phone", "phone_number", "first_name", "last_name")},
        raw_payload=body,
    )

    return WebhookResponse(
        status="ok",
        lead_id=str(lead.id),
        is_duplicate=is_dup,
        message="Google Ads lead received",
    )
