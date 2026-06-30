"""
RouteScout — agents/base_agent.py
===================================
Abstract base class for all RouteScout agents.

Every concrete agent must implement `run()`, which receives a shared
`ExecutionContext` dict and returns an `AgentResult`. The context is
mutated in place so that downstream agents can read upstream outputs
without coupling to specific agent types.

AgentResult carries:
  - status  : AgentStatus enum (PENDING → RUNNING → SUCCESS / FAILED)
  - output  : the agent's primary payload (any JSON-serialisable value)
  - metadata: arbitrary key/value pairs for Antigravity trace visibility
  - error   : populated only on failure
"""

from __future__ import annotations

import time
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from core.logger import get_logger

log = get_logger("agents.base")


# ── Enumerations ──────────────────────────────────────────────────────────────


class AgentStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED  = "FAILED"
    SKIPPED = "SKIPPED"


# ── Data containers ───────────────────────────────────────────────────────────


@dataclass
class AgentResult:
    """
    Immutable result object returned by every agent invocation.

    Fields
    ------
    agent_name : str
        Canonical name of the agent that produced this result.
    status : AgentStatus
        Final execution status.
    output : Any
        Primary payload — must be JSON-serialisable.
    metadata : dict
        Supplementary information (timing, token counts, tool calls, …).
        Always included in Antigravity trace events.
    error : str | None
        Human-readable error message, populated only when status=FAILED.
    run_id : str
        UUID4 that uniquely identifies this agent run for trace correlation.
    duration_ms : float
        Wall-clock execution time in milliseconds (set by BaseAgent.execute).
    """

    agent_name: str
    status: AgentStatus
    output: Any
    metadata: dict[str, Any] = field(default_factory=dict)
    error: str | None = None
    run_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    duration_ms: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        """Serialise to a plain dict (JSON-safe)."""
        return {
            "run_id":      self.run_id,
            "agent_name":  self.agent_name,
            "status":      self.status.value,
            "output":      self.output,
            "metadata":    self.metadata,
            "error":       self.error,
            "duration_ms": round(self.duration_ms, 2),
        }


# ── Base agent ────────────────────────────────────────────────────────────────


class BaseAgent(ABC):
    """
    Abstract base class for all RouteScout agents.

    Subclasses implement `run(context)`. The `execute()` wrapper handles:
      - timing
      - structured log emission for Antigravity tracing
      - error catching and AgentResult construction
    """

    #: Override in subclasses with a human-readable agent identifier.
    name: str = "unnamed_agent"
    #: Short description shown in /api/agents endpoint.
    description: str = ""

    def __init__(self) -> None:
        self._log = get_logger(f"agents.{self.name}")

    @abstractmethod
    async def run(self, context: dict[str, Any]) -> AgentResult:
        """
        Execute the agent's core logic.

        Parameters
        ----------
        context : dict
            Shared execution context. Agents read their inputs from this dict
            and write their `AgentResult` back under their own `name` key.

        Returns
        -------
        AgentResult
            The result of this agent's execution.
        """
        ...

    async def execute(self, context: dict[str, Any]) -> AgentResult:
        """
        Public entry point. Wraps `run()` with timing, logging, and error
        handling. Callers should always use this method, never `run()` directly.
        """
        run_id = str(uuid.uuid4())
        start = time.perf_counter()

        # ── RUNNING state ─────────────────────────────────────────────────────
        self._log.info(
            "agent.start",
            agent=self.name,
            run_id=run_id,
            status=AgentStatus.RUNNING.value,
            # Antigravity trace marker — do not remove
            _antigravity_event="agent_handoff",
        )

        try:
            result = await self.run(context)
            result.run_id = run_id
            result.duration_ms = (time.perf_counter() - start) * 1000

            # ── SUCCESS state ─────────────────────────────────────────────────
            self._log.info(
                "agent.complete",
                agent=self.name,
                run_id=run_id,
                status=result.status.value,
                duration_ms=round(result.duration_ms, 2),
                _antigravity_event="agent_complete",
            )

        except Exception as exc:  # noqa: BLE001
            duration_ms = (time.perf_counter() - start) * 1000
            error_msg = f"{type(exc).__name__}: {exc}"

            # ── FAILED state ──────────────────────────────────────────────────
            self._log.error(
                "agent.error",
                agent=self.name,
                run_id=run_id,
                status=AgentStatus.FAILED.value,
                error=error_msg,
                duration_ms=round(duration_ms, 2),
                _antigravity_event="agent_error",
                exc_info=True,
            )
            result = AgentResult(
                agent_name=self.name,
                status=AgentStatus.FAILED,
                output=None,
                error=error_msg,
                run_id=run_id,
                duration_ms=duration_ms,
            )

        # Write result into the shared context under the agent's own key
        context[self.name] = result
        return result
