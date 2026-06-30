"""
RouteScout — mcp_server/weather_server.py
==========================================
Lightweight JSON-RPC 2.0 server that exposes the MCP tool:

    fetch_weather(city: str) → WeatherResponse

This server runs as a FastAPI sub-application (mounted at /mcp) so it
shares the same process as the main API. For production, you would spin
this up independently (e.g., in a Docker sidecar).

Weather data is intentionally mocked to keep the system self-contained.
The mock dataset covers 30+ popular travel destinations with realistic
seasonal forecasts.
"""

import random
from datetime import datetime
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from core.logger import get_logger

log = get_logger("mcp_server.weather")

# ── Mock weather database ─────────────────────────────────────────────────────
# Each city maps to a list of possible forecasts weighted by season.
# In a real system, this would call OpenWeatherMap / Weather.gov.
WEATHER_DATABASE: dict[str, list[dict]] = {
    # ── Beach / Tropical ──────────────────────────────────────────────────────
    "miami": [
        {"forecast": "Sunny", "temp_c": 32, "humidity_pct": 65, "uv_index": 9},
        {"forecast": "Partly Cloudy", "temp_c": 29, "humidity_pct": 72, "uv_index": 7},
        {"forecast": "Thunderstorms", "temp_c": 27, "humidity_pct": 88, "uv_index": 3},
    ],
    "bali": [
        {"forecast": "Sunny", "temp_c": 30, "humidity_pct": 70, "uv_index": 8},
        {"forecast": "Heavy Rain", "temp_c": 26, "humidity_pct": 90, "uv_index": 2},
        {"forecast": "Partly Cloudy", "temp_c": 28, "humidity_pct": 75, "uv_index": 6},
    ],
    "cancun": [
        {"forecast": "Sunny", "temp_c": 33, "humidity_pct": 60, "uv_index": 10},
        {"forecast": "Rainy", "temp_c": 27, "humidity_pct": 85, "uv_index": 4},
    ],
    "hawaii": [
        {"forecast": "Sunny", "temp_c": 28, "humidity_pct": 55, "uv_index": 8},
        {"forecast": "Showers", "temp_c": 25, "humidity_pct": 78, "uv_index": 5},
    ],
    # ── European Cities ───────────────────────────────────────────────────────
    "paris": [
        {"forecast": "Cloudy", "temp_c": 15, "humidity_pct": 70, "uv_index": 3},
        {"forecast": "Rainy", "temp_c": 12, "humidity_pct": 85, "uv_index": 2},
        {"forecast": "Sunny", "temp_c": 22, "humidity_pct": 55, "uv_index": 6},
    ],
    "london": [
        {"forecast": "Drizzle", "temp_c": 13, "humidity_pct": 80, "uv_index": 2},
        {"forecast": "Overcast", "temp_c": 11, "humidity_pct": 78, "uv_index": 1},
        {"forecast": "Partly Cloudy", "temp_c": 18, "humidity_pct": 62, "uv_index": 4},
    ],
    "rome": [
        {"forecast": "Sunny", "temp_c": 28, "humidity_pct": 45, "uv_index": 9},
        {"forecast": "Partly Cloudy", "temp_c": 24, "humidity_pct": 55, "uv_index": 7},
        {"forecast": "Rainy", "temp_c": 18, "humidity_pct": 80, "uv_index": 3},
    ],
    "barcelona": [
        {"forecast": "Sunny", "temp_c": 26, "humidity_pct": 50, "uv_index": 8},
        {"forecast": "Partly Cloudy", "temp_c": 22, "humidity_pct": 60, "uv_index": 6},
    ],
    "amsterdam": [
        {"forecast": "Rainy", "temp_c": 14, "humidity_pct": 82, "uv_index": 2},
        {"forecast": "Cloudy", "temp_c": 16, "humidity_pct": 75, "uv_index": 3},
        {"forecast": "Sunny", "temp_c": 20, "humidity_pct": 58, "uv_index": 5},
    ],
    # ── Asian Cities ──────────────────────────────────────────────────────────
    "tokyo": [
        {"forecast": "Sunny", "temp_c": 24, "humidity_pct": 60, "uv_index": 7},
        {"forecast": "Partly Cloudy", "temp_c": 20, "humidity_pct": 68, "uv_index": 5},
        {"forecast": "Rainy", "temp_c": 18, "humidity_pct": 88, "uv_index": 2},
    ],
    "singapore": [
        {"forecast": "Thunderstorms", "temp_c": 29, "humidity_pct": 92, "uv_index": 4},
        {"forecast": "Sunny", "temp_c": 32, "humidity_pct": 70, "uv_index": 9},
        {"forecast": "Heavy Rain", "temp_c": 27, "humidity_pct": 90, "uv_index": 2},
    ],
    "bangkok": [
        {"forecast": "Sunny", "temp_c": 35, "humidity_pct": 65, "uv_index": 10},
        {"forecast": "Thunderstorms", "temp_c": 30, "humidity_pct": 90, "uv_index": 3},
    ],
    "bengaluru": [
        {"forecast": "Sunny", "temp_c": 26, "humidity_pct": 50, "uv_index": 7},
        {"forecast": "Partly Cloudy", "temp_c": 24, "humidity_pct": 60, "uv_index": 6},
        {"forecast": "Rainy", "temp_c": 21, "humidity_pct": 80, "uv_index": 3},
    ],
    "jaipur": [
        {"forecast": "Sunny", "temp_c": 36, "humidity_pct": 30, "uv_index": 9},
        {"forecast": "Hot and Sunny", "temp_c": 40, "humidity_pct": 20, "uv_index": 10},
        {"forecast": "Rainy", "temp_c": 30, "humidity_pct": 70, "uv_index": 4},
    ],
    "hyderabad": [
        {"forecast": "Sunny", "temp_c": 32, "humidity_pct": 40, "uv_index": 8},
        {"forecast": "Partly Cloudy", "temp_c": 29, "humidity_pct": 55, "uv_index": 7},
        {"forecast": "Rainy", "temp_c": 25, "humidity_pct": 75, "uv_index": 3},
    ],
    "chennai": [
        {"forecast": "Sunny", "temp_c": 34, "humidity_pct": 75, "uv_index": 9},
        {"forecast": "Showers", "temp_c": 29, "humidity_pct": 85, "uv_index": 4},
        {"forecast": "Thunderstorms", "temp_c": 27, "humidity_pct": 90, "uv_index": 3},
    ],
    "mumbai": [
        {"forecast": "Sunny", "temp_c": 31, "humidity_pct": 70, "uv_index": 8},
        {"forecast": "Heavy Rain", "temp_c": 26, "humidity_pct": 92, "uv_index": 2},
        {"forecast": "Partly Cloudy", "temp_c": 29, "humidity_pct": 75, "uv_index": 6},
    ],
    # ── American Cities ───────────────────────────────────────────────────────
    "new york": [
        {"forecast": "Sunny", "temp_c": 20, "humidity_pct": 55, "uv_index": 6},
        {"forecast": "Cloudy", "temp_c": 15, "humidity_pct": 68, "uv_index": 3},
        {"forecast": "Rainy", "temp_c": 12, "humidity_pct": 82, "uv_index": 2},
        {"forecast": "Snowy", "temp_c": -2, "humidity_pct": 75, "uv_index": 1},
    ],
    "san francisco": [
        {"forecast": "Foggy", "temp_c": 16, "humidity_pct": 85, "uv_index": 3},
        {"forecast": "Sunny", "temp_c": 20, "humidity_pct": 60, "uv_index": 6},
        {"forecast": "Partly Cloudy", "temp_c": 18, "humidity_pct": 72, "uv_index": 4},
    ],
    "san diego": [
        {"forecast": "Sunny", "temp_c": 25, "humidity_pct": 58, "uv_index": 8},
        {"forecast": "Partly Cloudy", "temp_c": 22, "humidity_pct": 65, "uv_index": 6},
        {"forecast": "Rainy", "temp_c": 18, "humidity_pct": 78, "uv_index": 3},
    ],
    "las vegas": [
        {"forecast": "Sunny", "temp_c": 38, "humidity_pct": 20, "uv_index": 11},
        {"forecast": "Hot and Sunny", "temp_c": 42, "humidity_pct": 15, "uv_index": 12},
    ],
    # ── Default fallback ──────────────────────────────────────────────────────
    "__default__": [
        {"forecast": "Partly Cloudy", "temp_c": 20, "humidity_pct": 65, "uv_index": 5},
        {"forecast": "Sunny", "temp_c": 24, "humidity_pct": 55, "uv_index": 7},
        {"forecast": "Rainy", "temp_c": 16, "humidity_pct": 80, "uv_index": 3},
    ],
}

# ── Forecasts classified as "bad weather" for the optimizer ──────────────────
BAD_WEATHER_CONDITIONS = {
    "rainy", "heavy rain", "thunderstorms", "drizzle",
    "showers", "snowy", "overcast", "foggy",
}


def _is_bad_weather(forecast: str) -> bool:
    return forecast.lower() in BAD_WEATHER_CONDITIONS


def fetch_weather(city: str) -> dict[str, Any]:
    """
    Core MCP tool: return a mock weather forecast for the given city.

    Parameters
    ----------
    city : str
        Name of the destination city (case-insensitive).

    Returns
    -------
    dict
        Structured weather data including forecast label, temperature,
        humidity, UV index, a bad_weather flag, and the query timestamp.
    """
    key = city.strip().lower()
    options = WEATHER_DATABASE.get(key, WEATHER_DATABASE["__default__"])

    # Seed with city name for deterministic results per session
    rng = random.Random(key + str(datetime.utcnow().date()))
    chosen = rng.choice(options)

    result = {
        "city": city.title(),
        "forecast": chosen["forecast"],
        "temperature_c": chosen["temp_c"],
        "humidity_percent": chosen["humidity_pct"],
        "uv_index": chosen["uv_index"],
        "bad_weather": _is_bad_weather(chosen["forecast"]),
        "queried_at": datetime.utcnow().isoformat() + "Z",
        "source": "RouteScout MCP Mock Server v1.0",
    }

    log.info(
        "mcp.fetch_weather",
        city=result["city"],
        forecast=result["forecast"],
        bad_weather=result["bad_weather"],
    )
    return result


# ── JSON-RPC 2.0 dispatcher ───────────────────────────────────────────────────

def _jsonrpc_error(id_: Any, code: int, message: str) -> dict:
    return {"jsonrpc": "2.0", "id": id_, "error": {"code": code, "message": message}}


def _jsonrpc_result(id_: Any, result: Any) -> dict:
    return {"jsonrpc": "2.0", "id": id_, "result": result}


async def dispatch_jsonrpc(payload: dict) -> dict:
    """
    Dispatch a single JSON-RPC 2.0 request object to the appropriate tool.

    Supported methods
    -----------------
    - ``fetch_weather``  params: {"city": "<name>"}
    - ``list_tools``     params: {}  — returns the tool manifest
    """
    rpc_id = payload.get("id")
    method = payload.get("method", "")
    params = payload.get("params", {})

    log.debug("mcp.dispatch", method=method, params=params)

    if method == "fetch_weather":
        city = params.get("city", "").strip()
        if not city:
            return _jsonrpc_error(rpc_id, -32602, "Missing required param: city")
        return _jsonrpc_result(rpc_id, fetch_weather(city))

    if method == "list_tools":
        manifest = {
            "tools": [
                {
                    "name": "fetch_weather",
                    "description": "Return the current weather forecast for a city.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "city": {"type": "string", "description": "City name"}
                        },
                        "required": ["city"],
                    },
                }
            ]
        }
        return _jsonrpc_result(rpc_id, manifest)

    return _jsonrpc_error(rpc_id, -32601, f"Method not found: {method}")


# ── FastAPI sub-application ───────────────────────────────────────────────────

mcp_app = FastAPI(
    title="RouteScout MCP Weather Server",
    description="Local JSON-RPC 2.0 MCP server exposing the fetch_weather tool.",
    version="1.0.0",
)


@mcp_app.post("/jsonrpc")
async def jsonrpc_endpoint(request: Request) -> JSONResponse:
    """
    POST /jsonrpc
    Accept a JSON-RPC 2.0 request (single or batch) and return results.
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            _jsonrpc_error(None, -32700, "Parse error: invalid JSON"),
            status_code=400,
        )

    # Batch support
    if isinstance(body, list):
        results = [await dispatch_jsonrpc(item) for item in body]
        return JSONResponse(results)

    result = await dispatch_jsonrpc(body)
    return JSONResponse(result)


@mcp_app.get("/health")
async def mcp_health() -> dict:
    return {"status": "ok", "service": "MCP Weather Server"}
