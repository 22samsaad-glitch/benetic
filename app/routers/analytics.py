from __future__ import annotations
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_tenant, get_db
from app.models.tenant import Tenant
from app.schemas.analytics import (
    OverviewStats,
    PipelineStats,
    SourceStats,
    TeamMemberStats,
    TimelinePoint,
)
from app.services import analytics_service

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/overview", response_model=OverviewStats)
def get_overview(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    return analytics_service.overview(db, tenant.id, start_date, end_date)


@router.get("/sources", response_model=list[SourceStats])
def get_sources(tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return analytics_service.by_source(db, tenant.id)


@router.get("/pipeline", response_model=list[PipelineStats])
def get_pipeline(tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return analytics_service.pipeline_summary(db, tenant.id)


@router.get("/timeline", response_model=list[TimelinePoint])
def get_timeline(
    days: int = Query(30, ge=1, le=365),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    return analytics_service.timeline(db, tenant.id, days)


@router.get("/team", response_model=list[TeamMemberStats])
def get_team_stats(tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return analytics_service.team_stats(db, tenant.id)
