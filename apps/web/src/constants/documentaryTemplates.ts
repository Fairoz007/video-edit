/** Visual documentary templates (mirrors @docuforge/config/documentaryTemplates). */
export const DEFAULT_TEMPLATE_ID = 'template_cinematic_docuforge';

export interface DocumentaryTemplateOption {
  id: string;
  name: string;
  description: string;
  style: string;
  preview?: { primary: string; secondary: string; background: string };
}

export const DOCUMENTARY_VISUAL_TEMPLATES: DocumentaryTemplateOption[] = [
  {
    id: DEFAULT_TEMPLATE_ID,
    name: 'Cinematic DocuForge',
    description:
      'Purple gradient accents, kinetic word subtitles, cross-dissolve chapters. Default look.',
    style: 'cinematic_dark',
    preview: { primary: '#7C3AED', secondary: '#EC4899', background: '#000000' },
  },
  {
    id: 'template_cinematic_noir',
    name: 'Cinematic Noir',
    description: 'High-contrast B&W with gold accents. Slow Ken Burns, dramatic serif tags.',
    style: 'noir_documentary',
    preview: { primary: '#D4AF37', secondary: '#8B0000', background: '#0A0A0A' },
  },
  {
    id: 'template_hype_sports',
    name: 'Hype Sports',
    description: 'Fast cuts, neon energy, slam subtitles. Built for social clips.',
    style: 'hype_sports_youtube',
    preview: { primary: '#00F5FF', secondary: '#FF006E', background: '#050510' },
  },
  {
    id: 'template_premium_longform',
    name: 'Premium Longform',
    description: 'Warm earth tones, editorial pacing. Netflix-style documentary.',
    style: 'premium_editorial_netflix',
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
