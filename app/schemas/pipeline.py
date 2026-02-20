from __future__ import annotations
import uuid
from datetime import datetime

from pydantic import BaseModel


class PipelineStageCreate(BaseModel):
    name: str
    position: int
    is_terminal: bool = False


class PipelineStageOut(BaseModel):
    id: uuid.UUID
    name: str
    position: int
    is_terminal: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PipelineStageUpdate(BaseModel):
    name: str | None = None
    position: int | None = None
    is_terminal: bool | None = None


class PipelineCreate(BaseModel):
    name: str
    is_default: bool = False
    stages: list[PipelineStageCreate] = []


class PipelineOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    is_default: bool
    stages: list[PipelineStageOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class PipelineUpdate(BaseModel):
    name: str | None = None
    is_default: bool | None = None
