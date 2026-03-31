"""
Resend email provider. Alternative to SendGrid.
"""
from __future__ import annotations
import logging
import uuid

from app.integrations.base import EmailMessage, EmailProvider, EmailResult

logger = logging.getLogger(__name__)


class ResendProvider(EmailProvider):
    def __init__(self, api_key: str, from_email: str = "noreply@jetleads.io"):
        self.api_key = api_key
        self.from_email = from_email

    def send(self, message: EmailMessage) -> EmailResult:
        try:
            import resend
            resend.api_key = self.api_key

            result = resend.Emails.send({
                "from": message.from_email or self.from_email,
                "to": [message.to_email],
                "subject": message.subject,
                "html": message.html_body,
            })
            return EmailResult(success=True, provider_id=result.get("id"))
        except Exception as e:
            logger.error(f"Resend send failed: {e}")
            return EmailResult(success=False, error=str(e))

    def test_connection(self) -> bool:
        try:
            import resend
            resend.api_key = self.api_key
            resend.Domains.list()
            return True
        except Exception:
            return False
