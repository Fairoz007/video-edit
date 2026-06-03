import { motion } from 'framer-motion';
import { Layers, Film, Mic, Music } from 'lucide-react';

const DEMO_CLIPS = [
  { label: 'Intro', width: '18%', color: 'bg-indigo-600/80' },
  { label: 'Scene 1', width: '24%', color: 'bg-violet-600/70' },
  { label: 'Scene 2', width: '20%', color: 'bg-indigo-500/70' },
  { label: 'Outro', width: '14%', color: 'bg-purple-600/60' },
];

function WaveformBars({ count = 32 }: { count?: number }) {
  return (
    <div className="absolute inset-0 flex items-end gap-px px-1 pb-0.5 opacity-50" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-sky-400/50 rounded-sm min-w-0"
          style={{ height: `${22 + Math.abs(Math.sin(i * 0.7)) * 55}%` }}
        />
      ))}
    </div>
  );
}

export function TimelineEmptyState() {
  return (
    <div className="flex-1 flex flex-col min-h-0 p-3 gap-2">
      <p className="text-xs text-forge-text-secondary text-center mb-1">
        Your edit appears here after script generation and scene assembly
      </p>

      <div className="flex-1 min-h-[100px] rounded-studio bg-forge-surface/80 border border-forge-border p-2 space-y-1.5 opacity-60 pointer-events-none select-none">
        <motion.div className="flex items-stretch gap-2 h-9">
          <div className="w-16 shrink-0 flex items-center justify-end pr-1">
            <Film className="w-3 h-3 text-forge-muted mr-1" />
            <span className="text-[10px] font-semibold text-forge-muted uppercase">V1</span>
          </div>
          <div className="track-lane flex-1 flex gap-0.5 p-0.5">
            {DEMO_CLIPS.map((clip) => (
              <div
                key={clip.label}
                className={`h-full rounded-md ${clip.color} flex items-center px-1.5 clip-block`}
                style={{ width: clip.width }}
              >
                <span className="text-[9px] text-white/80 truncate">{clip.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex items-stretch gap-2 h-8">
          <div className="w-16 shrink-0 flex items-center justify-end pr-1">
            <Mic className="w-3 h-3 text-forge-muted mr-1" />
            <span className="text-[10px] font-semibold text-forge-muted uppercase">A1</span>
          </div>
          <div className="track-lane flex-1 relative h-full bg-track-narration/30">
            <WaveformBars count={40} />
          </div>
        </div>

        <div className="flex items-stretch gap-2 h-7">
          <div className="w-16 shrink-0 flex items-center justify-end pr-1">
            <Music className="w-3 h-3 text-forge-muted mr-1" />
            <span className="text-[10px] font-semibold text-forge-muted uppercase">A2</span>
          </div>
          <div
            className="track-lane flex-1 h-full bg-gradient-to-r from-sky-900/40 to-cyan-900/30 rounded-studio"
            style={{ width: '85%' }}
          >
            <WaveformBars count={28} />
          </div>
        </div>
      </div>

      <motion.div
        className="flex items-center justify-center gap-2 text-forge-muted"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Layers className="w-3.5 h-3.5" />
        <span className="text-[11px]">Generate script → scenes → render to populate tracks</span>
      </motion.div>
    </div>
  );
}
