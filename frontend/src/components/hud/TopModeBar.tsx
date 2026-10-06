import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  GitCompare,
  Radio,
  Upload,
  Home,
  Database,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import type { AnalysisMode, ImageMetadata, SampleDataset } from '@/lib/types';
import { BUNDLED_SAMPLES } from '@/lib/api';

interface Props {
  mode: AnalysisMode;
  metadata?: ImageMetadata;
  backendOnline: boolean;
  onUploadClick: () => void;
  onSelectSample: (sample: SampleDataset) => void;
  onModeChange: (newMode: AnalysisMode) => void;
}

const MODES: { key: AnalysisMode; label: string; short: string; icon: React.ReactNode }[] = [
  { key: 'single', label: 'Single Scene', short: 'SINGLE', icon: <Layers size={12} /> },
  { key: 'crossmodal', label: 'Optical + SAR', short: 'OPT+SAR', icon: <Radio size={12} /> },
  { key: 'bitemporal', label: 'Bi-Temporal', short: 'BI-TEMPORAL', icon: <GitCompare size={12} /> },
];

export const TopModeBar: React.FC<Props> = ({
  mode,
  metadata,
  backendOnline,
  onUploadClick,
  onSelectSample,
  onModeChange,
}) => {
  const [datasetDropdownOpen, setDatasetDropdownOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-black/85 border-b border-hud-border backdrop-blur-md shrink-0 text-xs font-mono select-none">
      {/* Left: Brand, Home, and Workspace */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group" title="Return to BhuDrishti Home">
          <div
            className="w-5 h-5 border border-hud-cyan rotate-45 flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ boxShadow: '0 0 8px rgba(0,217,255,0.4)' }}
          >
            <div className="w-2 h-2 bg-hud-cyan" />
          </div>
          <span className="font-bold text-white tracking-widest group-hover:text-hud-cyan transition-colors">
            BHUDRISHTI
          </span>
        </Link>

        <div className="hidden sm:block h-4 w-px bg-hud-border" />

        {/* Dataset Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => setDatasetDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-hud-border hover:border-hud-cyan/40 bg-black/40 rounded text-[11px] text-hud-text transition-colors"
          >
            <Database size={11} className="text-hud-cyan" />
            <span className="hidden md:inline text-hud-muted">DATASET:</span>
            <span className="font-semibold text-white truncate max-w-[130px]">
              {metadata?.sensor?.split(' ')[0] || 'Reference Scene'}
            </span>
            <ChevronDown size={11} className="text-hud-muted" />
          </button>

          {datasetDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-1.5 w-64 bg-hud-panel border border-hud-border rounded shadow-xl z-50 p-1 space-y-1"
              onMouseLeave={() => setDatasetDropdownOpen(false)}
            >
              <div className="p-1.5 text-[9px] text-hud-muted uppercase tracking-wider border-b border-hud-border/70">
                Switch Reference Dataset
              </div>
              {BUNDLED_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectSample(s);
                    setDatasetDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded hover:bg-hud-cyan/10 hover:border-hud-cyan/40 border border-transparent transition-all flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-white">{s.title}</span>
                    <span className="text-[8px] text-hud-cyan uppercase">{s.mode}</span>
                  </div>
                  <div className="text-[9px] text-hud-muted">{s.location.city} · {s.sensor}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mode Selector */}
        <div className="hidden lg:flex items-center gap-1 border border-hud-border/80 bg-black/40 p-0.5 rounded">
          {MODES.map((m) => {
            const isActive = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => onModeChange(m.key)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] tracking-wider transition-all ${
                  isActive
                    ? 'bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/50 font-semibold'
                    : 'text-hud-muted hover:text-white border border-transparent'
                }`}
              >
                {m.icon}
                <span>{m.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: Live Telemetry Metadata */}
      {metadata && (
        <div className="hidden xl:flex items-center gap-4 text-[10px] text-hud-muted">
          <div className="flex items-center gap-1">
            <span className="text-hud-muted/60">RES:</span>
            <span className="text-hud-cyan font-bold">{metadata.resolution_m}m GSD</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-hud-muted/60">CRS:</span>
            <span className="text-hud-text">{metadata.crs.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={11} className="text-hud-muted/70" />
            <span className="text-hud-text">{metadata.acquisition_date}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-hud-muted/60">CLOUD:</span>
            <span className="text-hud-text">{metadata.cloud_cover_pct}%</span>
          </div>
        </div>
      )}

      {/* Right: Backend Engine Status & Actions */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 border rounded text-[10px] tracking-wider ${
            backendOnline
              ? 'border-hud-green/30 bg-hud-green/10 text-hud-green'
              : 'border-hud-amber/30 bg-hud-amber/10 text-hud-amber'
          }`}
          title={
            backendOnline
              ? 'FastAPI Geospatial Engine connected at http://localhost:8000'
              : 'Operating in deterministic offline simulation mode'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendOnline ? 'bg-hud-green animate-pulse' : 'bg-hud-amber'
            }`}
          />
          <span className="hidden sm:inline">
            {backendOnline ? 'BACKEND ONLINE' : 'CLIENT SIMULATION'}
          </span>
        </div>

        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-2.5 py-1 border border-hud-cyan/50 hover:border-hud-cyan bg-hud-cyan/10 hover:bg-hud-cyan/20 text-hud-cyan rounded text-[11px] font-semibold tracking-wider transition-all"
        >
          <Upload size={12} />
          <span>UPLOAD</span>
        </button>

        <Link
          to="/"
          className="p-1.5 text-hud-muted hover:text-white transition-colors border border-hud-border/70 rounded hover:border-hud-border"
          title="Return to Landing Page"
        >
          <Home size={13} />
        </Link>
      </div>
    </div>
  );
};
