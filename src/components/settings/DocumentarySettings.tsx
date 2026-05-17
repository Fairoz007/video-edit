import { Settings } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';

export function DocumentarySettings() {
  const { script } = useProjectStore();

  return (
    <section className="glass-panel p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase mb-3">
        <Settings className="w-3.5 h-3.5 text-forge-accent" />
        Documentary
      </h3>
      <label className="block text-[10px] text-gray-500 mb-1">Style</label>
      <select className="input-field text-xs mb-2">
        <option>Cinematic</option>
        <option>News</option>
        <option>Educational</option>
      </select>
      <label className="block text-[10px] text-gray-500 mb-1">Pacing</label>
      <select className="input-field text-xs">
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
