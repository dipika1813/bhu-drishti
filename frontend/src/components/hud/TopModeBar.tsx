import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Layers, GitCompare, Radio } from 'lucide-react';
import type { AnalysisMode, ImageMetadata } from '@/lib/types';

interface Props {
  mode: AnalysisMode;
  metadata?: ImageMetadata;
  onUploadClick: () => void;
}

const MODE_CONFIG: { key: AnalysisMode; label: string; short: string; icon: React.ReactNode }[] = [
  { key: 'single',     label: 'Single Image',          short: 'SINGLE', icon: <Layers size={11} /> },
  { key: 'crossmodal', label: 'Cross-Modal Pair',       short: 'OPT+SAR', icon: <Radio size={11} /> },
  { key: 'bitemporal', label: 'Bi-Temporal Pair',       short: 'ΔT PAIR', icon: <GitCompare size={11} /> },
];

export const TopModeBar: React.FC<Props> = ({ mode, metadata, onUploadClick }) => {
  const current = MODE_CONFIG.find((m) => m.key === mode) ?? MODE_CONFIG[0];

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-black/70 border-b border-hud-border backdrop-blur-sm shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 shrink-0">
        <div className="w-5 h-5 border border-hud-cyan/60 rotate-45 flex items-center justify-center"
          style={{ boxShadow: '0 0 8px rgba(0,217,255,0.3)' }}>
          <div className="w-2 h-2 bg-hud-cyan/60" />
        </div>
        <span className="font-mono text-[11px] text-hud-cyan tracking-widest glow-cyan">SATQUERY·AI</span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-hud-border" />

      {/* Mode badge */}
      <div className="flex items-center gap-1.5 font-mono text-[10px]">
        <span className="text-hud-muted tracking-widest">MODE</span>
        <span className="flex items-center gap-1 px-2 py-0.5 border border-hud-cyan/30 rounded text-hud-cyan bg-hud-cyan/5">
          {current.icon}
          {current.short}
        </span>
      </div>

      {/* Sensor info */}
      {metadata && (
        <>
          <div className="h-6 w-px bg-hud-border" />
          <div className="flex items-center gap-3 font-mono text-[10px] text-hud-muted">
            <span><span className="text-hud-muted/50">SNS</span> <span className="text-hud-text">{metadata.sensor.split(' ')[0]}</span></span>
            <span><span className="text-hud-muted/50">RES</span> <span className="text-hud-text">{metadata.resolution_m}m</span></span>
            <span><span className="text-hud-muted/50">DATE</span> <span className="text-hud-text">{metadata.acquisition_date}</span></span>
            <span><span className="text-hud-muted/50">CLD</span> <span className="text-hud-text">{metadata.cloud_cover_pct}%</span></span>
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Upload button */}
      <motion.button
        onClick={onUploadClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-1.5 px-3 py-1 border border-hud-border rounded font-mono text-[10px] text-hud-muted hover:text-hud-cyan hover:border-hud-cyan/40 transition-all"
      >
        <Upload size={10} />
        NEW SESSION
      </motion.button>
    </div>
  );
};
