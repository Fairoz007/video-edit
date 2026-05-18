import { motion } from 'framer-motion';

interface TimelineItem {
  id: string;
  start: number;
  duration: number;
  label: string;
  color: string;
}

interface Props {
  label: string;
  items: TimelineItem[];
  totalDuration: number;
}

export function TimelineTrack({ label, items, totalDuration }: Props) {
  return (
    <div className="flex items-center gap-2 h-10">
      <span className="w-16 text-[10px] text-gray-500 shrink-0 text-right">{label}</span>
      <div className="flex-1 relative h-8 bg-black/40 rounded border border-forge-border/30">
        {items.map((item) => {
          const left = (item.start / totalDuration) * 100;
          const width = (item.duration / totalDuration) * 100;
          return (
            <motion.div
              key={item.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              className={`absolute top-0.5 bottom-0.5 rounded bg-gradient-to-r ${item.color} cursor-grab active:cursor-grabbing overflow-hidden`}
              style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
              title={item.label}
              whileHover={{ scaleY: 1.1 }}
            >
              <span className="absolute inset-0 flex items-center px-1 text-[9px] text-white/80 truncate">
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
