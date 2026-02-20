"""
SendGrid email provider. Falls back to stub mode if no API key is configured.
"""
from __future__ import annotations
import logging
import uuid

from app.integrations.base import EmailMessage, EmailProvider, EmailResult

logger = logging.getLogger(__name__)


class SendGridProvider(EmailProvider):
    def __init__(self, api_key: str, from_email: str = "noreply@benetic.com"):
        self.api_key = api_key
        self.from_email = from_email

    def send(self, message: EmailMessage) -> EmailResult:
        from_email = message.from_email or self.from_email
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            mail = Mail(
                from_email=from_email,
                to_emails=message.to_email,
                subject=message.subject,
                html_content=message.html_body,
            )
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(mail)
            return EmailResult(
                success=response.status_code in (200, 201, 202),
                provider_id=response.headers.get("X-Message-Id"),
            )
        except Exception as e:
            logger.error(f"SendGrid send failed: {e}")
            return EmailResult(success=False, error=str(e))

    def test_connection(self) -> bool:
        try:
            from sendgrid import SendGridAPIClient
            sg = SendGridAPIClient(self.api_key)
            sg.client.api_keys.get()
            return True
        except Exception:
            return False


class StubEmailProvider(EmailProvider):
    """Logs emails instead of sending. Use when no email provider is configured."""

    def send(self, message: EmailMessage) -> EmailResult:
        stub_id = f"stub-{uuid.uuid4().hex[:8]}"
        logger.info(f"[STUB EMAIL] {stub_id} | To: {message.to_email} | Subject: {message.subject}")
        logger.info(f"[STUB EMAIL] Body preview: {message.html_body[:200]}")
        return EmailResult(success=True, provider_id=stub_id)

    def test_connection(self) -> bool:
        logger.info("[STUB EMAIL] Test connection: OK (stub mode)")
        return True
