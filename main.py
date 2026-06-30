"""
RouteScout — main.py
=====================
FastAPI application entry point.

Startup sequence
----------------
1. Logging is configured.
2. The FastAPI app is created with full OpenAPI metadata.
3. CORS middleware is added.
4. The MCP server sub-application is mounted at /mcp.
5. API routes are registered under /api.
6. A root redirect sends browsers to /docs.

Run with:
    uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from api.routes import router as api_router
from core.config import settings
from core.logger import get_logger, setup_logging
from mcp_server.weather_server import mcp_app

# ── Logging must be configured before any module uses get_logger() ─────────
setup_logging()
log = get_logger("main")


# ── Lifespan (startup / shutdown hooks) ───────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """
    FastAPI lifespan context manager.
    Code before yield → startup.
    Code after yield  → shutdown.
    """
    log.info(
        "routescout.startup",
        version="1.0.0",
        mock_llm=settings.mock_llm,
        llm_available=settings.llm_available,
        mcp_server_url=settings.mcp_server_url,
        _antigravity_event="app_startup",
    )
    yield
    log.info("routescout.shutdown", _antigravity_event="app_shutdown")


# ── Application factory ────────────────────────────────────────────────────────


def create_app() -> FastAPI:
    """Construct and configure the FastAPI application."""

    app = FastAPI(
        title="RouteScout — Intelligent Travel Agent API",
        description=(
            "Multi-agent travel planning system powered by FastAPI and ADK-style agents.\n\n"
            "**Agents**:\n"
            "- 🗓️ `TripPlannerAgent` — generates a raw day-by-day itinerary\n"
            "- 🌦️ `WeatherCheckerAgent` — fetches live forecast via MCP tool\n"
            "- 🔄 `OptimizerAgent` — swaps outdoor activities on bad-weather days\n\n"
            "**MCP Server**: mounted at `/mcp/jsonrpc` (JSON-RPC 2.0)\n\n"
            "See `/docs` for the full interactive API reference."
        ),
        version="1.0.0",
        contact={
            "name": "RouteScout",
            "url":  "https://github.com/your-org/routescout",
        },
        license_info={"name": "MIT"},
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    # In production, replace allow_origins=["*"] with your frontend domain(s).
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Mount MCP sub-application ─────────────────────────────────────────────
    # The MCP weather server is reachable at /mcp/jsonrpc and /mcp/health.
    # WeatherCheckerAgent will call this endpoint unless it fails over to
    # the in-process function call.
    app.mount("/mcp", mcp_app)

    # ── Register API routes ───────────────────────────────────────────────────
    app.include_router(api_router)

    # ── Root redirect ─────────────────────────────────────────────────────────
    @app.get("/", include_in_schema=False)
    async def root() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    return app


# ── Module-level app instance (used by uvicorn) ───────────────────────────────
app = create_app()


# ── Direct execution ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
