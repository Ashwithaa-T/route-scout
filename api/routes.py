"""
RouteScout — api/routes.py
===========================
FastAPI route definitions for the RouteScout REST API.

Endpoints
---------
  POST  /api/plan-trip   Run the full multi-agent pipeline.
  GET   /api/health      Health / readiness check.
  GET   /api/agents      List registered agents and descriptions.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from agents.trip_planner_agent import TripPlannerAgent
from agents.weather_checker_agent import WeatherCheckerAgent
from agents.optimizer_agent import OptimizerAgent
from api.schemas import (
    AgentInfo,
    AgentListResponse,
    AgentTraceSummary,
    ItinerarySummary,
    PlanTripRequest,
    PlanTripResponse,
    WeatherSummary,
)
from core.logger import get_logger
from orchestration.agent_runner import AgentRunner

log = get_logger("api.routes")

router = APIRouter(prefix="/api", tags=["RouteScout"])

# Module-level runner singleton — avoids re-instantiation per request.
_runner = AgentRunner()

# Static agent registry for the /api/agents endpoint.
_REGISTERED_AGENTS = [
    TripPlannerAgent(),
    WeatherCheckerAgent(),
    OptimizerAgent(),
]


# ── POST /api/plan-trip ───────────────────────────────────────────────────────


@router.post(
    "/plan-trip",
    response_model=PlanTripResponse,
    status_code=status.HTTP_200_OK,
    summary="Plan a trip with weather-aware optimisation",
    description=(
        "Runs the full multi-agent pipeline:\n"
        "1. **TripPlannerAgent** — generates a raw day-by-day itinerary.\n"
        "2. **WeatherCheckerAgent** — fetches the forecast via the MCP tool.\n"
        "3. **OptimizerAgent** — swaps outdoor activities on bad-weather days.\n\n"
        "Returns the optimised itinerary plus the full agent execution trace."
    ),
    response_description="Optimised itinerary with weather info and agent trace.",
)
async def plan_trip(request: PlanTripRequest) -> PlanTripResponse:
    """
    Run the RouteScout multi-agent pipeline.

    - **destination**: City to travel to (e.g. "Paris", "Tokyo")
    - **start_date**: Trip start in YYYY-MM-DD format
    - **end_date**: Trip end in YYYY-MM-DD format
    """
    log.info(
        "api.plan_trip.received",
        destination=request.destination,
        start_date=request.start_date,
        end_date=request.end_date,
    )

    result = await _runner.run(
        destination=request.destination,
        start_date=request.start_date,
        end_date=request.end_date,
    )

    if not result.success:
        log.error(
            "api.plan_trip.pipeline_error",
            pipeline_id=result.pipeline_id,
            error=result.error,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "pipeline_id": result.pipeline_id,
                "error":       result.error,
                "trace":       result.trace,
            },
        )

    # ── Shape the response ────────────────────────────────────────────────────
    itinerary_data = result.itinerary
    weather_data   = result.weather

    itinerary_model = ItinerarySummary(
        destination=        itinerary_data["destination"],
        forecast=           itinerary_data["forecast"],
        bad_weather=        itinerary_data["bad_weather"],
        days=               itinerary_data["days"],
        swaps_made=         itinerary_data["swaps_made"],
        itinerary_markdown= itinerary_data["itinerary_markdown"],
        activities=         itinerary_data.get("activities", []),
    )

    weather_model = WeatherSummary(
        city=             weather_data["city"],
        forecast=         weather_data["forecast"],
        temperature_c=    weather_data["temperature_c"],
        humidity_percent= weather_data["humidity_percent"],
        uv_index=         weather_data["uv_index"],
        bad_weather=      weather_data["bad_weather"],
        queried_at=       weather_data["queried_at"],
        source=           weather_data["source"],
    )

    trace_models = [
        AgentTraceSummary(
            run_id=     t["run_id"],
            agent_name= t["agent_name"],
            status=     t["status"],
            duration_ms=t["duration_ms"],
            metadata=   t.get("metadata", {}),
            error=      t.get("error"),
        )
        for t in result.trace
    ]

    response = PlanTripResponse(
        pipeline_id= result.pipeline_id,
        success=     result.success,
        destination= result.destination,
        start_date=  result.start_date,
        end_date=    result.end_date,
        itinerary=   itinerary_model,
        weather=     weather_model,
        trace=       trace_models,
        total_ms=    result.total_ms,
    )

    log.info(
        "api.plan_trip.response_sent",
        pipeline_id=result.pipeline_id,
        total_ms=round(result.total_ms, 2),
        swaps_made=itinerary_data["swaps_made"],
    )

    return response


# ── GET /api/health ───────────────────────────────────────────────────────────


@router.get(
    "/health",
    summary="Health check",
    response_description="Service health status.",
)
async def health_check() -> JSONResponse:
    """Returns 200 OK when the service is running."""
    return JSONResponse(
        content={
            "status":  "healthy",
            "service": "RouteScout API",
            "version": "1.0.0",
        }
    )


# ── GET /api/agents ───────────────────────────────────────────────────────────


@router.get(
    "/agents",
    response_model=AgentListResponse,
    summary="List registered agents",
    response_description="All agents in the RouteScout pipeline.",
)
async def list_agents() -> AgentListResponse:
    """Returns metadata for all registered agents in the pipeline."""
    agents = [
        AgentInfo(name=a.name, description=a.description)
        for a in _REGISTERED_AGENTS
    ]
    return AgentListResponse(agents=agents, total=len(agents))
