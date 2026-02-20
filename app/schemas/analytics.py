from __future__ import annotations
from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_leads: int
    leads_this_month: int
    conversion_rate: float  # percentage
    avg_score: float


class SourceStats(BaseModel):
    source: str
    count: int
    avg_score: float


class PipelineStats(BaseModel):
    stage_id: str | None
    stage_name: str
    count: int


class TimelinePoint(BaseModel):
    date: str
    count: int


class TeamMemberStats(BaseModel):
    user_id: str
    name: str
    leads_assigned: int
    tasks_completed: int
    tasks_pending: int
