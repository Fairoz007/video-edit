import { Settings } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import type { VideoStyle } from '../../utils/api';

const VIDEO_STYLES: { id: VideoStyle; label: string; hint: string }[] = [
  {
    id: 'documentary',
    label: 'Documentary',
    hint: 'Intro/outro, Ken Burns, lower thirds, captions',
  },
  {
    id: 'walkthrough',
    label: 'Walkthrough',
    hint: 'UI slides, zoom, progress bar (Stitch-style)',
  },
];

export function DocumentarySettings() {
  const { script, input, setInput } = useProjectStore();

  return (
    <section className="glass-panel p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase mb-3">
        <Settings className="w-3.5 h-3.5 text-forge-accent" />
        Remotion output
      </h3>
      <label className="block text-[10px] text-gray-500 mb-1">Composition</label>
      <select
        className="input-field text-xs mb-2 w-full"
        value={input.videoStyle || 'documentary'}
        onChange={(e) =>
          setInput({ videoStyle: e.target.value as VideoStyle })
        }
      >
        {VIDEO_STYLES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-gray-600 mb-3">
        {VIDEO_STYLES.find((s) => s.id === (input.videoStyle || 'documentary'))?.hint}
      </p>
      <label className="block text-[10px] text-gray-500 mb-1">Pacing</label>
      <select className="input-field text-xs w-full">
        <option>Standard</option>
        <option>Slow burn</option>
        <option>Fast cut</option>
      </select>
      {script && (
        <p className="mt-2 text-[10px] text-gray-600 line-clamp-3">
          {script.sections.length} sections · {script.fullNarration.split(' ').length} words
        </p>
      )}
    </section>
  );
}
