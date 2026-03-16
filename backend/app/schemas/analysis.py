from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


# --------------------------------------------------------------------------- #
# Parametric Assumptions / Job Create
# --------------------------------------------------------------------------- #

class AnalysisJobCreate(BaseModel):
    yield_pct: float = Field(..., ge=0, le=100, description="Yield percentage (0-100)")
    solvent_recovery_pct: float = Field(
        ..., ge=0, le=100, description="Solvent recovery percentage (0-100)"
    )
    city: str = Field(..., min_length=1, description="Manufacturing city / location")
    profit_margin_pct: float = Field(
        ..., ge=0, le=100, description="Profit margin percentage (0-100)"
    )


# --------------------------------------------------------------------------- #
# Cost breakdown structures
# --------------------------------------------------------------------------- #

class CostLineItem(BaseModel):
    name: str
    quantity: float | None = None
    unit: str | None = None
    unit_cost: float | None = None
    total_cost: float
    category: str | None = None
    notes: str | None = None


class AnalysisResult(BaseModel):
    material_cost: float
    labor_cost: float
    overhead_cost: float
    profit: float
    total_cost: float
    per_unit_cost: float
    currency: str = "USD"
    assumptions: dict[str, Any] = Field(default_factory=dict)
    line_items: list[CostLineItem] = Field(default_factory=list)
    summary: str | None = None


# --------------------------------------------------------------------------- #
# Job Response
# --------------------------------------------------------------------------- #

class AnalysisJobResponse(BaseModel):
    id: str
    project_id: str | None
    status: str
    yield_pct: float
    solvent_recovery_pct: float
    city: str
    profit_margin_pct: float
    document_filename: str
    document_path: str
    result_json: dict | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --------------------------------------------------------------------------- #
# Project schemas
# --------------------------------------------------------------------------- #

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    user_id: str = Field(default="default")


class ProjectResponse(BaseModel):
    id: str
    name: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
