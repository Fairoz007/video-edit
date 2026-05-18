import { createContext, useContext } from 'react';

export interface VisualTheme {
  id: string;
  name: string;
  style: string;
  palette: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    muted: string;
    accent: string;
  };
  fonts: { heading: string; body: string };
  globalLut: string;
  filmGrain: number;
  vignette: number;
  cornerBrackets: boolean;
  bracketColor: string;
  intro: {
    style: string;
    bg: string;
    titleColor: string;
    accentColor: string;
    durationFrames: number;
  };
  subtitles: {
    position: string;
    marginBottom: number;
    marginLeft: number;
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
    color: string;
    highlightColor: string;
    textTransform: string;
    textShadow?: string;
    background?: { enabled: boolean; color?: string; border_radius?: number };
    stroke?: { enabled: boolean; color: string; width: number };
    enterAnimation: string;
    exitAnimation: string;
  };
  chapterBadge: {
    style: string;
    background?: string;
    border?: string;
    borderBottom?: string;
    color: string;
    borderLeft?: string;
    boxShadow?: string;
    fontStyle?: string;
    letterSpacing: number;
    textTransform: string;
    exitDelayFrames: number;
  };
  progressBar: {
    height: number;
    color: string;
    position: string;
    opacity: number;
  };
  lowerThird: { style: string; accentColor: string };
  transitions: { defaultType: string; durationFrames: number };
  bgEffects: { scaleMin: number; scaleMax: number; durationMultiplier: number };
  outro: {
    style: string;
    bg: string;
    ctaSubscribe: string;
    ctaLike: string;
  };
  musicDuckLevel: number;
}

export const DEFAULT_VISUAL_THEME: VisualTheme = {
  id: 'template_cinematic_docuforge',
  name: 'Cinematic DocuForge',
  style: 'cinematic_dark',
  palette: {
    primary: '#7C3AED',
    secondary: '#EC4899',
    background: '#0a0a0f',
    text: '#FFFFFF',
    muted: '#94A3B8',
    accent: '#F59E0B',
  },
  fonts: { heading: 'Bebas Neue', body: 'Inter' },
  globalLut: 'cinematic_teal_orange',
  filmGrain: 0.08,
  vignette: 0.35,
  cornerBrackets: true,
  bracketColor: '#7C3AED',
  intro: {
    style: 'cinematic_reveal',
    bg: 'linear-gradient(145deg, #050508 0%, #12122a 45%, #1a1040 100%)',
    titleColor: '#FFFFFF',
    accentColor: '#7C3AED',
    durationFrames: 90,
  },
  subtitles: {
    position: 'bottom_center',
    marginBottom: 80,
    marginLeft: 0,
    fontSize: 52,
    fontWeight: '700',
    fontStyle: 'normal',
    color: '#FFFFFF',
    highlightColor: '#F59E0B',
    textTransform: 'none',
    enterAnimation: 'slide_up_fade',
    exitAnimation: 'slide_up_fade',
    background: { enabled: true, color: 'rgba(0,0,0,0.55)', border_radius: 8 },
  },
  chapterBadge: {
    style: 'pill_accent',
    background: 'rgba(124,58,237,0.85)',
    color: '#FFFFFF',
    borderLeft: '3px solid #F59E0B',
    letterSpacing: 0,
    textTransform: 'none',
    exitDelayFrames: 60,
  },
  progressBar: {
    height: 3,
    color: 'linear-gradient(90deg, #7C3AED, #EC4899)',
    position: 'top',
    opacity: 1,
  },
  lowerThird: { style: 'gradient_bar', accentColor: '#7C3AED' },
  transitions: { defaultType: 'crossfade', durationFrames: 20 },
  bgEffects: { scaleMin: 1.0, scaleMax: 1.08, durationMultiplier: 1.0 },
  outro: {
    style: 'cinematic_cta',
    bg: 'radial-gradient(ellipse at center, #0F0A1E 0%, #000000 100%)',
    ctaSubscribe: '#7C3AED',
    ctaLike: '#EC4899',
  },
  musicDuckLevel: 0.15,
};

const TemplateContext = createContext<VisualTheme>(DEFAULT_VISUAL_THEME);

export const TemplateProvider = TemplateContext.Provider;

export function useVisualTemplate(): VisualTheme {
  return useContext(TemplateContext);
}
