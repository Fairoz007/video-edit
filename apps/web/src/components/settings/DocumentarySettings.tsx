import { Clapperboard } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import type { EditMode, VideoStyle } from '../../utils/api';
import {
  DEFAULT_TEMPLATE_ID,
  DOCUMENTARY_VISUAL_TEMPLATES,
} from '../../constants/documentaryTemplates';

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
  const { script, input, setInput } = useProjectStore();

  return (
    <section className="p-3 rounded-xl bg-black/30 border border-forge-border/40">
      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
        <Clapperboard className="w-3.5 h-3.5 text-forge-accent" />
        Documentary Settings
      </h3>

      <label className="block text-[10px] text-gray-500 mb-1">Edit mode</label>
      <select
        className="input-field text-xs mb-2.5 w-full"
        value={input.editMode || 'with-narration'}
        onChange={(e) => setInput({ editMode: e.target.value as EditMode })}
      >
        {EDIT_MODES.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      <p className="text-[9px] text-gray-600 mb-2.5 -mt-1">
        {EDIT_MODES.find((m) => m.id === (input.editMode || 'with-narration'))?.hint}
      </p>

      <label className="block text-[10px] text-gray-500 mb-1">Composition</label>
      <select className="input-field text-xs mb-2.5">
        <option>16:9 Widescreen</option>
        <option>9:16 Vertical</option>
        <option>1:1 Square</option>
      </select>

      <label className="block text-[10px] text-gray-500 mb-1">Style</label>
      <select
        className="input-field text-xs mb-2.5 w-full"
        value={input.videoStyle || 'documentary'}
        onChange={(e) => setInput({ videoStyle: e.target.value as VideoStyle })}
      >
        {VIDEO_STYLES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <label className="block text-[10px] text-gray-500 mb-1">Visual template</label>
      <select
        className="input-field text-xs mb-2.5 w-full"
        value={input.templateId || DEFAULT_TEMPLATE_ID}
        disabled={input.videoStyle === 'walkthrough'}
        onChange={(e) =>
          setInput({ templateId: e.target.value, videoStyle: 'documentary' })
        }
      >
        {DOCUMENTARY_VISUAL_TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.id === DEFAULT_TEMPLATE_ID ? ' (default)' : ''}
          </option>
        ))}
      </select>
      <p className="text-[9px] text-gray-600 mb-2.5 -mt-1">
        {DOCUMENTARY_VISUAL_TEMPLATES.find((t) => t.id === (input.templateId || DEFAULT_TEMPLATE_ID))
          ?.description || 'Choose a look in Templates sidebar for previews.'}
      </p>

      {script && (
        <p className="mt-2.5 text-[10px] text-forge-cyan/70 pt-2 border-t border-forge-border/30">
          {script.sections.length} sections · {script.fullNarration.split(' ').length} words
        </p>
      )}
    </section>
  );
}
