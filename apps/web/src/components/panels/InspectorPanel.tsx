import { Sliders, Move, Palette, Type, Scan } from 'lucide-react';
import { SettingsSection } from '../ui/SettingsSection';

export function InspectorPanel() {
  return (
    <SettingsSection title="Clip inspector" icon={Scan}>
      <div className="p-3 rounded-studio-lg bg-black/35 border border-forge-border/50 space-y-1">
        <p className="text-sm font-semibold text-forge-text">Selected clip</p>
        <p className="text-[11px] text-forge-muted mb-3">Video · adjust transform & grade</p>
        {[
          { icon: Move, label: 'Position', value: 'Center' },
          { icon: Sliders, label: 'Opacity', value: '100%' },
          { icon: Palette, label: 'Color grade', value: 'Cinematic' },
          { icon: Type, label: 'Transition', value: 'Cross dissolve' },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between py-2 border-t border-forge-border/30 first:border-0 first:pt-0"
          >
            <span className="flex items-center gap-2 text-xs text-forge-text-secondary">
              <Icon className="w-3.5 h-3.5 text-forge-glow" />
              {label}
            </span>
            <span className="text-xs font-medium text-forge-text">{value}</span>
          </div>
        ))}
      </div>

      <label className="settings-label">Scale</label>
      <input type="range" className="neon-slider" defaultValue={100} min={50} max={150} />

      <label className="settings-label mt-3 block">Rotation</label>
      <input type="range" className="neon-slider" defaultValue={0} min={-15} max={15} />
    </SettingsSection>
  );
}
