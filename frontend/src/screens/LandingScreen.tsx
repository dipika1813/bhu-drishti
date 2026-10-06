import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  Image as ImageIcon,
  GitCompare,
  Radio,
  ArrowRight,
  Layers,
  Terminal,
  Activity,
  AlertCircle,
} from 'lucide-react';
import type { AnalysisMode, Session, UploadedImages, SampleDataset } from '@/lib/types';
import { uploadImages, mockUpload, BUNDLED_SAMPLES } from '@/lib/api';

interface Props {
  onSessionReady: (session: Session, images: UploadedImages) => void;
}

const MODES: {
  key: AnalysisMode;
  label: string;
  tag: string;
  desc: string;
  slots: number;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    key: 'single',
    label: 'Single Image',
    tag: 'SINGLE SCENE',
    desc: 'Analyze a single optical or SAR scene using natural-language queries.',
    slots: 1,
    icon: <ImageIcon size={18} />,
    color: '#00d9ff',
  },
  {
    key: 'crossmodal',
    label: 'Optical + SAR',
    tag: 'CROSS-MODAL',
    desc: 'Fuse optical multispectral imagery with Synthetic Aperture Radar backscatter.',
    slots: 2,
    icon: <Radio size={18} />,
    color: '#38bdf8', // Clean sky blue, strictly avoiding purple
  },
  {
    key: 'bitemporal',
    label: 'Bi-Temporal',
    tag: 'CHANGE DETECTION',
    desc: 'Compare before and after acquisitions to detect land-cover transitions and floods.',
    slots: 2,
    icon: <GitCompare size={18} />,
    color: '#ffb020',
  },
];

async function urlToFile(url: string, name: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

export const LandingScreen: React.FC<Props> = ({ onSessionReady }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AnalysisMode>('single');
  const [images, setImages] = useState<UploadedImages>({
    primary: null,
    secondary: null,
    primaryPreview: null,
    secondaryPreview: null,
  });
  const [dragging, setDragging] = useState<'primary' | 'secondary' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleDataset | null>(null);

  const p1Ref = useRef<HTMLInputElement>(null);
  const p2Ref = useRef<HTMLInputElement>(null);

  const modeConfig = MODES.find((m) => m.key === mode)!;

  const setSlot = useCallback((slot: 'primary' | 'secondary', file: File) => {
    // Validate file size: 25MB max
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File exceeds maximum supported size (25MB limit).');
      return;
    }
    const url = URL.createObjectURL(file);
setImages((prev: UploadedImages) => ({
        ...prev,
      [slot]: file,
      [`${slot}Preview`]: url,
    }));
    setErrorMessage(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, slot: 'primary' | 'secondary') => {
      e.preventDefault();
      setDragging(null);
      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|tif|tiff|webp)$/i))) {
        setSlot(slot, file);
      } else {
        setErrorMessage('Unsupported file format. Please upload JPEG, PNG, TIFF, or WebP.');
      }
    },
    [setSlot]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, slot: 'primary' | 'secondary') => {
      const file = e.target.files?.[0];
      if (file) setSlot(slot, file);
    },
    [setSlot]
  );

  const loadPresetSample = useCallback(
    async (sample: SampleDataset) => {
      setLoading(true);
      setErrorMessage(null);
      setSelectedSample(sample);
      setMode(sample.mode);
      try {
        const file1 = await urlToFile(sample.file1, `${sample.id}-primary.jpg`);
        const p1Url = sample.file1;
        let file2: File | null = null;
        let p2Url: string | null = null;

        if (sample.file2) {
          file2 = await urlToFile(sample.file2, `${sample.id}-secondary.jpg`);
          p2Url = sample.file2;
        }

        const newImgs: UploadedImages = {
          primary: file1,
          secondary: file2,
          primaryPreview: p1Url,
          secondaryPreview: p2Url,
        };
        setImages(newImgs);

        // Try upload to backend or fallback
        try {
          const session = await uploadImages(sample.mode, file1, file2 ?? undefined);
          onSessionReady(session, newImgs);
        } catch {
          const session = mockUpload(sample.mode, sample);
          onSessionReady(session, newImgs);
        }
        navigate('/console');
      } catch (_err) {
        setErrorMessage('Failed to load sample dataset imagery.');
      } finally {
        setLoading(false);
      }
    },
    [navigate, onSessionReady]
  );

  const canStart = images.primary !== null && (modeConfig.slots === 1 || images.secondary !== null);

  const handleStart = async () => {
    if (!canStart || loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const session = await uploadImages(mode, images.primary!, images.secondary ?? undefined);
      onSessionReady(session, images);
      navigate('/console');
    } catch {
      // Fall back to client-side mock when backend is unreachable
      const session = mockUpload(mode, selectedSample ?? undefined);
      onSessionReady(session, images);
      navigate('/console');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectConsoleLaunch = () => {
    // Quick launch using the first preset sample
    loadPresetSample(BUNDLED_SAMPLES[0]);
  };

  return (
    <div className="min-h-screen w-full bg-hud-bg text-hud-text font-sans flex flex-col justify-between selection:bg-hud-cyan/20 selection:text-hud-cyan relative">
      {/* Background technical grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,217,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.15) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top Header */}
      <header className="relative z-20 border-b border-hud-border bg-black/60 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 border border-hud-cyan/80 rotate-45 flex items-center justify-center"
            style={{ boxShadow: '0 0 10px rgba(0,217,255,0.3)' }}
          >
            <div className="w-2.5 h-2.5 bg-hud-cyan" />
          </div>
          <div>
            <span className="font-mono text-sm tracking-widest text-hud-cyan font-bold">BHUDRISHTI</span>
            <span className="hidden sm:inline-block ml-3 font-mono text-[10px] text-hud-muted tracking-wider">
              GEOSPATIAL INTELLIGENCE PLATFORM
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-5 text-xs font-mono">
          <div className="hidden md:flex items-center gap-2 text-hud-muted">
            <span className="inline-block w-2 h-2 rounded-full bg-hud-green animate-pulse" />
            <span className="text-[10px] tracking-wider text-hud-green">SYSTEM READY</span>
          </div>
          <button
            onClick={handleDirectConsoleLaunch}
            className="flex items-center gap-2 px-3 py-1.5 border border-hud-cyan bg-hud-cyan/10 hover:bg-hud-cyan/20 text-hud-cyan text-xs font-mono tracking-wider rounded transition-all"
          >
            <Terminal size={13} />
            <span>OPEN CONSOLE</span>
          </button>
          <Link to="/privacy" className="text-hud-muted hover:text-hud-text transition-colors">
            PRIVACY
          </Link>
          <Link to="/terms" className="text-hud-muted hover:text-hud-text transition-colors">
            TERMS
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 w-full flex-1 flex flex-col gap-10">
        {/* Headline & Mission */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-hud-cyan/30 bg-hud-cyan/5 rounded text-[11px] font-mono text-hud-cyan tracking-wider">
            <Layers size={13} />
            <span>NATURAL LANGUAGE SATELLITE IMAGE INTELLIGENCE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-white leading-tight">
            Geospatial Remote Sensing <span className="text-hud-cyan">Analysis Console</span>
          </h1>

          <p className="text-sm sm:text-base text-hud-text/80 leading-relaxed max-w-2xl mx-auto">
            Analyze satellite imagery using natural-language queries. Inspect optical and radar scenes, compare
            bi-temporal acquisitions to identify surface changes, and localize detected features directly on the imagery.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDirectConsoleLaunch}
              className="flex items-center gap-2 px-6 py-3 border border-hud-cyan bg-hud-cyan text-black font-mono font-semibold text-xs tracking-widest rounded hover:bg-hud-cyan/90 transition-all shadow-[0_0_20px_rgba(0,217,255,0.25)]"
            >
              <span>OPEN ANALYSIS CONSOLE</span>
              <ArrowRight size={14} />
            </button>
            <a
              href="#workspace-setup"
              className="flex items-center gap-2 px-5 py-3 border border-hud-border bg-black/40 hover:border-hud-cyan/40 text-hud-text font-mono text-xs tracking-widest rounded transition-colors"
            >
              <span>CONFIGURE DATASET</span>
            </a>
          </div>

          <p className="text-[11px] font-mono text-hud-muted/70 tracking-wide">
            Designed for remote-sensing analysts, GIS teams, environmental monitoring, and urban infrastructure assessment.
          </p>
        </div>

        {/* Feature Pillars: Concrete and Anti-AI-Slop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 border border-hud-border bg-black/40 rounded space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-hud-cyan font-bold tracking-wider">
              <ImageIcon size={16} />
              <span>SINGLE SCENE VQA</span>
            </div>
            <p className="text-xs text-hud-text/90 leading-relaxed">
              Ingest high-resolution optical or SAR scenes. Ask natural-language questions about structural density,
              roadway connectivity, land-use classification, and vegetation vitality.
            </p>
          </div>

          <div className="p-5 border border-hud-border bg-black/40 rounded space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-hud-amber font-bold tracking-wider">
              <GitCompare size={16} />
              <span>BI-TEMPORAL CHANGE</span>
            </div>
            <p className="text-xs text-hud-text/90 leading-relaxed">
              Compare paired before and after acquisition dates. Quantify surface water expansion during flood events,
              measure vegetation canopy loss, and delineate new construction boundaries.
            </p>
          </div>

          <div className="p-5 border border-hud-border bg-black/40 rounded space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-sky-400 font-bold tracking-wider">
              <Radio size={16} />
              <span>OPTICAL + SAR FUSION</span>
            </div>
            <p className="text-xs text-hud-text/90 leading-relaxed">
              Co-register optical multispectral rasters with Synthetic Aperture Radar (SAR) backscatter to penetrate
              cloud obscuration and disambiguate smooth water from building facade double-bounce.
            </p>
          </div>
        </div>

        {/* Workspace Initialization Setup */}
        <section id="workspace-setup" className="border border-hud-border bg-black/50 rounded p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hud-border pb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-hud-cyan tracking-wider font-semibold">
                <Terminal size={14} />
                <span>WORKSPACE INITIALIZATION</span>
              </div>
              <p className="text-xs text-hud-muted mt-1">
                Select an analysis mode, load a reference dataset, or upload custom imagery to initialize your session.
              </p>
            </div>
            <div className="font-mono text-[10px] text-hud-muted px-2.5 py-1 border border-hud-border rounded">
              STEP 1 OF 2: SESSION CONFIG
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="space-y-2">
            <div className="font-mono text-[10px] text-hud-muted tracking-widest uppercase">
              Option A: Load Bundled Reference Datasets
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {BUNDLED_SAMPLES.map((sample) => {
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => loadPresetSample(sample)}
                    disabled={loading}
                    className={`text-left p-3 border rounded transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-hud-cyan bg-hud-cyan/10'
                        : 'border-hud-border bg-black/40 hover:border-hud-border/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-hud-cyan mb-1">
                        <span className="uppercase tracking-wider">{sample.mode}</span>
                        <span className="text-hud-muted">{sample.sensor.split(' ')[0]}</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-white">{sample.title}</div>
                      <p className="text-[11px] text-hud-muted line-clamp-2 mt-1 leading-snug">
                        {sample.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-hud-border/40 text-[10px] font-mono text-hud-cyan">
                      <span>{sample.location.city}</span>
                      <span className="inline-flex items-center gap-1">LOAD PRESET →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2 pt-2">
            <div className="font-mono text-[10px] text-hud-muted tracking-widest uppercase">
              Option B: Custom Upload by Analysis Mode
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MODES.map((m) => {
                const isActive = mode === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => {
                      setMode(m.key);
                      setSelectedSample(null);
                      setImages({ primary: null, secondary: null, primaryPreview: null, secondaryPreview: null });
                      setErrorMessage(null);
                    }}
                    className={`p-3.5 border rounded text-left transition-all ${
                      isActive
                        ? 'border-hud-cyan bg-hud-cyan/10 shadow-[0_0_15px_rgba(0,217,255,0.15)]'
                        : 'border-hud-border bg-black/40 hover:border-hud-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ color: isActive ? m.color : '#4a6080' }}>{m.icon}</span>
                      <span
                        className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 border rounded"
                        style={{ borderColor: isActive ? m.color : '#1a2535', color: isActive ? m.color : '#4a6080' }}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-white">{m.label}</div>
                    <p className="text-[11px] text-hud-muted mt-1 leading-snug">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Dropzones */}
          <div className={`grid gap-4 ${modeConfig.slots === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {(modeConfig.slots === 2 ? (['primary', 'secondary'] as const) : (['primary'] as const)).map((slot) => {
              const isSecondary = slot === 'secondary';
              const preview = slot === 'primary' ? images.primaryPreview : images.secondaryPreview;
              const label =
                mode === 'bitemporal'
                  ? isSecondary
                    ? 'T1 AFTER ACQUISITION'
                    : 'T0 BEFORE BASELINE'
                  : mode === 'crossmodal'
                  ? isSecondary
                    ? 'C-BAND SAR RADAR RASTER'
                    : 'OPTICAL MULTISPECTRAL RASTER'
                  : 'PRIMARY SATELLITE SCENE';

              const inputRef = isSecondary ? p2Ref : p1Ref;
              const accentColor = isSecondary
                ? mode === 'crossmodal'
                  ? '#38bdf8'
                  : '#ffb020'
                : modeConfig.color;

              return (
                <div key={slot} className="relative">
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/tiff,image/webp,.tif,.tiff"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, slot)}
                  />
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(slot);
                    }}
                    onDragLeave={() => setDragging(null)}
                    onDrop={(e) => handleDrop(e, slot)}
                    onClick={() => !preview && inputRef.current?.click()}
                    className="relative rounded border-2 border-dashed overflow-hidden transition-all cursor-pointer min-h-[160px] flex flex-col items-center justify-center p-4"
                    style={{
                      borderColor: dragging === slot ? accentColor : preview ? `${accentColor}80` : '#1a2535',
                      background: dragging === slot ? `${accentColor}08` : 'rgba(0,0,0,0.35)',
                    }}
                  >
                    {preview ? (
                      <div className="relative w-full h-full min-h-[140px] flex flex-col justify-between">
                        <img
                          src={preview}
                          alt={slot}
                          className="w-full h-32 object-cover rounded border border-hud-border"
                        />
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-mono text-[10px] tracking-wider font-semibold" style={{ color: accentColor }}>
                            {label}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              inputRef.current?.click();
                            }}
                            className="font-mono text-[9px] text-hud-muted hover:text-white px-2 py-0.5 border border-hud-border rounded"
                          >
                            CHANGE FILE
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center gap-2">
                        <Upload size={22} style={{ color: accentColor, opacity: 0.7 }} />
                        <div className="font-mono text-[11px] font-semibold tracking-wider text-white">
                          {label}
                        </div>
                        <div className="font-mono text-[9px] text-hud-muted">
                          DRAG & DROP IMAGE OR CLICK TO BROWSE (MAX 25MB)
                        </div>
                        <div className="text-[10px] text-hud-muted/70">
                          Supports JPEG, PNG, GeoTIFF, WebP
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 border border-hud-red/40 bg-hud-red/10 rounded flex items-center gap-2 text-xs font-mono text-hud-red">
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-hud-border">
            <div className="text-xs font-mono text-hud-muted flex items-center gap-2">
              <Activity size={13} className="text-hud-cyan" />
              <span>
                {canStart
                  ? 'All required rasters loaded. Ready to initialize workspace.'
                  : `Please load ${modeConfig.slots === 2 ? 'both images' : 'one image'} to begin.`}
              </span>
            </div>

            <button
              onClick={handleStart}
              disabled={!canStart || loading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded font-mono text-xs tracking-widest uppercase transition-all ${
                canStart && !loading
                  ? 'border border-hud-cyan bg-hud-cyan/15 text-hud-cyan hover:bg-hud-cyan/25 shadow-[0_0_15px_rgba(0,217,255,0.2)]'
                  : 'border border-hud-border bg-transparent text-hud-muted cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-hud-cyan border-t-transparent rounded-full animate-spin" />
                  <span>INITIALIZING...</span>
                </>
              ) : (
                <>
                  <span>INITIALIZE WORKSPACE</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Technical Architecture Overview */}
        <section className="space-y-4 border-t border-hud-border pt-8">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-mono font-semibold text-white">System Architecture & Capabilities</h2>
            <p className="text-xs text-hud-muted">
              Built strictly for spatial remote sensing analysts with zero artificial marketing claims.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 border border-hud-border bg-black/30 rounded space-y-1">
              <div className="text-hud-cyan font-semibold">COGNITIVE ROUTER</div>
              <p className="text-hud-muted text-[11px] leading-relaxed">
                Categorizes incoming natural-language prompts into task-specific execution graphs.
              </p>
            </div>
            <div className="p-3 border border-hud-border bg-black/30 rounded space-y-1">
              <div className="text-hud-amber font-semibold">SPECTRAL SYNTHESIS</div>
              <p className="text-hud-muted text-[11px] leading-relaxed">
                Applies NDVI, NDWI, and delta change transforms across multi-band acquisitions.
              </p>
            </div>
            <div className="p-3 border border-hud-border bg-black/30 rounded space-y-1">
              <div className="text-sky-400 font-semibold">SPATIAL GROUNDING</div>
              <p className="text-hud-muted text-[11px] leading-relaxed">
                Extracts oriented bounding regions and links visual detections to telemetry records.
              </p>
            </div>
            <div className="p-3 border border-hud-border bg-black/30 rounded space-y-1">
              <div className="text-hud-green font-semibold">DETERMINISTIC TRACE</div>
              <p className="text-hud-muted text-[11px] leading-relaxed">
                Every calculation produces a verifiable execution trace for transparency and auditing.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hud-border bg-black/80 px-6 py-6 text-xs font-mono text-hud-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-hud-cyan" />
            <span className="text-white font-semibold">BhuDrishti Geospatial Intelligence Engine</span>
            <span className="text-hud-muted/60">· v1.0.0</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/console" className="hover:text-hud-cyan transition-colors">
              CONSOLE
            </Link>
            <Link to="/privacy" className="hover:text-hud-cyan transition-colors">
              PRIVACY POLICY
            </Link>
            <Link to="/terms" className="hover:text-hud-cyan transition-colors">
              TERMS OF SERVICE
            </Link>
            <a
              href="https://github.com/dipika1813/bhu-drishti"
              target="_blank"
              rel="noreferrer"
              className="hover:text-hud-cyan transition-colors"
            >
              GITHUB
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
