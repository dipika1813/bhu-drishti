import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, X, Activity, Search, Database, Cpu, CheckCircle, Clock } from 'lucide-react';
import type { QueryResult, ExecutionTraceStep } from '@/lib/types';
import { confidenceColor, TASK_LABELS, TASK_COLORS, STEP_ICONS } from '@/lib/utils';

interface Props {
  result: QueryResult | null;
  isOpen: boolean;
  onClose: () => void;
}

const STEP_ICONS_MAP: Record<string, React.ReactNode> = {
  task_classification:     <Activity size={10} />,
  visual_rag_retrieval:    <Search size={10} />,
  textual_rag_retrieval:   <Database size={10} />,
  model_inference:         <Cpu size={10} />,
  deterministic_verification: <CheckCircle size={10} />,
};

const TraceRow: React.FC<{ step: ExecutionTraceStep; index: number }> = ({ step, index }) => {
  const icon = STEP_ICONS_MAP[step.step] ?? <Activity size={10} />;
  const label = step.step.replace(/_/g, ' ').toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.25 }}
      className="flex items-start gap-2 py-1.5 border-b border-hud-border/40 last:border-0"
    >
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        <span className="text-hud-cyan opacity-60">{icon}</span>
        <div className="w-px h-full bg-hud-border" />
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[8px] text-hud-muted tracking-widest">{label}</div>
        <div className="font-mono text-[10px] text-hud-text leading-snug mt-0.5">{step.detail}</div>
      </div>
    </motion.div>
  );
};

export const ResultsPanel: React.FC<Props> = ({ result, isOpen, onClose }) => {
  const [traceOpen, setTraceOpen] = useState(false);

  const confColor = result ? confidenceColor(result.confidence) : '#4a6080';
  const taskColor = result ? TASK_COLORS[result.task_classified] : '#4a6080';
  const taskLabel = result ? TASK_LABELS[result.task_classified] : '';

  return (
    <AnimatePresence>
      {isOpen && result && (
        <motion.div
          key="results-panel"
          initial={{ x: '110%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '110%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute top-0 right-0 h-full w-80 z-40 flex flex-col bg-hud-panel border-l border-hud-border overflow-hidden"
          style={{ boxShadow: '-4px 0 30px rgba(0,0,0,0.5)' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-hud-border shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-hud-cyan animate-pulse" />
              <span className="font-mono text-[10px] text-hud-cyan tracking-widest">ANALYSIS RESULT</span>
            </div>
            <button onClick={onClose} className="text-hud-muted hover:text-hud-text transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Task badge */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <span
                className="font-mono text-[9px] tracking-widest px-2 py-1 border rounded"
                style={{ borderColor: taskColor, color: taskColor, background: `${taskColor}15` }}
              >
                {taskLabel}
              </span>
              <div className="flex items-center gap-1 font-mono text-[9px] text-hud-muted">
                <Clock size={9} />
                <span>{result.inference_time_ms}ms</span>
              </div>
            </motion.div>

            {/* Confidence meter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between font-mono text-[9px]">
                <span className="text-hud-muted tracking-widest">CONFIDENCE</span>
                <span style={{ color: confColor }} className="font-bold text-sm">{result.confidence}%</span>
              </div>
              <div className="h-1.5 bg-hud-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(to right, ${confColor}88, ${confColor})` }}
                />
              </div>
              <div className="flex justify-between font-mono text-[8px] text-hud-muted/50">
                <span>LOW</span><span>MED</span><span>HIGH</span>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="border-t border-hud-border" />

            {/* Answer */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-1.5"
            >
              <div className="font-mono text-[9px] text-hud-muted tracking-widest">ANALYSIS OUTPUT</div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-[12px] text-hud-text leading-relaxed font-sans"
              >
                {result.answer}
              </motion.p>
            </motion.div>

            {/* Bounding boxes summary */}
            {result.bounding_boxes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1.5"
              >
                <div className="font-mono text-[9px] text-hud-muted tracking-widest">
                  DETECTIONS ({result.bounding_boxes.length})
                </div>
                <div className="space-y-1">
                  {result.bounding_boxes.map((bb, i) => (
                    <div key={i} className="flex items-center justify-between font-mono text-[10px] py-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 border border-hud-cyan" />
                        <span className="text-hud-text">{bb.label}</span>
                      </div>
                      <span className="text-hud-cyan">{bb.confidence}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Divider */}
            <div className="border-t border-hud-border" />

            {/* Execution trace accordion */}
            <div className="space-y-1.5">
              <button
                onClick={() => setTraceOpen((o) => !o)}
                className="w-full flex items-center justify-between font-mono text-[9px] text-hud-muted tracking-widest hover:text-hud-cyan transition-colors"
              >
                <span>EXECUTION TRACE ({result.execution_trace.length} steps)</span>
                {traceOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              </button>

              <AnimatePresence>
                {traceOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-hud-border/50 rounded p-2 space-y-0 bg-black/20">
                      {result.execution_trace.map((step, i) => (
                        <TraceRow key={i} step={step} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Panel footer */}
          <div className="shrink-0 px-4 py-2 border-t border-hud-border">
            <div className="flex items-center justify-between font-mono text-[8px] text-hud-muted/50">
              <span>SATQUERY AI v1.0 · DEMO MODE</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-hud-green animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
