/**
 * Documentary visual templates — default DocuForge cinematic + 3 alternates.
 */

export const DEFAULT_TEMPLATE_ID = 'template_cinematic_docuforge';

export const DOCUMENTARY_TEMPLATES = [
  {
    id: DEFAULT_TEMPLATE_ID,
    name: 'Cinematic DocuForge',
    description:
      'Purple gradient accents, kinetic word subtitles, cross-dissolve chapters. The standard DocuForge look.',
    style: 'cinematic_dark',
    color_palette: {
      primary: '#7C3AED',
      secondary: '#EC4899',
      background: '#000000',
      text: '#FFFFFF',
      muted: '#94A3B8',
      accent: '#F59E0B',
    },
    font_heading: 'Bebas Neue',
    font_body: 'Inter',
    global_lut: 'cinematic_teal_orange',
    film_grain_opacity: 0.08,
    vignette_strength: 0.35,
    chromatic_aberration: true,
    audio: {
      music_volume_under_narration: 0.15,
    },
    intro: {
      style: 'cinematic_reveal',
      bg: 'linear-gradient(145deg, #050508 0%, #12122a 45%, #1a1040 100%)',
      title_color: '#FFFFFF',
      accent_color: '#7C3AED',
      duration_frames: 90,
    },
    kinetic_subtitles: {
      mode: 'word_by_word',
      position: 'bottom_center',
      margin_bottom: 80,
      style: {
        font_size: 52,
        font_weight: '700',
        color: '#FFFFFF',
        highlight_color: '#F59E0B',
        background: { enabled: true, color: 'rgba(0,0,0,0.55)', border_radius: 8 },
      },
      word_animation: {
        enter: { type: 'slide_up_fade', duration_frames: 4 },
        exit: { type: 'slide_up_fade', duration_frames: 3 },
      },
    },
    chapter_badge: {
      style: 'pill_accent',
      background: 'rgba(124,58,237,0.85)',
      color: '#FFFFFF',
      border_left: '3px solid #F59E0B',
      animation: {
        enter: { type: 'slide_right_fade', duration_frames: 15 },
        exit: { type: 'slide_left_fade', duration_frames: 12, delay_before_exit_frames: 60 },
      },
    },
    transitions: {
      default_type: 'crossfade',
      default_duration_frames: 20,
    },
    lower_thirds: {
      style: 'gradient_bar',
      accent_line_color: '#7C3AED',
    },
    progress_bar: {
      style: 'gradient_top',
      height: 3,
      color: 'linear-gradient(90deg, #7C3AED, #EC4899)',
      position: 'top',
    },
    corner_brackets: { enabled: true, color: '#7C3AED' },
    bg_effects: {
      type: 'ken_burns',
      scale_range: [1.0, 1.08],
      duration_multiplier: 1.0,
    },
    outro: {
      style: 'cinematic_cta',
      bg: 'radial-gradient(ellipse at center, #0F0A1E 0%, #000000 100%)',
      cta_colors: { subscribe: '#7C3AED', like: '#EC4899' },
    },
  },

  {
    id: 'template_cinematic_noir',
    name: 'Cinematic Noir',
    description:
      'High-contrast black & white with gold accents. Ken Burns slow zooms, dramatic chapter reveals.',
    style: 'noir_documentary',
    color_palette: {
      primary: '#D4AF37',
      secondary: '#8B0000',
      background: '#0A0A0A',
      text: '#F5F5F0',
      muted: '#6B6B6B',
      accent: '#8B0000',
    },
    font_heading: 'Cormorant Garamond',
    font_body: 'Libre Baskerville',
    global_lut: 'desaturated',
    film_grain_opacity: 0.18,
    vignette_strength: 0.55,
    chromatic_aberration: false,
    audio: { music_volume_under_narration: 0.1 },
    intro: {
      style: 'typewriter_title',
      bg: 'radial-gradient(ellipse at center, #1A1A1A 0%, #000000 100%)',
      title_color: '#D4AF37',
      accent_color: '#D4AF37',
      duration_frames: 120,
    },
    kinetic_subtitles: {
      mode: 'word_by_word',
      position: 'bottom_center',
      margin_bottom: 80,
      style: {
        font_size: 38,
        font_style: 'italic',
        color: '#F5F5F0',
        highlight_color: '#D4AF37',
        background: { enabled: true, color: 'rgba(0,0,0,0.7)', border_radius: 3 },
      },
      word_animation: {
        enter: { type: 'fade', duration_frames: 6 },
        exit: { type: 'dissolve', duration_frames: 4 },
      },
    },
    chapter_badge: {
      style: 'serif_tag',
      background: 'transparent',
      border: '1px solid #D4AF37',
      color: '#D4AF37',
      font_style: 'italic',
      letter_spacing: 4,
      text_transform: 'uppercase',
      animation: {
        enter: { type: 'fade', duration_frames: 20 },
        exit: { type: 'fade', duration_frames: 15, delay_before_exit_frames: 90 },
      },
    },
    transitions: {
      default_type: 'fade',
      default_duration_frames: 30,
    },
    lower_thirds: {
      style: 'editorial_serif',
      accent_line_color: '#D4AF37',
    },
    progress_bar: {
      style: 'thin_gold_line',
      height: 1,
      color: '#D4AF37',
      position: 'top',
      opacity: 0.6,
    },
    corner_brackets: { enabled: false },
    bg_effects: {
      type: 'ken_burns_slow',
      scale_range: [1.0, 1.05],
      duration_multiplier: 1.4,
    },
    outro: {
      style: 'fade_to_black_title_card',
      bg: '#000000',
      cta_colors: { subscribe: '#D4AF37', like: '#8B0000' },
    },
  },

  {
    id: 'template_hype_sports',
    name: 'Hype Sports',
    description:
      'Fast cuts, neon energy. Rapid word drops, punchy stats. Made for social clips.',
    style: 'hype_sports_youtube',
    color_palette: {
      primary: '#00F5FF',
      secondary: '#FF006E',
      background: '#050510',
      text: '#FFFFFF',
      muted: '#8892B0',
      accent: '#FFE600',
    },
    font_heading: 'Black Han Sans',
    font_body: 'DM Sans',
    global_lut: 'warm_contrast',
    film_grain_opacity: 0.04,
    vignette_strength: 0.2,
    chromatic_aberration: true,
    glitch_intensity: 0.6,
    audio: { music_volume_under_narration: 0.2 },
    intro: {
      style: 'glitch_slam',
      bg: 'linear-gradient(135deg, #050510 0%, #0A0A2E 100%)',
      title_color: '#FFFFFF',
      accent_color: '#00F5FF',
      duration_frames: 60,
    },
    kinetic_subtitles: {
      mode: 'word_by_word',
      position: 'center',
      style: {
        font_size: 72,
        font_weight: '900',
        color: '#FFFFFF',
        highlight_color: '#00F5FF',
        text_transform: 'uppercase',
        text_shadow: '0 0 30px #00F5FF, 0 0 60px #FF006E',
        background: { enabled: false },
        stroke: { enabled: true, color: '#000000', width: 3 },
      },
      word_animation: {
        enter: { type: 'slam_scale', duration_frames: 3 },
        exit: { type: 'instant_pop', duration_frames: 2 },
      },
    },
    chapter_badge: {
      style: 'neon_pill',
      background: 'linear-gradient(90deg, rgba(0,245,255,0.13), rgba(255,0,110,0.13))',
      border: '1px solid #00F5FF',
      color: '#00F5FF',
      box_shadow: '0 0 12px rgba(0,245,255,0.4)',
      animation: {
        enter: { type: 'slide_right_fade', duration_frames: 8 },
        exit: { type: 'slide_left_fade', duration_frames: 6, delay_before_exit_frames: 50 },
      },
    },
    transitions: {
      default_type: 'wipe',
      default_duration_frames: 4,
    },
    lower_thirds: {
      style: 'cyber_bar',
      accent_line_color: '#00F5FF',
    },
    progress_bar: {
      style: 'neon_gradient',
      height: 4,
      color: 'linear-gradient(90deg, #00F5FF, #FF006E)',
      position: 'top',
    },
    corner_brackets: { enabled: true, color: '#00F5FF' },
    bg_effects: {
      type: 'quick_zoom_cuts',
      scale_range: [1.0, 1.12],
      duration_multiplier: 0.6,
    },
    outro: {
      style: 'neon_endcard',
      bg: 'radial-gradient(ellipse, #0A0A2E 0%, #050510 100%)',
      cta_colors: { subscribe: '#00F5FF', like: '#FF006E' },
    },
  },

  {
    id: 'template_premium_longform',
    name: 'Premium Longform',
    description:
      'Warm earth tones, editorial layout. Slow poetic pacing. Netflix-style documentary.',
    style: 'premium_editorial_netflix',
    color_palette: {
      primary: '#E8DCC8',
      secondary: '#C4956A',
      background: '#1C1410',
      text: '#F0EAE0',
      muted: '#9A8B78',
      accent: '#D4622A',
    },
    font_heading: 'Playfair Display',
    font_body: 'Source Serif 4',
    global_lut: 'warm_golden',
    film_grain_opacity: 0.12,
    vignette_strength: 0.45,
    chromatic_aberration: false,
    audio: { music_volume_under_narration: 0.08 },
    intro: {
      style: 'editorial_build',
      bg: '#1C1410',
      title_color: '#E8DCC8',
      accent_color: '#C4956A',
      duration_frames: 150,
    },
    kinetic_subtitles: {
      mode: 'word_by_word',
      position: 'bottom_left',
      margin_left: 80,
      margin_bottom: 90,
      style: {
        font_size: 34,
        font_weight: '400',
        font_style: 'italic',
        color: '#F0EAE0',
        highlight_color: '#C4956A',
        background: { enabled: false },
      },
      word_animation: {
        enter: { type: 'fade_slide_right', duration_frames: 8 },
        exit: { type: 'fade', duration_frames: 6 },
      },
    },
    chapter_badge: {
      style: 'editorial_category',
      background: 'transparent',
      border_bottom: '1px solid #C4956A',
      color: '#C4956A',
      font_style: 'italic',
      animation: {
        enter: { type: 'fade', duration_frames: 25 },
        exit: { type: 'fade', duration_frames: 20, delay_before_exit_frames: 120 },
      },
    },
    transitions: {
      default_type: 'crossfade',
      default_duration_frames: 45,
    },
    lower_thirds: {
      style: 'magazine_pullout',
      accent_line_color: '#D4622A',
    },
    progress_bar: {
      style: 'warm_thin',
      height: 2,
      color: '#C4956A',
      position: 'bottom',
      opacity: 0.5,
    },
    corner_brackets: { enabled: false },
    bg_effects: {
      type: 'ken_burns_poetic',
      scale_range: [1.0, 1.04],
      duration_multiplier: 1.8,
    },
    outro: {
      style: 'warm_editorial_close',
      bg: '#1C1410',
      cta_colors: { subscribe: '#C4956A', like: '#D4622A' },
    },
  },
];

const LEGACY_TEMPLATE_MAP = {
  history: DEFAULT_TEMPLATE_ID,
  corporate: DEFAULT_TEMPLATE_ID,
  travel: DEFAULT_TEMPLATE_ID,
  product: 'template_hype_sports',
};

export function getDocumentaryTemplate(templateId) {
  const resolvedId = LEGACY_TEMPLATE_MAP[templateId] || templateId || DEFAULT_TEMPLATE_ID;
  return (
    DOCUMENTARY_TEMPLATES.find((t) => t.id === resolvedId) ||
    DOCUMENTARY_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID)
  );
}

/** Intro graphic length in seconds — must match Remotion `introGraphicSec` for subtitle sync. */
export function getIntroGraphicSec(templateId, fps = 30) {
  const theme = resolveVisualTheme(getDocumentaryTemplate(templateId));
  return (theme.intro?.durationFrames ?? 90) / fps;
}

/** Flatten template into Remotion-friendly theme tokens. */
export function resolveVisualTheme(template) {
  const t = template || getDocumentaryTemplate(DEFAULT_TEMPLATE_ID);
  const p = t.color_palette || {};
  const intro = t.intro || {};
  const subs = t.kinetic_subtitles || {};
  const badge = t.chapter_badge || {};
  const bar = t.progress_bar || {};
  const bg = t.bg_effects || {};
  const outro = t.outro || {};

  return {
    id: t.id,
    name: t.name,
    style: t.style,
    palette: {
      primary: p.primary || '#7C3AED',
      secondary: p.secondary || '#EC4899',
      background: p.background || '#0a0a0f',
      text: p.text || '#FFFFFF',
      muted: p.muted || '#94A3B8',
      accent: p.accent || '#F59E0B',
    },
    fonts: {
      heading: t.font_heading || 'Bebas Neue',
      body: t.font_body || 'Inter',
    },
    globalLut: t.global_lut || 'cinematic_teal_orange',
    filmGrain: t.film_grain_opacity ?? 0.08,
    vignette: t.vignette_strength ?? 0.35,
    cornerBrackets: t.corner_brackets?.enabled !== false,
    bracketColor: t.corner_brackets?.color || p.primary,
    intro: {
      style: intro.style || 'cinematic_reveal',
      bg: intro.bg || '#0a0a0f',
      titleColor: intro.title_color || p.text,
      accentColor: intro.accent_color || p.primary,
      durationFrames: intro.duration_frames || 90,
    },
    subtitles: {
      position: subs.position || 'bottom_center',
      marginBottom: subs.margin_bottom ?? 80,
      marginLeft: subs.margin_left ?? 0,
      fontSize: subs.style?.font_size ?? 52,
      fontWeight: subs.style?.font_weight || '700',
      fontStyle: subs.style?.font_style || 'normal',
      color: subs.style?.color || p.text,
      highlightColor: subs.style?.highlight_color || p.accent,
      textTransform: subs.style?.text_transform || 'none',
      textShadow: subs.style?.text_shadow,
      background: subs.style?.background,
      stroke: subs.style?.stroke,
      enterAnimation: subs.word_animation?.enter?.type || 'slide_up_fade',
      exitAnimation: subs.word_animation?.exit?.type || 'slide_up_fade',
    },
    chapterBadge: {
      style: badge.style || 'pill_accent',
      background: badge.background,
      border: badge.border,
      borderBottom: badge.border_bottom,
      color: badge.color || p.primary,
      borderLeft: badge.border_left,
      boxShadow: badge.box_shadow,
      fontStyle: badge.font_style,
      letterSpacing: badge.letter_spacing ?? 0,
      textTransform: badge.text_transform || 'none',
      exitDelayFrames: badge.animation?.exit?.delay_before_exit_frames ?? 60,
    },
    progressBar: {
      height: bar.height ?? 3,
      color: bar.color || p.primary,
      position: bar.position || 'top',
      opacity: bar.opacity ?? 1,
    },
    lowerThird: {
      style: t.lower_thirds?.style || 'gradient_bar',
      accentColor: t.lower_thirds?.accent_line_color || p.primary,
    },
    transitions: {
      defaultType: t.transitions?.default_type || 'crossfade',
      durationFrames: t.transitions?.default_duration_frames || 20,
    },
    bgEffects: {
      scaleMin: bg.scale_range?.[0] ?? 1.0,
      scaleMax: bg.scale_range?.[1] ?? 1.08,
      durationMultiplier: bg.duration_multiplier ?? 1.0,
    },
    outro: {
      style: outro.style || 'cinematic_cta',
      bg: outro.bg || p.background,
      ctaSubscribe: outro.cta_colors?.subscribe || p.primary,
      ctaLike: outro.cta_colors?.like || p.secondary,
    },
    musicDuckLevel: t.audio?.music_volume_under_narration ?? 0.15,
  };
}

export function listDocumentaryTemplates() {
  return DOCUMENTARY_TEMPLATES.map(({ id, name, description, style }) => ({
    id,
    name,
    description,
    style,
  }));
}
