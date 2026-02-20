from __future__ import annotations
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_tenant, get_db
from app.models.pipeline import Pipeline, PipelineStage
from app.models.tenant import Tenant
from app.schemas.pipeline import (
    PipelineCreate,
    PipelineOut,
    PipelineStageCreate,
    PipelineStageOut,
    PipelineStageUpdate,
    PipelineUpdate,
)

router = APIRouter(prefix="/api/v1/pipelines", tags=["pipelines"])


@router.get("/", response_model=list[PipelineOut])
def list_pipelines(tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return db.query(Pipeline).filter_by(tenant_id=tenant.id).all()


@router.post("/", response_model=PipelineOut, status_code=201)
def create_pipeline(
    payload: PipelineCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    # If this is the default, unset others
    if payload.is_default:
        db.query(Pipeline).filter_by(tenant_id=tenant.id, is_default=True).update({"is_default": False})

    pipeline = Pipeline(tenant_id=tenant.id, name=payload.name, is_default=payload.is_default)
    db.add(pipeline)
    db.flush()

    for stage_data in payload.stages:
        stage = PipelineStage(
            pipeline_id=pipeline.id,
            tenant_id=tenant.id,
            name=stage_data.name,
            position=stage_data.position,
            is_terminal=stage_data.is_terminal,
        )
        db.add(stage)

    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.get("/{pipeline_id}", response_model=PipelineOut)
def get_pipeline(pipeline_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter_by(id=pipeline_id, tenant_id=tenant.id).first()
    if not pipeline:
        raise HTTPException(404, "Pipeline not found")
    return pipeline


@router.put("/{pipeline_id}", response_model=PipelineOut)
def update_pipeline(
    pipeline_id: uuid.UUID,
    payload: PipelineUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    pipeline = db.query(Pipeline).filter_by(id=pipeline_id, tenant_id=tenant.id).first()
    if not pipeline:
        raise HTTPException(404, "Pipeline not found")

    if payload.is_default:
        db.query(Pipeline).filter_by(tenant_id=tenant.id, is_default=True).update({"is_default": False})

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(pipeline, field, value)

    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.delete("/{pipeline_id}", status_code=204)
def delete_pipeline(pipeline_id: uuid.UUID, tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter_by(id=pipeline_id, tenant_id=tenant.id).first()
    if not pipeline:
        raise HTTPException(404, "Pipeline not found")
    if pipeline.is_default:
        raise HTTPException(400, "Cannot delete the default pipeline")

    db.query(PipelineStage).filter_by(pipeline_id=pipeline.id).delete()
    db.delete(pipeline)
    db.commit()


@router.post("/{pipeline_id}/stages", response_model=PipelineStageOut, status_code=201)
def add_stage(
    pipeline_id: uuid.UUID,
    payload: PipelineStageCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    pipeline = db.query(Pipeline).filter_by(id=pipeline_id, tenant_id=tenant.id).first()
    if not pipeline:
        raise HTTPException(404, "Pipeline not found")

    stage = PipelineStage(
        pipeline_id=pipeline.id,
        tenant_id=tenant.id,
        name=payload.name,
        position=payload.position,
        is_terminal=payload.is_terminal,
    )
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage


@router.put("/{pipeline_id}/stages/{stage_id}", response_model=PipelineStageOut)
def update_stage(
    pipeline_id: uuid.UUID,
    stage_id: uuid.UUID,
    payload: PipelineStageUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    stage = db.query(PipelineStage).filter_by(id=stage_id, pipeline_id=pipeline_id, tenant_id=tenant.id).first()
    if not stage:
        raise HTTPException(404, "Stage not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(stage, field, value)

    db.commit()
    db.refresh(stage)
    return stage


@router.delete("/{pipeline_id}/stages/{stage_id}", status_code=204)
def delete_stage(
    pipeline_id: uuid.UUID,
    stage_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    stage = db.query(PipelineStage).filter_by(id=stage_id, pipeline_id=pipeline_id, tenant_id=tenant.id).first()
    if not stage:
        raise HTTPException(404, "Stage not found")
    db.delete(stage)
    db.commit()
