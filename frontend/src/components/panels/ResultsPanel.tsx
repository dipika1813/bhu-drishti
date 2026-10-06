import React, { useState } from 'react';
import {
  X,
  Activity,
  Search,
  Database,
  Cpu,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Download,
  Copy,
  Check,
  MapPin,
  FileText,
} from 'lucide-react';
import type { QueryResult, ExecutionTraceStep, ImageMetadata } from '@/lib/types';
import { confidenceColor, TASK_LABELS, TASK_COLORS } from '@/lib/utils';

interface Props {
  result: QueryResult | null;
  isOpen: boolean;
  onClose: () => void;
  metadata?: ImageMetadata;
  selectedBboxId: string | null;
  onSelectBbox: (id: string | null) => void;
  onQuerySelect?: (query: string) => void;
}

const STEP_ICONS_MAP: Record<string, React.ReactNode> = {
  task_classification: <Activity size={12} className="text-hud-cyan" />,
  visual_rag_retrieval: <Search size={12} className="text-hud-cyan" />,
  textual_rag_retrieval: <Database size={12} className="text-hud-cyan" />,
  model_inference: <Cpu size={12} className="text-hud-cyan" />,
  deterministic_verification: <CheckCircle size={12} className="text-hud-green" />,
};

export const ResultsPanel: React.FC<Props> = ({
  result,
  isOpen,
  onClose,
  metadata,
  selectedBboxId,
  onSelectBbox,
  onQuerySelect,
}) => {
  const [traceOpen, setTraceOpen] = useState(true);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const confColor = result ? confidenceColor(result.confidence) : '#4a6080';
  const taskColor = result ? TASK_COLORS[result.task_classified] || '#00d9ff' : '#00d9ff';
  const taskLabel = result ? TASK_LABELS[result.task_classified] || 'GEOSPATIAL VQA' : 'GEOSPATIAL VQA';

  const handleCopyReport = () => {
    if (!result) return;
    const text = `BhuDrishti Analysis Report\nQuery: ${result.query || 'N/A'}\nTask: ${taskLabel}\nConfidence: ${result.confidence}%\n\nSummary:\n${result.answer}\n\nFindings:\n${(result.findings || []).map((f) => `- [${f.category}] ${f.title}: ${f.description}`).join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadJSON = () => {
    if (!result) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bhudrishti-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      className="absolute top-0 right-0 h-full w-full sm:w-96 z-40 flex flex-col bg-hud-panel border-l border-hud-border select-text overflow-hidden transition-all duration-300"
      style={{ boxShadow: '-6px 0 25px rgba(0,0,0,0.6)' }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hud-border bg-black/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-hud-cyan animate-pulse" />
          <span className="font-mono text-xs font-semibold text-hud-cyan tracking-widest">
            ANALYSIS TELEMETRY
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <>
              <button
                onClick={handleCopyReport}
                title="Copy Text Summary"
                className="p-1 text-hud-muted hover:text-hud-cyan transition-colors"
              >
                {copied ? <Check size={13} className="text-hud-green" /> : <Copy size={13} />}
              </button>
              <button
                onClick={handleDownloadJSON}
                title="Export JSON Report"
                className="p-1 text-hud-muted hover:text-hud-cyan transition-colors"
              >
                <Download size={13} />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1 text-hud-muted hover:text-white transition-colors"
            title="Close Panel"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {!result ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full border border-hud-border flex items-center justify-center text-hud-muted">
              <Search size={22} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">No Analysis Executed</div>
              <p className="text-[11px] text-hud-muted font-sans leading-relaxed">
                Submit a natural-language query in the bottom command bar to inspect land cover, detect changes, or localize features.
              </p>
            </div>
            {onQuerySelect && (
              <div className="space-y-1.5 w-full pt-2 text-left">
                <div className="text-[10px] text-hud-muted tracking-wider uppercase">Sample Queries:</div>
                {[
                  'Identify areas of new construction.',
                  'Where did vegetation decrease?',
                  'Find areas of water expansion and flood inundation.',
                  'Locate industrial infrastructure and warehouse clusters.',
                ].map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => onQuerySelect(sq)}
                    className="w-full text-left p-2 border border-hud-border/80 bg-black/30 hover:border-hud-cyan/40 rounded text-[10px] text-hud-text truncate block transition-colors"
                  >
                    ▶ {sq}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Task Classification & Execution Duration */}
            <div className="flex items-center justify-between gap-2 border-b border-hud-border/70 pb-3">
              <span
                className="font-mono text-[10px] tracking-wider px-2 py-0.5 border rounded uppercase font-semibold"
                style={{ borderColor: taskColor, color: taskColor, background: `${taskColor}15` }}
              >
                {taskLabel}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-hud-muted">
                <Clock size={11} />
                <span>{result.inference_time_ms} ms</span>
                {result.is_demo_mode && (
                  <span className="px-1 py-0.2 text-[8px] border border-hud-amber/50 text-hud-amber rounded">
                    DEMO
                  </span>
                )}
              </div>
            </div>

            {/* Confidence Meter */}
            <div className="p-3 border border-hud-border bg-black/30 rounded space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-hud-muted tracking-wider text-[10px]">ANALYSIS CONFIDENCE:</span>
                <span style={{ color: confColor }} className="font-bold text-sm">
                  {result.confidence}%
                </span>
              </div>
              <div className="h-1.5 bg-hud-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${result.confidence}%`, backgroundColor: confColor }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-hud-muted/60">
                <span>PRELIMINARY</span>
                <span>MODERATE</span>
                <span>VERIFIED</span>
              </div>
            </div>

            {/* Executive Summary / Answer */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-hud-cyan tracking-wider flex items-center gap-1 font-semibold">
                <FileText size={12} />
                <span>EXECUTIVE FINDINGS</span>
              </div>
              <p className="text-xs font-sans text-hud-text/95 leading-relaxed bg-black/40 p-3 border border-hud-border/70 rounded">
                {result.answer}
              </p>
            </div>

            {/* Structured Findings List */}
            {result.findings && result.findings.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] text-hud-cyan tracking-wider font-semibold">
                  DETAILED FINDINGS ({result.findings.length})
                </div>
                <div className="space-y-2">
                  {result.findings.map((f, i) => (
                    <div key={i} className="p-2.5 border border-hud-border/80 bg-black/30 rounded space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-hud-cyan font-bold">{f.category}</span>
                        {f.severity === 'Warning' ? (
                          <span className="text-hud-amber flex items-center gap-1 text-[9px]">
                            <AlertTriangle size={10} />
                            <span>ALERT</span>
                          </span>
                        ) : (
                          <span className="text-hud-muted text-[9px]">{f.confidence}% conf</span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-white">{f.title}</div>
                      <p className="text-[10px] font-sans text-hud-text/80 leading-normal">
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Regions / Bounding Boxes */}
            {result.bounding_boxes && result.bounding_boxes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-hud-cyan tracking-wider font-semibold">
                  <span>DETECTED SPATIAL REGIONS ({result.bounding_boxes.length})</span>
                  <span className="text-[9px] text-hud-muted">Click to focus</span>
                </div>
                <div className="space-y-1.5">
                  {result.bounding_boxes.map((bb, i) => {
                    const boxId = bb.id || `bbox-${i}`;
                    const isSelected = selectedBboxId === boxId;
                    return (
                      <button
                        key={boxId}
                        onClick={() => onSelectBbox(isSelected ? null : boxId)}
                        className={`w-full text-left p-2 rounded border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-hud-cyan bg-hud-cyan/15 text-white'
                            : 'border-hud-border/70 bg-black/30 hover:border-hud-cyan/50 text-hud-text'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin size={11} className={isSelected ? 'text-hud-cyan' : 'text-hud-muted'} />
                          <span className="font-semibold text-[10px] capitalize">{bb.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="text-hud-muted">X:{Math.round(bb.x)}% Y:{Math.round(bb.y)}%</span>
                          <span className="text-hud-cyan font-bold">{bb.confidence}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evidence & Verification Context */}
            {result.evidence && result.evidence.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] text-hud-cyan tracking-wider font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>EVIDENCE & VERIFICATION</span>
                </div>
                <div className="border border-hud-border/70 rounded overflow-hidden">
                  <table className="w-full text-[9px] border-collapse text-left">
                    <thead className="bg-black/60 text-hud-muted">
                      <tr>
                        <th className="p-1.5 border-b border-hud-border/70 font-semibold">METRIC</th>
                        <th className="p-1.5 border-b border-hud-border/70 font-semibold">VALUE</th>
                        <th className="p-1.5 border-b border-hud-border/70 font-semibold text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hud-border/40 bg-black/20">
                      {result.evidence.map((ev, i) => (
                        <tr key={i} className="hover:bg-hud-cyan/5">
                          <td className="p-1.5 text-hud-text">{ev.metric}</td>
                          <td className="p-1.5 text-hud-muted">{ev.value}</td>
                          <td className="p-1.5 text-right font-bold text-hud-green">{ev.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Execution Trace Accordion */}
            <div className="space-y-1.5 border-t border-hud-border/70 pt-2">
              <button
                onClick={() => setTraceOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-[10px] text-hud-muted hover:text-hud-cyan tracking-wider transition-colors"
              >
                <span>EXECUTION TRACE ({result.execution_trace?.length || 0} STEPS)</span>
                {traceOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>

              {traceOpen && result.execution_trace && (
                <div className="space-y-1 pt-1">
                  {result.execution_trace.map((step: ExecutionTraceStep, i: number) => {
                    const icon = STEP_ICONS_MAP[step.step] || <Activity size={12} />;
                    const stepName = step.step.replace(/_/g, ' ').toUpperCase();
                    return (
                      <div
                        key={i}
                        className="p-2 border border-hud-border/50 bg-black/20 rounded flex items-start gap-2"
                      >
                        <span className="shrink-0 mt-0.5">{icon}</span>
                        <div className="min-w-0">
                          <div className="text-[8px] text-hud-muted tracking-widest">{stepName}</div>
                          <div className="text-[10px] text-hud-text font-sans mt-0.5 leading-snug">
                            {step.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Metadata Accordion */}
            {metadata && (
              <div className="space-y-1.5 border-t border-hud-border/70 pt-2">
                <button
                  onClick={() => setMetadataOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-[10px] text-hud-muted hover:text-hud-cyan tracking-wider transition-colors"
                >
                  <span>SCENE METADATA</span>
                  {metadataOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                {metadataOpen && (
                  <div className="p-2.5 border border-hud-border/50 bg-black/20 rounded space-y-1 text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-hud-muted">SENSOR:</span>
                      <span className="text-white font-bold">{metadata.sensor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hud-muted">CRS:</span>
                      <span className="text-white">{metadata.crs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hud-muted">GSD RESOLUTION:</span>
                      <span className="text-hud-cyan">{metadata.resolution_m} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hud-muted">BANDS:</span>
                      <span className="text-white">{metadata.num_bands} spectral channels</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hud-muted">ACQUISITION DATE:</span>
                      <span className="text-white">{metadata.acquisition_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hud-muted">CLOUD COVER:</span>
                      <span className="text-white">{metadata.cloud_cover_pct}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel Footer */}
      <div className="p-3 border-t border-hud-border bg-black/60 shrink-0 flex items-center justify-between text-[9px] font-mono text-hud-muted">
        <span>BHUDRISHTI ENGINE</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-hud-green" />
          <span className="text-hud-text">ONLINE</span>
        </div>
      </div>
    </div>
  );
};
