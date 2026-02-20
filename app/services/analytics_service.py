"""
Analytics query builders for the dashboard API.
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.models.lead import Lead, LeadEvent
from app.models.pipeline import PipelineStage
from app.models.task import Task
from app.models.tenant import User


def overview(db: Session, tenant_id, start_date: datetime | None = None, end_date: datetime | None = None) -> dict:
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    base = db.query(Lead).filter_by(tenant_id=tenant_id, is_duplicate=False)
    if start_date:
        base = base.filter(Lead.created_at >= start_date)
    if end_date:
        base = base.filter(Lead.created_at <= end_date)

    total = base.count()
    this_month = base.filter(Lead.created_at >= month_start).count()

    # Conversion rate: leads in terminal (won) stages / total
    won = (
        base.join(PipelineStage, Lead.stage_id == PipelineStage.id)
        .filter(PipelineStage.is_terminal == True, PipelineStage.name == "Won")
        .count()
    )
    conversion_rate = (won / total * 100) if total > 0 else 0.0

    avg_score = db.query(func.avg(Lead.score)).filter(Lead.tenant_id == tenant_id, Lead.is_duplicate == False).scalar() or 0

    return {
        "total_leads": total,
        "leads_this_month": this_month,
        "conversion_rate": round(conversion_rate, 1),
        "avg_score": round(float(avg_score), 1),
    }


def by_source(db: Session, tenant_id) -> list[dict]:
    results = (
        db.query(Lead.source, func.count(Lead.id), func.avg(Lead.score))
        .filter_by(tenant_id=tenant_id, is_duplicate=False)
        .group_by(Lead.source)
        .all()
    )
    return [{"source": r[0], "count": r[1], "avg_score": round(float(r[2] or 0), 1)} for r in results]


def pipeline_summary(db: Session, tenant_id) -> list[dict]:
    results = (
        db.query(PipelineStage.id, PipelineStage.name, func.count(Lead.id))
        .outerjoin(Lead, (Lead.stage_id == PipelineStage.id) & (Lead.is_duplicate == False))
        .filter(PipelineStage.tenant_id == tenant_id)
        .group_by(PipelineStage.id, PipelineStage.name, PipelineStage.position)
        .order_by(PipelineStage.position)
        .all()
    )
    return [{"stage_id": str(r[0]) if r[0] else None, "stage_name": r[1], "count": r[2]} for r in results]


def timeline(db: Session, tenant_id, days: int = 30) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    results = (
        db.query(func.date(Lead.created_at), func.count(Lead.id))
        .filter(Lead.tenant_id == tenant_id, Lead.is_duplicate == False, Lead.created_at >= cutoff)
        .group_by(func.date(Lead.created_at))
        .order_by(func.date(Lead.created_at))
        .all()
    )
    return [{"date": str(r[0]), "count": r[1]} for r in results]


def team_stats(db: Session, tenant_id) -> list[dict]:
    users = db.query(User).filter_by(tenant_id=tenant_id, is_active=True).all()
    result = []
    for user in users:
        leads_assigned = db.query(Lead).filter_by(tenant_id=tenant_id, assigned_to=user.id, is_duplicate=False).count()
        tasks_completed = db.query(Task).filter_by(tenant_id=tenant_id, assigned_to=user.id, status="completed").count()
        tasks_pending = db.query(Task).filter_by(tenant_id=tenant_id, assigned_to=user.id, status="pending").count()
        result.append({
            "user_id": str(user.id),
            "name": user.name,
            "leads_assigned": leads_assigned,
            "tasks_completed": tasks_completed,
            "tasks_pending": tasks_pending,
        })
    return result
