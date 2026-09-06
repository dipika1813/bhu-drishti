import React, { useEffect, useState } from 'react';
import { formatTimestamp, formatCoord } from '@/lib/utils';
import type { ImageMetadata } from '@/lib/types';

interface Props {
  metadata?: ImageMetadata;
}

export const HudCornerDecorations: React.FC<Props> = ({ metadata }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const cornerSvg = (flip: boolean, flipY: boolean) => (
    <svg
      width="32" height="32" viewBox="0 0 32 32" fill="none"
      style={{ transform: `scale(${flip ? -1 : 1}, ${flipY ? -1 : 1})` }}
    >
      <path d="M2 30 L2 2 L30 2" stroke="#00d9ff" strokeWidth="1.5" strokeOpacity="0.8"/>
    </svg>
  );

  return (
    <>
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 z-30 pointer-events-none">{cornerSvg(false, false)}</div>
      <div className="absolute top-2 right-2 z-30 pointer-events-none">{cornerSvg(true, false)}</div>
      <div className="absolute bottom-2 left-2 z-30 pointer-events-none">{cornerSvg(false, true)}</div>
      <div className="absolute bottom-2 right-2 z-30 pointer-events-none">{cornerSvg(true, true)}</div>

      {/* Scan-lines overlay */}
      <div className="absolute inset-0 scanlines z-20 pointer-events-none opacity-40" />

      {/* Vignette */}
      <div className="absolute inset-0 vignette z-20 pointer-events-none" />

      {/* Timestamp — top right */}
      <div className="absolute top-10 right-10 z-30 pointer-events-none text-right">
        <div className="font-mono text-[10px] text-hud-cyan opacity-70 tracking-widest">
          UTC {formatTimestamp(now)}
        </div>
        <div className="font-mono text-[9px] text-hud-muted tracking-widest mt-0.5">
          EPOCH {Math.floor(now.getTime() / 1000)}
        </div>
      </div>

      {/* Coordinates — bottom left */}
      <div className="absolute bottom-24 left-10 z-30 pointer-events-none">
        {metadata ? (
          <>
            <div className="font-mono text-[10px] text-hud-cyan opacity-70 tracking-widest">
              {formatCoord(metadata.scene_center.lat, true)} {formatCoord(metadata.scene_center.lon, false)}
            </div>
            <div className="font-mono text-[9px] text-hud-muted tracking-widest mt-0.5">
              GSD {metadata.resolution_m}m · {metadata.num_bands}B · {metadata.crs.split(' ')[0]}
            </div>
          </>
        ) : (
          <div className="font-mono text-[10px] text-hud-muted opacity-50 tracking-widest">
            NO SESSION ACTIVE
          </div>
        )}
      </div>

      {/* Scale bar — bottom right */}
      <div className="absolute bottom-24 right-10 z-30 pointer-events-none text-right">
        <div className="font-mono text-[9px] text-hud-muted tracking-widest">SCALE</div>
        <div className="flex items-center gap-1 mt-1 justify-end">
          <div className="h-px w-16 bg-hud-cyan opacity-60" />
          <span className="font-mono text-[10px] text-hud-cyan opacity-70">1 km</span>
        </div>
      </div>
    </>
  );
};
