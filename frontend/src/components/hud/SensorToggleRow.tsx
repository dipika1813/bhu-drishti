import React from 'react';
import { motion } from 'framer-motion';
import type { SensorFilter } from '@/lib/types';

const SENSORS: { key: SensorFilter; label: string; num: number; color: string }[] = [
  { key: 'truecolor', label: 'TRUE COLOR', num: 1, color: '#c8d8e8' },
  { key: 'grayscale', label: 'GRAYSCALE', num: 2, color: '#aaaaaa' },
  { key: 'ndvi',      label: 'NDVI',       num: 3, color: '#39ff14' },
  { key: 'ndwi',      label: 'NDWI',       num: 4, color: '#00d9ff' },
  { key: 'heatmap',   label: 'Δ HEATMAP',  num: 5, color: '#ff3b3b' },
];

interface Props {
  active: SensorFilter;
  onChange: (s: SensorFilter) => void;
}

export const SensorToggleRow: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-hud-border rounded">
      <span className="font-mono text-[9px] text-hud-muted tracking-widest mr-2">SENSOR</span>
      {SENSORS.map((s) => {
        const isActive = active === s.key;
        return (
          <motion.button
            key={s.key}
            onClick={() => onChange(s.key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[10px] tracking-widest transition-all"
            style={{
              borderColor: isActive ? s.color : '#1a2535',
              color: isActive ? s.color : '#4a6080',
              background: isActive ? `${s.color}18` : 'transparent',
              boxShadow: isActive ? `0 0 8px ${s.color}44` : 'none',
            }}
          >
            <span
              className="w-4 h-4 flex items-center justify-center border text-[9px] font-bold"
              style={{ borderColor: isActive ? s.color : '#2a3545', color: isActive ? s.color : '#3a4555' }}
            >
              {s.num}
            </span>
            {s.label}
            {isActive && (
              <motion.div
                layoutId="sensor-indicator"
                className="absolute inset-0 rounded border"
                style={{ borderColor: s.color, boxShadow: `0 0 6px ${s.color}` }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
