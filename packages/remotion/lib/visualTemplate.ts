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
  chromaticAberration?: boolean;
  glitchIntensity?: number;
  effects?: {
    filmGrain?: number;
    vignette?: number;
    chromaticAberration?: boolean;
    glitchIntensity?: number;
    lightLeak?: boolean;
    lightLeakHue?: number;
    accentShapes?: boolean;
    motionBlur?: boolean;
  };
  cornerBrackets:
    | boolean
    | {
        enabled: boolean;
        color: string;
        size: number;
        weight: number;
      };
  bracketColor?: string;
  intro: {
    style: string;
    bg: string;
    titleColor: string;
    accentColor: string;
    durationFrames: number;
  };
  subtitles: {
    mode?: string;
    chunkSize?: number;
    position: string;
    marginBottom: number;
    marginLeft: number;
    marginRight?: number;
    maxWidthPx?: number;
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
    letterSpacing?: number;
    color: string;
    highlightColor: string;
    textTransform: string;
    textShadow?: string;
    background?: {
      enabled: boolean;
      color?: string;
      borderRadius?: number;
      border_radius?: number;
      paddingX?: number;
      paddingY?: number;
    };
    stroke?: { enabled: boolean; color: string; width: number };
    enterAnimation: string;
    exitAnimation: string;
    layout?: {
      position: string;
      marginBottom: number;
      marginLeft: number;
      marginRight: number;
      maxWidthPx: number;
    };
    style?: Record<string, unknown>;
    wordAnimation?: Record<string, unknown>;
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
  transitions: {
    presentation?: string;
    defaultType?: string;
    durationFrames: number;
    slideDirection?: string;
    wipeAngleDeg?: number;
    flipDirection?: string;
  };
  bgEffects: {
    scaleMin: number;
    scaleMax: number;
    durationMultiplier: number;
    directions?: string[];
    easing?: string;
    type?: string;
  };
  outro: {
    style: string;
    bg: string;
    ctaSubscribe: string;
    ctaLike: string;
  };
  musicDuckLevel: number;
}

export const DEFAULT_VISUAL_THEME: VisualTheme = {
  id: 'template_premium_longform',
  name: 'Premium Longform',
  style: 'premium_editorial_netflix',
  palette: {
    primary: '#E8DCC8',
    secondary: '#C4956A',
    background: '#1C1410',
    text: '#F0EAE0',
    muted: '#9A8B78',
    accent: '#D4622A',
  },
  fonts: { heading: 'Playfair Display', body: 'Source Serif 4' },
  globalLut: 'warm_golden',
  filmGrain: 0.12,
  vignette: 0.45,
  chromaticAberration: false,
  glitchIntensity: 0,
  effects: {
    filmGrain: 0.12,
    vignette: 0.45,
    chromaticAberration: false,
    glitchIntensity: 0,
    lightLeak: true,
    lightLeakHue: 32,
    accentShapes: false,
    motionBlur: false,
  },
  cornerBrackets: {
    enabled: false,
    color: '#C4956A',
    size: 24,
    weight: 1,
  },
  bracketColor: '#C4956A',
  intro: {
    style: 'editorial_build',
    bg: '#1C1410',
    titleColor: '#E8DCC8',
    accentColor: '#C4956A',
    durationFrames: 150,
  },
  subtitles: {
    position: 'bottom_left',
    marginBottom: 90,
    marginLeft: 80,
    fontSize: 34,
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#F0EAE0',
    highlightColor: '#C4956A',
    textTransform: 'none',
    enterAnimation: 'fade_slide_right',
    exitAnimation: 'fade',
    background: { enabled: false, color: 'transparent', border_radius: 0 },
  },
  chapterBadge: {
    style: 'editorial_category',
    background: 'transparent',
    color: '#C4956A',
    borderLeft: null,
    letterSpacing: 2,
    textTransform: 'none',
    exitDelayFrames: 120,
  },
  progressBar: {
    height: 2,
    color: '#C4956A',
    position: 'bottom',
    opacity: 0.5,
  },
  lowerThird: { style: 'magazine_pullout', accentColor: '#D4622A' },
  transitions: { presentation: 'fade', defaultType: 'crossfade', durationFrames: 45 },
  bgEffects: { scaleMin: 1.0, scaleMax: 1.04, durationMultiplier: 1.8 },
  outro: {
    style: 'warm_editorial_close',
    bg: '#1C1410',
    ctaSubscribe: '#C4956A',
    ctaLike: '#D4622A',
  },
  musicDuckLevel: 0.08,
};

const TemplateContext = createContext<VisualTheme>(DEFAULT_VISUAL_THEME);

export const TemplateProvider = TemplateContext.Provider;

export function useVisualTemplate(): VisualTheme {
  return useContext(TemplateContext);
}
