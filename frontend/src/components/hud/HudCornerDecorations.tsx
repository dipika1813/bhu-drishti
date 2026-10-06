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
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      style={{ transform: `scale(${flip ? -1 : 1}, ${flipY ? -1 : 1})` }}
    >
      <path d="M2 30 L2 2 L30 2" stroke="#00d9ff" strokeWidth="1.5" strokeOpacity="0.7" />
    </svg>
  );

  return (
    <>
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none">{cornerSvg(false, false)}</div>
      <div className="absolute top-2 right-2 z-20 pointer-events-none">{cornerSvg(true, false)}</div>
      <div className="absolute bottom-2 left-2 z-20 pointer-events-none">{cornerSvg(false, true)}</div>
      <div className="absolute bottom-2 right-2 z-20 pointer-events-none">{cornerSvg(true, true)}</div>

      {/* Subtle Scan-lines overlay */}
      <div className="absolute inset-0 scanlines z-10 pointer-events-none opacity-20" />

      {/* Vignette */}
      <div className="absolute inset-0 vignette z-10 pointer-events-none" />

      {/* Timestamp: Top Right */}
      <div className="absolute top-12 right-12 z-20 pointer-events-none text-right hidden sm:block">
        <div className="font-mono text-[9px] text-hud-cyan opacity-80 tracking-widest">
          UTC {formatTimestamp(now)}
        </div>
        <div className="font-mono text-[8px] text-hud-muted tracking-widest mt-0.5">
          SYS TIME {Math.floor(now.getTime() / 1000)}
        </div>
      </div>

      {/* Scale bar: Bottom Right */}
      <div className="absolute bottom-16 right-10 z-20 pointer-events-none text-right hidden sm:block">
        <div className="font-mono text-[8px] text-hud-muted tracking-widest">EST. SCALE</div>
        <div className="flex items-center gap-1.5 mt-0.5 justify-end">
          <div className="h-px w-16 bg-hud-cyan opacity-70" />
          <span className="font-mono text-[9px] text-hud-cyan opacity-80">1.0 km</span>
        </div>
      </div>
    </>
  );
};
