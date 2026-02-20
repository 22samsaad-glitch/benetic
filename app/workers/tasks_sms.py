from __future__ import annotations
import logging

from app.workers.celery_app import celery
from app.database import SessionLocal
from app.models.integration import IntegrationConfig
from app.models.lead import LeadEvent
from app.integrations.base import SMSMessage
from app.integrations.sms_twilio import TwilioProvider, StubSMSProvider
from app.config import settings

logger = logging.getLogger(__name__)


def _get_sms_provider(tenant_id: str):
    """Resolve the SMS provider for a tenant. Falls back to stub."""
    db = SessionLocal()
    try:
        config = db.query(IntegrationConfig).filter_by(
            tenant_id=tenant_id, provider="twilio", is_active=True
        ).first()
        if config and config.credentials.get("account_sid"):
            return TwilioProvider(
                account_sid=config.credentials["account_sid"],
                auth_token=config.credentials["auth_token"],
                from_phone=config.settings.get("from_phone", settings.TWILIO_FROM_PHONE),
            )
    finally:
        db.close()

    # Fallback to global config or stub
    if settings.TWILIO_ACCOUNT_SID:
        return TwilioProvider(
            account_sid=settings.TWILIO_ACCOUNT_SID,
            auth_token=settings.TWILIO_AUTH_TOKEN,
            from_phone=settings.TWILIO_FROM_PHONE,
        )
    return StubSMSProvider()


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def send_sms(self, tenant_id: str, lead_id: str, to_phone: str, body: str):
    """Send an SMS to a lead."""
    provider = _get_sms_provider(tenant_id)
    message = SMSMessage(to_phone=to_phone, body=body)

    result = provider.send(message)

    # Log event
    db = SessionLocal()
    try:
        event = LeadEvent(
            tenant_id=tenant_id,
            lead_id=lead_id,
            event_type="sms_sent",
            metadata_={
                "provider_id": result.provider_id,
                "success": result.success,
                "error": result.error,
            },
        )
        db.add(event)
        db.commit()
    finally:
        db.close()

    if not result.success:
        raise self.retry(exc=Exception(result.error))

    return {"provider_id": result.provider_id, "success": True}
