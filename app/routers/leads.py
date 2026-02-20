from __future__ import annotations
import csv
import io
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_current_tenant, get_current_user, get_db
from app.models.lead import Lead, LeadEvent
from app.models.tenant import Tenant, User
from app.schemas.lead import (
    LeadAssign,
    LeadCreate,
    LeadEventOut,
    LeadListResponse,
    LeadMoveStage,
    LeadOut,
    LeadUpdate,
)

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


@router.get("/", response_model=LeadListResponse)
def list_leads(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    source: str | None = None,
    stage_id: uuid.UUID | None = None,
    assigned_to: uuid.UUID | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    q = db.query(Lead).filter_by(tenant_id=tenant.id, is_duplicate=False)

    if source:
        q = q.filter(Lead.source == source)
    if stage_id:
        q = q.filter(Lead.stage_id == stage_id)
    if assigned_to:
        q = q.filter(Lead.assigned_to == assigned_to)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Lead.email.ilike(like)) | (Lead.first_name.ilike(like)) | (Lead.last_name.ilike(like)) | (Lead.phone.ilike(like))
        )

    total = q.count()

    sort_col = getattr(Lead, sort_by, Lead.created_at)
    if sort_dir == "asc":
        q = q.order_by(sort_col.asc())
    else:
        q = q.order_by(sort_col.desc())

    items = q.offset((page - 1) * per_page).limit(per_page).all()

    return LeadListResponse(items=items, total=total, page=page, per_page=per_page)


@router.post("/", response_model=LeadOut, status_code=201)
def create_lead(
    payload: LeadCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    if not payload.email and not payload.phone:
        raise HTTPException(400, "At least one of email or phone is required")

    lead = Lead(tenant_id=tenant.id, **payload.model_dump())
    db.add(lead)
    db.flush()

    event = LeadEvent(tenant_id=tenant.id, lead_id=lead.id, event_type="created", metadata_={"source": "manual"})
    db.add(event)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    lead.opted_out = True  # soft delete for GDPR
    db.commit()


@router.post("/{lead_id}/move", response_model=LeadOut)
def move_lead_stage(
    lead_id: uuid.UUID,
    payload: LeadMoveStage,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    old_stage = str(lead.stage_id) if lead.stage_id else None
    lead.stage_id = payload.stage_id

    event = LeadEvent(
        tenant_id=tenant.id,
        lead_id=lead.id,
        event_type="stage_changed",
        metadata_={"from_stage": old_stage, "to_stage": str(payload.stage_id)},
    )
    db.add(event)
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/assign", response_model=LeadOut)
def assign_lead(
    lead_id: uuid.UUID,
    payload: LeadAssign,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    lead.assigned_to = payload.user_id

    event = LeadEvent(
        tenant_id=tenant.id,
        lead_id=lead.id,
        event_type="assigned",
        metadata_={"assigned_to": str(payload.user_id)},
    )
    db.add(event)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}/events", response_model=list[LeadEventOut])
def list_lead_events(
    lead_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter_by(id=lead_id, tenant_id=tenant.id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    return db.query(LeadEvent).filter_by(lead_id=lead_id).order_by(LeadEvent.created_at.desc()).all()


@router.get("/export/csv")
def export_leads_csv(
    source: str | None = None,
    stage_id: uuid.UUID | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    q = db.query(Lead).filter_by(tenant_id=tenant.id, is_duplicate=False)
    if source:
        q = q.filter(Lead.source == source)
    if stage_id:
        q = q.filter(Lead.stage_id == stage_id)

    leads = q.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "email", "phone", "first_name", "last_name", "source", "score", "created_at"])
    for lead in leads:
        writer.writerow([str(lead.id), lead.email, lead.phone, lead.first_name, lead.last_name, lead.source, lead.score, lead.created_at.isoformat()])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads_export.csv"},
    )


@router.post("/import/csv", response_model=dict)
async def import_leads_csv(
    file: UploadFile = File(...),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))

    created = 0
    errors = []

    for i, row in enumerate(reader):
        email = row.get("email", "").strip() or None
        phone = row.get("phone", "").strip() or None

        if not email and not phone:
            errors.append(f"Row {i + 1}: missing email and phone")
            continue

        lead = Lead(
            tenant_id=tenant.id,
            email=email,
            phone=phone,
            first_name=row.get("first_name", "").strip() or None,
            last_name=row.get("last_name", "").strip() or None,
            source="csv",
        )
        db.add(lead)
        created += 1

    db.commit()
    return {"created": created, "errors": errors}
