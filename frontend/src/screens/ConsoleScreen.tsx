import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, RotateCcw, AlertCircle } from 'lucide-react';
import { ImageViewer } from '@/components/viewer/ImageViewer';
import { QueryCommandBar } from '@/components/query/QueryCommandBar';
import { ResultsPanel } from '@/components/panels/ResultsPanel';
import { SensorToggleRow } from '@/components/hud/SensorToggleRow';
import { TopModeBar } from '@/components/hud/TopModeBar';
import type {
  Session,
  UploadedImages,
  SensorFilter,
  QueryResult,
  ReticlePoint,
  BoundingBox,
  AnalysisMode,
  SampleDataset,
} from '@/lib/types';
import { submitQuery, mockQuery, healthCheck, BUNDLED_SAMPLES, mockUpload } from '@/lib/api';

interface Props {
  session: Session;
  images: UploadedImages;
  onNewSession: () => void;
  onSessionUpdate?: (session: Session, images: UploadedImages) => void;
}

export const ConsoleScreen: React.FC<Props> = ({
  session: initialSession,
  images: initialImages,
  onNewSession,
  onSessionUpdate,
}) => {
  const [session, setSession] = useState<Session>(initialSession);
  const [images, setImages] = useState<UploadedImages>(initialImages);
  const [sensorFilter, setSensorFilter] = useState<SensorFilter>('truecolor');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [reticle, setReticle] = useState<ReticlePoint | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [bboxes, setBboxes] = useState<BoundingBox[]>([]);
  const [selectedBboxId, setSelectedBboxId] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prefilledQuery, setPrefilledQuery] = useState<string>('');

  // Check backend health on mount and periodically
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const ok = await healthCheck();
      if (mounted) setBackendOnline(ok);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcut listener: [1]-[5] for spectral filters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === '1') setSensorFilter('truecolor');
      else if (e.key === '2') setSensorFilter('grayscale');
      else if (e.key === '3') setSensorFilter('ndvi');
      else if (e.key === '4') setSensorFilter('ndwi');
      else if (e.key === '5') setSensorFilter('heatmap');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Query Execution Handler
  const handleQuery = useCallback(
    async (queryText: string) => {
      setIsLoading(true);
      setErrorMessage(null);
      setSelectedBboxId(null);
      setScanStepIndex(0);
      setQueryHistory((prev) => [queryText, ...prev.filter((q) => q !== queryText)].slice(0, 8));

      // Advance scan step stages
      const stepTimer1 = setTimeout(() => setScanStepIndex(1), 200);
      const stepTimer2 = setTimeout(() => setScanStepIndex(2), 400);
      const stepTimer3 = setTimeout(() => setScanStepIndex(3), 600);
      const stepTimer4 = setTimeout(() => setScanStepIndex(4), 800);

      try {
        let queryRes: QueryResult;
        if (backendOnline) {
          try {
            queryRes = await submitQuery(session.session_id, queryText);
          } catch {
            // Fallback to deterministic client mock if request fails
            queryRes = mockQuery(queryText, session.mode);
          }
        } else {
          // Client simulation delay
          await new Promise((r) => setTimeout(r, 700));
          queryRes = mockQuery(queryText, session.mode);
        }

        setResult(queryRes);
        setBboxes(queryRes.bounding_boxes || []);
        setPanelOpen(true);
      } catch (_err) {
        setErrorMessage('Failed to execute query analysis. Please check input and retry.');
      } finally {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        clearTimeout(stepTimer3);
        clearTimeout(stepTimer4);
        setIsLoading(false);
      }
    },
    [backendOnline, session.session_id, session.mode]
  );

  // Switch to a bundled reference dataset
  const handleSelectSample = useCallback(
    (sample: SampleDataset) => {
      const newSession = mockUpload(sample.mode, sample);
      const newImages: UploadedImages = {
        primary: null,
        secondary: null,
        primaryPreview: sample.file1,
        secondaryPreview: sample.file2 || null,
      };
      setSession(newSession);
      setImages(newImages);
      setResult(null);
      setBboxes([]);
      setSelectedBboxId(null);
      setReticle(null);
      setErrorMessage(null);
      onSessionUpdate?.(newSession, newImages);
    },
    [onSessionUpdate]
  );

  // Switch analysis mode
  const handleModeChange = useCallback(
    (newMode: AnalysisMode) => {
      const matchingSample = BUNDLED_SAMPLES.find((s) => s.mode === newMode) || BUNDLED_SAMPLES[0];
      handleSelectSample(matchingSample);
    },
    [handleSelectSample]
  );

  // Reset current analysis
  const handleResetAnalysis = () => {
    setResult(null);
    setBboxes([]);
    setSelectedBboxId(null);
    setReticle(null);
    setErrorMessage(null);
  };

  const primarySrc = images.primaryPreview || '/sample_optical.jpg';
  const secondaryPreview =
    images.secondaryPreview ||
    (session.mode === 'crossmodal'
      ? '/sample_sar.jpg'
      : session.mode === 'bitemporal'
      ? '/sample_after.jpg'
      : undefined);

  return (
    <div className="relative w-full h-full flex flex-col bg-hud-bg overflow-hidden text-hud-text select-none">
      {/* Top Navigation & Status Bar */}
      <TopModeBar
        mode={session.mode}
        metadata={session.metadata}
        backendOnline={backendOnline}
        onUploadClick={onNewSession}
        onSelectSample={handleSelectSample}
        onModeChange={handleModeChange}
      />

      {/* Main Workspace Area (Viewer + Sliding Results Panel) */}
      <div className="relative flex-1 overflow-hidden">
        {/* ImageViewer fills available area with responsive margin when panel is open */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{ right: panelOpen ? '384px' : '0' }}
        >
          <ImageViewer
            primarySrc={primarySrc}
            secondarySrc={secondaryPreview}
            mode={session.mode}
            sensorFilter={sensorFilter}
            bboxes={bboxes}
            selectedBboxId={selectedBboxId}
            onSelectBbox={setSelectedBboxId}
            reticle={reticle}
            onReticlePlace={setReticle}
            onReticleClear={() => setReticle(null)}
            metadata={session.metadata}
            isScanning={isLoading}
            scanStepIndex={scanStepIndex}
          />
        </div>

        {/* Results Panel */}
        <ResultsPanel
          result={result}
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          metadata={session.metadata}
          selectedBboxId={selectedBboxId}
          onSelectBbox={setSelectedBboxId}
          onQuerySelect={(sq) => setPrefilledQuery(sq)}
        />

        {/* Panel toggle tab (when panel is collapsed) */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute top-1/2 right-0 -translate-y-1/2 z-40 flex items-center gap-1.5 pl-2 pr-1.5 py-4 bg-hud-panel border border-hud-border border-r-0 rounded-l font-mono text-[10px] text-hud-cyan tracking-wider hover:bg-black transition-all shadow-[-4px_0_15px_rgba(0,0,0,0.5)]"
            title="Open Results Drawer"
          >
            <ChevronLeft size={13} />
            <span className="rotate-90 whitespace-nowrap font-bold">
              {result ? 'ANALYSIS RESULTS' : 'RESULTS'}
            </span>
          </button>
        )}
      </div>

      {/* Bottom Command Center */}
      <div className="shrink-0 border-t border-hud-border bg-black/90 backdrop-blur-md px-4 py-2.5 space-y-2 z-30">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="p-2 border border-hud-red/40 bg-hud-red/10 rounded flex items-center justify-between text-xs font-mono text-hud-red">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[10px] underline hover:text-white"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Toolbar: Sensor Toggles + Reset Button + Recent Query Hints */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SensorToggleRow active={sensorFilter} onChange={setSensorFilter} />

          <div className="flex items-center gap-2 font-mono text-[10px]">
            {result && (
              <button
                onClick={handleResetAnalysis}
                className="flex items-center gap-1 px-2.5 py-1 border border-hud-border hover:border-hud-cyan/50 rounded text-hud-muted hover:text-white transition-colors"
                title="Reset current query and results"
              >
                <RotateCcw size={11} />
                <span>RESET RESULTS</span>
              </button>
            )}

            {queryHistory.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-hud-muted">
                <span className="text-hud-muted/50">LAST:</span>
                <button
                  onClick={() => setPrefilledQuery(queryHistory[0])}
                  className="text-hud-text hover:text-hud-cyan truncate max-w-[200px] text-left underline underline-offset-2"
                  title="Click to load into command bar"
                >
                  {queryHistory[0]}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Natural Language Command Bar */}
        <QueryCommandBar
          onSubmit={handleQuery}
          isLoading={isLoading}
          disabled={false}
          externalQuery={prefilledQuery}
        />
      </div>
    </div>
  );
};
