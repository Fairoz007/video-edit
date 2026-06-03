import { Music, Upload } from 'lucide-react';
import { useState } from 'react';

const EQ_PRESETS = ['Cinematic', 'Warm Documentary', 'Broadcast', 'Flat'];

export function MusicControls() {
  const [duck, setDuck] = useState(true);
  const [duckLevel, setDuckLevel] = useState(25);

  return (
    <section className="p-3 rounded-xl bg-black/30 border border-forge-border/40">
      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
        <Music className="w-3.5 h-3.5 text-forge-accent" />
        Music & Audio
      </h3>

      <p className="text-xs text-forge-text-secondary mb-2 leading-relaxed">
        A track from the project <span className="text-forge-text">music/</span> folder is mixed
        automatically on every export at low volume under narration.
      </p>
      <label className="block text-[10px] text-forge-muted mb-1">Override track (optional)</label>
      <button
        type="button"
        className="w-full mb-2.5 py-2 rounded-studio border border-dashed border-forge-border text-[10px] text-forge-text-secondary hover:text-forge-text flex items-center justify-center gap-1.5 transition-all"
      >
        <Upload className="w-3 h-3" />
        Upload custom audio
      </button>

      <label className="block text-[10px] text-gray-500 mb-1">EQ Preset</label>
      <select className="input-field text-xs mb-2.5 w-full">
        {EQ_PRESETS.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>

      <label className="block text-[10px] text-gray-500 mb-1">Music volume</label>
      <input type="range" min={0} max={100} defaultValue={70} className="neon-slider mb-2.5" />

      <label className="block text-[10px] text-gray-500 mb-1">Duck level ({duckLevel}%)</label>
      <input
        type="range"
        min={0}
        max={100}
        value={duckLevel}
        onChange={(e) => setDuckLevel(Number(e.target.value))}
        className="neon-slider mb-2.5"
      />

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">Duck narration</span>
        <button
          type="button"
          onClick={() => setDuck(!duck)}
          className={`w-9 h-5 rounded-full relative transition-all ${
            duck ? 'accent-gradient shadow-glow-sm' : 'bg-gray-800'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
              duck ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </section>
  );
}
