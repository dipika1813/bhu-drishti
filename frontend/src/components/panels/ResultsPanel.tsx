import React from 'react';
import type { QueryResult, Session } from '@/lib/types';
import { confidenceColor, TASK_LABELS, TASK_COLORS, STEP_ICONS } from '@/lib/utils';
import { Activity, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface Props {
  result: QueryResult | null;
  isLoading: boolean;
  session: Session;
  onSuggestedQuery: (query: string) => void;
}

const SUGGESTED_QUERIES = [
  'Identify areas of new construction and structural buildings.',
  'Find areas of flood inundation and water expansion.',
  'Where did vegetation coverage decrease?',
  'Compare the two acquisitions for land-cover transitions.',
  'Analyze SAR backscatter for structural detection.',
];

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'Warning' || severity === 'Critical') {
    return <AlertCircle size={12} className="text-hud-amber shrink-0" />;
  }
  return <Info size={12} className="text-hud-cyan shrink-0" />;
}

export const ResultsPanel: React.FC<Props> = ({ result, isLoading, session, onSuggestedQuery }) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <div className="w-8 h-8 border-2 border-hud-cyan border-t-transparent rounded-full animate-spin" />
        <div className="font-mono text-xs text-hud-muted tracking-wider text-center">
          RUNNING ANALYSIS…<br />
          <span className="text-[10px] opacity-60">Processing spectral data</span>
        </div>
      </div>
    );
  }

  // Empty / idle state
  if (!result) {
    return (
      <div className="flex flex-col p-4 gap-4 h-full">
        {/* Session meta */}
        <div className="border border-hud-border bg-black/40 rounded p-3 space-y-2">
          <div className="font-mono text-[10px] text-hud-cyan tracking-widest">SESSION INFO</div>
          <div className="space-y-1 font-mono text-[10px] text-hud-muted">
            <div className="flex justify-between">
              <span>SENSOR</span>
              <span className="text-hud-text truncate max-w-[160px] text-right">{session.metadata.sensor}</span>
            </div>
            <div className="flex justify-between">
              <span>CRS</span>
              <span className="text-hud-text">{session.metadata.crs}</span>
            </div>
            <div className="flex justify-between">
              <span>RESOLUTION</span>
              <span className="text-hud-text">{session.metadata.resolution_m} m/px</span>
            </div>
            <div className="flex justify-between">
              <span>ACQUISITION</span>
              <span className="text-hud-text">{session.metadata.acquisition_date}</span>
            </div>
            <div className="flex justify-between">
              <span>CLOUD COVER</span>
              <span className="text-hud-text">{session.metadata.cloud_cover_pct}%</span>
            </div>
            <div className="flex justify-between">
              <span>BANDS</span>
              <span className="text-hud-text">{session.metadata.num_bands}</span>
            </div>
            <div className="flex justify-between">
              <span>SCENE CENTER</span>
              <span className="text-hud-text">
                {session.metadata.scene_center.lat.toFixed(4)}, {session.metadata.scene_center.lon.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Suggested queries */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] text-hud-muted tracking-widest">SUGGESTED QUERIES</div>
          <div className="space-y-1.5">
            {SUGGESTED_QUERIES.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSuggestedQuery(q)}
                className="w-full text-left px-3 py-2 border border-hud-border/60 bg-black/30 hover:border-hud-cyan/50 hover:bg-hud-cyan/5 rounded font-mono text-[10px] text-hud-muted hover:text-hud-text transition-all"
              >
                <span className="text-hud-cyan/50 mr-1">›</span> {q}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto font-mono text-[9px] text-hud-muted/50 text-center">
          Submit a query to begin analysis
        </div>
      </div>
    );
  }

  // Results state
  const taskColor = TASK_COLORS[result.task_classified] ?? '#00d9ff';
  const taskLabel = TASK_LABELS[result.task_classified] ?? result.task_classified.toUpperCase();

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Task badge + confidence */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[10px] tracking-wider px-2 py-0.5 border rounded"
          style={{ color: taskColor, borderColor: taskColor + '50' }}
        >
          {taskLabel}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-hud-muted">CONFIDENCE</span>
          <span
            className="font-mono text-sm font-bold"
            style={{ color: confidenceColor(result.confidence) }}
          >
            {result.confidence}%
          </span>
        </div>
      </div>

      {/* Answer */}
      <div className="border border-hud-border bg-black/40 rounded p-3 space-y-2">
        <div className="font-mono text-[10px] text-hud-cyan tracking-widest">ANALYSIS RESULT</div>
        <p className="text-xs text-hud-text leading-relaxed">{result.answer}</p>
        {result.is_demo_mode && (
          <div className="flex items-center gap-1 font-mono text-[9px] text-hud-amber/70 pt-1">
            <AlertCircle size={9} />
            <span>DEMO MODE — offline mock response</span>
          </div>
        )}
      </div>

      {/* Findings */}
      {result.findings.length > 0 && (
        <div className="space-y-2">
          <div className="font-mono text-[10px] text-hud-muted tracking-widest">FINDINGS</div>
          {result.findings.map((f, i) => (
            <div key={i} className="border border-hud-border/60 bg-black/30 rounded p-3 space-y-1">
              <div className="flex items-center gap-2">
                <SeverityIcon severity={f.severity} />
                <span className="font-mono text-[10px] text-hud-muted tracking-wider">{f.category}</span>
                <span
                  className="ml-auto font-mono text-[10px] font-bold"
                  style={{ color: confidenceColor(f.confidence) }}
                >
                  {f.confidence}%
                </span>
              </div>
              <div className="font-mono text-xs text-white font-semibold">{f.title}</div>
              <p className="text-[11px] text-hud-muted leading-snug">{f.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Evidence */}
      {result.evidence.length > 0 && (
        <div className="space-y-2">
          <div className="font-mono text-[10px] text-hud-muted tracking-widest">EVIDENCE</div>
          <div className="border border-hud-border/40 rounded overflow-hidden">
            {result.evidence.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 px-3 py-2 font-mono text-[10px] border-b border-hud-border/30 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="text-hud-muted">{e.type}</span>
                  <span className="text-hud-text">{e.metric}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-white">{e.value}</span>
                  <span className="flex items-center gap-1 text-hud-green text-[9px]">
                    <CheckCircle size={8} />
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution trace */}
      {result.execution_trace.length > 0 && (
        <div className="space-y-2">
          <div className="font-mono text-[10px] text-hud-muted tracking-widest">EXECUTION TRACE</div>
          <div className="space-y-1">
            {result.execution_trace.map((step, i) => (
              <div key={i} className="flex gap-2 items-start font-mono text-[10px]">
                <span className="text-hud-cyan shrink-0 w-4 text-center mt-px">
                  {STEP_ICONS[step.step] ?? '·'}
                </span>
                <div>
                  <span className="text-hud-muted tracking-wider">{step.step.replace(/_/g, ' ').toUpperCase()}</span>
                  <p className="text-hud-text/70 text-[9px] leading-snug mt-0.5">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inference time */}
      <div className="flex items-center justify-between font-mono text-[10px] text-hud-muted border-t border-hud-border pt-3">
        <div className="flex items-center gap-1.5">
          <Activity size={10} className="text-hud-green" />
          <span>INFERENCE COMPLETE</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={10} />
          <span>{result.inference_time_ms} ms</span>
        </div>
      </div>
    </div>
  );
};
