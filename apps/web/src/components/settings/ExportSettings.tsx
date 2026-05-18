import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';

const PRESETS = [
  { id: '1080p', label: '1080p Full HD' },
  { id: '4k', label: '4K UHD' },
  { id: 'youtube', label: 'YouTube (16:9)' },
  { id: 'shorts', label: 'Shorts (9:16)' },
  { id: 'reels', label: 'Reels (9:16)' },
] as const;

const QUALITY = ['High', 'Maximum', 'Streaming', 'Archive'];

export function ExportSettings() {
  const { exportOptions, setExportOptions, outputPath, status } = useProjectStore();
  const [bitrate, setBitrate] = useState(12);
  const [aiUpscale, setAiUpscale] = useState(false);
  const [lutExport, setLutExport] = useState(true);

  return (
    <section className="p-3 rounded-xl bg-black/30 border border-forge-border/40">
      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
        <Download className="w-3.5 h-3.5 text-forge-accent" />
        Export Settings
      </h3>

      <label className="block text-[10px] text-gray-500 mb-1">Resolution</label>
      <select
        className="input-field text-xs mb-2.5 w-full"
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
        className="input-field text-xs mb-2.5 w-full"
        value={exportOptions.format || 'mp4'}
        onChange={(e) =>
          setExportOptions({ format: e.target.value as 'mp4' | 'mov' })
        }
      >
        <option value="mp4">MP4 (H.264)</option>
        <option value="mov">MOV (ProRes)</option>
      </select>

      <label className="block text-[10px] text-gray-500 mb-1">Quality</label>
      <select className="input-field text-xs mb-2.5 w-full">
        {QUALITY.map((q) => (
          <option key={q}>{q}</option>
        ))}
      </select>

      <label className="block text-[10px] text-gray-500 mb-1">Bitrate ({bitrate} Mbps)</label>
      <input
        type="range"
        min={4}
        max={50}
        value={bitrate}
        onChange={(e) => setBitrate(Number(e.target.value))}
        className="neon-slider mb-2.5"
      />

      {[
        { label: 'Cinematic LUT export', on: lutExport, set: setLutExport },
        { label: 'AI upscaling', on: aiUpscale, set: setAiUpscale },
      ].map(({ label, on, set }) => (
        <motion.div key={label} className="flex items-center justify-between py-1.5">
          <span className="text-[10px] text-gray-400">{label}</span>
          <button
            type="button"
            onClick={() => set(!on)}
            className={`w-9 h-5 rounded-full relative ${on ? 'accent-gradient' : 'bg-gray-800'}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                on ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </motion.div>
      ))}

      {status === 'completed' && outputPath && (
        <p className="mt-2 text-[10px] text-emerald-400 truncate pt-2 border-t border-forge-border/30" title={outputPath}>
          ✓ {outputPath.split('/').pop()}
        </p>
      )}
    </section>
  );
}
