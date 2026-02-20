"""
Twilio SMS provider. Falls back to stub mode if no credentials are configured.
"""
from __future__ import annotations
import logging
import uuid

from app.integrations.base import SMSMessage, SMSProvider, SMSResult

logger = logging.getLogger(__name__)


class TwilioProvider(SMSProvider):
    def __init__(self, account_sid: str, auth_token: str, from_phone: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_phone = from_phone

    def send(self, message: SMSMessage) -> SMSResult:
        try:
            from twilio.rest import Client
            client = Client(self.account_sid, self.auth_token)
            msg = client.messages.create(
                body=message.body,
                from_=message.from_phone or self.from_phone,
                to=message.to_phone,
            )
            return SMSResult(success=True, provider_id=msg.sid)
        except Exception as e:
            logger.error(f"Twilio send failed: {e}")
            return SMSResult(success=False, error=str(e))

    def test_connection(self) -> bool:
        try:
            from twilio.rest import Client
            client = Client(self.account_sid, self.auth_token)
            client.api.accounts(self.account_sid).fetch()
            return True
        except Exception:
            return False


class StubSMSProvider(SMSProvider):
    """Logs SMS messages instead of sending. Use when no SMS provider is configured."""

    def send(self, message: SMSMessage) -> SMSResult:
        stub_id = f"stub-{uuid.uuid4().hex[:8]}"
        logger.info(f"[STUB SMS] {stub_id} | To: {message.to_phone} | Body: {message.body[:100]}")
        return SMSResult(success=True, provider_id=stub_id)

    def test_connection(self) -> bool:
        logger.info("[STUB SMS] Test connection: OK (stub mode)")
        return True
