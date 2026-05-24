import { Music, Upload } from 'lucide-react';
import { useState } from 'react';
import { SettingsField, SettingsSection } from '../ui/SettingsSection';

const EQ_PRESETS = ['Cinematic', 'Warm Documentary', 'Broadcast', 'Flat'];

export function MusicControls() {
  const [duck, setDuck] = useState(true);
  const [duckLevel, setDuckLevel] = useState(25);

  return (
    <SettingsSection title="Music & audio" icon={Music}>
      <p className="text-xs text-forge-text-secondary leading-relaxed -mt-1">
        A track from <span className="text-forge-glow font-medium">music/</span> is mixed automatically
        under narration on export.
      </p>

      <SettingsField label="Override track (optional)">
        <button
          type="button"
          className="w-full py-2.5 rounded-studio-lg border border-dashed border-forge-border-strong text-xs text-forge-text-secondary hover:text-forge-text hover:border-forge-border-accent flex items-center justify-center gap-2 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload custom audio
        </button>
      </SettingsField>

      <SettingsField label="EQ preset">
        <select className="input-field text-xs w-full">
          {EQ_PRESETS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </SettingsField>

      <SettingsField label="Music volume">
        <input type="range" min={0} max={100} defaultValue={70} className="neon-slider" />
      </SettingsField>

      <SettingsField label={`Duck level · ${duckLevel}%`}>
        <input
          type="range"
          min={0}
          max={100}
          value={duckLevel}
          onChange={(e) => setDuckLevel(Number(e.target.value))}
          className="neon-slider"
        />
      </SettingsField>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-forge-text-secondary">Duck under narration</span>
        <button
          type="button"
          onClick={() => setDuck(!duck)}
          className={`w-10 h-5 rounded-full relative transition-all ${
            duck ? 'accent-gradient shadow-glow-sm' : 'bg-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
              duck ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </SettingsSection>
  );
}
