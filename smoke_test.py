"""
RouteScout — smoke_test.py
===========================
Quick integration smoke test that can be run without pytest.
Calls the full pipeline in-process and prints results to stdout.

Usage:
    python smoke_test.py
"""

import asyncio
import sys

# Force UTF-8 output on Windows so structlog JSON doesn't crash on emoji
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]

from core.logger import setup_logging
setup_logging()

from orchestration.agent_runner import AgentRunner


async def main() -> None:
    runner = AgentRunner()

    test_cases = [
        {"destination": "Paris",     "start_date": "2024-08-01", "end_date": "2024-08-05"},
        {"destination": "Tokyo",     "start_date": "2024-09-10", "end_date": "2024-09-13"},
        {"destination": "San Diego", "start_date": "2024-07-20", "end_date": "2024-07-22"},
        {"destination": "London",    "start_date": "2024-10-05", "end_date": "2024-10-07"},
    ]

    for tc in test_cases:
        print(f"\n{'='*60}")
        print(f"Planning trip to {tc['destination']} ({tc['start_date']} -> {tc['end_date']})")
        print(f"{'='*60}")

        result = await runner.run(**tc)

        print(f"  Success      : {result.success}")
        print(f"  Forecast     : {result.weather.get('forecast', 'N/A')}")
        print(f"  Bad Weather  : {result.weather.get('bad_weather', False)}")
        print(f"  Swaps Made   : {result.itinerary.get('swaps_made', 0)}")
        print(f"  Total ms     : {result.total_ms:.1f}")
        print()

        # Print the final itinerary markdown (strip emoji for safe console output)
        itinerary_md = result.itinerary.get("itinerary_markdown", "No itinerary generated")
        print(itinerary_md)

        # Print trace summary
        print("\nExecution Trace:")
        for t in result.trace:
            status_icon = "[OK]  " if t["status"] == "SUCCESS" else "[FAIL]"
            print(f"  {status_icon} {t['agent_name']:25s} | {t['status']:8s} | {t['duration_ms']:.1f}ms")


if __name__ == "__main__":
    asyncio.run(main())
