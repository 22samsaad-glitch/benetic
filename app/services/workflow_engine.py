"""
Workflow execution engine.

Handles executing multi-step sequences with conditional branching,
delays, email/SMS sends, task assignments, and stage changes.
"""
from __future__ import annotations
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.lead import Lead, LeadEvent
from app.models.task import Task
from app.models.template import MessageTemplate
from app.models.workflow import Workflow, WorkflowExecution, WorkflowStep

logger = logging.getLogger(__name__)


def render_template(body: str, lead: Lead, subject: str | None = None) -> tuple[str, str | None]:
    """Replace {{placeholder}} tokens with lead data."""
    replacements = {
        "{{first_name}}": lead.first_name or "",
        "{{last_name}}": lead.last_name or "",
        "{{email}}": lead.email or "",
        "{{phone}}": lead.phone or "",
        "{{source}}": lead.source or "",
        "{{score}}": str(lead.score),
    }
    # Also support custom fields
    for key, val in (lead.custom_fields or {}).items():
        replacements[f"{{{{{key}}}}}"] = str(val) if val else ""

    rendered_body = body
    rendered_subject = subject
    for token, value in replacements.items():
        rendered_body = rendered_body.replace(token, value)
        if rendered_subject:
            rendered_subject = rendered_subject.replace(token, value)

    return rendered_body, rendered_subject


def trigger_workflows_for_lead(db: Session, lead: Lead, trigger_type: str = "on_lead_created"):
    """Find and start all active workflows that match this trigger for the lead's tenant."""
    workflows = db.query(Workflow).filter_by(
        tenant_id=lead.tenant_id,
        trigger_type=trigger_type,
        is_active=True,
    ).all()

    for wf in workflows:
        # Check trigger config filters
        config = wf.trigger_config or {}
        if config.get("source") and config["source"] != lead.source:
            continue
        if config.get("min_score") and lead.score < config["min_score"]:
            continue

        # Don't start duplicate executions
        existing = db.query(WorkflowExecution).filter_by(
            workflow_id=wf.id, lead_id=lead.id, status="running"
        ).first()
        if existing:
            continue

        execution = WorkflowExecution(
            workflow_id=wf.id,
            lead_id=lead.id,
            tenant_id=lead.tenant_id,
            current_step=0,
            status="running",
            next_run_at=datetime.now(timezone.utc),
        )
        db.add(execution)
        db.flush()

        logger.info(f"Started workflow '{wf.name}' for lead {lead.id}, execution {execution.id}")

    db.commit()


def execute_step(db: Session, execution_id: uuid.UUID) -> bool:
    """
    Execute the current step of a workflow execution.
    Returns True if the execution should continue immediately, False if it's paused/done.
    """
    execution = db.query(WorkflowExecution).filter_by(id=execution_id).first()
    if not execution or execution.status != "running":
        return False

    lead = db.query(Lead).filter_by(id=execution.lead_id).first()
    if not lead or lead.opted_out:
        execution.status = "cancelled"
        execution.completed_at = datetime.now(timezone.utc)
        db.commit()
        return False

    # Get the current step
    step = db.query(WorkflowStep).filter_by(
        workflow_id=execution.workflow_id,
        position=execution.current_step,
    ).first()

    if not step:
        # No more steps — workflow complete
        execution.status = "completed"
        execution.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Workflow execution {execution.id} completed")
        return False

    config = step.config or {}
    continue_immediately = True

    try:
        if step.step_type == "send_email":
            continue_immediately = _handle_send_email(db, lead, config)

        elif step.step_type == "send_sms":
            continue_immediately = _handle_send_sms(db, lead, config)

        elif step.step_type == "delay":
            delay_minutes = config.get("delay_minutes", 60)
            execution.next_run_at = datetime.now(timezone.utc) + timedelta(minutes=delay_minutes)
            execution.current_step += 1
            db.commit()
            logger.info(f"Execution {execution.id} delayed {delay_minutes} minutes")
            return False  # Don't continue — wait for beat to pick it up

        elif step.step_type == "condition":
            next_pos = _evaluate_condition(lead, config)
            execution.current_step = next_pos
            db.commit()
            return True

        elif step.step_type == "assign_task":
            _handle_assign_task(db, lead, config)

        elif step.step_type == "move_stage":
            _handle_move_stage(db, lead, config)

        elif step.step_type == "send_scheduling_link":
            _handle_scheduling_link(db, lead, config)

        else:
            logger.warning(f"Unknown step type: {step.step_type}")

        # Advance to next step
        execution.current_step += 1
        execution.next_run_at = datetime.now(timezone.utc)
        db.commit()
        return continue_immediately

    except Exception as e:
        logger.error(f"Workflow step failed: {e}", exc_info=True)
        execution.status = "failed"
        execution.error = str(e)
        execution.completed_at = datetime.now(timezone.utc)
        db.commit()
        return False


def _handle_send_email(db: Session, lead: Lead, config: dict) -> bool:
    """Dispatch an email send task."""
    template_id = config.get("template_id")
    if not template_id:
        logger.warning("send_email step missing template_id")
        return True

    template = db.query(MessageTemplate).filter_by(id=template_id).first()
    if not template or not lead.email:
        return True

    body, subject = render_template(template.body, lead, template.subject)

    from app.workers.tasks_email import send_email
    send_email.delay(
        tenant_id=str(lead.tenant_id),
        lead_id=str(lead.id),
        to_email=lead.email,
        to_name=lead.first_name or "",
        subject=subject or "No subject",
        html_body=body,
    )
    return True


def _handle_send_sms(db: Session, lead: Lead, config: dict) -> bool:
    """Dispatch an SMS send task."""
    template_id = config.get("template_id")
    if not template_id:
        logger.warning("send_sms step missing template_id")
        return True

    template = db.query(MessageTemplate).filter_by(id=template_id).first()
    if not template or not lead.phone:
        return True

    body, _ = render_template(template.body, lead)

    from app.workers.tasks_sms import send_sms
    send_sms.delay(
        tenant_id=str(lead.tenant_id),
        lead_id=str(lead.id),
        to_phone=lead.phone,
        body=body,
    )
    return True


def _evaluate_condition(lead: Lead, config: dict) -> int:
    """Evaluate a condition and return the next step position."""
    field = config.get("field", "score")
    operator = config.get("operator", "gte")
    value = config.get("value", 0)
    true_step = config.get("true_step", 0)
    false_step = config.get("false_step", 0)

    lead_val = getattr(lead, field, None)
    if lead_val is None:
        # Check custom fields
        lead_val = (lead.custom_fields or {}).get(field)

    result = False
    try:
        if operator == "gte":
            result = lead_val >= value
        elif operator == "lte":
            result = lead_val <= value
        elif operator == "eq":
            result = lead_val == value
        elif operator == "neq":
            result = lead_val != value
        elif operator == "contains":
            result = str(value) in str(lead_val) if lead_val else False
        elif operator == "exists":
            result = lead_val is not None and lead_val != ""
    except (TypeError, ValueError):
        pass

    return true_step if result else false_step


def _handle_assign_task(db: Session, lead: Lead, config: dict):
    """Create a manual task for the sales team."""
    task = Task(
        tenant_id=lead.tenant_id,
        lead_id=lead.id,
        assigned_to=config.get("assign_to"),
        title=config.get("title", f"Follow up with {lead.first_name or lead.email}"),
        description=config.get("description"),
        due_at=datetime.now(timezone.utc) + timedelta(hours=config.get("due_in_hours", 24)),
    )
    db.add(task)

    event = LeadEvent(
        tenant_id=lead.tenant_id,
        lead_id=lead.id,
        event_type="task_created",
        metadata_={"task_title": task.title},
    )
    db.add(event)


def _handle_move_stage(db: Session, lead: Lead, config: dict):
    """Move the lead to a different pipeline stage."""
    stage_id = config.get("stage_id")
    if not stage_id:
        return

    old_stage = str(lead.stage_id) if lead.stage_id else None
    lead.stage_id = stage_id

    event = LeadEvent(
        tenant_id=lead.tenant_id,
        lead_id=lead.id,
        event_type="stage_changed",
        metadata_={"from_stage": old_stage, "to_stage": stage_id, "via": "workflow"},
    )
    db.add(event)


def _handle_scheduling_link(db: Session, lead: Lead, config: dict):
    """Log a scheduling link send (actual implementation depends on calendar provider)."""
    calendar_url = config.get("calendar_url", "")
    event = LeadEvent(
        tenant_id=lead.tenant_id,
        lead_id=lead.id,
        event_type="scheduling_link_sent",
        metadata_={"calendar_url": calendar_url},
    )
    db.add(event)
    logger.info(f"Scheduling link for lead {lead.id}: {calendar_url}")
