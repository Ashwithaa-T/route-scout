"""
RouteScout — orchestration/agent_runner.py
==========================================
Multi-agent orchestration loop with full Antigravity execution state tracking.

Pipeline
--------
  ExecutionContext is initialised with the user's request inputs.

  Step 1 → TripPlannerAgent     (independent — no upstream deps)
  Step 2 → WeatherCheckerAgent  (independent — no upstream deps)
  Step 3 → OptimizerAgent       (depends on Steps 1 & 2)

  Steps 1 & 2 run CONCURRENTLY via asyncio.gather for efficiency.
  Step 3 runs after both complete.

Execution State
---------------
  Every agent transition emits a structured log event with the key
  `_antigravity_event` so the Antigravity browser framework can
  parse and visualise the agent execution graph in real time.

  State machine per agent:
    PENDING → RUNNING → SUCCESS | FAILED

  The PipelineResult carries the full trace so API callers receive
  complete observability data alongside the final itinerary.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

from agents.base_agent import AgentResult, AgentStatus
from agents.trip_planner_agent import TripPlannerAgent
from agents.weather_checker_agent import WeatherCheckerAgent
from agents.optimizer_agent import OptimizerAgent
from core.logger import get_logger

log = get_logger("orchestration.runner")


# ── Result containers ─────────────────────────────────────────────────────────


@dataclass
class PipelineResult:
    """
    Top-level result returned to the API layer after the full pipeline runs.

    Fields
    ------
    pipeline_id  : Unique identifier for this pipeline run (for tracing).
    success      : True iff all agents completed successfully.
    destination  : Trip destination (echoed for convenience).
    start_date   : Trip start date.
    end_date     : Trip end date.
    itinerary    : Final optimised itinerary (from OptimizerAgent).
    weather      : Weather summary (from WeatherCheckerAgent).
    trace        : Ordered list of AgentResult dicts — full execution trace
                   for Antigravity monitoring.
    total_ms     : Wall-clock time for the complete pipeline in milliseconds.
    error        : Human-readable error summary if success=False.
    """

    pipeline_id: str
    success: bool
    destination: str
    start_date: str
    end_date: str
    itinerary: dict[str, Any]
    weather: dict[str, Any]
    trace: list[dict[str, Any]] = field(default_factory=list)
    total_ms: float = 0.0
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "pipeline_id": self.pipeline_id,
            "success":     self.success,
            "destination": self.destination,
            "start_date":  self.start_date,
            "end_date":    self.end_date,
            "itinerary":   self.itinerary,
            "weather":     self.weather,
            "trace":       self.trace,
            "total_ms":    round(self.total_ms, 2),
            "error":       self.error,
        }


# ── Orchestrator ──────────────────────────────────────────────────────────────


class AgentRunner:
    """
    Orchestrates the three-agent RouteScout pipeline.

    Usage
    -----
    ::

        runner = AgentRunner()
        result = await runner.run(
            destination="Paris",
            start_date="2024-08-01",
            end_date="2024-08-05",
        )
    """

    def __init__(self) -> None:
        self._trip_planner    = TripPlannerAgent()
        self._weather_checker = WeatherCheckerAgent()
        self._optimizer       = OptimizerAgent()

    async def run(
        self,
        destination: str,
        start_date: str,
        end_date: str,
    ) -> PipelineResult:
        """
        Execute the full multi-agent pipeline and return a PipelineResult.

        Parameters
        ----------
        destination : str
            Trip destination city.
        start_date  : str
            ISO date string (YYYY-MM-DD).
        end_date    : str
            ISO date string (YYYY-MM-DD).
        """
        pipeline_id = str(uuid.uuid4())
        wall_start  = time.perf_counter()

        log.info(
            "pipeline.start",
            pipeline_id=pipeline_id,
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            _antigravity_event="pipeline_start",
        )

        # ── Shared execution context ──────────────────────────────────────────
        context: dict[str, Any] = {
            "pipeline_id": pipeline_id,
            "destination": destination,
            "start_date":  start_date,
            "end_date":    end_date,
        }

        trace: list[AgentResult] = []

        # ─────────────────────────────────────────────────────────────────────
        # STEP 1 & 2 — Run TripPlanner and WeatherChecker CONCURRENTLY
        # ─────────────────────────────────────────────────────────────────────
        log.info(
            "pipeline.parallel_phase",
            agents=["trip_planner", "weather_checker"],
            _antigravity_event="parallel_phase_start",
        )

        planner_result, weather_result = await asyncio.gather(
            self._trip_planner.execute(context),
            self._weather_checker.execute(context),
            return_exceptions=False,
        )

        trace.extend([planner_result, weather_result])

        # Fail-fast if either upstream agent failed
        for result in (planner_result, weather_result):
            if result.status == AgentStatus.FAILED:
                total_ms = (time.perf_counter() - wall_start) * 1000
                log.error(
                    "pipeline.early_failure",
                    pipeline_id=pipeline_id,
                    failed_agent=result.agent_name,
                    error=result.error,
                    _antigravity_event="pipeline_failure",
                )
                return PipelineResult(
                    pipeline_id=pipeline_id,
                    success=False,
                    destination=destination,
                    start_date=start_date,
                    end_date=end_date,
                    itinerary={},
                    weather={},
                    trace=[r.to_dict() for r in trace],
                    total_ms=total_ms,
                    error=f"Agent '{result.agent_name}' failed: {result.error}",
                )

        log.info(
            "pipeline.parallel_phase_complete",
            _antigravity_event="parallel_phase_complete",
        )

        # ─────────────────────────────────────────────────────────────────────
        # STEP 3 — Optimizer (sequential, depends on 1 & 2)
        # ─────────────────────────────────────────────────────────────────────
        log.info(
            "pipeline.handoff",
            from_agents=["trip_planner", "weather_checker"],
            to_agent="optimizer",
            _antigravity_event="agent_handoff",
        )

        optimizer_result = await self._optimizer.execute(context)
        trace.append(optimizer_result)

        total_ms = (time.perf_counter() - wall_start) * 1000

        if optimizer_result.status == AgentStatus.FAILED:
            log.error(
                "pipeline.optimizer_failure",
                pipeline_id=pipeline_id,
                error=optimizer_result.error,
                _antigravity_event="pipeline_failure",
            )
            return PipelineResult(
                pipeline_id=pipeline_id,
                success=False,
                destination=destination,
                start_date=start_date,
                end_date=end_date,
                itinerary={},
                weather=weather_result.output,
                trace=[r.to_dict() for r in trace],
                total_ms=total_ms,
                error=f"Optimizer failed: {optimizer_result.error}",
            )

        # ── Success ───────────────────────────────────────────────────────────
        log.info(
            "pipeline.complete",
            pipeline_id=pipeline_id,
            destination=destination,
            swaps_made=optimizer_result.output.get("swaps_made", 0),
            total_ms=round(total_ms, 2),
            _antigravity_event="pipeline_complete",
        )

        return PipelineResult(
            pipeline_id=pipeline_id,
            success=True,
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            itinerary=optimizer_result.output,
            weather=weather_result.output,
            trace=[r.to_dict() for r in trace],
            total_ms=total_ms,
        )
