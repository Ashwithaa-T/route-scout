"""
RouteScout — core/config.py
============================
Centralised configuration loaded from environment variables (.env file).
Never hardcode secrets — all sensitive values MUST be set via env vars.
"""

import os
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """
    Application settings resolved from environment variables.

    Pydantic-settings automatically reads from:
      1. Environment variables (highest priority)
      2. A .env file in the project root (if present)
    """

    # ── LLM / API ─────────────────────────────────────────────────────────────
    google_api_key: str = Field(
        default="",
        description="Google Gemini API key. Leave empty to run in mock mode.",
    )
    mock_llm: bool = Field(
        default=True,
        description="When True, agents return deterministic mock responses "
                    "instead of calling the real LLM API.",
    )

    # ── MCP Server ────────────────────────────────────────────────────────────
    mcp_server_port: int = Field(
        default=5001,
        description="Port on which the local MCP JSON-RPC weather server runs.",
    )
    mcp_server_host: str = Field(
        default="127.0.0.1",
        description="Host of the local MCP server.",
    )

    # ── Application ───────────────────────────────────────────────────────────
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8000)
    log_level: str = Field(default="INFO")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def mcp_server_url(self) -> str:
        """Full URL of the local MCP JSON-RPC server."""
        return f"http://{self.mcp_server_host}:{self.mcp_server_port}/jsonrpc"

    @property
    def llm_available(self) -> bool:
        """True when a real API key is provided and mock mode is disabled."""
        return bool(self.google_api_key) and not self.mock_llm


# Module-level singleton — import this everywhere
settings = Settings()
