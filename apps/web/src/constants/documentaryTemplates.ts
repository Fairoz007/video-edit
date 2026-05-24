/** Visual documentary templates (mirrors @docuforge/config/documentaryTemplates). */
export const DEFAULT_TEMPLATE_ID = 'template_cinematic_docuforge';
export const DEFAULT_SHORTS_TEMPLATE_ID = 'template_youtube_shorts';

/** Intro length in seconds at 30fps — mirrors documentaryTemplates intro.duration_frames */
export const TEMPLATE_INTRO_SEC: Record<string, number> = {
  [DEFAULT_TEMPLATE_ID]: 3,
  template_cinematic_noir: 4,
  template_hype_sports: 2,
  template_premium_longform: 5,
  template_epic_cinematic: 4,
  template_dynamic_documentary: 2.5,
  [DEFAULT_SHORTS_TEMPLATE_ID]: 1.5,
  template_shorts_viral_burst: 1.2,
  template_shorts_neon_pulse: 1.4,
  template_shorts_story_mode: 2,
};

export function getTemplateIntroSec(templateId?: string): number {
  const id = templateId || DEFAULT_TEMPLATE_ID;
  return TEMPLATE_INTRO_SEC[id] ?? TEMPLATE_INTRO_SEC[DEFAULT_TEMPLATE_ID];
}

export interface DocumentaryTemplateOption {
  id: string;
  name: string;
  description: string;
  style: string;
  format?: 'longform' | 'shorts';
  preview?: { primary: string; secondary: string; background: string };
}

/** 16:9 full documentary — Documentary settings & main render. */
export const DOCUMENTARY_VISUAL_TEMPLATES: DocumentaryTemplateOption[] = [
  {
    id: DEFAULT_TEMPLATE_ID,
    name: 'Cinematic DocuForge',
    description:
      'Purple accents, kinetic subtitles, fade/slide/dissolve/wipe/flip transitions, light leaks.',
    style: 'cinematic_dark',
    format: 'longform',
    preview: { primary: '#7C3AED', secondary: '#EC4899', background: '#000000' },
  },
  {
    id: 'template_epic_cinematic',
    name: 'Epic Cinematic',
    description:
      'Clock, flip & dissolve cuts, motion blur, pulse vignette, dramatic Ken Burns — premium docs.',
    style: 'epic_cinematic',
    format: 'longform',
    preview: { primary: '#3B82F6', secondary: '#F97316', background: '#030712' },
  },
  {
    id: 'template_dynamic_documentary',
    name: 'Dynamic Documentary',
    description:
      'Ripple, dissolve & flip rhythm, glitch accents, slam captions — modern explainers.',
    style: 'dynamic_documentary',
    format: 'longform',
    preview: { primary: '#10B981', secondary: '#6366F1', background: '#0B0F14' },
  },
  {
    id: 'template_cinematic_noir',
    name: 'Cinematic Noir',
    description: 'High-contrast B&W with gold accents. Slow Ken Burns, dramatic serif tags.',
    style: 'noir_documentary',
    format: 'longform',
    preview: { primary: '#D4AF37', secondary: '#8B0000', background: '#0A0A0A' },
  },
  {
    id: 'template_hype_sports',
    name: 'Hype Sports',
    description: 'Fast wipes & flips, neon energy, slam subtitles, motion blur.',
    style: 'hype_sports_youtube',
    format: 'longform',
    preview: { primary: '#00F5FF', secondary: '#FF006E', background: '#050510' },
  },
  {
    id: 'template_premium_longform',
    name: 'Premium Longform',
    description: 'Warm earth tones, editorial pacing, soft dissolves. Netflix-style.',
    style: 'premium_editorial_netflix',
    format: 'longform',
    preview: { primary: '#E8DCC8', secondary: '#C4956A', background: '#1C1410' },
  },
];

/** 9:16 Shorts only — Export settings when Shorts / full+Shorts is enabled. */
export const YOUTUBE_SHORTS_VISUAL_TEMPLATES: DocumentaryTemplateOption[] = [
  {
    id: DEFAULT_SHORTS_TEMPLATE_ID,
    name: 'YouTube Shorts',
    description:
      'Hook intro, bottom captions, wipe/flip/slide/clock mix, motion blur & light leaks.',
    style: 'youtube_shorts_vertical',
    format: 'shorts',
    preview: { primary: '#FF0033', secondary: '#FFFFFF', background: '#0A0A0A' },
  },
  {
    id: 'template_shorts_viral_burst',
    name: 'Viral Burst',
    description:
      'Ultra-fast flip/wipe, glitch intro, center slam captions — max retention.',
    style: 'shorts_viral_burst',
    format: 'shorts',
    preview: { primary: '#FFE600', secondary: '#FF006E', background: '#000000' },
  },
  {
    id: 'template_shorts_neon_pulse',
    name: 'Neon Pulse',
    description: 'Ripple & clock cuts, chromatic glow, cyber lower thirds.',
    style: 'shorts_neon_pulse',
    format: 'shorts',
    preview: { primary: '#00F5FF', secondary: '#BF00FF', background: '#050510' },
  },
  {
    id: 'template_shorts_story_mode',
    name: 'Story Mode',
    description: 'Editorial dissolves, warm leaks, line captions — narrative Shorts.',
    style: 'shorts_story_mode',
    format: 'shorts',
    preview: { primary: '#E8DCC8', secondary: '#C4956A', background: '#1C1410' },
  },
];

export const WALKTHROUGH_FORMAT_TEMPLATES = [
  {
    id: 'walkthrough',
    name: 'App / UI Walkthrough',
    description: 'Stitch-style slides, zoom, progress bar, voiceover',
    videoStyle: 'walkthrough' as const,
  },
  {
    id: 'product',
    name: 'Product Demo',
    description: 'Screen-by-screen with slide & wipe transitions',
    videoStyle: 'walkthrough' as const,
  },
];
