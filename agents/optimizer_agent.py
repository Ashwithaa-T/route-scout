"""
RouteScout — agents/optimizer_agent.py
=======================================
Agent 3: OptimizerAgent

Responsibility
--------------
Reads the raw itinerary from TripPlannerAgent and the weather forecast
from WeatherCheckerAgent. If the forecast indicates bad weather (rain,
storms, overcast, fog, snow, etc.), it swaps every OUTDOOR activity on
each affected day for an equivalent INDOOR alternative.

The optimizer applies rule-based substitution — no LLM call required.
In a production system you could upgrade this to an LLM re-planner.

Swap Logic
----------
  outdoor  → indoor alternative selected from INDOOR_ALTERNATIVES
  (indoor, cultural, culinary activities are kept as-is)

Context keys consumed
---------------------
  context["trip_planner"]     : AgentResult
  context["weather_checker"]  : AgentResult

Context keys produced
---------------------
  context["optimizer"] : AgentResult
    result.output = {
        "destination":        str,
        "forecast":           str,
        "bad_weather":        bool,
        "days":               int,
        "swaps_made":         int,
        "itinerary_markdown": str,   # final optimised markdown
        "activities":         list[dict],
    }
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from agents.base_agent import AgentResult, AgentStatus, BaseAgent
from core.logger import get_logger

log = get_logger("agents.optimizer")


# ── Indoor alternative activity database ─────────────────────────────────────
# Maps (destination_key, outdoor_activity_name) → indoor replacement.
# Falls back to generic substitutions when no specific match exists.

SPECIFIC_SWAPS: dict[tuple[str, str], dict] = {
    ("paris", "Eiffel Tower visit"):          {"name": "Musée de l'Armée (Military Museum)",      "type": "indoor", "duration_h": 2},
    ("paris", "Seine River cruise"):           {"name": "Palais Royal indoor galleries",           "type": "indoor", "duration_h": 1.5},
    ("paris", "Tuileries Garden stroll"):      {"name": "Musée de l'Orangerie (Monet's Water Lilies)", "type": "indoor", "duration_h": 1.5},
    ("paris", "Montmartre & Sacré-Cœur hike"):{"name": "Musée de Montmartre",                     "type": "indoor", "duration_h": 2},
    ("paris", "Versailles Palace & Gardens"):  {"name": "Guided Versailles Palace interior tour",  "type": "indoor", "duration_h": 4},
    ("paris", "Père Lachaise Cemetery walk"):  {"name": "Bibliothèque nationale de France tour",   "type": "indoor", "duration_h": 2},

    ("tokyo", "Senso-ji Temple & Nakamise shopping"): {"name": "Edo Tokyo Museum",                "type": "indoor", "duration_h": 3},
    ("tokyo", "Shibuya Crossing & Harajuku"):          {"name": "Mori Art Museum (Roppongi Hills)", "type": "indoor", "duration_h": 2},
    ("tokyo", "Mt Fuji day trip (Fuji Five Lakes)"):   {"name": "teamLab Planets digital art",     "type": "indoor", "duration_h": 4},
    ("tokyo", "Odaiba waterfront"):                    {"name": "Odaiba National Museum of Emerging Science", "type": "indoor", "duration_h": 2},

    ("san diego", "Balboa Park & San Diego Zoo"):      {"name": "Fleet Science Center (indoor exhibits)", "type": "indoor", "duration_h": 3},
    ("san diego", "La Jolla Cove snorkelling"):        {"name": "Birch Aquarium at Scripps",              "type": "indoor", "duration_h": 2},
    ("san diego", "Torrey Pines hike"):                {"name": "San Diego Museum of Art",                "type": "indoor", "duration_h": 2},
    ("san diego", "Pacific Beach sunset"):             {"name": "Comedy Store Pacific Beach show",        "type": "indoor", "duration_h": 1.5},

    # Bengaluru Swaps
    ("bengaluru", "Cubbon Park Botanical Walk"):       {"name": "National Gallery of Modern Art (NGMA) Bangalore", "type": "indoor", "duration_h": 2},
    ("bengaluru", "Lalbagh Botanical Garden"):         {"name": "Visvesvaraya Industrial & Technological Museum", "type": "indoor", "duration_h": 2},
    ("bengaluru", "Commercial Street Shopping"):       {"name": "UB City Luxury Mall galleries", "type": "indoor", "duration_h": 3},
    ("bengaluru", "Nandi Hills drive & trek"):         {"name": "HAL Heritage Centre and Aerospace Museum", "type": "indoor", "duration_h": 3},
    ("bengaluru", "Bannerghatta National Park Safari"):{"name": "Snow City Bengaluru indoor fun", "type": "indoor", "duration_h": 3},
    ("bengaluru", "Innovative Film City excursion"):   {"name": "Kempegowda Museum & indoor galleries", "type": "indoor", "duration_h": 3},

    # Jaipur Swaps
    ("jaipur", "Johari Bazaar & Bapu Bazaar shopping"): {"name": "Anokhi Museum of Hand Printing", "type": "indoor", "duration_h": 2},
    ("jaipur", "Nahargarh Fort Morning Hike"):         {"name": "Albert Hall Museum (indoor exhibits)", "type": "indoor", "duration_h": 2.5},
    ("jaipur", "Jal Mahal Sunset Promenade"):          {"name": "Amrapali Museum of Jewels", "type": "indoor", "duration_h": 1.5},
    ("jaipur", "Sisodia Rani Ka Bagh Gardens"):        {"name": "Jaipur Wax Museum at Nahargarh interior", "type": "indoor", "duration_h": 2},
    ("jaipur", "Patrika Gate photoshoot"):             {"name": "Albert Hall Museum galleries", "type": "indoor", "duration_h": 1.5},

    # Hyderabad Swaps
    ("hyderabad", "Hussain Sagar Lake Cruise to Buddha Statue"): {"name": "Salar Jung Museum indoor walk", "type": "indoor", "duration_h": 2.5},
    ("hyderabad", "Ramoji Film City Blockbuster Day Tour"):      {"name": "Birla Science Museum & Planetarium", "type": "indoor", "duration_h": 4.0},
    ("hyderabad", "NTR Gardens stroll"):               {"name": "Sudha Car Museum (indoor display)", "type": "indoor", "duration_h": 1.5},
    ("hyderabad", "Nehru Zoological Park safari"):     {"name": "Nizam Museum interior tour", "type": "indoor", "duration_h": 3},
    ("hyderabad", "Cable bridge driving & Durgam Cheruvu park"): {"name": "Inorbit Mall shopping & indoor play", "type": "indoor", "duration_h": 2},

    # Chennai Swaps
    ("chennai", "Marina Beach walk & sunset"):         {"name": "Government Museum Chennai (indoor galleries)", "type": "indoor", "duration_h": 2.5},
    ("chennai", "Mahabalipuram shore temple trip"):    {"name": "DakshinaChitra Heritage indoor exhibits", "type": "indoor", "duration_h": 4},
    ("chennai", "Besant Nagar beach (Elliot's)"):      {"name": "Express Avenue mall leisure", "type": "indoor", "duration_h": 2},
    ("chennai", "Guindy National Park stroll"):        {"name": "Fort St. George Museum", "type": "indoor", "duration_h": 2},
    ("chennai", "Semmozhi Poonga Botanical Garden"):   {"name": "Vivekanandar House indoor exhibition", "type": "indoor", "duration_h": 2},
    ("chennai", "Pulicat Lake bird watching"):         {"name": "Phoenix Marketcity shopping Chennai", "type": "indoor", "duration_h": 3},

    # Mumbai Swaps
    ("mumbai", "Marine Drive sunset walk"):           {"name": "Chhatrapati Shivaji Maharaj Museum (indoor)", "type": "indoor", "duration_h": 2.5},
    ("mumbai", "Sanjay Gandhi National Park & Kanheri Caves"): {"name": "Nehru Science Centre indoor experience", "type": "indoor", "duration_h": 4},
    ("mumbai", "Juhu Beach street food tour"):        {"name": "Britannia & Co traditional dining (indoor)", "type": "indoor", "duration_h": 2},
    ("mumbai", "Elephanta Caves ferry & tour"):       {"name": "NGMA Mumbai art museum", "type": "indoor", "duration_h": 3},
    ("mumbai", "Colaba Causeway shopping"):          {"name": "Phoenix Palladium luxury mall", "type": "indoor", "duration_h": 2},
    ("mumbai", "Bandra Bandstand & Sea Link view"):   {"name": "Mani Bhavan Gandhi Sangrahalaya", "type": "indoor", "duration_h": 2},
    ("mumbai", "EsselWorld amusement park day"):      {"name": "Smaaash indoor sports center", "type": "indoor", "duration_h": 4},
}

# Generic indoor substitutions by duration bucket
GENERIC_SWAPS_BY_DURATION: list[tuple[float, dict]] = [
    # (max_duration_h, replacement)
    (1.5, {"name": "Visit a local café or patisserie",                "type": "culinary", "duration_h": 1}),
    (2.5, {"name": "Guided walking tour of an indoor historic site",  "type": "indoor",   "duration_h": 2}),
    (4.0, {"name": "City art museum or gallery visit",                "type": "indoor",   "duration_h": 3}),
    (9.9, {"name": "Full-day immersive cultural experience & spa",    "type": "indoor",   "duration_h": 5}),
]


def _get_indoor_swap(city: str, activity: dict) -> dict:
    """
    Return the best indoor replacement for an outdoor activity.

    Priority:
    1. City-specific swap  (SPECIFIC_SWAPS)
    2. Duration-bucketed generic swap  (GENERIC_SWAPS_BY_DURATION)
    """
    key = (city.lower(), activity["name"])
    if key in SPECIFIC_SWAPS:
        return SPECIFIC_SWAPS[key]

    duration = activity.get("duration_h", 2.0)
    for max_h, swap in GENERIC_SWAPS_BY_DURATION:
        if duration <= max_h:
            return swap
    # Absolute fallback
    return {"name": "Indoor relaxation & local museum visit", "type": "indoor", "duration_h": 2}


def _rebuild_markdown(
    destination: str,
    forecast: str,
    activities: list[dict],
    start_date: str,
) -> str:
    """Re-render the markdown itinerary from the (possibly modified) activity list."""
    days: dict[int, list[dict]] = {}
    for act in activities:
        days.setdefault(act["day"], []).append(act)

    start_dt = date.fromisoformat(start_date)

    lines = [
        f"# 🗺️ {destination.title()} Itinerary — Optimised",
        f"**Weather:** {forecast}  |  **Dates:** from {start_date}\n",
    ]

    for day_num in sorted(days):
        current_date = start_dt + timedelta(days=day_num - 1)
        lines.append(f"## Day {day_num} — {current_date.strftime('%A, %B %d')}")

        for act in days[day_num]:
            emoji = {
                "outdoor":   "🌿",
                "indoor":    "🏛️",
                "cultural":  "🎭",
                "culinary":  "🍽️",
                "adventure": "⛺",
            }.get(act["type"], "📍")

            swap_tag = " _(☔ weather swap)_" if act.get("swapped") else ""
            lines.append(
                f"- {emoji} **{act['name']}** _{act['type']}_ "
                f"({act['duration_h']}h){swap_tag}"
            )
        lines.append("")

    return "\n".join(lines)


class OptimizerAgent(BaseAgent):
    """
    Agent 3 — OptimizerAgent

    Reads the itinerary and weather forecast from the shared context.
    When bad weather is detected, substitutes all outdoor activities
    with indoor alternatives and rebuilds the final markdown output.
    """

    name = "optimizer"
    description = (
        "Optimises the raw itinerary based on the weather forecast. "
        "Swaps outdoor activities for indoor alternatives on bad-weather days."
    )

    async def run(self, context: dict[str, Any]) -> AgentResult:
        # ── Read upstream results ─────────────────────────────────────────────
        planner_result  = context["trip_planner"]
        weather_result  = context["weather_checker"]

        itinerary  = planner_result.output
        weather    = weather_result.output
        destination = itinerary["destination"]
        forecast    = weather["forecast"]
        bad_weather = weather["bad_weather"]

        self._log.info(
            "optimizer.run",
            destination=destination,
            forecast=forecast,
            bad_weather=bad_weather,
        )

        # ── Shallow-copy activities so we don't mutate upstream output ────────
        activities: list[dict] = [dict(a) for a in itinerary.get("activities", [])]
        swaps_made = 0

        if bad_weather and activities:
            self._log.info(
                "optimizer.swapping_activities",
                forecast=forecast,
                total_outdoor=sum(
                    1 for a in activities if a["type"] == "outdoor"
                ),
            )

            for act in activities:
                if act["type"] == "outdoor":
                    original = act["name"]
                    swap = _get_indoor_swap(destination, act)
                    act.update(swap)
                    act["swapped"] = True
                    swaps_made += 1

                    self._log.info(
                        "optimizer.swap",
                        original=original,
                        replacement=act["name"],
                        day=act["day"],
                    )

        elif bad_weather and not activities:
            # LLM path — no structured activities; annotate the markdown
            itinerary["itinerary_markdown"] += (
                f"\n\n> ☔ **Weather Alert**: {forecast} forecast detected. "
                "Consider indoor alternatives for outdoor activities."
            )

        # ── Rebuild final markdown ────────────────────────────────────────────
        final_markdown = _rebuild_markdown(
            destination=destination,
            forecast=forecast,
            activities=activities,
            start_date=context["start_date"],
        ) if activities else itinerary["itinerary_markdown"]

        output = {
            "destination":        destination,
            "forecast":           forecast,
            "bad_weather":        bad_weather,
            "days":               itinerary["days"],
            "swaps_made":         swaps_made,
            "itinerary_markdown": final_markdown,
            "activities":         activities,
        }

        return AgentResult(
            agent_name=self.name,
            status=AgentStatus.SUCCESS,
            output=output,
            metadata={
                "swaps_made":  swaps_made,
                "bad_weather": bad_weather,
                "forecast":    forecast,
            },
        )
