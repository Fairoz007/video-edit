import {
  Undo2,
  Redo2,
  Scissors,
  Trash2,
  Magnet,
  Wand2,
  ZoomIn,
  ZoomOut,
  ScanSearch,
  SkipBack,
  SkipForward,
  Play,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TimelineToolbarProps {
  zoom: number;
  onZoomChange: (z: number) => void;
  playhead?: number;
  totalDuration?: number;
}

export function TimelineToolbar({
  zoom,
  onZoomChange,
  playhead = 0,
  totalDuration = 0,
}: TimelineToolbarProps) {
  const tools = [
    { icon: Undo2, label: 'Undo' },
    { icon: Redo2, label: 'Redo' },
    { icon: Scissors, label: 'Split at playhead' },
    { icon: Trash2, label: 'Delete' },
    { icon: Magnet, label: 'Snap' },
    { icon: Wand2, label: 'Auto arrange' },
    { icon: ScanSearch, label: 'Scene detect' },
  ];

  const formatTc = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const f = Math.floor((sec % 1) * 25);
    return `${m}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-forge-border/60 bg-black/25 shrink-0">
      <div className="flex items-center gap-0.5">
        <button type="button" className="btn-icon p-1.5" title="Play from playhead" aria-label="Play">
          <Play className="w-3.5 h-3.5 text-forge-glow" />
        </button>
        <button type="button" className="btn-icon p-1.5" title="Previous edit" aria-label="Previous">
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="btn-icon p-1.5" title="Next edit" aria-label="Next">
          <SkipForward className="w-3.5 h-3.5" />
        </button>
        <span className="w-px h-5 bg-forge-border mx-1" />
        {tools.map(({ icon: Icon, label }) => (
          <motion.button
            key={label}
            type="button"
            title={label}
            className="btn-icon p-1.5"
            whileHover={{ scale: 1.08, backgroundColor: 'rgba(99, 102, 241, 0.12)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className="w-3.5 h-3.5" />
          </motion.button>
        ))}
      </div>

      <span className="hidden sm:inline text-xs font-mono text-forge-glow tabular-nums px-3 py-1 rounded-lg bg-black/30 border border-forge-border/50">
        {formatTc(playhead)} / {formatTc(totalDuration)}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-icon p-1"
          onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <input
          type="range"
          min={0.5}
          max={2.5}
          step={0.25}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="studio-slider w-24 sm:w-32"
          aria-label="Timeline zoom"
        />
        <button
          type="button"
          className="btn-icon p-1"
          onClick={() => onZoomChange(Math.min(2.5, zoom + 0.25))}
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-forge-muted w-10 text-right tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
