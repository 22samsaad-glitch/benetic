"""
Maintenance background tasks — overdue tasks, re-engagement, etc.
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone

from app.workers.celery_app import celery
from app.database import SessionLocal
from app.models.task import Task
from app.models.lead import Lead, LeadEvent

logger = logging.getLogger(__name__)


@celery.task
def check_overdue_tasks():
    """Mark tasks past their due date as overdue. Runs daily at 9am."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        overdue = db.query(Task).filter(
            Task.status == "pending",
            Task.due_at < now,
        ).all()

        for task in overdue:
            task.status = "overdue"

        db.commit()
        logger.info(f"Marked {len(overdue)} tasks as overdue")
    finally:
        db.close()


@celery.task
def reengage_cold_leads():
    """
    Find leads with no activity in 14+ days that are in non-terminal stages.
    Log an event so re-engagement workflows can pick them up.
    Runs daily at 10am.
    """
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=14)

        # Find leads whose last event is older than cutoff
        from sqlalchemy import func
        from app.models.pipeline import PipelineStage

        cold_leads = (
            db.query(Lead)
            .outerjoin(PipelineStage, Lead.stage_id == PipelineStage.id)
            .filter(
                Lead.opted_out == False,
                Lead.is_duplicate == False,
                Lead.updated_at < cutoff,
                (PipelineStage.is_terminal == False) | (Lead.stage_id == None),
            )
            .limit(500)  # Process in batches
            .all()
        )

        count = 0
        for lead in cold_leads:
            # Check if already flagged recently
            recent = db.query(LeadEvent).filter(
                LeadEvent.lead_id == lead.id,
                LeadEvent.event_type == "cold_lead_flagged",
                LeadEvent.created_at > cutoff,
            ).first()

            if not recent:
                event = LeadEvent(
                    tenant_id=lead.tenant_id,
                    lead_id=lead.id,
                    event_type="cold_lead_flagged",
                    metadata_={"days_inactive": (datetime.now(timezone.utc) - lead.updated_at).days},
                )
                db.add(event)
                count += 1

        db.commit()
        logger.info(f"Flagged {count} cold leads for re-engagement")
    finally:
        db.close()
