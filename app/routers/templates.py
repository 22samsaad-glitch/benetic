from __future__ import annotations
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_tenant, get_db
from app.models.template import MessageTemplate
from app.models.tenant import Tenant
from app.schemas.template import (
    TemplateCreate,
    TemplateOut,
    TemplatePreview,
    TemplatePreviewOut,
    TemplateUpdate,
)

router = APIRouter(prefix="/api/v1/templates", tags=["templates"])


@router.get("/", response_model=list[TemplateOut])
def list_templates(
    channel: str | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    q = db.query(MessageTemplate).filter_by(tenant_id=tenant.id)
    if channel:
        q = q.filter(MessageTemplate.channel == channel)
    return q.all()


@router.post("/", response_model=TemplateOut, status_code=201)
def create_template(
    payload: TemplateCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    if payload.channel not in ("email", "sms"):
        raise HTTPException(400, "Channel must be 'email' or 'sms'")

    template = MessageTemplate(
        tenant_id=tenant.id,
        name=payload.name,
        channel=payload.channel,
        subject=payload.subject,
        body=payload.body,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/{template_id}", response_model=TemplateOut)
def get_template(template_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    t = db.query(MessageTemplate).filter_by(id=template_id, tenant_id=tenant.id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    return t


@router.put("/{template_id}", response_model=TemplateOut)
def update_template(
    template_id: uuid.UUID,
    payload: TemplateUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    t = db.query(MessageTemplate).filter_by(id=template_id, tenant_id=tenant.id).first()
    if not t:
        raise HTTPException(404, "Template not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(t, field, value)

    db.commit()
    db.refresh(t)
    return t


@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    t = db.query(MessageTemplate).filter_by(id=template_id, tenant_id=tenant.id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    db.delete(t)
    db.commit()


@router.post("/{template_id}/preview", response_model=TemplatePreviewOut)
def preview_template(
    template_id: uuid.UUID,
    sample: TemplatePreview,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Render a template with sample data to preview how it will look."""
    t = db.query(MessageTemplate).filter_by(id=template_id, tenant_id=tenant.id).first()
    if not t:
        raise HTTPException(404, "Template not found")

    replacements = {
        "{{first_name}}": sample.first_name,
        "{{last_name}}": sample.last_name,
        "{{email}}": sample.email,
        "{{phone}}": sample.phone,
        "{{source}}": sample.source,
        "{{score}}": str(sample.score),
    }
    for key, val in sample.custom_fields.items():
        replacements[f"{{{{{key}}}}}"] = str(val)

    body = t.body
    subject = t.subject
    for token, value in replacements.items():
        body = body.replace(token, value)
        if subject:
            subject = subject.replace(token, value)

    return TemplatePreviewOut(subject=subject, body=body)
