import type React from 'react';
import { Film, Minus, Square, X } from 'lucide-react';

export function TitleBar() {
  return (
    <header
      className="h-10 flex items-center justify-between px-4 border-b border-forge-border bg-black/60 backdrop-blur-md"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Film className="w-4 h-4 text-forge-accent" />
        <span className="text-sm font-semibold tracking-wide">
          <span className="text-forge-glow">Docu</span>
          <span className="text-white">Forge</span>
        </span>
        <span className="text-[10px] text-gray-500 ml-2 uppercase tracking-widest">
          Documentary Studio
        </span>
      </div>
      <div
        className="flex gap-1 text-gray-500"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button type="button" className="p-1 hover:text-white rounded">
          <Minus className="w-3 h-3" />
        </button>
        <button type="button" className="p-1 hover:text-white rounded">
          <Square className="w-3 h-3" />
        </button>
        <button type="button" className="p-1 hover:text-red-400 rounded">
          <X className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
}
