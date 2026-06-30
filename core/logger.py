"""
RouteScout — core/logger.py
============================
Structured logging with structlog.
All agent handoffs and execution state transitions are emitted as
structured JSON events so they can be consumed by the Antigravity
browser monitoring framework.
"""

import logging
import sys
import structlog
from core.config import settings


def _configure_stdlib_logging() -> None:
    """Configure the standard-library root logger to feed into structlog."""
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )


def _build_processors() -> list:
    """Return the list of structlog processors for the current environment."""
    shared = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.log_level.upper() == "DEBUG":
        # Human-readable in development
        return shared + [structlog.dev.ConsoleRenderer()]

    # Machine-readable JSON for production / Antigravity tracing
    return shared + [
        structlog.processors.dict_tracebacks,
        structlog.processors.JSONRenderer(),
    ]


def setup_logging() -> None:
    """
    Call once at application startup to initialise structlog.
    After this, obtain loggers via `get_logger(__name__)`.
    """
    _configure_stdlib_logging()

    structlog.configure(
        processors=_build_processors(),
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper(), logging.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = "routescout") -> structlog.BoundLogger:
    """Return a named structlog logger."""
    return structlog.get_logger(name)
