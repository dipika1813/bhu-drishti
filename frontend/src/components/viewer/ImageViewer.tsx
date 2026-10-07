import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { AnalysisMode, BoundingBox, SensorFilter } from '@/lib/types';

interface Props {
  mode: AnalysisMode;
  primarySrc?: string;
  secondarySrc?: string;
  sensorFilter: SensorFilter;
  boundingBoxes?: BoundingBox[];
}

const FILTER_STYLES: Record<SensorFilter, string> = {
  truecolor: 'none',
  grayscale: 'grayscale(1)',
  ndvi: 'hue-rotate(90deg) saturate(1.8)',
  ndwi: 'hue-rotate(200deg) saturate(2)',
  heatmap: 'sepia(1) hue-rotate(320deg) saturate(2.5)',
};

function ImagePane({
  src,
  label,
  sensorFilter,
  boundingBoxes,
}: {
  src?: string;
  label: string;
  sensorFilter: SensorFilter;
  boundingBoxes?: BoundingBox[];
}) {
  return (
    <div className="relative flex-1 min-w-0 h-full overflow-hidden bg-black/60 border border-hud-border/40 rounded">
      <div className="absolute top-2 left-2 z-10 font-mono text-[9px] text-hud-cyan tracking-widest bg-black/70 px-2 py-0.5 border border-hud-border/50 rounded pointer-events-none">
        {label}
      </div>
      {src ? (
        <TransformWrapper
          minScale={0.5}
          maxScale={8}
          centerOnInit
          wheel={{ step: 0.1 }}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div className="relative inline-block">
              <img
                src={src}
                alt={label}
                draggable={false}
                style={{ filter: FILTER_STYLES[sensorFilter], display: 'block', maxWidth: '100%', maxHeight: '100%' }}
                className="select-none"
              />
              {/* Bounding boxes overlay */}
              {boundingBoxes && boundingBoxes.length > 0 && (
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ pointerEvents: 'none' }}
                >
                  {boundingBoxes.map((box) => (
                    <g key={box.id}>
                      <rect
                        x={box.x}
                        y={box.y}
                        width={box.w}
                        height={box.h}
                        fill="none"
                        stroke="#39ff14"
                        strokeWidth="0.5"
                        strokeDasharray="2 1"
                        opacity={0.85}
                      />
                      <rect
                        x={box.x}
                        y={box.y - 4}
                        width={Math.min(box.w, 40)}
                        height={4}
                        fill="rgba(0,0,0,0.7)"
                      />
                      <text
                        x={box.x + 0.5}
                        y={box.y - 0.5}
                        fontSize="2.2"
                        fill="#39ff14"
                        fontFamily="monospace"
                        dominantBaseline="auto"
                      >
                        {box.label} ({box.confidence}%)
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>
      ) : (
        <div className="flex h-full items-center justify-center font-mono text-[11px] text-hud-muted">
          NO IMAGE LOADED
        </div>
      )}
    </div>
  );
}

export const ImageViewer: React.FC<Props> = ({
  mode,
  primarySrc,
  secondarySrc,
  sensorFilter,
  boundingBoxes,
}) => {
  const isSplit = mode === 'crossmodal' || mode === 'bitemporal';

  const primaryLabel =
    mode === 'bitemporal'
      ? 'T0 BEFORE BASELINE'
      : mode === 'crossmodal'
      ? 'OPTICAL MULTISPECTRAL'
      : 'PRIMARY SCENE';

  const secondaryLabel =
    mode === 'bitemporal' ? 'T1 AFTER ACQUISITION' : 'C-BAND SAR RADAR';

  return (
    <div className={`flex gap-1 h-full p-1 ${isSplit ? 'flex-row' : ''}`}>
      <ImagePane
        src={primarySrc}
        label={primaryLabel}
        sensorFilter={sensorFilter}
        boundingBoxes={boundingBoxes}
      />
      {isSplit && (
        <ImagePane
          src={secondarySrc}
          label={secondaryLabel}
          sensorFilter={sensorFilter}
        />
      )}
    </div>
  );
};
