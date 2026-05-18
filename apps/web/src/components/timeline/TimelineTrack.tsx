import { motion } from 'framer-motion';

export interface TimelineItem {
  id: string;
  start: number;
  duration: number;
  label: string;
  color: string;
  waveform?: boolean;
}

interface Props {
  label: string;
  items: TimelineItem[];
  totalDuration: number;
  zoom?: number;
  locked?: boolean;
  playheadPercent?: number;
}

export function TimelineTrack({
  label,
  items,
  totalDuration,
  zoom = 1,
  locked,
}: Props) {
  return (
    <div className="flex items-stretch gap-2 h-10 group">
      <div className="w-[72px] shrink-0 flex items-center justify-end gap-1 pr-1">
        <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide truncate">
          {label}
        </span>
        {locked && (
          <span className="text-[8px] text-gray-700" title="Locked">
            🔒
          </span>
        )}
      </div>
      <div
        className="track-lane flex-1 min-w-[400px]"
        style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left center' }}
      >
        {items.map((item) => {
          const left = (item.start / totalDuration) * 100;
          const width = (item.duration / totalDuration) * 100;
          return (
            <motion.div
              key={item.id}
              drag="x"
              dragElastic={0}
              dragMomentum={false}
              className={`absolute top-0.5 bottom-0.5 rounded-md bg-gradient-to-r ${item.color} cursor-grab active:cursor-grabbing clip-glow overflow-hidden border border-white/10`}
              style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
              title={item.label}
              whileHover={{ scaleY: 1.15, zIndex: 10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {item.waveform ? (
                <div className="absolute inset-0 flex items-end gap-px px-0.5 pb-0.5 opacity-60">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-white/40 rounded-sm"
                      style={{ height: `${30 + Math.sin(i) * 50}%` }}
                    />
                  ))}
                </div>
              ) : (
                <span className="absolute inset-0 flex items-center px-1.5 text-[8px] font-medium text-white/90 truncate drop-shadow">
                  {item.label}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
