import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Crosshair,
  Sliders,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react';
import { HudCornerDecorations } from '@/components/hud/HudCornerDecorations';
import type { SensorFilter, BoundingBox, ReticlePoint, ImageMetadata, AnalysisMode } from '@/lib/types';
import { formatCoord } from '@/lib/utils';

const LAND_CLASSES = [
  'Built-Up Impervious Surface',
  'Dense Vegetation Canopy',
  'Open Surface Water',
  'Agricultural Land',
  'Transportation Infrastructure',
  'Industrial Facility',
  'Bare Soil / Sedimentary Bed',
];

const SENSOR_FILTERS: Record<SensorFilter, string> = {
  truecolor: 'none',
  grayscale: 'grayscale(100%) contrast(1.15)',
  ndvi: 'grayscale(100%) sepia(100%) hue-rotate(65deg) saturate(320%) contrast(1.25)',
  ndwi: 'grayscale(100%) sepia(100%) hue-rotate(185deg) saturate(320%) contrast(1.25)',
  heatmap: 'grayscale(100%) sepia(100%) hue-rotate(345deg) saturate(380%) contrast(1.35)',
};

interface Props {
  primarySrc: string;
  secondarySrc?: string;
  mode: AnalysisMode;
  sensorFilter: SensorFilter;
  bboxes: BoundingBox[];
  selectedBboxId: string | null;
  onSelectBbox: (boxId: string | null) => void;
  reticle: ReticlePoint | null;
  onReticlePlace: (pt: ReticlePoint) => void;
  onReticleClear: () => void;
  metadata?: ImageMetadata;
  isScanning: boolean;
  scanStepIndex?: number;
}

export const ImageViewer: React.FC<Props> = ({
  primarySrc,
  secondarySrc,
  mode,
  sensorFilter,
  bboxes,
  selectedBboxId,
  onSelectBbox,
  reticle,
  onReticlePlace,
  onReticleClear,
  metadata,
  isScanning,
  scanStepIndex = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const zoomPanRef = useRef<ReactZoomPanPinchRef>(null);

  const [mouseCoord, setMouseCoord] = useState<{ lat: number; lon: number; px: number; py: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showGraticule, setShowGraticule] = useState(true);
  const [layerOpacity, setLayerOpacity] = useState(1.0);
  const [isHoveringBbox, setIsHoveringBbox] = useState<string | null>(null);

  const isPair = (mode === 'crossmodal' || mode === 'bitemporal') && !!secondarySrc;

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Compute geographical coordinates from image relative coordinates
  const calculateGeoCoord = useCallback(
    (pctX: number, pctY: number) => {
      const centerLat = metadata?.scene_center.lat ?? 28.6139;
      const centerLon = metadata?.scene_center.lon ?? 77.2090;
      // 0.05 deg delta across the bounding envelope
      const lat = centerLat + (0.5 - pctY / 100) * 0.06;
      const lon = centerLon + (pctX / 100 - 0.5) * 0.06;
      return { lat, lon };
    },
    [metadata]
  );

  // Mouse move handler for live coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const py = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    const { lat, lon } = calculateGeoCoord(px, py);
    setMouseCoord({ lat, lon, px, py });
  };

  // Image click handler: drop inspection reticle
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicked on an interactive annotation button, don't drop reticle
    if ((e.target as HTMLElement).closest('[data-annotation]')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const { lat, lon } = calculateGeoCoord(px, py);

    // Calculate deterministic indices based on position
    const ndviVal = +(0.15 + 0.55 * Math.sin(px * 0.08) * Math.cos(py * 0.08)).toFixed(3);
    const ndwiVal = +(-0.25 + 0.45 * Math.cos(px * 0.05 + py * 0.05)).toFixed(3);
    const classIdx = Math.floor((px * 3 + py * 7) % LAND_CLASSES.length);
    const conf = Math.floor(75 + ((px + py) % 22));

    let changeState = 'Stable baseline surface';
    if (mode === 'bitemporal') {
      if (ndwiVal > 0.1) changeState = 'Water transition / Submerged';
      else if (ndviVal < 0.25) changeState = 'Canopy disturbance detected';
      else changeState = 'Stable unperturbed land cover';
    }

    onReticlePlace({
      x: px,
      y: py,
      ndvi: ndviVal,
      ndwi: ndwiVal,
      classLabel: LAND_CLASSES[classIdx],
      classConf: conf,
      lat: +lat.toFixed(6),
      lon: +lon.toFixed(6),
      changeState,
    });
  };

  const scanSteps = [
    'Task Classification & Lexical Parsing',
    'Ingesting Spectral Bands & Calibrating Radiometry',
    'Spatial Alignment & Co-Registration',
    'Feature Verification Against Reference Ontology',
    'Synthesizing Structured Analysis Report',
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#05080c] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouseCoord(null)}
    >
      {/* Floating Toolbar (Top-Right of viewer) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 p-1 bg-black/80 border border-hud-border/80 rounded backdrop-blur-md">
        <button
          onClick={() => zoomPanRef.current?.zoomIn(0.3)}
          title="Zoom In (+)"
          className="p-1.5 text-hud-muted hover:text-hud-cyan hover:bg-hud-cyan/10 rounded transition-colors"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => zoomPanRef.current?.zoomOut(0.3)}
          title="Zoom Out (-)"
          className="p-1.5 text-hud-muted hover:text-hud-cyan hover:bg-hud-cyan/10 rounded transition-colors"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => zoomPanRef.current?.resetTransform()}
          title="Reset Zoom (1:1)"
          className="p-1.5 text-hud-muted hover:text-hud-cyan hover:bg-hud-cyan/10 rounded transition-colors"
        >
          <RotateCcw size={14} />
        </button>
        <div className="w-px h-4 bg-hud-border" />
        <button
          onClick={() => setShowAnnotations((prev) => !prev)}
          title={showAnnotations ? 'Hide Annotations' : 'Show Annotations'}
          className={`p-1.5 rounded transition-colors ${
            showAnnotations ? 'text-hud-cyan bg-hud-cyan/10' : 'text-hud-muted hover:text-white'
          }`}
        >
          {showAnnotations ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          onClick={() => setShowGraticule((prev) => !prev)}
          title="Toggle Grid / Graticule"
          className={`p-1.5 rounded transition-colors ${
            showGraticule ? 'text-hud-cyan bg-hud-cyan/10' : 'text-hud-muted hover:text-white'
          }`}
        >
          <Crosshair size={14} />
        </button>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          className="p-1.5 text-hud-muted hover:text-hud-cyan hover:bg-hud-cyan/10 rounded transition-colors"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Layer Opacity Bar (Top-Left of viewer) */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 px-2.5 py-1.5 bg-black/80 border border-hud-border/80 rounded backdrop-blur-md text-[10px] font-mono text-hud-muted">
        <Sliders size={12} className="text-hud-cyan" />
        <span>OPACITY:</span>
        <input
          type="range"
          min="0.2"
          max="1.0"
          step="0.05"
          value={layerOpacity}
          onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
          className="w-16 accent-hud-cyan h-1 cursor-pointer"
        />
        <span className="w-7 text-right text-hud-cyan font-bold">{Math.round(layerOpacity * 100)}%</span>
      </div>

      {/* Main Image Rendering Area */}
      {isPair ? (
        // Split-view comparison for cross-modal and bi-temporal modes
        <div className="relative w-full h-full flex overflow-hidden">
          {/* Left panel: primary image */}
          <div className="relative flex-1 h-full overflow-hidden border-r border-hud-border">
            <div className="absolute top-12 left-3 z-20 font-mono text-[9px] text-hud-amber tracking-widest bg-black/80 px-2 py-0.5 border border-hud-amber/40 rounded">
              {mode === 'bitemporal' ? 'T0 · BASELINE PRE-EVENT' : 'OPTICAL MULTISPECTRAL'}
            </div>
            <div
              className="w-full h-full relative cursor-crosshair"
              onClick={handleImageClick}
              style={{ opacity: layerOpacity }}
            >
              <img
                src={primarySrc}
                alt="Primary Acquisition"
                className="w-full h-full object-cover"
                style={{ filter: SENSOR_FILTERS[sensorFilter] }}
              />
            </div>
          </div>

          {/* Right panel: secondary image */}
          <div className="relative flex-1 h-full overflow-hidden">
            <div className="absolute top-12 left-3 z-20 font-mono text-[9px] text-hud-cyan tracking-widest bg-black/80 px-2 py-0.5 border border-hud-cyan/40 rounded">
              {mode === 'bitemporal' ? 'T1 · POST-EVENT OBSERVATION' : 'C-BAND SAR BACKSCATTER'}
            </div>
            <div
              className="w-full h-full relative cursor-crosshair"
              onClick={handleImageClick}
              style={{ opacity: layerOpacity }}
            >
              <img
                src={secondarySrc}
                alt="Secondary Acquisition"
                className="w-full h-full object-cover"
                style={{
                  filter:
                    sensorFilter === 'truecolor'
                      ? 'grayscale(100%) contrast(1.15)'
                      : SENSOR_FILTERS[sensorFilter],
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        // Single Image Mode with Full Smooth Zoom and Pan
        <TransformWrapper
          ref={zoomPanRef}
          initialScale={1}
          minScale={0.6}
          maxScale={10}
          wheel={{ step: 0.12 }}
          panning={{ disabled: false }}
          doubleClick={{ mode: 'reset' }}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%' }}
          >
            <div
              ref={imgRef}
              onClick={handleImageClick}
              className="relative w-full h-full cursor-crosshair"
              style={{ opacity: layerOpacity }}
            >
              <img
                src={primarySrc}
                alt="Satellite Ingestion"
                className="w-full h-full object-cover"
                style={{ filter: SENSOR_FILTERS[sensorFilter] }}
              />

              {/* Bounding box annotations overlay */}
              {showAnnotations &&
                bboxes.map((bb, index) => {
                  const boxId = bb.id || `bbox-${index}`;
                  const isSelected = selectedBboxId === boxId;
                  const isHovered = isHoveringBbox === boxId;
                  const highlight = isSelected || isHovered;

                  return (
                    <div
                      key={boxId}
                      data-annotation="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBbox(isSelected ? null : boxId);
                      }}
                      onMouseEnter={() => setIsHoveringBbox(boxId)}
                      onMouseLeave={() => setIsHoveringBbox(null)}
                      className="absolute transition-all cursor-pointer group"
                      style={{
                        left: `${bb.x}%`,
                        top: `${bb.y}%`,
                        width: `${bb.w}%`,
                        height: `${bb.h}%`,
                        border: highlight ? '2px solid #00d9ff' : '1.5px dashed rgba(0, 217, 255, 0.75)',
                        backgroundColor: highlight ? 'rgba(0, 217, 255, 0.16)' : 'rgba(0, 217, 255, 0.04)',
                        boxShadow: highlight ? '0 0 15px rgba(0, 217, 255, 0.4)' : 'none',
                        zIndex: highlight ? 25 : 15,
                      }}
                    >
                      {/* Corner bracket ticks */}
                      <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-hud-cyan" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-hud-cyan" />
                      <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-hud-cyan" />
                      <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-hud-cyan" />

                      {/* Label badge */}
                      <div className="absolute -top-6 left-0 flex items-center gap-1 bg-black/90 border border-hud-cyan/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-hud-cyan whitespace-nowrap shadow-md">
                        <span className="font-bold">{bb.label}</span>
                        <span className="text-hud-muted text-[8px]">({bb.confidence}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </TransformComponent>
        </TransformWrapper>
      )}

      {/* Reticle inspection popover */}
      {reticle && (
        <div
          className="absolute z-40 pointer-events-none"
          style={{
            left: `${reticle.x}%`,
            top: `${reticle.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Target Reticle Ring */}
          <div className="relative flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" className="animate-spin-slow">
              <circle cx="18" cy="18" r="10" stroke="#ffb020" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
              <circle cx="18" cy="18" r="3" fill="#ffb020" />
              <line x1="18" y1="2" x2="18" y2="8" stroke="#ffb020" strokeWidth="1.5" />
              <line x1="18" y1="28" x2="18" y2="34" stroke="#ffb020" strokeWidth="1.5" />
              <line x1="2" y1="18" x2="8" y2="18" stroke="#ffb020" strokeWidth="1.5" />
              <line x1="28" y1="18" x2="34" y2="18" stroke="#ffb020" strokeWidth="1.5" />
            </svg>

            {/* Telemetry card */}
            <div
              className="absolute left-9 top-2 pointer-events-auto bg-black/95 border border-hud-amber rounded p-3 w-56 font-mono text-[10px] space-y-1.5 shadow-[0_0_20px_rgba(255,176,32,0.25)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-hud-border/70 pb-1">
                <span className="text-hud-amber font-bold flex items-center gap-1">
                  <MapPin size={10} />
                  <span>PIXEL INSPECTION</span>
                </span>
                <button
                  onClick={onReticleClear}
                  className="text-hud-muted hover:text-white transition-colors"
                  title="Close Inspector"
                >
                  <X size={11} />
                </button>
              </div>

              <div className="space-y-0.5 text-hud-muted text-[9px]">
                <div className="flex justify-between">
                  <span>LAT:</span>
                  <span className="text-hud-text font-bold">{formatCoord(reticle.lat, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>LON:</span>
                  <span className="text-hud-text font-bold">{formatCoord(reticle.lon, false)}</span>
                </div>
              </div>

              <div className="pt-1 border-t border-hud-border/50 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-hud-muted">CLASS:</span>
                  <span className="text-hud-cyan font-bold truncate max-w-[120px]">{reticle.classLabel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-hud-muted">CERTAINTY:</span>
                  <span className="text-hud-green font-bold">{reticle.classConf}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-hud-muted">NDVI:</span>
                  <span className="text-hud-text font-bold">{reticle.ndvi}</span>
                </div>
                {reticle.ndwi !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-hud-muted">NDWI:</span>
                    <span className="text-hud-text font-bold">{reticle.ndwi}</span>
                  </div>
                )}
                {reticle.changeState && (
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-hud-muted">STATUS:</span>
                    <span className="text-hud-amber text-[8px] font-bold">{reticle.changeState}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanning Radar and Multi-Stage Progress Overlay */}
      {isScanning && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4">
          <div className="scan-sweep" />

          {/* Technical radar target */}
          <div className="relative flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border border-hud-cyan/40 flex items-center justify-center animate-spin-slow">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 65%, rgba(0,217,255,0.35) 100%)',
                }}
              />
            </div>
            <div className="absolute w-20 h-20 rounded-full border border-hud-cyan/60 animate-ping opacity-30" />
            <div className="absolute flex flex-col items-center text-center">
              <Sparkles size={16} className="text-hud-cyan animate-pulse" />
              <span className="font-mono text-[9px] text-hud-cyan font-bold tracking-widest mt-1">
                INFERENCE
              </span>
            </div>
          </div>

          {/* Progress sequence description */}
          <div className="max-w-md w-full px-6 text-center space-y-2">
            <div className="font-mono text-xs text-hud-cyan tracking-wider font-semibold">
              RUNNING GEOSPATIAL ANALYSIS
            </div>
            <div className="font-mono text-[10px] text-hud-muted">
              Step {scanStepIndex + 1} of 5: {scanSteps[scanStepIndex] || scanSteps[0]}
            </div>
            <div className="w-full bg-hud-border/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-hud-cyan transition-all duration-300"
                style={{ width: `${((scanStepIndex + 1) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Graticule / HUD decorations */}
      {showGraticule && <HudCornerDecorations metadata={metadata} />}

      {/* Real-time Cursor Coordinates Bar (Bottom-Left) */}
      {mouseCoord && (
        <div className="absolute bottom-3 left-3 z-30 pointer-events-none bg-black/85 border border-hud-border/80 px-2.5 py-1 rounded font-mono text-[9px] text-hud-muted flex items-center gap-3">
          <span>
            LAT: <strong className="text-hud-text">{formatCoord(mouseCoord.lat, true)}</strong>
          </span>
          <span>
            LON: <strong className="text-hud-text">{formatCoord(mouseCoord.lon, false)}</strong>
          </span>
          <span className="text-hud-muted/50">
            PX: {Math.round(mouseCoord.px)}% PY: {Math.round(mouseCoord.py)}%
          </span>
        </div>
      )}
    </div>
  );
};
