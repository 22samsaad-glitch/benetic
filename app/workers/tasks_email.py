from __future__ import annotations
import logging

from app.workers.celery_app import celery
from app.database import SessionLocal
from app.models.integration import IntegrationConfig
from app.models.lead import LeadEvent
from app.integrations.base import EmailMessage
from app.integrations.email_sendgrid import SendGridProvider, StubEmailProvider
from app.integrations.email_resend import ResendProvider
from app.config import settings

logger = logging.getLogger(__name__)


def _get_email_provider(tenant_id: str):
    """Resolve the email provider for a tenant. Falls back to stub."""
    db = SessionLocal()
    try:
        config = db.query(IntegrationConfig).filter_by(
            tenant_id=tenant_id, provider="sendgrid", is_active=True
        ).first()
        if config and config.credentials.get("api_key"):
            return SendGridProvider(
                api_key=config.credentials["api_key"],
                from_email=config.settings.get("from_email", settings.SENDGRID_FROM_EMAIL),
            )
    finally:
        db.close()

    # Fallback to global config: Resend > SendGrid > Stub
    if settings.RESEND_API_KEY:
        return ResendProvider(api_key=settings.RESEND_API_KEY, from_email=settings.RESEND_FROM_EMAIL)
    if settings.SENDGRID_API_KEY:
        return SendGridProvider(api_key=settings.SENDGRID_API_KEY, from_email=settings.SENDGRID_FROM_EMAIL)
    return StubEmailProvider()


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email(
    self,
    tenant_id: str,
    lead_id: str,
    to_email: str,
    to_name: str,
    subject: str,
    html_body: str,
    from_name: str = "",
    reply_to: str = "",
):
    """Send an email to a lead.

    Option C — From: "{from_name} <onboarding@resend.dev>", Reply-To: owner's email.
    from_name:  display name shown to the lead (e.g. "Mike - Richardson Roofing")
    reply_to:   owner's real email so replies land in their inbox
    """
    provider = _get_email_provider(tenant_id)

    # Build the From field: "Display Name <address>"
    # TODO: replace onboarding@resend.dev with noreply@jetleads.io after domain verification
    _from_addr = "onboarding@resend.dev"
    from_field = f"{from_name} <{_from_addr}>" if from_name else _from_addr

    message = EmailMessage(
        to_email=to_email,
        to_name=to_name,
        subject=subject,
        html_body=html_body,
        from_email=from_field,
        reply_to=reply_to or None,
    )

    result = provider.send(message)

    # Log event
    db = SessionLocal()
    try:
        event = LeadEvent(
            tenant_id=tenant_id,
            lead_id=lead_id,
            event_type="email_sent",
            metadata_={
                "subject": subject,
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
