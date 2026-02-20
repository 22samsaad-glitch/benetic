"""
Lead processing service — deduplication, enrichment, scoring, and auto-assignment.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.lead import Lead, LeadEvent
from app.models.pipeline import Pipeline, PipelineStage
from app.models.tenant import Tenant
from app.services.scoring import compute_score


def find_duplicate(db: Session, tenant_id: uuid.UUID, email: str | None, phone: str | None) -> Lead | None:
    """Check if a lead with the same email or phone already exists for this tenant."""
    if email:
        existing = db.query(Lead).filter_by(tenant_id=tenant_id, email=email, is_duplicate=False).first()
        if existing:
            return existing
    if phone:
        existing = db.query(Lead).filter_by(tenant_id=tenant_id, phone=phone, is_duplicate=False).first()
        if existing:
            return existing
    return None


def get_default_stage(db: Session, tenant_id: uuid.UUID) -> uuid.UUID | None:
    """Get the first stage of the default pipeline for this tenant."""
    pipeline = db.query(Pipeline).filter_by(tenant_id=tenant_id, is_default=True).first()
    if not pipeline:
        return None
    stage = db.query(PipelineStage).filter_by(pipeline_id=pipeline.id).order_by(PipelineStage.position).first()
    return stage.id if stage else None


def process_inbound_lead(
    db: Session,
    tenant: Tenant,
    email: str | None,
    phone: str | None,
    first_name: str | None,
    last_name: str | None,
    source: str,
    utm_source: str | None = None,
    utm_medium: str | None = None,
    utm_campaign: str | None = None,
    utm_content: str | None = None,
    utm_term: str | None = None,
    custom_fields: dict | None = None,
    raw_payload: dict | None = None,
) -> tuple[Lead, bool]:
    """
    Process an inbound lead: dedup, enrich, score, assign to pipeline.
    Returns (lead, is_duplicate).
    """
    # Normalize
    email = email.strip().lower() if email else None
    phone = phone.strip() if phone else None

    # Dedup
    existing = find_duplicate(db, tenant.id, email, phone)
    is_duplicate = existing is not None

    # Create lead
    lead = Lead(
        tenant_id=tenant.id,
        email=email,
        phone=phone,
        first_name=first_name,
        last_name=last_name,
        source=source,
        utm_source=utm_source,
        utm_medium=utm_medium,
        utm_campaign=utm_campaign,
        utm_content=utm_content,
        utm_term=utm_term,
        custom_fields=custom_fields or {},
        raw_payload=raw_payload or {},
        is_duplicate=is_duplicate,
        duplicate_of=existing.id if existing else None,
    )

    # Assign to default pipeline stage (only for non-duplicates)
    if not is_duplicate:
        lead.stage_id = get_default_stage(db, tenant.id)

    db.add(lead)
    db.flush()

    # Score
    scoring_rules = tenant.settings.get("scoring_rules") if tenant.settings else None
    lead.score = compute_score(lead, scoring_rules)

    # Log event
    event = LeadEvent(
        tenant_id=tenant.id,
        lead_id=lead.id,
        event_type="created",
        metadata_={
            "source": source,
            "is_duplicate": is_duplicate,
            "score": lead.score,
            "duplicate_of": str(existing.id) if existing else None,
        },
    )
    db.add(event)
    db.commit()
    db.refresh(lead)

    return lead, is_duplicate
