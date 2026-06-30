"""
RouteScout — api/schemas.py
============================
Pydantic v2 request / response schemas for the RouteScout REST API.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


# ── Request ───────────────────────────────────────────────────────────────────


class PlanTripRequest(BaseModel):
    """
    POST /api/plan-trip request body.

    Fields
    ------
    destination : str
        Name of the destination city (e.g. "Paris", "Tokyo").
    start_date  : str
        Trip start date in YYYY-MM-DD format.
    end_date    : str
        Trip end date in YYYY-MM-DD format (must be ≥ start_date).
    """

    destination: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["Paris", "Tokyo", "San Diego"],
        description="Destination city name.",
    )
    start_date: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        examples=["2024-08-01"],
        description="Trip start date (YYYY-MM-DD).",
    )
    end_date: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        examples=["2024-08-05"],
        description="Trip end date (YYYY-MM-DD).",
    )

    @field_validator("destination")
    @classmethod
    def destination_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("destination must not be blank")
        return stripped

    @model_validator(mode="after")
    def end_not_before_start(self) -> "PlanTripRequest":
        start = date.fromisoformat(self.start_date)
        end   = date.fromisoformat(self.end_date)
        if end < start:
            raise ValueError("end_date must be on or after start_date")
        return self


# ── Nested response models ────────────────────────────────────────────────────


class WeatherSummary(BaseModel):
    """Weather data returned alongside the itinerary."""

    city: str
    forecast: str
    temperature_c: int
    humidity_percent: int
    uv_index: int
    bad_weather: bool
    queried_at: str
    source: str


class AgentTraceSummary(BaseModel):
    """Slim execution trace entry — one per agent in the pipeline."""

    run_id: str
    agent_name: str
    status: str
    duration_ms: float
    metadata: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class ItinerarySummary(BaseModel):
    """The optimised itinerary payload."""

    destination: str
    forecast: str
    bad_weather: bool
    days: int
    swaps_made: int
    itinerary_markdown: str
    activities: list[dict[str, Any]] = Field(default_factory=list)


# ── Top-level response ────────────────────────────────────────────────────────


class PlanTripResponse(BaseModel):
    """
    POST /api/plan-trip response.

    Includes the optimised itinerary, weather summary, and the full
    agent execution trace for Antigravity monitoring.
    """

    pipeline_id: str = Field(description="Unique ID for this pipeline run.")
    success: bool
    destination: str
    start_date: str
    end_date: str
    itinerary: ItinerarySummary | None = None
    weather: WeatherSummary | None = None
    trace: list[AgentTraceSummary] = Field(
        default_factory=list,
        description="Ordered execution trace — one entry per agent.",
    )
    total_ms: float = Field(description="Total pipeline wall-clock time (ms).")
    error: str | None = None

    model_config = {"from_attributes": True}


# ── Agent list response ───────────────────────────────────────────────────────


class AgentInfo(BaseModel):
    name: str
    description: str
    status: str = "registered"


class AgentListResponse(BaseModel):
    agents: list[AgentInfo]
    total: int
