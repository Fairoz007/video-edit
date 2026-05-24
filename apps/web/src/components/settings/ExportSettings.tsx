import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import {
  DEFAULT_SHORTS_TEMPLATE_ID,
  YOUTUBE_SHORTS_VISUAL_TEMPLATES,
} from '../../constants/documentaryTemplates';
import { SettingsField, SettingsSection } from '../ui/SettingsSection';

const PRESETS = [
  { id: '1080p', label: '1080p Full HD' },
  { id: '4k', label: '4K UHD' },
  { id: 'youtube', label: 'YouTube (16:9)' },
  { id: 'shorts', label: 'Shorts (9:16)' },
  { id: 'reels', label: 'Reels (9:16)' },
] as const;

const QUALITY = ['High', 'Maximum', 'Streaming', 'Archive'];

export function ExportSettings() {
  const { exportOptions, setExportOptions, outputPath, outputPaths, status } = useProjectStore();
  const [bitrate, setBitrate] = useState(12);
  const [aiUpscale, setAiUpscale] = useState(false);
  const [lutExport, setLutExport] = useState(true);
  const exportBoth = Boolean(exportOptions.exportFullAndShorts);
  const autoShorts = Boolean(exportOptions.autoYouTubeShorts) || exportBoth;
  const shortsOnly = autoShorts && !exportBoth;
  const shortsTemplateId =
    exportOptions.shortsTemplateId || DEFAULT_SHORTS_TEMPLATE_ID;

  return (
    <SettingsSection title="Export settings" icon={Download}>
      <motion.div className="flex items-center justify-between py-1">
        <div>
          <span className="text-xs text-forge-text-secondary block">
            Render full + Shorts together
          </span>
          <span className="text-[10px] text-forge-muted">
            One job: 16:9 documentary + 9:16 Shorts (≤{exportOptions.shortsMaxDurationSec ?? 90}s
            each)
          </span>
        </div>
        <button
          type="button"
          aria-pressed={exportBoth}
          onClick={() =>
            setExportOptions({
              exportFullAndShorts: !exportBoth,
              autoYouTubeShorts: !exportBoth,
              shortsTemplateId: exportOptions.shortsTemplateId || DEFAULT_SHORTS_TEMPLATE_ID,
            })
          }
          className={`w-10 h-5 rounded-full relative transition-all ${
            exportBoth ? 'accent-gradient shadow-glow-sm' : 'bg-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
              exportBoth ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </motion.div>

      <motion.div className="flex items-center justify-between py-1">
        <div>
          <span className="text-xs text-forge-text-secondary block">Shorts only</span>
          <span className="text-[10px] text-forge-muted">
            9:16 vertical export, split into parts (no full video)
          </span>
        </div>
        <button
          type="button"
          aria-pressed={shortsOnly}
          disabled={exportBoth}
          onClick={() =>
            setExportOptions({
              autoYouTubeShorts: !shortsOnly,
              exportFullAndShorts: false,
              preset: !shortsOnly ? 'shorts' : exportOptions.preset === 'shorts' ? '1080p' : exportOptions.preset,
              shortsTemplateId: exportOptions.shortsTemplateId || DEFAULT_SHORTS_TEMPLATE_ID,
            })
          }
          className={`w-10 h-5 rounded-full relative transition-all ${
            shortsOnly ? 'accent-gradient shadow-glow-sm' : 'bg-white/10'
          } ${exportBoth ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
              shortsOnly ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </motion.div>

      {autoShorts && (
        <SettingsField
          label="Shorts visual template"
          hint={
            YOUTUBE_SHORTS_VISUAL_TEMPLATES.find((t) => t.id === shortsTemplateId)
              ?.description ||
            'Vertical look for Shorts — independent from your main documentary template.'
          }
        >
          <select
            className="input-field text-xs w-full"
            value={shortsTemplateId}
            onChange={(e) => setExportOptions({ shortsTemplateId: e.target.value })}
          >
            {YOUTUBE_SHORTS_VISUAL_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </SettingsField>
      )}

      <SettingsField
        label="Resolution"
        hint={exportBoth ? 'Applies to the full documentary; Shorts always use 9:16' : undefined}
      >
        <select
          className="input-field text-xs w-full"
          value={shortsOnly ? 'shorts' : exportOptions.preset || '1080p'}
          disabled={shortsOnly}
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
      </SettingsField>

      <SettingsField label="Format">
        <select
          className="input-field text-xs w-full"
          value={exportOptions.format || 'mp4'}
          onChange={(e) =>
            setExportOptions({ format: e.target.value as 'mp4' | 'mov' })
          }
        >
          <option value="mp4">MP4 (H.264)</option>
          <option value="mov">MOV (ProRes)</option>
        </select>
      </SettingsField>

      <SettingsField label="Quality">
        <select className="input-field text-xs w-full">
          {QUALITY.map((q) => (
            <option key={q}>{q}</option>
          ))}
        </select>
      </SettingsField>

      <SettingsField label={`Bitrate · ${bitrate} Mbps`}>
        <input
          type="range"
          min={4}
          max={50}
          value={bitrate}
          onChange={(e) => setBitrate(Number(e.target.value))}
          className="neon-slider"
        />
      </SettingsField>

      {[
        { label: 'Cinematic LUT export', on: lutExport, set: setLutExport },
        { label: 'AI upscaling', on: aiUpscale, set: setAiUpscale },
      ].map(({ label, on, set }) => (
        <motion.div key={label} className="flex items-center justify-between py-1">
          <span className="text-xs text-forge-text-secondary">{label}</span>
          <button
            type="button"
            onClick={() => set(!on)}
            className={`w-10 h-5 rounded-full relative transition-all ${
              on ? 'accent-gradient shadow-glow-sm' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                on ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </motion.div>
      ))}

      {status === 'completed' && outputPath && (
        <div className="pt-2 border-t border-forge-border/40 space-y-1">
          {(outputPaths && outputPaths.length > 0 ? outputPaths : [outputPath]).map((p, i) => {
            const name = p.split(/[/\\]/).pop() || p;
            const isShortPart = /-short-\d+/i.test(name);
            const isFull = /-full\./i.test(name);
            let label = '';
            if (isFull) label = 'Full: ';
            else if (isShortPart) label = `Short ${name.match(/short-(\d+)/i)?.[1] || i + 1}: `;
            else if (outputPaths && outputPaths.length > 1) label = `File ${i + 1}: `;
            return (
              <p key={`${p}-${i}`} className="text-xs text-emerald-400 truncate" title={p}>
                ✓ {label}
                {name}
              </p>
            );
          })}
        </div>
      )}
    </SettingsSection>
  );
}
