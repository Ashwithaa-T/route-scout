/**
 * InputPanel.jsx
 * ──────────────
 * Professional trip-planning form with destination, start/end date fields
 * and a prominent CTA button. Handles validation feedback inline.
 */

import React from 'react';

function MapPinIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CalendarIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function SparklesIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin-slow h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// Suggested destinations for quick-fill chips
const SUGGESTIONS = ['Paris', 'Tokyo', 'Bali', 'New York', 'San Diego', 'London'];

export default function InputPanel({
  destination, setDestination,
  startDate,   setStartDate,
  endDate,     setEndDate,
  onSubmit,
  loading,
  canSubmit,
}) {
  // Compute min date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="rs-card-lg p-6 lg:p-8">
      {/* ── Section header ── */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
          <SparklesIcon className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <p className="rs-section-title">Plan Your Trip</p>
          <p className="text-[11px] text-slate-400 font-medium">
            AI agents will build & weather-proof your itinerary
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* ── Destination ── */}
        <div>
          <label className="rs-label" htmlFor="destination">Destination</label>
          <div className="relative">
            <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              id="destination"
              type="text"
              className="rs-input pl-10"
              placeholder="e.g. Paris, Tokyo, Bali…"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {/* Quick-fill chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTIONS.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setDestination(city)}
                disabled={loading}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all duration-150
                  ${destination === city
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-25'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* ── Date range ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="rs-label" htmlFor="startDate">Start Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="startDate"
                type="date"
                className="rs-input pl-10"
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="rs-label" htmlFor="endDate">End Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="endDate"
                type="date"
                className="rs-input pl-10"
                min={startDate || today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <button
          id="btn-generate"
          type="button"
          className="rs-btn-primary w-full mt-2"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            <>
              <LoadingSpinner />
              <span>Running Agent Pipeline…</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              <span>Generate Weather-Proof Trip</span>
            </>
          )}
        </button>

        {/* ── Info row ── */}
        <div className="flex items-center gap-4 pt-1 border-t border-slate-50">
          <InfoPill icon="🗓️" label="Day-by-day itinerary" />
          <InfoPill icon="🌦️" label="Live weather check" />
          <InfoPill icon="🔄" label="Auto activity swaps" />
        </div>
      </div>
    </div>
  );
}

function InfoPill({ icon, label }) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
