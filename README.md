# 🧭 RouteScout — The Global Travel Suite

A premium, weather-optimised travel concierge planner. RouteScout leverages a robust Python backend with custom task agents and a local model-context mock server, paired with a high-density, luxury-themed React (Vite) and Tailwind CSS frontend workspace.

---

## 🧠 Intelligent Concierge Architecture & Flow

```
┌─────────────────────────────────────────────────────────┐
│              RouteScout Intelligent Engine              │
│                  POST /api/plan-trip                    │
│ ─────────────────────────────────────────────────────── │
│                            │                            │
│               ┌────────────▼────────────┐               │
│               │  Adaptive Journey Core  │               │
│               └────────────┬────────────┘               │
│                            │                            │
│         ┌──────────────────┼──────────────────┐         │
│         ▼                  ▼                  ▼         │
│ ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│ │ Trip Planner │   │Environment   │   │  Mitigation  │  │
│ │   Module     │   │Analyst (MCP) │   │    Engine    │  │
│ └──────────────┘   └──────────────┘   └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

RouteScout processes parameters sequentially through specialized modules to curate an optimal travel experience:

1. **Trip Planner Hub**: Formulates structured itinerary components spanning Morning, Afternoon, and Evening activities from our premium destination databases.
2. **Environmental Analyst**: Verifies local weather conditions securely via a local Model Context Protocol (MCP) tool utility layer.
3. **Adaptive Mitigation Engine**: Scans environmental forecasts and automatically substitutes outdoor activities with elite indoor alternatives on rainy days.

---

## 📂 Project Directory Structure

```
routescout/
├── agents/
│   ├── base_agent.py          # Abstract base agent definition
│   ├── trip_planner_agent.py  # Agent 1: Itinerary builder (Jaipur, Bengaluru, Mumbai, Chennai, Hyderabad, Paris, Tokyo, etc.)
│   ├── weather_checker_agent.py # Agent 2: Weather tool connectivity
│   └── optimizer_agent.py     # Agent 3: Smart weather indoor swap rules
├── mcp_server/
│   └── weather_server.py      # Mock weather microservice
├── orchestration/
│   └── agent_runner.py        # Multi-agent execution workflow
├── api/
│   ├── routes.py              # FastAPI endpoints
│   └── schemas.py             # Request & response validations
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Premium Teal & Amber travel hub & canvas dashboard
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── main.py                    # Entry point for the FastAPI server
├── requirements.txt           # Backend python dependencies
└── .env.example
```

---

## 🚀 Quick Start Guide

### 1. Launch the Backend API
Navigate to the root directory, install dependencies, and spin up the FastAPI service:
```powershell
# Install python packages
pip install -r requirements.txt

# Start the uvicorn development server
uvicorn main:app --reload --port 8000
```
*The backend API will run at **http://localhost:8000**.*

### 2. Launch the Frontend Dev Server
Navigate to the `frontend` directory, install packages, and boot the Vite server:
```powershell
cd frontend
npm install
npm run dev
```
*The frontend dashboard will run at **http://localhost:5174** (or http://localhost:5173).*

---

## 🎨 Design System & Highlights

- **Palette**: Premium Teal (`teal-600`, `teal-700`) matched with Soft Gold/Amber badges and pure white cards on a slate workspace background.
- **Layout**: High-density 3-column structured day cards (Morning, Afternoon, Evening) for optimal visual clarity.
- **Resilience**: Integrated automatic logical fallback arrays in React ensuring no empty slots appear even if backend databases return partial lists.
- **No Technical Jargon**: Clean, consumer-friendly copy branding ("Curating your Escape", "Weather-smart adjustments applied") instead of dry developer logging.