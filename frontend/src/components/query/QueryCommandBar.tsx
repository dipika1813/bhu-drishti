import React, { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { Terminal, Send, Loader2, Sparkles, X } from 'lucide-react';

interface Props {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  externalQuery?: string;
}

const SAMPLE_QUERIES = [
  'Identify areas of new construction and built-up structures.',
  'Where did vegetation decrease or show canopy disturbance?',
  'Find areas of water expansion and flood inundation.',
  'Compare the two acquisitions and identify major land-cover changes.',
  'Locate industrial infrastructure and warehouse clusters.',
  'Which regions require inspection for structural anomaly?',
];

const QUICK_CHIPS = [
  { label: 'New Construction', query: 'Identify areas of new construction and structural buildings.' },
  { label: 'Vegetation Canopy', query: 'Where did vegetation decrease or show canopy loss?' },
  { label: 'Flood Inundation', query: 'Find areas of water expansion and surface inundation.' },
  { label: 'Compare Acquisitions', query: 'Compare the two images and show major land-cover changes.' },
  { label: 'SAR / Radar Alignment', query: 'Analyze SAR microwave backscatter and structural facades.' },
];

export const QueryCommandBar: React.FC<Props> = ({ onSubmit, isLoading, disabled, externalQuery }) => {
  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevExternalRef = useRef<string | undefined>(externalQuery);

  useEffect(() => {
    if (externalQuery && externalQuery !== prevExternalRef.current) {
      prevExternalRef.current = externalQuery;
      // Use queueMicrotask to avoid immediate synchronous setState warning in React 19
      queueMicrotask(() => {
        setValue(externalQuery);
        inputRef.current?.focus();
      });
    }
  }, [externalQuery]);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIndex((p) => (p + 1) % SAMPLE_QUERIES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = () => {
    const q = value.trim();
    if (!q || isLoading || disabled) return;
    onSubmit(q);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setValue('');
    }
  };

  return (
    <div className="space-y-2">
      {/* Quick query chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[9px] font-mono">
        <span className="text-hud-muted/70 uppercase tracking-widest shrink-0 mr-1 flex items-center gap-1">
          <Sparkles size={10} className="text-hud-cyan" />
          <span>SUGGESTIONS:</span>
        </span>
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setValue(chip.query);
              inputRef.current?.focus();
            }}
            disabled={isLoading || disabled}
            className="px-2 py-0.5 border border-hud-border/80 bg-black/50 hover:border-hud-cyan/50 hover:text-hud-cyan text-hud-muted rounded shrink-0 whitespace-nowrap transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Main command bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-black/85 border border-hud-border rounded backdrop-blur-md transition-all focus-within:border-hud-cyan/80 focus-within:shadow-[0_0_20px_rgba(0,217,255,0.15)]"
      >
        {/* Prompt identifier */}
        <div className="flex items-center gap-1.5 shrink-0 select-none">
          <Terminal size={13} className="text-hud-cyan" />
          <span className="font-mono text-hud-cyan text-[11px] font-bold tracking-wider">
            BHUDRISHTI://&gt;
          </span>
        </div>

        {/* Input field */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
            placeholder={SAMPLE_QUERIES[placeholderIndex]}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent font-mono text-xs text-white outline-none placeholder:text-hud-muted/50"
          />
        </div>

        {/* Character count & clear button */}
        {value.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[9px] text-hud-muted">{value.length} char</span>
            <button
              type="button"
              onClick={() => setValue('')}
              className="text-hud-muted hover:text-white p-0.5 transition-colors"
              title="Clear Input"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Execute button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || disabled || !value.trim()}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded font-mono text-[11px] font-semibold tracking-wider uppercase transition-all ${
            value.trim() && !isLoading && !disabled
              ? 'border border-hud-cyan bg-hud-cyan text-black hover:bg-hud-cyan/90 shadow-[0_0_15px_rgba(0,217,255,0.3)]'
              : 'border border-hud-border/70 bg-black/40 text-hud-muted cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              <span>RUNNING...</span>
            </>
          ) : (
            <>
              <Send size={11} />
              <span>RUN ANALYSIS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
