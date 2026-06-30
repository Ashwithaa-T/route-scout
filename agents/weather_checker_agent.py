"""
RouteScout — agents/weather_checker_agent.py
=============================================
Agent 2: WeatherCheckerAgent

Responsibility
--------------
Calls the local MCP JSON-RPC server's `fetch_weather` tool to retrieve
the current forecast for the trip destination. The result is stored in
the shared context for the OptimizerAgent to consume.

MCP Call Flow
-------------
  1. Build a JSON-RPC 2.0 request envelope.
  2. POST it to http://127.0.0.1:<MCP_SERVER_PORT>/mcp/jsonrpc.
  3. Parse the response and return a structured WeatherResult.

Context keys consumed
---------------------
  context["destination"]  : str

Context keys produced
---------------------
  context["weather_checker"] : AgentResult
    result.output = {
        "city":             str,
        "forecast":         str,   e.g. "Rainy"
        "temperature_c":    int,
        "humidity_percent": int,
        "uv_index":         int,
        "bad_weather":      bool,
        "queried_at":       str,
        "source":           str,
    }
"""

from __future__ import annotations

import uuid
from typing import Any

import httpx

from agents.base_agent import AgentResult, AgentStatus, BaseAgent
from core.config import settings
from core.logger import get_logger
# Import the local function as a fallback (same-process call when MCP
# server is not running as a separate process)
from mcp_server.weather_server import fetch_weather as local_fetch_weather

log = get_logger("agents.weather_checker")


class WeatherCheckerAgent(BaseAgent):
    """
    Agent 2 — WeatherCheckerAgent

    Calls the MCP `fetch_weather` tool (via HTTP JSON-RPC) to get the
    current weather forecast for the trip destination.

    Fallback strategy
    -----------------
    If the HTTP call to the MCP server fails (e.g., server not running
    separately), the agent falls back to calling the Python function
    directly within the same process. This makes local development
    seamless — the MCP server is also mounted into the main FastAPI app.
    """

    name = "weather_checker"
    description = (
        "Fetches the current weather forecast for the destination city "
        "via the MCP fetch_weather tool."
    )

    async def run(self, context: dict[str, Any]) -> AgentResult:
        destination: str = context["destination"]

        self._log.info(
            "weather_checker.run",
            destination=destination,
            mcp_url=settings.mcp_server_url,
        )

        weather_data = await self._call_mcp_fetch_weather(destination)

        return AgentResult(
            agent_name=self.name,
            status=AgentStatus.SUCCESS,
            output=weather_data,
            metadata={
                "mcp_tool": "fetch_weather",
                "forecast": weather_data["forecast"],
                "bad_weather": weather_data["bad_weather"],
                "transport": weather_data.get("_transport", "http"),
            },
        )

    async def _call_mcp_fetch_weather(self, city: str) -> dict[str, Any]:
        """
        Build and dispatch a JSON-RPC 2.0 request to the MCP weather server.
        Falls back to an in-process call on network error.
        """
        rpc_payload = {
            "jsonrpc": "2.0",
            "method":  "fetch_weather",
            "params":  {"city": city},
            "id":      str(uuid.uuid4()),
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    settings.mcp_server_url,
                    json=rpc_payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
                rpc_response = response.json()

                if "error" in rpc_response:
                    raise ValueError(
                        f"MCP error {rpc_response['error']['code']}: "
                        f"{rpc_response['error']['message']}"
                    )

                result = rpc_response["result"]
                result["_transport"] = "http"

                self._log.info(
                    "weather_checker.mcp_response",
                    city=result["city"],
                    forecast=result["forecast"],
                    bad_weather=result["bad_weather"],
                    transport="http",
                )
                return result

        except httpx.HTTPError as exc:
            # Network error — fall back to in-process call
            self._log.warning(
                "weather_checker.mcp_http_fallback",
                reason=str(exc),
                fallback="in_process",
            )
            return self._inprocess_fetch_weather(city)

    def _inprocess_fetch_weather(self, city: str) -> dict[str, Any]:
        """
        In-process fallback: calls the Python function directly.
        Used when the MCP server endpoint is mounted in the same app
        and cannot call itself via HTTP (loopback).
        """
        result = local_fetch_weather(city)
        result["_transport"] = "in_process"

        self._log.info(
            "weather_checker.inprocess_response",
            city=result["city"],
            forecast=result["forecast"],
            bad_weather=result["bad_weather"],
            transport="in_process",
        )
        return result
