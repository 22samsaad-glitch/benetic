"""
Resend email provider.

Option C: send FROM a Jetleads domain on behalf of the business owner.
  From:     "{business_name} <onboarding@resend.dev>"
  Reply-To: owner's real email address

This way the lead sees the contractor's name; replies go to the contractor.

TODO: swap onboarding@resend.dev → noreply@jetleads.io once jetleads.io
      is verified in the Resend dashboard.
"""
from __future__ import annotations
import logging

from app.integrations.base import EmailMessage, EmailProvider, EmailResult

logger = logging.getLogger(__name__)

# TODO: change to "noreply@jetleads.io" after domain verification on resend.com
_JETLEADS_FROM_ADDR = "onboarding@resend.dev"


class ResendProvider(EmailProvider):
    def __init__(self, api_key: str, from_email: str = _JETLEADS_FROM_ADDR):
        self.api_key = api_key
        # from_email is the raw address portion; display name is supplied per-send
        self.from_email = from_email

    def send(self, message: EmailMessage) -> EmailResult:
        try:
            import resend
            resend.api_key = self.api_key

            # Build "Display Name <address>" — use message.from_email as the
            # display name portion if provided, otherwise fall back to the address.
            from_field = message.from_email or self.from_email

            payload: dict = {
                "from": from_field,
                "to": [message.to_email],
                "subject": message.subject,
                "html": message.html_body,
            }

            if message.reply_to:
                payload["reply_to"] = message.reply_to

            result = resend.Emails.send(payload)
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
