import React, { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Terminal, Loader2 } from 'lucide-react';

interface Props {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const SAMPLE_QUERIES = [
  'What is the dominant land use class in this scene?',
  'Are there any signs of flooding or water inundation?',
  'Locate all large industrial or warehouse structures.',
  'How has the vegetation coverage changed between the two acquisitions?',
  'What percentage of the scene is impervious surface?',
];

export const QueryCommandBar: React.FC<Props> = ({ onSubmit, isLoading, disabled }) => {
  const [value, setValue] = useState('');
  const [placeholder, setPlaceholder] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholder((p) => (p + 1) % SAMPLE_QUERIES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = () => {
    const q = value.trim();
    if (!q || isLoading || disabled) return;
    onSubmit(q);
    setValue('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-black/70 border border-hud-border rounded backdrop-blur-sm"
      style={{ boxShadow: '0 0 20px rgba(0,217,255,0.05)' }}>
      {/* Prompt prefix */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Terminal size={12} className="text-hud-cyan opacity-70" />
        <span className="font-mono text-hud-cyan text-xs">SATQUERY://&gt;</span>
      </div>

      {/* Input */}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={isLoading || disabled}
          className="w-full bg-transparent font-mono text-xs text-hud-text outline-none placeholder-hud-muted/50 cursor-blink"
          placeholder={SAMPLE_QUERIES[placeholder]}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Char count */}
      {value.length > 0 && (
        <span className="font-mono text-[9px] text-hud-muted shrink-0">{value.length}</span>
      )}

      {/* Send button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isLoading || disabled || !value.trim()}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="shrink-0 flex items-center gap-1 px-3 py-1 border rounded font-mono text-[10px] tracking-widest transition-all"
        style={{
          borderColor: value.trim() && !isLoading && !disabled ? '#00d9ff' : '#1a2535',
          color: value.trim() && !isLoading && !disabled ? '#00d9ff' : '#2a3545',
          background: value.trim() && !isLoading && !disabled ? 'rgba(0,217,255,0.1)' : 'transparent',
        }}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 size={10} className="animate-spin" />
            </motion.div>
          ) : (
            <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1">
              <Send size={10} />
              <span>RUN</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
