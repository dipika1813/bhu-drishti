import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, GitCompare, Radio, ArrowRight, Zap, ChevronRight } from 'lucide-react';
import type { AnalysisMode, Session, UploadedImages } from '@/lib/types';
import { uploadImages, mockUpload } from '@/lib/api';

interface Props {
  onSessionReady: (session: Session, images: UploadedImages) => void;
}

const MODES: { key: AnalysisMode; label: string; desc: string; slots: number; icon: React.ReactNode; color: string }[] = [
  {
    key: 'single', label: 'Single Image', desc: 'Analyse one optical or SAR scene',
    slots: 1, icon: <Image size={18} />, color: '#00d9ff',
  },
  {
    key: 'crossmodal', label: 'Cross-Modal Pair', desc: 'Fuse optical + SAR from same area',
    slots: 2, icon: <Radio size={18} />, color: '#a855f7',
  },
  {
    key: 'bitemporal', label: 'Bi-Temporal Pair', desc: 'Change detection between two dates',
    slots: 2, icon: <GitCompare size={18} />, color: '#ffb020',
  },
];

const SAMPLES = [
  { label: 'Optical (City)', file: '/sample_optical.jpg', slot: 'primary' as const },
  { label: 'SAR (Radar)',    file: '/sample_sar.jpg',     slot: 'secondary' as const },
  { label: 'Before',        file: '/sample_before.jpg',  slot: 'primary' as const },
  { label: 'After',         file: '/sample_after.jpg',   slot: 'secondary' as const },
];

async function urlToFile(url: string, name: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type });
}

export const LandingScreen: React.FC<Props> = ({ onSessionReady }) => {
  const [mode, setMode] = useState<AnalysisMode>('single');
  const [images, setImages] = useState<UploadedImages>({ primary: null, secondary: null, primaryPreview: null, secondaryPreview: null });
  const [dragging, setDragging] = useState<'primary' | 'secondary' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const p1Ref = useRef<HTMLInputElement>(null);
  const p2Ref = useRef<HTMLInputElement>(null);

  const modeConfig = MODES.find((m) => m.key === mode)!;

  const setSlot = useCallback((slot: 'primary' | 'secondary', file: File) => {
    const url = URL.createObjectURL(file);
    setImages((prev) => ({
      ...prev,
      [slot]: file,
      [`${slot}Preview`]: url,
    }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, slot: 'primary' | 'secondary') => {
    e.preventDefault();
    setDragging(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) setSlot(slot, file);
  }, [setSlot]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, slot: 'primary' | 'secondary') => {
    const file = e.target.files?.[0];
    if (file) setSlot(slot, file);
  }, [setSlot]);

  const loadSample = useCallback(async (sampleUrl: string, slot: 'primary' | 'secondary') => {
    try {
      const name = sampleUrl.split('/').pop()!;
      const file = await urlToFile(sampleUrl, name);
      setSlot(slot, file);
    } catch { /* ignore */ }
  }, [setSlot]);

  const canStart = images.primary !== null && (modeConfig.slots === 1 || images.secondary !== null);

  const handleStart = async () => {
    if (!canStart || loading) return;
    setLoading(true);
    setError(null);
    try {
      const session = await uploadImages(mode, images.primary!, images.secondary ?? undefined);
      onSessionReady(session, images);
    } catch {
      // Fall back to mock when backend is offline
      const session = mockUpload(mode);
      onSessionReady(session, images);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-hud-bg">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,217,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.2) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Scan lines overlay */}
      <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,50,80,0.4) 0%, transparent 70%)' }}
      />

      {/* Corner brackets */}
      {[
        'top-4 left-4',
        'top-4 right-4 rotate-90',
        'bottom-4 left-4 -rotate-90',
        'bottom-4 right-4 rotate-180',
      ].map((cls, i) => (
        <div key={i} className={`absolute ${cls} w-8 h-8 pointer-events-none`}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M2 30 L2 2 L30 2" stroke="#00d9ff" strokeWidth="1.5" strokeOpacity="0.5"/>
          </svg>
        </div>
      ))}

      {/* Timestamp */}
      <div className="absolute top-6 right-12 font-mono text-[10px] text-hud-muted tracking-widest">
        {new Date().toISOString().substring(0, 19).replace('T', ' ')} UTC
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-3xl px-6"
      >
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-hud-cyan opacity-60" />
            <span className="font-mono text-[10px] text-hud-muted tracking-[0.3em]">REMOTE SENSING ANALYSIS CONSOLE</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-hud-cyan opacity-60" />
          </div>
          <h1
            className="font-mono text-5xl font-bold tracking-widest"
            style={{
              color: '#00d9ff',
              textShadow: '0 0 20px rgba(0,217,255,0.6), 0 0 60px rgba(0,217,255,0.2)',
            }}
          >
            SATQUERY<span className="text-hud-amber">·</span>AI
          </h1>
          <p className="font-mono text-[11px] text-hud-muted tracking-widest mt-1">
            NATURAL LANGUAGE SATELLITE IMAGE INTELLIGENCE
          </p>
        </div>

        {/* Mode selector */}
        <div className="w-full space-y-2">
          <div className="font-mono text-[9px] text-hud-muted tracking-widest text-center">SELECT ANALYSIS MODE</div>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => {
              const isActive = mode === m.key;
              return (
                <motion.button
                  key={m.key}
                  onClick={() => { setMode(m.key); setImages({ primary: null, secondary: null, primaryPreview: null, secondaryPreview: null }); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative flex flex-col items-center gap-2 p-4 rounded border transition-all"
                  style={{
                    borderColor: isActive ? m.color : '#1a2535',
                    background: isActive ? `${m.color}12` : 'rgba(0,0,0,0.4)',
                    boxShadow: isActive ? `0 0 20px ${m.color}30` : 'none',
                  }}
                >
                  <span style={{ color: isActive ? m.color : '#4a6080' }}>{m.icon}</span>
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: isActive ? m.color : '#6a7080' }}>
                    {m.label}
                  </span>
                  <span className="font-sans text-[10px] text-hud-muted/70 text-center leading-snug">{m.desc}</span>
                  {isActive && (
                    <motion.div layoutId="mode-active" className="absolute inset-0 rounded border"
                      style={{ borderColor: m.color }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Upload zones */}
        <div className={`w-full grid gap-3 ${modeConfig.slots === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {(modeConfig.slots === 2 ? ['primary', 'secondary'] as const : ['primary'] as const).map((slot) => {
            const isSecondary = slot === 'secondary';
            const preview = slot === 'primary' ? images.primaryPreview : images.secondaryPreview;
            const label = mode === 'bitemporal'
              ? (isSecondary ? 'T₁ AFTER IMAGE' : 'T₀ BEFORE IMAGE')
              : mode === 'crossmodal'
              ? (isSecondary ? 'SAR IMAGE' : 'OPTICAL IMAGE')
              : 'SATELLITE IMAGE';
            const inputRef = isSecondary ? p2Ref : p1Ref;
            const accentColor = isSecondary
              ? (mode === 'crossmodal' ? '#a855f7' : '#ffb020')
              : modeConfig.color;
            const sampleFile = isSecondary
              ? (mode === 'crossmodal' ? '/sample_sar.jpg' : '/sample_after.jpg')
              : (mode === 'crossmodal' ? '/sample_optical.jpg' : '/sample_before.jpg');

            return (
              <motion.div
                key={slot}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isSecondary ? 0.1 : 0 }}
                className="relative"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileInput(e, slot)}
                />
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(slot); }}
                  onDragLeave={() => setDragging(null)}
                  onDrop={(e) => handleDrop(e, slot)}
                  onClick={() => !preview && inputRef.current?.click()}
                  className="relative rounded border-2 border-dashed overflow-hidden transition-all cursor-pointer"
                  style={{
                    borderColor: dragging === slot ? accentColor : (preview ? `${accentColor}60` : '#1a2535'),
                    background: dragging === slot ? `${accentColor}08` : 'rgba(0,0,0,0.3)',
                    minHeight: '160px',
                  }}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt={slot} className="w-full h-40 object-cover" style={{ filter: 'brightness(0.85)' }} />
                      <div className="absolute inset-0 flex flex-col justify-end p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] tracking-widest" style={{ color: accentColor }}>{label}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                            className="font-mono text-[8px] text-hud-muted hover:text-hud-text px-2 py-0.5 border border-hud-border rounded"
                          >
                            CHANGE
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                      <Upload size={20} style={{ color: accentColor, opacity: 0.5 }} />
                      <div className="text-center">
                        <div className="font-mono text-[10px] tracking-widest" style={{ color: accentColor }}>{label}</div>
                        <div className="font-mono text-[9px] text-hud-muted mt-1">DROP IMAGE OR CLICK</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); loadSample(sampleFile, slot); }}
                        className="font-mono text-[9px] text-hud-muted hover:text-hud-cyan border border-hud-border hover:border-hud-cyan/30 px-2 py-1 rounded transition-all"
                      >
                        LOAD SAMPLE
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Start button */}
        <motion.button
          onClick={handleStart}
          disabled={!canStart || loading}
          whileHover={canStart && !loading ? { scale: 1.02 } : {}}
          whileTap={canStart && !loading ? { scale: 0.98 } : {}}
          className="flex items-center gap-3 px-8 py-3 border rounded font-mono text-sm tracking-widest transition-all"
          style={{
            borderColor: canStart && !loading ? '#00d9ff' : '#1a2535',
            color: canStart && !loading ? '#00d9ff' : '#2a3545',
            background: canStart && !loading ? 'rgba(0,217,255,0.08)' : 'transparent',
            boxShadow: canStart && !loading ? '0 0 30px rgba(0,217,255,0.15)' : 'none',
          }}
        >
          {loading ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Zap size={16} />
              </motion.div>
              INITIALIZING SESSION…
            </>
          ) : (
            <>
              <ArrowRight size={16} />
              INITIALIZE SESSION
            </>
          )}
        </motion.button>

        {/* Version */}
        <div className="font-mono text-[9px] text-hud-muted/40 tracking-widest">
          v1.0.0-DEMO · FRONTEND PROTOTYPE · NO REAL ML INFERENCE
        </div>
      </motion.div>
    </div>
  );
};
