import { Music } from 'lucide-react';

export function MusicControls() {
  return (
    <section className="glass-panel p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase mb-3">
        <Music className="w-3.5 h-3.5 text-forge-accent" />
        Music
      </h3>
      <label className="block text-[10px] text-gray-500 mb-1">Background track</label>
      <input type="file" accept="audio/*" className="text-[10px] text-gray-400 w-full" />
      <label className="block text-[10px] text-gray-500 mt-2 mb-1">Ducking level</label>
      <input type="range" min={0} max={100} defaultValue={25} className="w-full accent-forge-accent" />
      <p className="text-[10px] text-gray-600 mt-1">Narration ducks music via FFmpeg amix</p>
    </section>
  );
}
