import React, { useState, useCallback } from 'react';
import type { Session, UploadedImages, QueryResult, SensorFilter } from '@/lib/types';
import { submitQuery, mockQuery } from '@/lib/api';
import { HudCornerDecorations } from '@/components/hud/HudCornerDecorations';
import { TopModeBar } from '@/components/hud/TopModeBar';
import { SensorToggleRow } from '@/components/hud/SensorToggleRow';
import { ImageViewer } from '@/components/viewer/ImageViewer';
import { QueryCommandBar } from '@/components/query/QueryCommandBar';
import { ResultsPanel } from '@/components/panels/ResultsPanel';

interface Props {
  session: Session;
  images: UploadedImages;
  onNewSession: () => void;
  onSessionUpdate: (session: Session, images: UploadedImages) => void;
}

export const ConsoleScreen: React.FC<Props> = ({ session, images, onNewSession }) => {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sensorFilter, setSensorFilter] = useState<SensorFilter>('truecolor');
  const [externalQuery, setExternalQuery] = useState<string | undefined>(undefined);

  const handleQuery = useCallback(
    async (query: string) => {
      setIsLoading(true);
      setResult(null);
      try {
        const res = await submitQuery(session.session_id, query);
        setResult(res);
      } catch {
        // Fallback to client-side mock when backend is unreachable
        const mockResult = mockQuery(query, session.mode);
        setResult(mockResult);
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  const primarySrc = images.primaryPreview ?? undefined;
  const secondarySrc = images.secondaryPreview ?? undefined;

  return (
    <div className="w-screen h-screen overflow-hidden bg-hud-bg text-hud-text flex flex-col relative">
      {/* HUD overlays: corners, scanlines, timestamp */}
      <HudCornerDecorations metadata={session.metadata} />

      {/* Top bar: mode, session info, new session button */}
      <TopModeBar session={session} onNewSession={onNewSession} />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left: image viewer */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-r border-hud-border">
          {/* Spectral layer toggle */}
          <div className="px-3 pt-2 pb-1 border-b border-hud-border shrink-0">
            <SensorToggleRow active={sensorFilter} onChange={setSensorFilter} />
          </div>

          {/* Image viewer */}
          <div className="flex-1 overflow-hidden relative">
            <ImageViewer
              mode={session.mode}
              primarySrc={primarySrc}
              secondarySrc={secondarySrc}
              sensorFilter={sensorFilter}
              boundingBoxes={result?.bounding_boxes}
            />
          </div>

          {/* Query command bar */}
          <div className="px-3 py-2 border-t border-hud-border shrink-0 bg-black/70">
            <QueryCommandBar
              onSubmit={handleQuery}
              isLoading={isLoading}
              externalQuery={externalQuery}
            />
          </div>
        </div>

        {/* Right: results panel */}
        <div className="w-[380px] xl:w-[420px] shrink-0 overflow-y-auto border-l border-hud-border bg-black/60 hidden md:block">
          <ResultsPanel
            result={result}
            isLoading={isLoading}
            session={session}
            onSuggestedQuery={(q) => setExternalQuery(q)}
          />
        </div>
      </div>
    </div>
  );
};
