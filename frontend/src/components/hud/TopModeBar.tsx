import React from 'react';
import { Home, Cpu } from 'lucide-react';
import type { Session } from '@/lib/types';

interface Props {
  session: Session;
  onNewSession: () => void;
}

const MODE_LABELS: Record<string, string> = {
  single: 'SINGLE SCENE',
  crossmodal: 'CROSS-MODAL',
  bitemporal: 'BI-TEMPORAL',
};

export const TopModeBar: React.FC<Props> = ({ session, onNewSession }) => {
  const modeLabel = MODE_LABELS[session.mode] ?? session.mode.toUpperCase();

  return (
    <div className="relative z-20 flex items-center justify-between gap-3 px-4 py-2 border-b border-hud-border bg-black/80 backdrop-blur-sm shrink-0">
      {/* Left: logo + session mode */}
      <div className="flex items-center gap-3">
        <div
          className="w-5 h-5 border border-hud-cyan/80 rotate-45 flex items-center justify-center shrink-0"
          style={{ boxShadow: '0 0 8px rgba(0,217,255,0.25)' }}
        >
          <div className="w-2 h-2 bg-hud-cyan" />
        </div>
        <span className="font-mono text-xs tracking-widest text-hud-cyan font-bold hidden sm:block">
          BHUDRISHTI
        </span>
        <div className="h-4 w-px bg-hud-border hidden sm:block" />
        <span className="font-mono text-[10px] tracking-wider text-hud-muted px-2 py-0.5 border border-hud-border/60 rounded">
          {modeLabel}
        </span>
      </div>

      {/* Center: sensor + session id */}
      <div className="flex items-center gap-3 font-mono text-[10px] text-hud-muted overflow-hidden">
        <div className="hidden md:flex items-center gap-1.5">
          <Cpu size={10} className="text-hud-cyan shrink-0" />
          <span className="truncate max-w-[200px]">{session.metadata.sensor}</span>
        </div>
        <div className="hidden lg:block h-3 w-px bg-hud-border" />
        <div className="hidden lg:flex items-center gap-1 text-hud-muted/60">
          <span>SID:</span>
          <span className="text-hud-cyan/70 font-mono truncate max-w-[120px]">
            {session.session_id.substring(0, 12)}…
          </span>
        </div>
        {session.metadata.is_synthetic_demo && (
          <span className="px-1.5 py-0.5 border border-hud-amber/40 text-hud-amber rounded text-[9px] tracking-wider shrink-0">
            DEMO
          </span>
        )}
      </div>

      {/* Right: task badge + new session */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[9px] tracking-wider">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-hud-green animate-pulse" />
          <span className="text-hud-green">READY</span>
        </div>
        <button
          type="button"
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-3 py-1 border border-hud-border bg-black/50 hover:border-hud-cyan/50 hover:text-hud-cyan text-hud-muted font-mono text-[10px] tracking-wider rounded transition-all"
          title="Return to landing page"
        >
          <Home size={11} />
          <span className="hidden sm:inline">NEW SESSION</span>
        </button>
      </div>
    </div>
  );
};
