/**
 * useRoutePlanner.js
 * ──────────────────
 * Custom React hook that drives the multi-agent pipeline call.
 *
 * It manages:
 *  - form state  (destination, startDate, endDate)
 *  - agent stage simulation for the live monitor
 *  - API call to POST /api/plan-trip
 *  - result + error state
 *
 * The `agentStages` array is stepped through while the real API call
 * is in flight so the Antigravity Monitor shows believable progress.
 */

import { useState, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

// ── Agent pipeline stages ─────────────────────────────────────────────────────
export const STAGES = [
  {
    id:       'idle',
    label:    'Ready',
    detail:   'Awaiting your trip details.',
    icon:     'compass',
    color:    'slate',
  },
  {
    id:       'trip_planner',
    label:    'Planning Trip',
    detail:   'TripPlannerAgent is building your day-by-day itinerary…',
    icon:     'map',
    color:    'indigo',
  },
  {
    id:       'weather_checker',
    label:    'Checking Weather (MCP)',
    detail:   'WeatherCheckerAgent is calling fetch_weather via JSON-RPC…',
    icon:     'cloud',
    color:    'sky',
  },
  {
    id:       'optimizer',
    label:    'Optimising Itinerary',
    detail:   'OptimizerAgent is applying weather-aware activity swaps…',
    icon:     'sparkles',
    color:    'violet',
  },
  {
    id:       'done',
    label:    'Plan Ready',
    detail:   'Your weather-proof itinerary is ready!',
    icon:     'check',
    color:    'emerald',
  },
  {
    id:       'error',
    label:    'Error',
    detail:   'Something went wrong. Please try again.',
    icon:     'x',
    color:    'red',
  },
];

// Delay helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function useRoutePlanner() {
  const [destination, setDestination] = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');

  const [currentStage, setCurrentStage] = useState(STAGES[0]);
  const [stageHistory, setStageHistory] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);

  const abortRef = useRef(null);

  const advanceTo = useCallback((stageId) => {
    const stage = STAGES.find((s) => s.id === stageId);
    if (!stage) return;
    setCurrentStage(stage);
    setStageHistory((h) => [...h, stage]);
  }, []);

  const submit = useCallback(async () => {
    if (!destination || !startDate || !endDate) return;

    // Reset state
    setLoading(true);
    setResult(null);
    setError(null);
    setStageHistory([]);
    advanceTo('trip_planner');

    abortRef.current = new AbortController();

    try {
      // Show trip-planner stage for ~600 ms before moving on
      await sleep(600);
      advanceTo('weather_checker');

      // Fire the actual API call concurrently with the stage animation
      const fetchPromise = fetch(`${API_BASE}/api/plan-trip`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ destination, start_date: startDate, end_date: endDate }),
        signal:  abortRef.current.signal,
      });

      // Show weather stage for at least 800 ms
      await sleep(800);
      advanceTo('optimizer');

      const response = await fetchPromise;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.detail?.error ?? `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Let optimizer stage breathe
      await sleep(500);
      advanceTo('done');
      setResult(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      advanceTo('error');
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [destination, startDate, endDate, advanceTo]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setCurrentStage(STAGES[0]);
    setStageHistory([]);
    setLoading(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    // Form
    destination, setDestination,
    startDate,   setStartDate,
    endDate,     setEndDate,
    // State
    loading,
    currentStage,
    stageHistory,
    result,
    error,
    // Actions
    submit,
    reset,
    canSubmit: Boolean(destination && startDate && endDate && !loading),
  };
}
