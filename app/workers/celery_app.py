from __future__ import annotations
from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery = Celery(
    "jetleads",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.workers.tasks_email",
        "app.workers.tasks_sms",
        "app.workers.tasks_workflow",
        "app.workers.tasks_maintenance",
    ],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "advance-workflows": {
            "task": "app.workers.tasks_workflow.advance_delayed_executions",
            "schedule": 60.0,
        },
        "check-overdue-tasks": {
            "task": "app.workers.tasks_maintenance.check_overdue_tasks",
            "schedule": crontab(hour=9, minute=0),
        },
        "reengage-cold-leads": {
            "task": "app.workers.tasks_maintenance.reengage_cold_leads",
            "schedule": crontab(hour=10, minute=0),
        },
    },
)
