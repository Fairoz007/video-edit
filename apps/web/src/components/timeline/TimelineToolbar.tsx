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
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TimelineToolbarProps {
  zoom: number;
  onZoomChange: (z: number) => void;
}

export function TimelineToolbar({ zoom, onZoomChange }: TimelineToolbarProps) {
  const tools = [
    { icon: Undo2, label: 'Undo' },
    { icon: Redo2, label: 'Redo' },
    { icon: Scissors, label: 'Split' },
    { icon: Trash2, label: 'Delete' },
    { icon: Magnet, label: 'Ripple' },
    { icon: Wand2, label: 'Auto Arrange' },
    { icon: ScanSearch, label: 'AI Scene Detect' },
  ];

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-forge-border/40">
      <div className="flex items-center gap-0.5">
        {tools.map(({ icon: Icon, label }) => (
          <motion.button
            key={label}
            type="button"
            title={label}
            className="btn-icon p-1.5"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <Icon className="w-3.5 h-3.5" />
          </motion.button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <ZoomOut
          className="w-3.5 h-3.5 text-gray-600 cursor-pointer hover:text-white"
          onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
        />
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.25}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="neon-slider w-24"
        />
        <ZoomIn
          className="w-3.5 h-3.5 text-gray-600 cursor-pointer hover:text-white"
          onClick={() => onZoomChange(Math.min(2, zoom + 0.25))}
        />
        <span className="text-[9px] font-mono text-gray-600 w-8">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
