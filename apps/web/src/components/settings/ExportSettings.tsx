import { Download } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';

const PRESETS = [
  { id: '1080p', label: '1080p HD' },
  { id: '4k', label: '4K UHD' },
  { id: 'youtube', label: 'YouTube (16:9)' },
  { id: 'shorts', label: 'Shorts (9:16)' },
  { id: 'reels', label: 'Reels (9:16)' },
] as const;

export function ExportSettings() {
  const { exportOptions, setExportOptions, outputPath, status } = useProjectStore();

  return (
    <section className="glass-panel p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase mb-3">
        <Download className="w-3.5 h-3.5 text-forge-accent" />
        Export
      </h3>
      <label className="block text-[10px] text-gray-500 mb-1">Resolution</label>
      <select
        className="input-field text-xs mb-2"
        value={exportOptions.preset || '1080p'}
        onChange={(e) =>
          setExportOptions({ preset: e.target.value as typeof exportOptions.preset })
        }
      >
        {PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <label className="block text-[10px] text-gray-500 mb-1">Format</label>
      <select
        className="input-field text-xs mb-2"
        value={exportOptions.format || 'mp4'}
        onChange={(e) =>
          setExportOptions({ format: e.target.value as 'mp4' | 'mov' })
        }
      >
        <option value="mp4">MP4 (H.264)</option>
        <option value="mov">MOV (ProRes)</option>
      </select>
      <p className="text-[10px] text-gray-500 mb-2">
        Motion graphics (intro, outro, subscribe CTA) are included by default.
      </p>
      {status === 'completed' && outputPath && (
        <p className="mt-2 text-[10px] text-emerald-400 truncate" title={outputPath}>
          ✓ {outputPath.split('/').pop()}
        </p>
      )}
    </section>
  );
}
