from __future__ import annotations
from pydantic import BaseModel


class WebhookLeadPayload(BaseModel):
    """Universal webhook payload — normalizes leads from any source."""
    email: str | None = None
    phone: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    name: str | None = None  # full name fallback, will be split
    source: str | None = None  # override, otherwise derived from endpoint
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    custom_fields: dict = {}


class MetaLeadPayload(BaseModel):
    """Meta Lead Ads webhook structure."""
    object: str = ""
    entry: list[dict] = []


class WebhookResponse(BaseModel):
    status: str
    lead_id: str | None = None
    is_duplicate: bool = False
    message: str = ""
