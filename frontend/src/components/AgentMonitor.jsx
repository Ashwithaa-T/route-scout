/**
 * AgentMonitor.jsx
 * ────────────────
 * Live Antigravity execution monitor.
 * Shows the three-agent pipeline stages with animated state transitions.
 * Each stage has: icon, label, detail text, status indicator.
 */

import React from 'react';

// ── Stage icon map ────────────────────────────────────────────────────────────
function StageIcon({ type, className = '' }) {
  const props = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8 };
  switch (type) {
    case 'compass': return (
      <svg {...props}><circle cx="12" cy="12" r="10" /><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76" /></svg>
    );
    case 'map': return (
      <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
    );
    case 'cloud': return (
      <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
    );
    case 'sparkles': return (
      <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    );
    case 'check': return (
      <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    );
    case 'x': return (
      <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    );
    default: return null;
  }
}

// ── Stage colour tokens ───────────────────────────────────────────────────────
const STAGE_STYLES = {
  slate:   { ring: 'ring-slate-200',   bg: 'bg-slate-100',   icon: 'text-slate-400',  bar: 'bg-slate-200',    text: 'text-slate-500'   },
  indigo:  { ring: 'ring-indigo-200',  bg: 'bg-indigo-100',  icon: 'text-indigo-600', bar: 'bg-indigo-500',   text: 'text-indigo-700'  },
  sky:     { ring: 'ring-sky-200',     bg: 'bg-sky-100',     icon: 'text-sky-600',    bar: 'bg-sky-500',      text: 'text-sky-700'     },
  violet:  { ring: 'ring-violet-200',  bg: 'bg-violet-100',  icon: 'text-violet-600', bar: 'bg-violet-500',   text: 'text-violet-700'  },
  emerald: { ring: 'ring-emerald-200', bg: 'bg-emerald-100', icon: 'text-emerald-600',bar: 'bg-emerald-500',  text: 'text-emerald-700' },
  red:     { ring: 'ring-red-200',     bg: 'bg-red-100',     icon: 'text-red-600',    bar: 'bg-red-500',      text: 'text-red-700'     },
};

// All visible pipeline steps (excludes idle/error/done which are handled separately)
const PIPELINE_STEPS = [
  { id: 'trip_planner',    label: 'TripPlannerAgent',    icon: 'map',      color: 'indigo', order: 1 },
  { id: 'weather_checker', label: 'WeatherCheckerAgent', icon: 'cloud',    color: 'sky',    order: 2 },
  { id: 'optimizer',       label: 'OptimizerAgent',      icon: 'sparkles', color: 'violet', order: 3 },
];

// Map stage id → step index completed
const STAGE_PROGRESS = {
  idle:            0,
  trip_planner:    0,
  weather_checker: 1,
  optimizer:       2,
  done:            3,
  error:           0,
};

function PipelineStep({ step, status }) {
  // status: 'waiting' | 'running' | 'done'
  const styles = STAGE_STYLES[step.color];
  const isRunning = status === 'running';
  const isDone    = status === 'done';

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300
      ${isRunning ? `ring-1 ${styles.ring} bg-white shadow-sm` : ''}
      ${isDone    ? 'opacity-60' : ''}
    `}>
      {/* ── Icon bubble ── */}
      <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg ring-1 transition-all duration-300
        ${isDone    ? `${STAGE_STYLES.emerald.bg} ${STAGE_STYLES.emerald.ring}` : ''}
        ${isRunning ? `${styles.bg} ${styles.ring}` : 'bg-slate-50 ring-slate-200'}
      `}>
        {isDone ? (
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <StageIcon
            type={step.icon}
            className={`h-4 w-4 transition-colors ${isRunning ? styles.icon : 'text-slate-300'}`}
          />
        )}
      </div>

      {/* ── Label + status ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold truncate transition-colors
            ${isDone ? 'text-emerald-600' : isRunning ? styles.text : 'text-slate-400'}`}
          >
            {step.label}
          </span>
          {isRunning && (
            <span className="flex-shrink-0 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" style={{ color: 'var(--tw-ring-color)' }} />
              <span className={`text-[10px] font-semibold ${styles.text}`}>Running</span>
            </span>
          )}
          {isDone && (
            <span className="text-[10px] font-semibold text-emerald-600">Done</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ease-out
            ${isDone    ? 'w-full bg-emerald-400' : ''}
            ${isRunning ? `w-2/3 ${styles.bar} animate-pulse` : 'w-0'}
          `} />
        </div>
      </div>
    </div>
  );
}

export default function AgentMonitor({ currentStage, stageHistory, loading }) {
  const progressCount = STAGE_PROGRESS[currentStage.id] ?? 0;

  const getStepStatus = (step) => {
    const stepOrder = step.order;
    if (progressCount >= stepOrder) return 'done';
    if (progressCount === stepOrder - 1 && loading) return 'running';
    return 'waiting';
  };

  const isIdle  = currentStage.id === 'idle';
  const isDone  = currentStage.id === 'done';
  const isError = currentStage.id === 'error';

  return (
    <div className="rs-card p-5 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="rs-section-title">Antigravity Monitor</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Live agent execution trace</p>
        </div>
        {/* Live indicator */}
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold
          ${loading ? 'bg-indigo-50 text-indigo-600' : isDone ? 'bg-emerald-50 text-emerald-600' : isError ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}
        `}>
          <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'animate-pulse bg-indigo-500' : isDone ? 'bg-emerald-500' : isError ? 'bg-red-500' : 'bg-slate-300'}`} />
          {loading ? 'LIVE' : isDone ? 'COMPLETE' : isError ? 'ERROR' : 'IDLE'}
        </div>
      </div>

      {/* ── Current stage banner ── */}
      <div className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300
        ${isIdle  ? 'bg-slate-50 border border-slate-100' : ''}
        ${loading ? 'bg-indigo-50 border border-indigo-100' : ''}
        ${isDone  ? 'bg-emerald-50 border border-emerald-100' : ''}
        ${isError ? 'bg-red-50 border border-red-100' : ''}
      `}>
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg
          ${STAGE_STYLES[currentStage.color]?.bg ?? 'bg-slate-100'}
        `}>
          <StageIcon
            type={currentStage.icon}
            className={`h-4 w-4 ${STAGE_STYLES[currentStage.color]?.icon ?? 'text-slate-400'} ${loading ? 'animate-bounce-subtle' : ''}`}
          />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-bold ${STAGE_STYLES[currentStage.color]?.text ?? 'text-slate-500'}`}>
            {currentStage.label}
          </p>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
            {currentStage.detail}
          </p>
        </div>
      </div>

      {/* ── Pipeline steps ── */}
      <div className="space-y-2">
        {PIPELINE_STEPS.map((step) => (
          <PipelineStep key={step.id} step={step} status={getStepStatus(step)} />
        ))}
      </div>

      {/* ── Stage history log ── */}
      {stageHistory.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Event Log</p>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
            {stageHistory.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${STAGE_STYLES[s.color]?.bar ?? 'bg-slate-300'}`} />
                <span className="font-mono">{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <span className="font-medium text-slate-600">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty idle hint ── */}
      {isIdle && stageHistory.length === 0 && (
        <div className="text-center py-3">
          <p className="text-[11px] text-slate-400">
            Fill in your trip details and click <strong className="text-indigo-500">Generate</strong> to see the pipeline run live.
          </p>
        </div>
      )}
    </div>
  );
}
