/** Premium Longform — sole documentary visual template. */
export const DEFAULT_TEMPLATE_ID = 'template_premium_longform';

/** Intro length in seconds at 30fps — mirrors documentaryTemplates intro.duration_frames (150 frames). */
export const TEMPLATE_INTRO_SEC = 5;

export function getTemplateIntroSec(_templateId?: string): number {
  return TEMPLATE_INTRO_SEC;
}

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
    name: 'Premium Longform',
    description:
      'Warm earth tones, editorial pacing. Netflix / BBC documentary aesthetic.',
    style: 'premium_editorial_netflix',
    preview: { primary: '#E8DCC8', secondary: '#C4956A', background: '#1C1410' },
  },
];
