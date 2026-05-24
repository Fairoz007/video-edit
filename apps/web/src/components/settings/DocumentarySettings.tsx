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

export function DocumentarySettings() {
  const { script, input, setInput, media } = useProjectStore();
  const { rebuildTimelineFlow } = useDocumentaryPipeline();

  const editMode = input.editMode || 'with-narration';
  const templateId = input.templateId || DEFAULT_TEMPLATE_ID;

  return (
    <SettingsSection title="Documentary settings" icon={Clapperboard}>
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

      <SettingsField label="Composition">
        <select className="input-field text-xs w-full">
          <option>16:9 Widescreen</option>
          <option>9:16 Vertical</option>
          <option>1:1 Square</option>
        </select>
      </SettingsField>

      <SettingsField
        label="Style"
        hint={VIDEO_STYLES.find((s) => s.id === (input.videoStyle || 'documentary'))?.hint}
      >
        <select
          className="input-field text-xs w-full"
          value={input.videoStyle || 'documentary'}
          onChange={(e) => setInput({ videoStyle: e.target.value as VideoStyle })}
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
            setInput({ templateId: next, videoStyle: 'documentary' });
            if (script && media.length > 0) {
              await rebuildTimelineFlow({ templateId: next, videoStyle: 'documentary' });
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
