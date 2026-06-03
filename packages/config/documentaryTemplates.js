/**
 * DocuForge Visual Templates — Production-Grade v2
 *
 * What's new vs v1:
 *  - Remotion-native transition names (fade, slide, wipe, flip, clock, none)
 *  - Subtitle sync config aligned with @remotion/captions createTikTokStyleCaptions()
 *  - Ken Burns via Remotion's interpolate() — explicit easing + direction per segment
 *  - Lower-third spec expanded (name, title, icon, position, animation tokens)
 *  - Chapter badge now carries full enter/hold/exit timing in frames
 *  - Intro spec includes typewriter, glitch, editorial, and cinematic_reveal modes
 *  - Outro carries endcard grid layout (4-slot YouTube endcard or minimal fade)
 *  - Audio section includes per-segment ducking envelope
 *  - resolveVisualTheme() returns flat, Remotion-prop-ready tokens
 *  - getIntroGraphicSec() synced to template durationFrames for subtitle offset
 *  - New helper: getTransitionConfig(templateId, type?) — safe Remotion transition
 *  - New helper: getSubtitleConfig(templateId) — ready for createTikTokStyleCaptions
 *  - New helper: getKenBurnsConfig(templateId, segmentIndex) — per-clip animation
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_TEMPLATE_ID = 'template_premium_longform';
export const DEFAULT_FPS = 30;

/**
 * Remotion @remotion/transitions presentation names.
 * These map 1-to-1 with the presentations exported from that package.
 *
 * | Value           | Remotion API              | Notes                        |
 * |-----------------|---------------------------|------------------------------|
 * | fade            | fade()                    | opacity cross-fade           |
 * | slide           | slide()                   | direction-aware slide        |
 * | wipe            | wipe()                    | directional wipe             |
 * | flip            | flip()                    | 3-D card flip                |
 * | clock           | clock()                   | clock-wipe / iris            |
 * | dissolve        | dissolve()                | HTML-in-canvas dissolve      |
 * | ripple          | ripple()                  | sinusoidal ripple            |
 * | none            | (AbsoluteFill, no series) | hard cut                     |
 */
const VALID_TRANSITIONS = ['fade', 'slide', 'wipe', 'flip', 'clock', 'dissolve', 'ripple', 'none'];

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export const DOCUMENTARY_TEMPLATES = [

  // ─── PREMIUM LONGFORM (sole template) ─────────────────────────────────────
  {
    id: 'template_premium_longform',
    name: 'Premium Longform',
    description:
      'Warm earth tones, editorial serif fonts, slow poetic pacing. Netflix / BBC documentary aesthetic.',
    style: 'premium_editorial_netflix',

    color_palette: {
      primary:    '#E8DCC8',
      secondary:  '#C4956A',
      background: '#1C1410',
      text:       '#F0EAE0',
      muted:      '#9A8B78',
      accent:     '#D4622A',
    },

    font_heading: 'Playfair Display',
    font_body:    'Source Serif 4',
    font_mono:    'Courier Prime',
    google_fonts: [
      'Playfair+Display:ital,wght@0,400;0,700;1,400',
      'Source+Serif+4:ital,wght@0,400;1,400',
    ],

    global_lut:           'warm_golden',
    film_grain_opacity:   0.12,
    vignette_strength:    0.45,
    chromatic_aberration: false,

    audio: {
      music_volume_under_narration: 0.08,
      music_volume_full:            0.70,
      duck_fade_frames:             24,
    },

    intro: {
      style:             'editorial_build',
      bg:                '#1C1410',
      title_color:       '#E8DCC8',
      accent_color:      '#C4956A',
      duration_frames:   150,
      title_in_frame:    40,
      subtitle_in_frame: 90,
    },

    subtitles: {
      mode:       'word_by_word',
      chunk_size: 1,

      layout: {
        position:      'bottom_left',
        margin_bottom: 90,
        margin_left:   80,
        margin_right:  80,
        max_width_px:  700,
      },

      style: {
        font_size:       34,
        font_weight:     '400',
        font_style:      'italic',
        letter_spacing:  0.5,
        text_transform:  'none',
        color:           '#F0EAE0',
        highlight_color: '#C4956A',
        text_shadow:     null,
        background: {
          enabled:       false,
          color:         'transparent',
          border_radius: 0,
          padding_x:     0,
          padding_y:     0,
        },
        stroke: { enabled: false, color: '#000', width: 0 },
      },

      word_animation: {
        enter: { type: 'fade_slide_right', duration_frames: 8, spring_mass: 1, spring_damping: 22 },
        exit:  { type: 'fade',             duration_frames: 6 },
      },
    },

    chapter_badge: {
      style:          'editorial_category',
      background:     'transparent',
      border:         null,
      border_left:    null,
      border_bottom:  '1px solid #C4956A',
      color:          '#C4956A',
      box_shadow:     null,
      font_style:     'italic',
      letter_spacing: 2,
      text_transform: 'none',
      animation: {
        enter: { type: 'fade', duration_frames: 25 },
        hold_frames:    120,
        exit:  { type: 'fade', duration_frames: 20 },
      },
    },

    transitions: {
      default_presentation:    'fade',
      default_duration_frames: 45,
      chapter_overrides:       {},
      slide_direction:         'from-right',
      wipe_angle_deg:          0,
      flip_direction:          'from-right',
    },

    lower_thirds: {
      style:             'magazine_pullout',
      accent_line_color: '#D4622A',
      position_bottom:   120,
      position_left:     60,
      name_font_size:    30,
      name_font_weight:  '700',
      name_color:        '#F0EAE0',
      title_font_size:   20,
      title_color:       '#9A8B78',
      animation: {
        enter: { type: 'fade_slide_right', duration_frames: 25 },
        hold_frames:      150,
        exit:  { type: 'fade',             duration_frames: 20 },
      },
    },

    progress_bar: {
      style:    'warm_thin',
      height:   2,
      color:    '#C4956A',
      position: 'bottom',
      opacity:  0.5,
    },

    corner_brackets: { enabled: false, color: '#C4956A', size: 24, weight: 1 },

    bg_effects: {
      type:               'ken_burns_poetic',
      scale_min:          1.0,
      scale_max:          1.04,
      directions:         ['zoom_in', 'pan_left', 'pan_up', 'zoom_out'],
      easing:             'easeInOut',
      duration_multiplier: 1.8,
    },

    outro: {
      style:           'warm_editorial_close',
      bg:              '#1C1410',
      duration_frames: 200,
      endcard_layout:  'minimal_2',
      cta_colors: {
        subscribe: '#C4956A',
        like:      '#D4622A',
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Legacy template alias map (keep backward-compat with old templateId strings)
// ---------------------------------------------------------------------------

const LEGACY_TEMPLATE_MAP = {
  history: DEFAULT_TEMPLATE_ID,
  corporate: DEFAULT_TEMPLATE_ID,
  travel: DEFAULT_TEMPLATE_ID,
  product: DEFAULT_TEMPLATE_ID,
  template_cinematic_docuforge: DEFAULT_TEMPLATE_ID,
  template_cinematic_noir: DEFAULT_TEMPLATE_ID,
  template_hype_sports: DEFAULT_TEMPLATE_ID,
};

// ---------------------------------------------------------------------------
// Core lookup
// ---------------------------------------------------------------------------

/**
 * Look up a template by ID, with legacy alias resolution.
 * Falls back to the default template if not found.
 *
 * @param {string} [templateId]
 * @returns {object} Raw template definition
 */
export function getDocumentaryTemplate(templateId) {
  const resolvedId = LEGACY_TEMPLATE_MAP[templateId] || templateId || DEFAULT_TEMPLATE_ID;
  return (
    DOCUMENTARY_TEMPLATES.find((t) => t.id === resolvedId) ||
    DOCUMENTARY_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID)
  );
}

/**
 * List all templates (metadata only — safe to send to front-end selectors).
 *
 * @returns {{ id, name, description, style }[]}
 */
export function listDocumentaryTemplates() {
  return DOCUMENTARY_TEMPLATES.map(({ id, name, description, style, color_palette }) => ({
    id,
    name,
    description,
    style,
    /** Preview swatch colours for the template picker UI */
    swatch: {
      primary:    color_palette.primary,
      secondary:  color_palette.secondary,
      background: color_palette.background,
    },
  }));
}

// ---------------------------------------------------------------------------
// resolveVisualTheme — flat Remotion-ready token map
// ---------------------------------------------------------------------------

/**
 * Flatten a raw template definition into a flat object of Remotion-ready
 * prop tokens. Import this in your Remotion composition and spread / destructure
 * where needed.
 *
 * @param {object | string} [templateOrId] - Template object or ID string
 * @returns {object} Flat theme token map
 */
export function resolveVisualTheme(templateOrId) {
  const t =
    typeof templateOrId === 'string'
      ? getDocumentaryTemplate(templateOrId)
      : templateOrId || getDocumentaryTemplate(DEFAULT_TEMPLATE_ID);

  const p    = t.color_palette  || {};
  const intro = t.intro          || {};
  const subs  = t.subtitles      || {};
  const badge = t.chapter_badge  || {};
  const bar   = t.progress_bar   || {};
  const bg    = t.bg_effects     || {};
  const outro = t.outro          || {};
  const lt    = t.lower_thirds   || {};
  const audio = t.audio          || {};
  const trans = t.transitions    || {};
  const cb    = t.corner_brackets || {};
  const sl    = subs.layout      || {};
  const ss    = subs.style       || {};
  const ssb   = ss.background    || {};
  const sss   = ss.stroke        || {};
  const swea  = subs.word_animation || {};

  // Validate / sanitise transition type
  const rawPresentation = trans.default_presentation || 'fade';
  const safePresentation = VALID_TRANSITIONS.includes(rawPresentation)
    ? rawPresentation
    : 'fade';

  return {
    // ── Identity
    id:    t.id,
    name:  t.name,
    style: t.style,

    // ── Colour palette
    palette: {
      primary:    p.primary    || '#7C3AED',
      secondary:  p.secondary  || '#EC4899',
      background: p.background || '#0a0a0f',
      text:       p.text       || '#FFFFFF',
      muted:      p.muted      || '#94A3B8',
      accent:     p.accent     || '#F59E0B',
    },

    // ── Typography
    fonts: {
      heading: t.font_heading || 'Bebas Neue',
      body:    t.font_body    || 'Inter',
      mono:    t.font_mono    || 'JetBrains Mono',
    },
    googleFonts: t.google_fonts || [],

    // ── Post-processing FX
    globalLut:           t.global_lut           || 'cinematic_teal_orange',
    filmGrain:           t.film_grain_opacity    ?? 0.08,
    vignette:            t.vignette_strength     ?? 0.35,
    chromaticAberration: t.chromatic_aberration  ?? false,
    glitchIntensity:     t.glitch_intensity      ?? 0,
    effects: {
      filmGrain:           t.film_grain_opacity    ?? 0.08,
      vignette:            t.vignette_strength     ?? 0.35,
      chromaticAberration: t.chromatic_aberration  ?? false,
      glitchIntensity:     t.glitch_intensity      ?? 0,
      lightLeak:
        t.style === 'cinematic_dark' ||
        t.style === 'premium_editorial_netflix' ||
        t.style === 'hype_sports_youtube',
      lightLeakHue:
        t.style === 'hype_sports_youtube'
          ? 210
          : t.style === 'premium_editorial_netflix'
            ? 32
            : 275,
      accentShapes:
        t.style === 'hype_sports_youtube' ||
        t.style === 'cinematic_dark',
      motionBlur:
        t.style === 'hype_sports_youtube' ||
        trans.default_presentation === 'wipe',
    },

    // ── Audio
    audio: {
      musicUnderNarration: audio.music_volume_under_narration ?? 0.15,
      musicFull:           audio.music_volume_full            ?? 0.85,
      duckFadeFrames:      audio.duck_fade_frames             ?? 12,
    },

    // ── Intro
    intro: {
      style:           intro.style             || 'cinematic_reveal',
      bg:              intro.bg                || p.background,
      titleColor:      intro.title_color       || p.text,
      accentColor:     intro.accent_color      || p.primary,
      durationFrames:  intro.duration_frames   || 90,
      titleInFrame:    intro.title_in_frame    || 24,
      subtitleInFrame: intro.subtitle_in_frame || 48,
    },

    // ── Subtitles (@remotion/captions ready)
    subtitles: {
      mode:      subs.mode       || 'word_by_word',
      chunkSize: subs.chunk_size || 1,
      position: sl.position      || 'bottom_center',
      marginBottom: sl.margin_bottom ?? 80,
      marginLeft:  sl.margin_left   ?? 0,
      marginRight: sl.margin_right  ?? 0,
      maxWidthPx:  sl.max_width_px  || 900,
      fontSize:       ss.font_size      ?? 52,
      fontWeight:     ss.font_weight    || '700',
      fontStyle:      ss.font_style     || 'normal',
      letterSpacing:  ss.letter_spacing ?? 0,
      textTransform:  ss.text_transform || 'none',
      color:          ss.color          || p.text,
      highlightColor: ss.highlight_color || p.accent,
      textShadow:     ss.text_shadow    || null,
      background: {
        enabled:      ssb.enabled       ?? false,
        color:        ssb.color         || 'rgba(0,0,0,0.55)',
        borderRadius: ssb.border_radius ?? 8,
        border_radius: ssb.border_radius ?? 8,
        paddingX:     ssb.padding_x     ?? 12,
        paddingY:     ssb.padding_y     ?? 6,
      },
      stroke: {
        enabled: sss.enabled ?? false,
        color:   sss.color   || '#000000',
        width:   sss.width   ?? 0,
      },
      enterAnimation: swea.enter?.type || 'slide_up_fade',
      exitAnimation: swea.exit?.type || 'slide_up_fade',
      layout: {
        position:    sl.position      || 'bottom_center',
        marginBottom: sl.margin_bottom ?? 80,
        marginLeft:  sl.margin_left   ?? 0,
        marginRight: sl.margin_right  ?? 0,
        maxWidthPx:  sl.max_width_px  || 900,
      },
      style: {
        fontSize:       ss.font_size      ?? 52,
        fontWeight:     ss.font_weight    || '700',
        fontStyle:      ss.font_style     || 'normal',
        letterSpacing:  ss.letter_spacing ?? 0,
        textTransform:  ss.text_transform || 'none',
        color:          ss.color          || p.text,
        highlightColor: ss.highlight_color || p.accent,
        textShadow:     ss.text_shadow    || null,
        background: {
          enabled:      ssb.enabled       ?? false,
          color:        ssb.color         || 'rgba(0,0,0,0.55)',
          borderRadius: ssb.border_radius ?? 8,
          paddingX:     ssb.padding_x     ?? 12,
          paddingY:     ssb.padding_y     ?? 6,
        },
        stroke: {
          enabled: sss.enabled ?? false,
          color:   sss.color   || '#000000',
          width:   sss.width   ?? 0,
        },
      },
      wordAnimation: {
        enterType:      swea.enter?.type           || 'slide_up_fade',
        enterFrames:    swea.enter?.duration_frames ?? 4,
        enterMass:      swea.enter?.spring_mass     ?? 0.8,
        enterDamping:   swea.enter?.spring_damping  ?? 14,
        exitType:       swea.exit?.type            || 'slide_up_fade',
        exitFrames:     swea.exit?.duration_frames  ?? 3,
      },
    },

    // ── Chapter badge
    chapterBadge: {
      style:          badge.style          || 'pill_accent',
      background:     badge.background     || null,
      border:         badge.border         || null,
      borderLeft:     badge.border_left    || null,
      borderBottom:   badge.border_bottom  || null,
      color:          badge.color          || p.primary,
      boxShadow:      badge.box_shadow     || null,
      fontStyle:      badge.font_style     || 'normal',
      letterSpacing:  badge.letter_spacing ?? 0,
      textTransform:  badge.text_transform || 'none',
      /** Frame when exit fade begins — used by ChapterBadge.tsx */
      exitDelayFrames: badge.animation?.hold_frames ?? 60,
      animation: {
        enterType:      badge.animation?.enter?.type           || 'slide_right_fade',
        enterFrames:    badge.animation?.enter?.duration_frames ?? 15,
        holdFrames:     badge.animation?.hold_frames            ?? 60,
        exitType:       badge.animation?.exit?.type            || 'slide_left_fade',
        exitFrames:     badge.animation?.exit?.duration_frames  ?? 12,
      },
    },

    // ── Transitions (Remotion TransitionSeries)
    transitions: {
      presentation:    safePresentation,
      durationFrames:  trans.default_duration_frames || 20,
      chapterOverrides: Object.fromEntries(
        Object.entries(trans.chapter_overrides || {}).map(([k, v]) => [
          k,
          {
            presentation: VALID_TRANSITIONS.includes(v.presentation) ? v.presentation : safePresentation,
            durationFrames: v.duration_frames || trans.default_duration_frames || 20,
          },
        ])
      ),
      slideDirection: trans.slide_direction  || 'from-right',
      wipeAngleDeg:   trans.wipe_angle_deg   ?? 0,
      flipDirection:  trans.flip_direction   || 'from-right',
    },

    // ── Lower thirds
    lowerThird: {
      style:           lt.style             || 'gradient_bar',
      accentColor:     lt.accent_line_color || p.primary,
      positionBottom:  lt.position_bottom   ?? 120,
      positionLeft:    lt.position_left     ?? 60,
      nameFontSize:    lt.name_font_size    ?? 32,
      nameFontWeight:  lt.name_font_weight  || '700',
      nameColor:       lt.name_color        || p.text,
      titleFontSize:   lt.title_font_size   ?? 22,
      titleColor:      lt.title_color       || p.muted,
      animation: {
        enterType:    lt.animation?.enter?.type           || 'slide_right_fade',
        enterFrames:  lt.animation?.enter?.duration_frames ?? 18,
        holdFrames:   lt.animation?.hold_frames            ?? 120,
        exitType:     lt.animation?.exit?.type            || 'slide_left_fade',
        exitFrames:   lt.animation?.exit?.duration_frames  ?? 14,
      },
    },

    // ── Progress bar
    progressBar: {
      style:    bar.style    || 'gradient_top',
      height:   bar.height   ?? 3,
      color:    bar.color    || p.primary,
      position: bar.position || 'top',
      opacity:  bar.opacity  ?? 1,
    },

    // ── Corner brackets
    cornerBrackets: {
      enabled: cb.enabled !== false,
      color:   cb.color  || p.primary,
      size:    cb.size   ?? 24,
      weight:  cb.weight ?? 2,
    },
    bracketColor: cb.color || p.primary,

    // ── Ken Burns / bg motion
    bgEffects: {
      type:               bg.type                || 'ken_burns',
      scaleMin:           bg.scale_min           ?? 1.0,
      scaleMax:           bg.scale_max           ?? 1.08,
      directions:         bg.directions          || ['zoom_in'],
      easing:             bg.easing              || 'easeInOut',
      durationMultiplier: bg.duration_multiplier ?? 1.0,
    },

    // ── Outro
    outro: {
      style:          outro.style           || 'cinematic_cta',
      bg:             outro.bg              || p.background,
      durationFrames: outro.duration_frames ?? 150,
      endcardLayout:  outro.endcard_layout  || 'full_4',
      ctaSubscribe:   outro.cta_colors?.subscribe || p.primary,
      ctaLike:        outro.cta_colors?.like      || p.secondary,
    },

    // ── Music ducking shorthand
    musicDuckLevel: audio.music_volume_under_narration ?? 0.15,
  };
}

// ---------------------------------------------------------------------------
// Helper — intro graphic duration (syncs with subtitle offset)
// ---------------------------------------------------------------------------

/**
 * Returns the intro graphic length in **seconds** so the Remotion composition
 * can offset subtitle timing correctly.
 *
 * Usage in composition:
 *   const introSec = getIntroGraphicSec(templateId, fps);
 *   // pass as prop to your subtitle <Sequence> startFrom offset
 *
 * @param {string} [templateId]
 * @param {number} [fps=30]
 * @returns {number}
 */
export function getIntroGraphicSec(templateId, fps = DEFAULT_FPS) {
  const theme = resolveVisualTheme(getDocumentaryTemplate(templateId));
  return theme.intro.durationFrames / fps;
}

// ---------------------------------------------------------------------------
// Helper — transition config for a specific chapter
// ---------------------------------------------------------------------------

/**
 * Returns the Remotion-ready transition config for a given chapter index.
 * Merges chapter-level overrides on top of the template default.
 *
 * @param {string}  [templateId]
 * @param {number}  [chapterIndex=0]
 * @returns {{ presentation: string, durationFrames: number, slideDirection: string, wipeAngleDeg: number, flipDirection: string }}
 *
 * @example
 * import { TransitionSeries, fade, slide } from '@remotion/transitions';
 * const tc = getTransitionConfig('template_hype_sports', 2);
 * // tc.presentation === 'wipe'
 * // Use tc in your <TransitionSeries.Transition presentation={wipe()} durationInFrames={tc.durationFrames} />
 */
export function getTransitionConfig(templateId, chapterIndex = 0) {
  const theme = resolveVisualTheme(getDocumentaryTemplate(templateId));
  const tr    = theme.transitions;
  const over  = tr.chapterOverrides[chapterIndex];

  return {
    presentation:    over?.presentation   || tr.presentation,
    durationFrames:  over?.durationFrames || tr.durationFrames,
    slideDirection:  tr.slideDirection,
    wipeAngleDeg:    tr.wipeAngleDeg,
    flipDirection:   tr.flipDirection,
  };
}

// ---------------------------------------------------------------------------
// Helper — subtitle config ready for @remotion/captions
// ---------------------------------------------------------------------------

/**
 * Returns the subtitle style object ready to be passed directly to the
 * word-by-word caption renderer or createTikTokStyleCaptions().
 *
 * @param {string} [templateId]
 * @returns {object}
 *
 * @example
 * import { createTikTokStyleCaptions } from '@remotion/captions';
 * const subConfig = getSubtitleConfig('template_cinematic_docuforge');
 * const { captions } = createTikTokStyleCaptions({
 *   captions: rawCaptions,
 *   combineTokensWithinMilliseconds: subConfig.chunkMs,
 * });
 */
export function getSubtitleConfig(templateId) {
  const theme = resolveVisualTheme(getDocumentaryTemplate(templateId));
  const s     = theme.subtitles;

  return {
    mode:       s.mode,
    chunkSize:  s.chunkSize,
    /** Approx ms per chunk — used by createTikTokStyleCaptions combineTokensWithinMilliseconds */
    chunkMs:    s.chunkSize === 1 ? 200 : 800,
    layout:     s.layout,
    style:      s.style,
    animation:  s.wordAnimation,
  };
}

// ---------------------------------------------------------------------------
// Helper — Ken Burns config for a specific clip
// ---------------------------------------------------------------------------

/**
 * Returns per-clip Ken Burns parameters for use with Remotion's interpolate().
 *
 * Cycles through the template's `directions` array using the segment index.
 *
 * @param {string} [templateId]
 * @param {number} [segmentIndex=0]
 * @returns {{ scaleFrom: number, scaleTo: number, xFrom: number, xTo: number, yFrom: number, yTo: number, easing: string, durationMultiplier: number }}
 *
 * @example
 * const kb = getKenBurnsConfig(templateId, segmentIndex);
 * const scale = interpolate(frame, [0, durationInFrames * kb.durationMultiplier], [kb.scaleFrom, kb.scaleTo]);
 */
export function getKenBurnsConfig(templateId, segmentIndex = 0) {
  const theme = resolveVisualTheme(getDocumentaryTemplate(templateId));
  const bg    = theme.bgEffects;

  const directions = bg.directions.length > 0 ? bg.directions : ['zoom_in'];
  const direction  = directions[segmentIndex % directions.length];

  const PAN_OFFSET = 0.04; // fraction of frame (4 % pan)

  const directionMap = {
    zoom_in:     { scaleFrom: bg.scaleMin, scaleTo: bg.scaleMax, xFrom: 0, xTo: 0,           yFrom: 0,           yTo: 0 },
    zoom_out:    { scaleFrom: bg.scaleMax, scaleTo: bg.scaleMin, xFrom: 0, xTo: 0,           yFrom: 0,           yTo: 0 },
    pan_right:   { scaleFrom: bg.scaleMin, scaleTo: bg.scaleMin, xFrom: -PAN_OFFSET, xTo: PAN_OFFSET, yFrom: 0, yTo: 0 },
    pan_left:    { scaleFrom: bg.scaleMin, scaleTo: bg.scaleMin, xFrom: PAN_OFFSET, xTo: -PAN_OFFSET, yFrom: 0, yTo: 0 },
    pan_up:      { scaleFrom: bg.scaleMin, scaleTo: bg.scaleMin, xFrom: 0, xTo: 0, yFrom: PAN_OFFSET, yTo: -PAN_OFFSET },
    pan_down:    { scaleFrom: bg.scaleMin, scaleTo: bg.scaleMin, xFrom: 0, xTo: 0, yFrom: -PAN_OFFSET, yTo: PAN_OFFSET },
    diagonal_tl: { scaleFrom: bg.scaleMin, scaleTo: bg.scaleMax, xFrom: PAN_OFFSET, xTo: -PAN_OFFSET * 0.5, yFrom: PAN_OFFSET, yTo: -PAN_OFFSET * 0.5 },
    diagonal_br: { scaleFrom: bg.scaleMax, scaleTo: bg.scaleMin, xFrom: -PAN_OFFSET, xTo: PAN_OFFSET * 0.5, yFrom: -PAN_OFFSET, yTo: PAN_OFFSET * 0.5 },
  };

  const coords = directionMap[direction] || directionMap.zoom_in;

  return {
    ...coords,
    direction,
    easing:             bg.easing,
    durationMultiplier: bg.durationMultiplier,
  };
}
