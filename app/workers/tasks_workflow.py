"""
Celery tasks for workflow execution.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone

from app.workers.celery_app import celery
from app.database import SessionLocal
from app.services.workflow_engine import execute_step

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=3, default_retry_delay=30)
def execute_workflow_step(self, execution_id: str):
    """Execute one step of a workflow, then schedule the next if applicable."""
    db = SessionLocal()
    try:
        should_continue = execute_step(db, execution_id)
        if should_continue:
            # Immediately execute next step
            execute_workflow_step.delay(execution_id)
    except Exception as e:
        logger.error(f"Workflow step execution failed: {e}", exc_info=True)
        raise self.retry(exc=e)
    finally:
        db.close()


@celery.task
def advance_delayed_executions():
    """
    Beat task: runs every 60 seconds.
    Finds workflow executions that have a delay that's now expired and resumes them.
    """
    from app.models.workflow import WorkflowExecution

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        ready = db.query(WorkflowExecution).filter(
            WorkflowExecution.status == "running",
            WorkflowExecution.next_run_at <= now,
        ).all()

        count = 0
        for execution in ready:
            execute_workflow_step.delay(str(execution.id))
            count += 1

        if count:
            logger.info(f"Advanced {count} delayed workflow executions")
    finally:
        db.close()
