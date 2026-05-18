import { Sliders, Move, Palette, Type } from 'lucide-react';

export function InspectorPanel() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Clip Inspector</h3>
      <div className="p-3 rounded-xl bg-black/40 border border-forge-border/40">
        <p className="text-xs font-medium text-white mb-1">Intro Aerial</p>
        <p className="text-[10px] text-gray-500 mb-3">Video · 0:00 – 0:22</p>
        {[
          { icon: Move, label: 'Position', value: 'Center' },
          { icon: Sliders, label: 'Opacity', value: '100%' },
          { icon: Palette, label: 'Color Grade', value: 'Cinematic' },
          { icon: Type, label: 'Transition', value: 'Cross Dissolve' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-t border-forge-border/20 first:border-0">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Icon className="w-3 h-3" />
              {label}
            </span>
            <span className="text-[10px] text-gray-300">{value}</span>
          </div>
        ))}
      </div>
      <label className="block text-[10px] text-gray-500">Scale</label>
      <input type="range" className="neon-slider" defaultValue={100} min={50} max={150} />
      <label className="block text-[10px] text-gray-500 mt-2">Rotation</label>
      <input type="range" className="neon-slider" defaultValue={0} min={-15} max={15} />
    </div>
  );
}
