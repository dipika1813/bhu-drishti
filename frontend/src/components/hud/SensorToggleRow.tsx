import React from 'react';
import type { SensorFilter } from '@/lib/types';

const SENSORS: { key: SensorFilter; label: string; num: number; color: string; desc: string }[] = [
  { key: 'truecolor', label: 'TRUE COLOR', num: 1, color: '#00d9ff', desc: 'RGB standard natural-color composite' },
  { key: 'grayscale', label: 'PANCHROMATIC', num: 2, color: '#94a3b8', desc: 'Single-band panchromatic radiometric view' },
  { key: 'ndvi', label: 'NDVI VEGETATION', num: 3, color: '#39ff14', desc: 'Normalized Difference Vegetation Index' },
  { key: 'ndwi', label: 'NDWI WATER', num: 4, color: '#38bdf8', desc: 'Normalized Difference Water Index' },
  { key: 'heatmap', label: 'DELTA HEATMAP', num: 5, color: '#ffb020', desc: 'Change anomaly and surface transition map' },
];

interface Props {
  active: SensorFilter;
  onChange: (s: SensorFilter) => void;
}

export const SensorToggleRow: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 border border-hud-border rounded overflow-x-auto no-scrollbar">
      <span className="font-mono text-[9px] text-hud-muted tracking-widest uppercase mr-1 shrink-0">
        SPECTRAL LAYER:
      </span>
      {SENSORS.map((s) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            title={s.desc}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[10px] tracking-wider shrink-0 transition-all ${
              isActive
                ? 'bg-black border-hud-cyan text-white shadow-[0_0_10px_rgba(0,217,255,0.25)]'
                : 'border-hud-border/80 bg-black/30 text-hud-muted hover:text-hud-text hover:border-hud-border'
            }`}
          >
            <span
              className="w-3.5 h-3.5 flex items-center justify-center border text-[8px] font-bold rounded-sm"
              style={{
                borderColor: isActive ? s.color : '#2a3545',
                color: isActive ? s.color : '#64748b',
              }}
            >
              {s.num}
            </span>
            <span className={isActive ? 'font-semibold' : ''}>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
};
