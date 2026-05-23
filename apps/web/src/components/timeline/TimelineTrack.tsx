import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export interface TimelineItem {
  id: string;
  start: number;
  duration: number;
  label: string;
  meta?: string;
  color: string;
  waveform?: boolean;
}

interface Props {
  label: string;
  items: TimelineItem[];
  totalDuration: number;
  zoom?: number;
  locked?: boolean;
  height?: number;
}

function WaveformVisualization({ bars = 24 }: { bars?: number }) {
  return (
    <div className="absolute inset-0 flex items-end gap-px px-1 pb-1 opacity-70">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-sky-300/50 rounded-sm min-w-0"
          style={{ height: `${20 + Math.abs(Math.sin(i * 0.55) * 65)}%` }}
        />
      ))}
    </div>
  );
}

export function TimelineTrack({
  label,
  items,
  totalDuration,
  zoom = 1,
  locked,
  height = 40,
}: Props) {
  return (
    <div className="flex items-stretch gap-2 group" style={{ height }}>
      <div className="w-14 shrink-0 flex items-center justify-end gap-1 pr-1">
        <span className="text-[10px] font-bold text-forge-muted uppercase tracking-wide">{label}</span>
        {locked && <Lock className="w-2.5 h-2.5 text-forge-muted/60" aria-label="Locked" />}
      </div>
      <div
        className="track-lane flex-1 min-w-[320px] relative"
        style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left center' }}
      >
        {items.map((item) => {
          const left = (item.start / totalDuration) * 100;
          const width = (item.duration / totalDuration) * 100;
          return (
            <motion.div
              key={item.id}
              drag={locked ? false : 'x'}
              dragElastic={0}
              dragMomentum={false}
              className={`absolute top-1 bottom-1 rounded-md bg-gradient-to-r ${item.color} ${
                locked ? 'cursor-default opacity-80' : 'cursor-grab active:cursor-grabbing'
              } clip-block overflow-hidden border border-white/10`}
              style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
              title={item.label}
              whileHover={locked ? undefined : { scaleY: 1.05, zIndex: 10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {item.waveform ? (
                <WaveformVisualization bars={Math.min(40, Math.max(12, Math.floor(width * 2)))} />
              ) : (
                <span className="absolute inset-0 flex flex-col justify-center px-2 text-white/90 truncate">
                  <span className="text-[10px] font-medium truncate">{item.label}</span>
                  {item.meta && (
                    <span className="text-[9px] font-mono text-white/60 truncate">
                      {item.meta}
                    </span>
                  )}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
