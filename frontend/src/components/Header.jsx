/**
 * Header.jsx
 * ──────────
 * Top navigation bar: logo, title, status badges.
 */

import React from 'react';

function CompassIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76" />
    </svg>
  );
}

function StatusDot({ color = 'emerald', pulse = true }) {
  const colors = {
    emerald: 'bg-emerald-500',
    indigo:  'bg-indigo-500',
    amber:   'bg-amber-400',
    red:     'bg-red-500',
  };
  return (
    <span className="relative flex h-2 w-2">
      {pulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-60`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[color]}`} />
    </span>
  );
}

export default function Header({ loading, apiReady }) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* ── Logo + Title ── */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
            <CompassIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-slate-900 tracking-tight">RouteScout</span>
            <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">
              Smart Travel Assistant
            </span>
          </div>
        </div>

        {/* ── Right badges ── */}
        <div className="flex items-center gap-3">
          {/* API status */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
            <StatusDot color={apiReady ? 'emerald' : 'amber'} pulse={loading} />
            <span className="text-[11px] font-semibold text-slate-600">
              {loading ? 'Running Pipeline' : apiReady ? 'API Connected' : 'Mock Mode'}
            </span>
          </div>

          {/* ADK badge */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5">
            <svg className="h-3 w-3 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-[11px] font-semibold text-indigo-600">3-Agent ADK Pipeline</span>
          </div>

          {/* MCP badge */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5">
            <span className="text-[10px] font-bold text-violet-600">MCP</span>
            <span className="text-[11px] font-semibold text-violet-700">Weather Server</span>
          </div>
        </div>

      </div>
    </header>
  );
}
