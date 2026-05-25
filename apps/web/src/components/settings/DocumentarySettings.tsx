import { Clapperboard } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline } from '../../hooks/useDocumentaryPipeline';
import type { EditMode, VideoStyle } from '../../utils/api';
import {
  DEFAULT_TEMPLATE_ID,
  DOCUMENTARY_VISUAL_TEMPLATES,
} from '../../constants/documentaryTemplates';
import { SettingsField, SettingsSection } from '../ui/SettingsSection';

const EDIT_MODES: { id: EditMode; label: string; hint: string }[] = [
  {
    id: 'with-narration',
    label: 'With narration',
    hint: 'Script, voice-over, subtitles, synced timeline',
  },
  {
    id: 'video-only',
    label: 'Video only',
    hint: 'Edit clips and timing — no TTS or narration track',
  },
];

const VIDEO_STYLES: { id: VideoStyle; label: string; hint: string }[] = [
  {
    id: 'documentary',
    label: 'Documentary',
    hint: 'Intro/outro, Ken Burns, lower thirds',
  },
  {
    id: 'walkthrough',
    label: 'Walkthrough',
    hint: 'UI slides, zoom, progress bar',
  },
];

type CompositionChoice = '16:9' | '9:16' | '1:1' | 'both';

function compositionFromExport(exportOptions: {
  preset?: string;
  autoYouTubeShorts?: boolean;
  exportFullAndShorts?: boolean;
}): CompositionChoice {
  if (exportOptions.exportFullAndShorts) return 'both';
  if (
    exportOptions.autoYouTubeShorts ||
    exportOptions.preset === 'shorts' ||
    exportOptions.preset === 'reels'
  ) {
    return '9:16';
  }
  return '16:9';
}

export function DocumentarySettings() {
  const { script, input, setInput, media, exportOptions, setExportOptions, status } =
    useProjectStore();
  const { rebuildTimelineFlow } = useDocumentaryPipeline();
  const renderActive = status === 'rendering';

  const editMode = input.editMode || 'with-narration';
  const templateId = input.templateId || DEFAULT_TEMPLATE_ID;
  const composition = compositionFromExport(exportOptions);

  return (
    <SettingsSection title="Documentary settings" icon={Clapperboard}>
      {renderActive && (
        <p className="text-[10px] text-amber-400/90 -mt-1 mb-1">
          Render in progress — changes here apply on the next export.
        </p>
      )}
      <SettingsField
        label="Edit mode"
        hint={EDIT_MODES.find((m) => m.id === editMode)?.hint}
      >
        <select
          className="input-field text-xs w-full"
          value={editMode}
          onChange={async (e) => {
            const next = e.target.value as EditMode;
            setInput({ editMode: next });
            if (script && media.length > 0) {
              await rebuildTimelineFlow({ editMode: next });
            }
          }}
        >
          {EDIT_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </SettingsField>

      <SettingsField
        label="Composition"
        hint="Aspect ratio for export — also available in Export settings"
      >
        <select
          className="input-field text-xs w-full"
          value={composition}
          onChange={(e) => {
            const choice = e.target.value as CompositionChoice;
            const basePreset =
              exportOptions.preset === 'shorts' || exportOptions.preset === 'reels'
                ? '1080p'
                : exportOptions.preset || '1080p';
            if (choice === '16:9') {
              setExportOptions({
                preset: basePreset === 'shorts' || basePreset === 'reels' ? '1080p' : basePreset,
                autoYouTubeShorts: false,
                exportFullAndShorts: false,
              });
            } else if (choice === '9:16') {
              setExportOptions({
                preset: 'shorts',
                autoYouTubeShorts: true,
                exportFullAndShorts: false,
              });
            } else if (choice === 'both') {
              setExportOptions({
                exportFullAndShorts: true,
                autoYouTubeShorts: true,
                preset: basePreset === 'shorts' || basePreset === 'reels' ? '1080p' : basePreset,
              });
            } else {
              setExportOptions({
                preset: '1080p',
                autoYouTubeShorts: false,
                exportFullAndShorts: false,
              });
            }
          }}
        >
          <option value="16:9">16:9 Widescreen</option>
          <option value="9:16">9:16 Vertical (Shorts)</option>
          <option value="1:1">1:1 Square (1080×1080)</option>
          <option value="both">16:9 + Shorts together</option>
        </select>
      </SettingsField>

      <SettingsField
        label="Style"
        hint={VIDEO_STYLES.find((s) => s.id === (input.videoStyle || 'documentary'))?.hint}
      >
        <select
          className="input-field text-xs w-full"
          value={input.videoStyle || 'documentary'}
          onChange={async (e) => {
            const next = e.target.value as VideoStyle;
            setInput({ videoStyle: next });
            if (script && media.length > 0 && next === 'documentary') {
              await rebuildTimelineFlow({ videoStyle: next });
            }
          }}
        >
          {VIDEO_STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </SettingsField>

      <SettingsField
        label="Full video template (16:9)"
        hint={
          DOCUMENTARY_VISUAL_TEMPLATES.find((t) => t.id === templateId)?.description ||
          'Long-form look — transitions, effects, intro/outro. Shorts use a separate template in Export.'
        }
      >
        <select
          className="input-field text-xs w-full"
          value={templateId}
          disabled={input.videoStyle === 'walkthrough'}
          onChange={async (e) => {
            const next = e.target.value;
            const name =
              DOCUMENTARY_VISUAL_TEMPLATES.find((t) => t.id === next)?.name || 'Template';
            setInput({ templateId: next, videoStyle: 'documentary' });
            if (script && media.length > 0) {
              const ok = await rebuildTimelineFlow({
                templateId: next,
                videoStyle: 'documentary',
              });
              if (ok) {
                useProjectStore.getState().setProgress(0, '', `Timeline updated · ${name}`);
              }
            }
          }}
        >
          {DOCUMENTARY_VISUAL_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.id === DEFAULT_TEMPLATE_ID ? ' (default)' : ''}
            </option>
          ))}
        </select>
      </SettingsField>

      {script && (
        <p className="text-xs text-forge-cyan/80 pt-2 border-t border-forge-border/40 font-medium">
          {script.sections.length} sections · {script.fullNarration.split(' ').length} words
        </p>
      )}
    </SettingsSection>
  );
}
