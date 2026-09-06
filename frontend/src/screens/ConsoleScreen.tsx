import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ImageViewer } from '@/components/viewer/ImageViewer';
import { QueryCommandBar } from '@/components/query/QueryCommandBar';
import { ResultsPanel } from '@/components/panels/ResultsPanel';
import { SensorToggleRow } from '@/components/hud/SensorToggleRow';
import { TopModeBar } from '@/components/hud/TopModeBar';
import type { Session, UploadedImages, SensorFilter, QueryResult, ReticlePoint, BoundingBox } from '@/lib/types';
import { submitQuery, mockQuery } from '@/lib/api';

interface Props {
  session: Session;
  images: UploadedImages;
  onNewSession: () => void;
}

export const ConsoleScreen: React.FC<Props> = ({ session, images, onNewSession }) => {
  const [sensorFilter, setSensorFilter] = useState<SensorFilter>('truecolor');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reticle, setReticle] = useState<ReticlePoint | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [bboxes, setBboxes] = useState<BoundingBox[]>([]);

  const handleQuery = useCallback(async (query: string) => {
    setIsLoading(true);
    setQueryHistory((prev) => [query, ...prev].slice(0, 10));
    try {
      const res = await submitQuery(session.session_id, query);
      setResult(res);
      setBboxes(res.bounding_boxes ?? []);
      setPanelOpen(true);
    } catch {
      // Backend offline — use mock
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));
      const res = mockQuery();
      setResult(res);
      setBboxes(res.bounding_boxes ?? []);
      setPanelOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [session.session_id]);

  const primarySrc = images.primaryPreview ?? '/sample_optical.jpg';
  const secondaryPreview = images.secondaryPreview ??
    (session.mode === 'crossmodal' ? '/sample_sar.jpg' :
     session.mode === 'bitemporal' ? '/sample_after.jpg' : undefined);

  return (
    <div className="relative w-full h-full flex flex-col bg-hud-bg overflow-hidden">
      {/* Top bar */}
      <TopModeBar mode={session.mode} metadata={session.metadata} onUploadClick={onNewSession} />

      {/* Main area: viewer + collapsed/open results panel */}
      <div className="relative flex-1 overflow-hidden">
        {/* Viewer fills the area */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{ right: panelOpen ? '320px' : '0' }}
        >
          <ImageViewer
            primarySrc={primarySrc}
            secondarySrc={secondaryPreview ?? undefined}
            mode={session.mode}
            sensorFilter={sensorFilter}
            bboxes={bboxes}
            reticle={reticle}
            onReticlePlace={setReticle}
            metadata={session.metadata}
            isScanning={isLoading}
          />
        </div>

        {/* Results panel */}
        <ResultsPanel
          result={result}
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
        />

        {/* Panel toggle tab (when panel is closed and there's a result) */}
        {result && !panelOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setPanelOpen(true)}
            className="absolute top-1/2 right-0 -translate-y-1/2 z-40 flex items-center gap-1 pl-2 pr-1 py-3 bg-hud-panel border border-hud-border border-r-0 rounded-l font-mono text-[9px] text-hud-cyan tracking-widest"
            style={{ boxShadow: '-2px 0 10px rgba(0,0,0,0.4)' }}
          >
            <span className="rotate-90 whitespace-nowrap">RESULTS</span>
            <ChevronLeft size={10} />
          </motion.button>
        )}
      </div>

      {/* Bottom bar: sensor toggles + command input */}
      <div className="shrink-0 border-t border-hud-border bg-black/80 backdrop-blur-sm px-4 py-2 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <SensorToggleRow active={sensorFilter} onChange={setSensorFilter} />

          {/* Query history hint */}
          {queryHistory.length > 0 && (
            <div className="flex items-center gap-1 font-mono text-[9px] text-hud-muted">
              <span className="text-hud-muted/40">LAST:</span>
              <span className="text-hud-muted truncate max-w-48">{queryHistory[0]}</span>
            </div>
          )}
        </div>
        <QueryCommandBar onSubmit={handleQuery} isLoading={isLoading} />
      </div>
    </div>
  );
};
