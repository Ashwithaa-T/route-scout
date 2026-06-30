"""
RouteScout — agents/trip_planner_agent.py
==========================================
Agent 1: TripPlannerAgent

Responsibility
--------------
Accepts a destination city, a start date, and an end date from the shared
execution context, then returns a raw day-by-day markdown itinerary.

In real-LLM mode, it calls the Google Gemini API with a structured prompt.
In mock mode (MOCK_LLM=true), it returns a rich deterministic itinerary
so the system can be tested without API credentials.

Context keys consumed
---------------------
  context["destination"]  : str  — destination city
  context["start_date"]   : str  — ISO date (YYYY-MM-DD)
  context["end_date"]     : str  — ISO date (YYYY-MM-DD)

Context keys produced
---------------------
  context["trip_planner"] : AgentResult
    result.output = {
        "destination": str,
        "days": int,
        "itinerary_markdown": str,     # raw day-by-day plan
        "activities": list[dict],      # structured activity list
    }
"""

from __future__ import annotations

import textwrap
from datetime import date
from typing import Any

from agents.base_agent import AgentResult, AgentStatus, BaseAgent
from core.config import settings
from core.logger import get_logger

log = get_logger("agents.trip_planner")


# ── Mock itinerary templates ──────────────────────────────────────────────────
# Keyed by city (lowercase). Each day has a list of activity dicts with
# "type" (outdoor | indoor | cultural | culinary | adventure) for the
# OptimizerAgent to swap if weather is bad.

MOCK_ITINERARIES: dict[str, list[list[dict]]] = {
    "paris": [
        [
            {"name": "Eiffel Tower visit", "type": "outdoor", "duration_h": 2},
            {"name": "Seine River cruise", "type": "outdoor", "duration_h": 1.5},
            {"name": "Café lunch in Le Marais", "type": "culinary", "duration_h": 1},
        ],
        [
            {"name": "Louvre Museum", "type": "indoor", "duration_h": 4},
            {"name": "Tuileries Garden stroll", "type": "outdoor", "duration_h": 1},
            {"name": "Dinner at a brasserie", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Montmartre & Sacré-Cœur hike", "type": "outdoor", "duration_h": 3},
            {"name": "Orsay Museum", "type": "indoor", "duration_h": 2},
        ],
        [
            {"name": "Versailles Palace & Gardens", "type": "outdoor", "duration_h": 6},
            {"name": "Wine tasting evening", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Père Lachaise Cemetery walk", "type": "outdoor", "duration_h": 2},
            {"name": "Centre Pompidou", "type": "indoor", "duration_h": 2},
            {"name": "Farewell dinner at a Michelin bistro", "type": "culinary", "duration_h": 2},
        ],
    ],
    "tokyo": [
        [
            {"name": "Senso-ji Temple & Nakamise shopping", "type": "cultural", "duration_h": 3},
            {"name": "Akihabara electronics district", "type": "indoor", "duration_h": 2},
            {"name": "Ramen dinner in Shinjuku", "type": "culinary", "duration_h": 1},
        ],
        [
            {"name": "Shibuya Crossing & Harajuku", "type": "outdoor", "duration_h": 3},
            {"name": "teamLab Borderless digital art", "type": "indoor", "duration_h": 2},
            {"name": "Sushi omakase dinner", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Mt Fuji day trip (Fuji Five Lakes)", "type": "outdoor", "duration_h": 8},
        ],
        [
            {"name": "Tsukiji outer market breakfast", "type": "culinary", "duration_h": 2},
            {"name": "Odaiba waterfront", "type": "outdoor", "duration_h": 2},
            {"name": "Roppongi Hills & Mori Art Museum", "type": "indoor", "duration_h": 3},
        ],
    ],
    "san diego": [
        [
            {"name": "Balboa Park & San Diego Zoo", "type": "outdoor", "duration_h": 5},
            {"name": "Gaslamp Quarter dinner", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "La Jolla Cove snorkelling", "type": "outdoor", "duration_h": 3},
            {"name": "Torrey Pines hike", "type": "outdoor", "duration_h": 2},
            {"name": "Pacific Beach sunset", "type": "outdoor", "duration_h": 1},
        ],
        [
            {"name": "USS Midway Museum", "type": "indoor", "duration_h": 3},
            {"name": "Old Town San Diego", "type": "cultural", "duration_h": 2},
            {"name": "Craft beer tour", "type": "culinary", "duration_h": 2},
        ],
    ],
    "bengaluru": [
        [
            {"name": "Cubbon Park Botanical Walk", "type": "outdoor", "duration_h": 2},
            {"name": "Visvesvaraya Industrial & Technological Museum", "type": "indoor", "duration_h": 3},
            {"name": "UB City Enclosed Gallery & dining", "type": "culinary", "duration_h": 2.5},
        ],
        [
            {"name": "Bangalore Palace Tour", "type": "cultural", "duration_h": 2.5},
            {"name": "National Gallery of Modern Art", "type": "indoor", "duration_h": 2},
            {"name": "Indiranagar microbrewery hopping", "type": "culinary", "duration_h": 3},
        ],
        [
            {"name": "Lalbagh Botanical Garden", "type": "outdoor", "duration_h": 2},
            {"name": "Commercial Street Shopping", "type": "outdoor", "duration_h": 3},
            {"name": "Vidhana Soudha light show", "type": "cultural", "duration_h": 1},
        ],
        [
            {"name": "Tipu Sultan's Summer Palace", "type": "cultural", "duration_h": 1.5},
            {"name": "Nandi Hills drive & trek", "type": "outdoor", "duration_h": 5},
            {"name": "Traditional South Indian feast at MTR", "type": "culinary", "duration_h": 1.5},
        ],
        [
            {"name": "Bannerghatta National Park Safari", "type": "outdoor", "duration_h": 4},
            {"name": "HAL Heritage Centre and Aerospace Museum", "type": "indoor", "duration_h": 2},
            {"name": "Dinner at Koramangala rooftop", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "ISKCON Temple Bangalore", "type": "cultural", "duration_h": 2},
            {"name": "Karnataka Chitrakala Parishath art galleries", "type": "indoor", "duration_h": 2.5},
            {"name": "VV Puram Food Street tour", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Bull Temple & Bugle Rock stroll", "type": "cultural", "duration_h": 1.5},
            {"name": "Innovative Film City excursion", "type": "outdoor", "duration_h": 5},
            {"name": "Farewell craft beer tasting in Whitefield", "type": "culinary", "duration_h": 2},
        ],
    ],
    "jaipur": [
        [
            {"name": "Amer Fort Elephant Trail & Palace", "type": "cultural", "duration_h": 3.5},
            {"name": "Hawa Mahal (Palace of Winds) Photo Walk", "type": "cultural", "duration_h": 1.5},
            {"name": "Chokhi Dhani Ethnic Village Resort", "type": "culinary", "duration_h": 4},
        ],
        [
            {"name": "City Palace Complex", "type": "cultural", "duration_h": 2.5},
            {"name": "Jantar Mantar UNESCO Observatory", "type": "cultural", "duration_h": 2},
            {"name": "Johari Bazaar & Bapu Bazaar shopping", "type": "outdoor", "duration_h": 3},
        ],
        [
            {"name": "Nahargarh Fort Morning Hike", "type": "outdoor", "duration_h": 3},
            {"name": "Albert Hall Museum", "type": "indoor", "duration_h": 2.5},
            {"name": "Jal Mahal Sunset Promenade", "type": "outdoor", "duration_h": 1.5},
        ],
        [
            {"name": "Jaigarh Fort & World's Largest Cannon", "type": "cultural", "duration_h": 2.5},
            {"name": "Galta Ji (Monkey Temple) Visit", "type": "cultural", "duration_h": 2},
            {"name": "Rajasthani Thali culinary experience", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Sisodia Rani Ka Bagh Gardens", "type": "outdoor", "duration_h": 2},
            {"name": "Amrapali Museum of Jewels", "type": "indoor", "duration_h": 2},
            {"name": "Folk dance & puppet show at Ravindra Manch", "type": "cultural", "duration_h": 2},
        ],
        [
            {"name": "Patrika Gate photoshoot", "type": "outdoor", "duration_h": 1.5},
            {"name": "Birla Mandir", "type": "cultural", "duration_h": 1},
            {"name": "Masala Chowk local street food", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Chand Baori Stepwell excursion", "type": "cultural", "duration_h": 4},
            {"name": "Anokhi Museum of Hand Printing", "type": "indoor", "duration_h": 2},
            {"name": "Sunset view from Padao rooftop", "type": "culinary", "duration_h": 2},
        ],
    ],
    "hyderabad": [
        [
            {"name": "Golconda Fort Guided Tour", "type": "cultural", "duration_h": 3.5},
            {"name": "Qutb Shahi Tombs", "type": "cultural", "duration_h": 2},
            {"name": "Hussain Sagar Lake Cruise to Buddha Statue", "type": "outdoor", "duration_h": 2},
        ],
        [
            {"name": "Salar Jung Museum", "type": "indoor", "duration_h": 3.5},
            {"name": "Chowmahalla Palace walkthrough", "type": "cultural", "duration_h": 2.5},
            {"name": "Charminar & Laad Bazaar shopping", "type": "cultural", "duration_h": 3},
        ],
        [
            {"name": "Ramoji Film City Studio Tour", "type": "outdoor", "duration_h": 4.5},
            {"name": "Ramoji Film City Show and Theme Park", "type": "outdoor", "duration_h": 3},
            {"name": "Ramoji Film City Carnival Parade & Dinner", "type": "culinary", "duration_h": 2.5},
        ],
        [
            {"name": "Birla Science Museum & Planetarium", "type": "indoor", "duration_h": 3},
            {"name": "NTR Gardens stroll", "type": "outdoor", "duration_h": 2},
            {"name": "Famous Hyderabadi Biryani dinner at Paradise", "type": "culinary", "duration_h": 1.5},
        ],
        [
            {"name": "Nehru Zoological Park safari", "type": "outdoor", "duration_h": 4},
            {"name": "Sudha Car Museum", "type": "indoor", "duration_h": 1.5},
            {"name": "Cable bridge driving & Durgam Cheruvu park", "type": "outdoor", "duration_h": 2},
        ],
        [
            {"name": "Shilparamam Arts & Crafts Village", "type": "cultural", "duration_h": 3},
            {"name": "Inorbit Mall leisure & shopping", "type": "indoor", "duration_h": 2},
            {"name": "Local street food tour", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Paigah Tombs peaceful visit", "type": "cultural", "duration_h": 1.5},
            {"name": "State Gallery of Art", "type": "indoor", "duration_h": 2},
            {"name": "Sunset dinner cruise on Hussain Sagar", "type": "culinary", "duration_h": 2.5},
        ],
    ],
    "chennai": [
        [
            {"name": "Kapaleeshwarar Temple visit", "type": "cultural", "duration_h": 2},
            {"name": "Government Museum Chennai", "type": "indoor", "duration_h": 3},
            {"name": "Marina Beach walk & sunset", "type": "outdoor", "duration_h": 2},
        ],
        [
            {"name": "Santhome Cathedral Basilica", "type": "cultural", "duration_h": 1.5},
            {"name": "Fort St. George Museum", "type": "indoor", "duration_h": 2.5},
            {"name": "South Indian filter coffee & dinner in Mylapore", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "DakshinaChitra Heritage Museum", "type": "cultural", "duration_h": 4},
            {"name": "Mahabalipuram Shore Temple tour", "type": "outdoor", "duration_h": 4},
            {"name": "Seafood fine dinner at Mahabalipuram Beach", "type": "culinary", "duration_h": 2.5},
        ],
        [
            {"name": "Guindy National Park stroll", "type": "outdoor", "duration_h": 2},
            {"name": "Birla Planetarium", "type": "indoor", "duration_h": 2},
            {"name": "Shopping in T. Nagar (Ranganathan Street)", "type": "outdoor", "duration_h": 3},
        ],
        [
            {"name": "Cholamandal Artists' Village", "type": "cultural", "duration_h": 2.5},
            {"name": "VGP Universal Kingdom park", "type": "outdoor", "duration_h": 4},
            {"name": "Chettinad dinner banquet", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Kalakshetra Foundation cultural tour", "type": "cultural", "duration_h": 2.5},
            {"name": "Semmozhi Poonga Botanical Garden", "type": "outdoor", "duration_h": 2},
            {"name": "Sunset view at Besant Nagar beach (Elliot's)", "type": "outdoor", "duration_h": 2},
        ],
        [
            {"name": "Pulicat Lake bird watching", "type": "outdoor", "duration_h": 4},
            {"name": "Express Avenue mall leisure", "type": "indoor", "duration_h": 3},
            {"name": "Seafood fine dining along ECR", "type": "culinary", "duration_h": 2},
        ],
    ],
    "mumbai": [
        [
            {"name": "Gateway of India & Taj Mahal Palace tour", "type": "cultural", "duration_h": 2},
            {"name": "Chhatrapati Shivaji Maharaj Museum", "type": "indoor", "duration_h": 3},
            {"name": "Marine Drive sunset walk", "type": "outdoor", "duration_h": 2},
        ],
        [
            {"name": "Elephanta Caves ferry & tour", "type": "cultural", "duration_h": 4},
            {"name": "Colaba Causeway shopping", "type": "outdoor", "duration_h": 2},
            {"name": "Seafood dining at Mahesh Lunch Home", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Haji Ali Dargah visit", "type": "cultural", "duration_h": 2},
            {"name": "Nehru Science Centre", "type": "indoor", "duration_h": 2.5},
            {"name": "Bandra Bandstand & Sea Link view", "type": "outdoor", "duration_h": 2},
        ],
        [
            {"name": "Sanjay Gandhi National Park & Kanheri Caves", "type": "outdoor", "duration_h": 5},
            {"name": "Global Vipassana Pagoda", "type": "cultural", "duration_h": 2},
            {"name": "Street food tour at Juhu Beach", "type": "culinary", "duration_h": 2.5},
        ],
        [
            {"name": "Dhobi Ghat photowalk & Mani Bhavan", "type": "indoor", "duration_h": 2},
            {"name": "Crawford Market shopping", "type": "outdoor", "duration_h": 3},
            {"name": "Parsi dinner at Britannia & Co", "type": "culinary", "duration_h": 1.5},
        ],
        [
            {"name": "Worli Fort exploration", "type": "cultural", "duration_h": 1.5},
            {"name": "National Gallery of Modern Art Mumbai", "type": "indoor", "duration_h": 2},
            {"name": "Trendy lounge hopping in Lower Parel", "type": "culinary", "duration_h": 3},
        ],
        [
            {"name": "EsselWorld amusement park day", "type": "outdoor", "duration_h": 6},
            {"name": "Shopping at Phoenix Marketcity", "type": "indoor", "duration_h": 3},
            {"name": "High-tea at the Oberoi", "type": "culinary", "duration_h": 1.5},
        ],
    ],
    # ── Generic fallback used for any city not in the database ────────────────
    "__default__": [
        [
            {"name": "Morning city walking tour", "type": "outdoor", "duration_h": 3},
            {"name": "Local market visit", "type": "culinary", "duration_h": 1.5},
            {"name": "Historical museum", "type": "indoor", "duration_h": 2},
        ],
        [
            {"name": "Scenic viewpoint & photography", "type": "outdoor", "duration_h": 2},
            {"name": "Cooking class", "type": "culinary", "duration_h": 3},
            {"name": "Evening cultural show", "type": "cultural", "duration_h": 2},
        ],
        [
            {"name": "Day trip to nearby countryside", "type": "outdoor", "duration_h": 6},
            {"name": "Artisan dinner experience", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Art gallery & contemporary museum", "type": "indoor", "duration_h": 3},
            {"name": "Rooftop bar sunset", "type": "outdoor", "duration_h": 1.5},
        ],
        [
            {"name": "Morning yoga & meditation", "type": "outdoor", "duration_h": 1},
            {"name": "Souvenir shopping in old town", "type": "cultural", "duration_h": 2},
            {"name": "Farewell gala dinner", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Riverside park nature walk", "type": "outdoor", "duration_h": 2},
            {"name": "Boutique shopping district tour", "type": "outdoor", "duration_h": 2.5},
            {"name": "Local brewery tasting experience", "type": "culinary", "duration_h": 2},
        ],
        [
            {"name": "Historic library & castle visit", "type": "cultural", "duration_h": 2},
            {"name": "Science and technology pavilion", "type": "indoor", "duration_h": 2.5},
            {"name": "Scenic twilight dinner cruise", "type": "outdoor", "duration_h": 3},
        ],
    ],
}


def _days_between(start: str, end: str) -> int:
    """Return the number of trip days (inclusive)."""
    d1 = date.fromisoformat(start)
    d2 = date.fromisoformat(end)
    return max(1, (d2 - d1).days + 1)


def _build_mock_itinerary(
    destination: str,
    start_date: str,
    end_date: str,
) -> dict[str, Any]:
    """
    Build a mock structured itinerary for the given trip.

    Returns a dict with keys:
      - destination, days, itinerary_markdown, activities
    """
    n_days = _days_between(start_date, end_date)
    key = destination.strip().lower()
    day_templates = MOCK_ITINERARIES.get(key, MOCK_ITINERARIES["__default__"])

    # Cycle through template days if the trip is longer than the template
    activities: list[dict] = []
    md_lines: list[str] = [
        f"# 🗺️ {destination.title()} Itinerary",
        f"**Dates:** {start_date} → {end_date}  |  **Duration:** {n_days} day(s)\n",
    ]

    start_dt = date.fromisoformat(start_date)
    from datetime import timedelta

    for i in range(n_days):
        day_num = i + 1
        current_date = start_dt + timedelta(days=i)
        day_acts = day_templates[i % len(day_templates)]

        md_lines.append(f"## Day {day_num} — {current_date.strftime('%A, %B %d')}")
        for act in day_acts:
            emoji = {
                "outdoor":   "🌿",
                "indoor":    "🏛️",
                "cultural":  "🎭",
                "culinary":  "🍽️",
                "adventure": "⛺",
            }.get(act["type"], "📍")
            md_lines.append(
                f"- {emoji} **{act['name']}** _{act['type']}_ "
                f"({act['duration_h']}h)"
            )
            activities.append(
                {
                    "day": day_num,
                    "date": current_date.isoformat(),
                    **act,
                    "swapped": False,
                }
            )
        md_lines.append("")  # blank line between days

    return {
        "destination": destination.title(),
        "days": n_days,
        "itinerary_markdown": "\n".join(md_lines),
        "activities": activities,
    }


async def _build_llm_itinerary(
    destination: str,
    start_date: str,
    end_date: str,
) -> dict[str, Any]:
    """
    Call Google Gemini to generate a real itinerary.
    Falls back to mock on any error.
    """
    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        n_days = _days_between(start_date, end_date)
        prompt = textwrap.dedent(f"""
            You are an expert travel planner. Create a detailed day-by-day itinerary
            for a trip to {destination} from {start_date} to {end_date} ({n_days} days).

            For each day, list 3-4 activities. For each activity include:
            - A short name
            - Activity type: one of [outdoor, indoor, cultural, culinary, adventure]
            - Estimated duration in hours

            Format the output as a markdown list under each day heading.
            Keep it practical and specific to {destination}.
        """).strip()

        response = model.generate_content(prompt)
        itinerary_md = response.text

        return {
            "destination": destination.title(),
            "days": n_days,
            "itinerary_markdown": itinerary_md,
            # LLM path returns unstructured activities; optimizer will use markdown
            "activities": [],
            "source": "gemini-1.5-flash",
        }

    except Exception as exc:  # noqa: BLE001
        log.warning(
            "trip_planner.llm_fallback",
            reason=str(exc),
            fallback="mock",
        )
        return _build_mock_itinerary(destination, start_date, end_date)


# ── Agent class ───────────────────────────────────────────────────────────────


class TripPlannerAgent(BaseAgent):
    """
    Agent 1 — TripPlannerAgent

    Reads `destination`, `start_date`, `end_date` from the shared context
    and returns a raw day-by-day itinerary (both markdown and structured).
    """

    name = "trip_planner"
    description = (
        "Generates a day-by-day travel itinerary for the requested "
        "destination and date range."
    )

    async def run(self, context: dict[str, Any]) -> AgentResult:
        destination: str = context["destination"]
        start_date: str  = context["start_date"]
        end_date: str    = context["end_date"]

        self._log.info(
            "trip_planner.run",
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            mode="llm" if settings.llm_available else "mock",
        )

        if settings.llm_available:
            itinerary = await _build_llm_itinerary(destination, start_date, end_date)
        else:
            itinerary = _build_mock_itinerary(destination, start_date, end_date)

        return AgentResult(
            agent_name=self.name,
            status=AgentStatus.SUCCESS,
            output=itinerary,
            metadata={
                "mode": "llm" if settings.llm_available else "mock",
                "days": itinerary["days"],
                "activity_count": len(itinerary.get("activities", [])),
            },
        )
