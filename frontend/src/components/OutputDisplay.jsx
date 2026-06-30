/**
 * OutputDisplay.jsx
 * ─────────────────
 * Renders the final itinerary and weather summary.
 * Replaces swapped outdoor activities with a nice visual badge.
 */

import React from 'react';

function CloudRainIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20v2m0 0v-2m0 2h.01M8 20v2m0 0v-2m0 2h.01M16 20v2m0 0v-2m0 2h.01" />
    </svg>
  );
}

function SunIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function AlertTriangleIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export default function OutputDisplay({ result, error, loading }) {
  if (error) {
    return (
      <div className="rs-card-lg p-8 border-red-100 bg-red-50 flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-3">
          <AlertTriangleIcon className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-sm font-bold text-red-800">Pipeline Failed</h3>
        <p className="text-xs text-red-600 mt-1 max-w-sm text-balance">{error}</p>
      </div>
    );
  }

  if (loading || !result) {
    return (
      <div className="rs-card-lg p-8 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="rs-skeleton h-10 w-10 rounded-xl" />
          <div className="space-y-2 flex-1 max-w-xs">
            <div className="rs-skeleton h-4 w-3/4" />
            <div className="rs-skeleton h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-4 flex-1">
          <div className="rs-skeleton h-24 w-full" />
          <div className="rs-skeleton h-24 w-full" />
          <div className="rs-skeleton h-24 w-3/4" />
        </div>
      </div>
    );
  }

  const { itinerary, weather } = result;

  return (
    <div className="rs-card-lg animate-fade-in overflow-hidden flex flex-col h-full">
      
      {/* ── Header: Destination & Weather ── */}
      <div className="bg-slate-900 px-6 py-8 sm:px-8 text-white relative overflow-hidden flex-shrink-0">
        
        {/* Decorative background circle */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="rs-badge bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 mb-3">
              <span>{itinerary.days} Day Trip</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {itinerary.destination}
            </h2>
            <p className="text-indigo-200 text-sm mt-1 font-medium">
              Your optimised, weather-proof itinerary
            </p>
          </div>

          {/* Weather Box */}
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-md">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${weather.bad_weather ? 'bg-amber-400/20 text-amber-300' : 'bg-sky-400/20 text-sky-300'}`}>
              {weather.bad_weather ? <CloudRainIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-0.5">Forecast</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">{weather.forecast}</span>
                <span className="text-sm font-medium text-slate-300">{weather.temperature_c}°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning banner if swaps were made */}
        {weather.bad_weather && itinerary.swaps_made > 0 && (
          <div className="relative z-10 mt-6 rounded-xl bg-amber-400/10 border border-amber-400/20 p-3 flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-200">Weather Swaps Applied</p>
              <p className="text-xs text-amber-200/70 mt-0.5">
                OptimizerAgent detected bad weather and automatically swapped {itinerary.swaps_made} outdoor {itinerary.swaps_made === 1 ? 'activity' : 'activities'} for indoor alternatives.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Itinerary Content ── */}
      <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
        
        {/* If we have structured activities, render beautifully */}
        {itinerary.activities && itinerary.activities.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(
              itinerary.activities.reduce((acc, act) => {
                acc[act.day] = acc[act.day] || [];
                acc[act.day].push(act);
                return acc;
              }, {})
            ).map(([dayStr, activities]) => {
              const date = new Date(activities[0].date);
              const dayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
              return (
                <div key={dayStr} className="relative pl-4 border-l-2 border-indigo-100">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-white bg-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 mb-4 ml-2">
                    Day {dayStr} <span className="text-slate-400 font-medium ml-2">— {dayFmt}</span>
                  </h3>
                  
                  <div className="space-y-3 ml-2">
                    {activities.map((act, i) => (
                      <div key={i} className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${act.swapped ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-lg leading-none mt-0.5">
                            {getEmoji(act.type)}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{act.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{act.type}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] font-medium text-slate-500">{act.duration_h}h</span>
                            </div>
                          </div>
                        </div>
                        
                        {act.swapped && (
                          <div className="flex-shrink-0">
                            <div className="rs-badge bg-amber-100 text-amber-700 border border-amber-200">
                              <CloudRainIcon className="h-3 w-3" />
                              <span>Rain Swap</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback for raw markdown (e.g. LLM didn't return structured JSON) */
          <div className="prose prose-sm prose-indigo max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-6 prose-a:text-indigo-600">
            <div dangerouslySetInnerHTML={{ __html: formatMarkdownFallback(itinerary.itinerary_markdown) }} />
          </div>
        )}

      </div>
    </div>
  );
}

// Helpers
function getEmoji(type) {
  const map = {
    outdoor: '🌿',
    indoor: '🏛️',
    cultural: '🎭',
    culinary: '🍽️',
    adventure: '⛺'
  };
  return map[type?.toLowerCase()] || '📍';
}

function formatMarkdownFallback(md) {
  if (!md) return '';
  return md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/_(.*?)_/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/gim, '<br/>');
}
