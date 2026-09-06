import React, { useRef, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion, AnimatePresence } from 'framer-motion';
import { HudCornerDecorations } from '@/components/hud/HudCornerDecorations';
import type { SensorFilter, BoundingBox, ReticlePoint, ImageMetadata } from '@/lib/types';
import { randomInRange } from '@/lib/utils';

const LAND_CLASSES = ['built-up', 'vegetation', 'water body', 'bare soil', 'industrial', 'road', 'agricultural'];
const SENSOR_CLASS = {
  truecolor: '',
  grayscale:  'grayscale(100%) contrast(1.1)',
  ndvi:       'grayscale(100%) sepia(100%) hue-rotate(60deg) saturate(300%) contrast(120%)',
  ndwi:       'grayscale(100%) sepia(100%) hue-rotate(180deg) saturate(300%) contrast(120%)',
  heatmap:    'grayscale(100%) sepia(100%) hue-rotate(340deg) saturate(400%) contrast(130%)',
} as const;

interface Props {
  primarySrc: string;
  secondarySrc?: string;
  mode: 'single' | 'crossmodal' | 'bitemporal';
  sensorFilter: SensorFilter;
  bboxes: BoundingBox[];
  reticle: ReticlePoint | null;
  onReticlePlace: (pt: ReticlePoint) => void;
  metadata?: ImageMetadata;
  isScanning: boolean;
}

export const ImageViewer: React.FC<Props> = ({
  primarySrc, secondarySrc, mode, sensorFilter, bboxes, reticle, onReticlePlace, metadata, isScanning,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Draw bounding boxes on canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { naturalWidth: nw, naturalHeight: nh } = img;
    const { width: dw, height: dh } = img.getBoundingClientRect();
    canvas.width = dw;
    canvas.height = dh;
    ctx.clearRect(0, 0, dw, dh);

    const scaleX = dw / 100;
    const scaleY = dh / 100;

    bboxes.forEach((bb) => {
      const x = bb.x * scaleX;
      const y = bb.y * scaleY;
      const w = bb.w * scaleX;
      const h = bb.h * scaleY;

      // Box
      ctx.strokeStyle = '#00d9ff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      // Corner ticks
      const tick = 6;
      ctx.strokeStyle = '#00d9ffcc';
      ctx.lineWidth = 2;
      [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy]) => {
        const dx = cx === x ? 1 : -1;
        const dy = cy === y ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx*tick, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + dy*tick); ctx.stroke();
      });

      // Label pill
      ctx.font = '11px JetBrains Mono, monospace';
      const text = `${bb.label} ${bb.confidence}%`;
      const tw = ctx.measureText(text).width + 10;
      ctx.fillStyle = 'rgba(0,8,20,0.85)';
      ctx.fillRect(x, y - 18, tw, 16);
      ctx.fillStyle = '#00d9ff';
      ctx.fillText(text, x + 5, y - 5);
    });
  }, [bboxes, primarySrc]);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const lat = (metadata?.scene_center.lat ?? 28.61) + (py / 100 - 0.5) * 0.05;
    const lon = (metadata?.scene_center.lon ?? 77.21) + (px / 100 - 0.5) * 0.05;
    onReticlePlace({
      x: px, y: py,
      ndvi: +(randomInRange(0.05, 0.72)).toFixed(3),
      classLabel: LAND_CLASSES[Math.floor(Math.random() * LAND_CLASSES.length)],
      classConf: Math.floor(randomInRange(65, 97)),
      lat: +lat.toFixed(6), lon: +lon.toFixed(6),
    });
  }, [metadata, onReticlePlace]);

  const isPair = mode === 'crossmodal' || mode === 'bitemporal';

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      {isPair && secondarySrc ? (
        // Side-by-side split view for pair modes
        <div className="flex h-full">
          <div className="relative flex-1 overflow-hidden border-r border-hud-border">
            <span className="absolute top-3 left-3 z-20 font-mono text-[9px] text-hud-amber tracking-widest bg-black/60 px-2 py-1 border border-hud-amber/30 rounded">
              {mode === 'bitemporal' ? 'T₀ · BEFORE' : 'OPTICAL'}
            </span>
            <img
              src={primarySrc}
              alt="primary"
              className="w-full h-full object-cover"
              style={{ filter: SENSOR_CLASS[sensorFilter] }}
            />
          </div>
          <div className="relative flex-1 overflow-hidden">
            <span className="absolute top-3 left-3 z-20 font-mono text-[9px] text-hud-cyan tracking-widest bg-black/60 px-2 py-1 border border-hud-cyan/30 rounded">
              {mode === 'bitemporal' ? 'T₁ · AFTER' : 'SAR'}
            </span>
            <img
              src={secondarySrc}
              alt="secondary"
              className="w-full h-full object-cover"
              style={{ filter: sensorFilter === 'truecolor' ? 'grayscale(100%) contrast(1.1)' : SENSOR_CLASS[sensorFilter] }}
            />
          </div>
        </div>
      ) : (
        // Single image with pan/zoom
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={8}
          wheel={{ step: 0.1 }}
          panning={{ disabled: false }}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%' }}
          >
            <div className="relative w-full h-full" onClick={handleImageClick} style={{ cursor: 'crosshair' }}>
              <img
                ref={imgRef}
                src={primarySrc}
                alt="satellite"
                className="w-full h-full object-cover"
                style={{ filter: SENSOR_CLASS[sensorFilter] }}
                onLoad={() => { /* trigger canvas redraw */ }}
              />
              {/* BBox canvas overlay */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </TransformComponent>
        </TransformWrapper>
      )}

      {/* Reticle marker */}
      <AnimatePresence>
        {reticle && (
          <motion.div
            key="reticle"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute z-40 pointer-events-none"
            style={{ left: `${reticle.x}%`, top: `${reticle.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {/* Crosshair */}
            <svg width="32" height="32" viewBox="0 0 32 32" className="absolute -translate-x-1/2 -translate-y-1/2">
              <circle cx="16" cy="16" r="6" fill="none" stroke="#ffb020" strokeWidth="1.5" />
              <line x1="16" y1="0" x2="16" y2="9"  stroke="#ffb020" strokeWidth="1" />
              <line x1="16" y1="23" x2="16" y2="32" stroke="#ffb020" strokeWidth="1" />
              <line x1="0"  y1="16" x2="9"  y2="16" stroke="#ffb020" strokeWidth="1" />
              <line x1="23" y1="16" x2="32" y2="16" stroke="#ffb020" strokeWidth="1" />
            </svg>
            {/* Info card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-5 left-5 bg-black/90 border border-hud-amber/50 rounded p-2 w-44 font-mono text-[9px] leading-relaxed"
              style={{ boxShadow: '0 0 12px rgba(255,176,32,0.2)' }}
            >
              <div className="text-hud-amber tracking-widest mb-1">◈ PIXEL INSPECT</div>
              <div className="text-hud-muted">LAT <span className="text-hud-text">{reticle.lat.toFixed(5)}</span></div>
              <div className="text-hud-muted">LON <span className="text-hud-text">{reticle.lon.toFixed(5)}</span></div>
              <div className="text-hud-muted mt-1">NDVI <span className="text-hud-green font-bold">{reticle.ndvi}</span></div>
              <div className="text-hud-muted">CLASS <span className="text-hud-cyan">{reticle.classLabel}</span></div>
              <div className="text-hud-muted">CONF <span className="text-hud-text">{reticle.classConf}%</span></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none"
          >
            {/* Sweep line */}
            <div className="scan-sweep" />
            {/* Darkening */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Radar circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-24 h-24 rounded-full border border-hud-cyan/30"
                  style={{ boxShadow: '0 0 20px rgba(0,217,255,0.2)' }}
                >
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 60%, rgba(0,217,255,0.4) 100%)',
                    }}
                  />
                </motion.div>
                <div
                  className="absolute inset-0 rounded-full radar-ring"
                  style={{ border: '1px solid rgba(0,217,255,0.5)' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-[9px] text-hud-cyan tracking-widest animate-pulse">
                    ANALYZING
                  </span>
                </div>
              </div>
            </div>
            {/* Status text */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] text-hud-cyan tracking-widest opacity-70">
              <span className="animate-pulse">▶ RUNNING INFERENCE ENGINE…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD decorations on top */}
      <HudCornerDecorations metadata={metadata} />
    </div>
  );
};
