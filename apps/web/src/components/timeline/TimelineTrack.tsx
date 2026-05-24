import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useMemo } from 'react';

export interface TimelineItem {
  id: string;
  start: number;
  duration: number;
  label: string;
  meta?: string;
  color?: string;
  waveform?: boolean;
  trackType?: 'video' | 'audio' | 'narration';
}

interface Props {
  label: string;
  items: TimelineItem[];
  totalDuration: number;
  zoom?: number;
  locked?: boolean;
  height?: number;
}

function seededHeights(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 9973;
  return Array.from({ length: count }, (_, i) => {
    h = (h * 16807 + i * 31) % 9973;
    return 0.15 + (h / 9973) * 0.85;
  });
}

function WaveformVisualization({ seed, bars = 32 }: { seed: string; bars?: number }) {
  const heights = useMemo(() => seededHeights(seed, bars), [seed, bars]);

  return (
    <div className="absolute inset-0 flex items-end gap-[1px] px-1.5 pb-1 pt-2 opacity-90">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 min-w-0 rounded-[1px]"
          style={{
            height: `${h * 100}%`,
            background:
              i % 3 === 0
                ? 'linear-gradient(180deg, rgba(34,211,238,0.9), rgba(99,102,241,0.7))'
                : 'linear-gradient(180deg, rgba(56,189,248,0.75), rgba(79,70,229,0.6))',
            boxShadow: h > 0.6 ? '0 0 4px rgba(34,211,238,0.35)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

function clipClass(item: TimelineItem): string {
  if (item.trackType === 'narration') return 'timeline-clip-narration';
  if (item.waveform || item.trackType === 'audio') return 'timeline-clip-audio';
  return 'timeline-clip-video';
}

export function TimelineTrack({
  label,
  items,
  totalDuration,
  zoom = 1,
  locked,
  height = 48,
}: Props) {
  return (
    <div className="flex items-stretch gap-2 group" style={{ height }}>
      <div className="w-12 shrink-0 flex flex-col items-end justify-center gap-0.5 pr-1">
        <span className="text-[10px] font-bold text-forge-glow uppercase tracking-wider">{label}</span>
        {locked && <Lock className="w-2.5 h-2.5 text-forge-muted/70" aria-label="Locked" />}
      </div>
      <div
        className="track-lane flex-1 min-w-[360px] relative"
        style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left center' }}
      >
        {items.map((item) => {
          const left = (item.start / totalDuration) * 100;
          const width = (item.duration / totalDuration) * 100;
          const barCount = Math.min(64, Math.max(16, Math.floor((width / 100) * 80)));

          return (
            <motion.div
              key={item.id}
              drag={locked ? false : 'x'}
              dragElastic={0}
              dragMomentum={false}
              className={`timeline-clip ${clipClass(item)} ${
                locked ? 'cursor-default opacity-85' : ''
              }`}
              style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
              title={`${item.label}${item.meta ? ` · ${item.meta}` : ''}`}
              whileHover={locked ? undefined : { scaleY: 1.04, zIndex: 10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            >
              {item.waveform ? (
                <WaveformVisualization seed={item.id} bars={barCount} />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  <span className="absolute inset-0 flex flex-col justify-center px-2.5 text-white z-[1]">
                    <span className="text-[10px] font-semibold truncate drop-shadow-sm">{item.label}</span>
                    {item.meta && (
                      <span className="text-[9px] font-mono text-white/55 truncate">{item.meta}</span>
                    )}
                  </span>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
