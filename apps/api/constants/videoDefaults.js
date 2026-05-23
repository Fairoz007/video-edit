/** Optional cap/override (seconds). Unset = length follows the script and narration. */
export const TARGET_VIDEO_DURATION_SEC = process.env.VIDEO_TARGET_DURATION_SEC
  ? parseInt(process.env.VIDEO_TARGET_DURATION_SEC, 10)
  : null;

export const INTRO_DURATION_SEC = 20;
export const OUTRO_DURATION_SEC = 20;

export const REMOTION_INTRO_GRAPHIC_SEC = 3;
export const REMOTION_OUTRO_GRAPHIC_SEC = 8;

/** Spoken pacing — used for script length and subtitle timing. */
export const NARRATION_WORDS_PER_MINUTE = parseInt(
  process.env.NARRATION_WPM || '150',
  10,
);

/** Stock/scrape media — prefer assets at least this wide (4K-friendly). */
export const MIN_IMAGE_WIDTH = parseInt(process.env.MIN_IMAGE_WIDTH || '1920', 10);

/** Cinematic documentary arc — order matters for pacing and TTS. */
export const SCRIPT_SECTION_IDS = [
  'opening',
  'introduction',
  'backstory',
  'rising_action',
  'revelation',
  'climax',
  'conclusion',
  'ending',
];

/** Default seconds per section when narration is not yet available (proportional arc). */
export const SCRIPT_SECTION_DURATION_HINTS = {
  opening: 15,
  introduction: 18,
  backstory: 22,
  rising_action: 35,
  revelation: 25,
  climax: 32,
  conclusion: 18,
  ending: 15,
};

/** Walkthrough / Stitch-style screen pacing (seconds per slide). */
export const WALKTHROUGH_SEC_PER_SCREEN = parseFloat(
  process.env.WALKTHROUGH_SEC_PER_SCREEN || '4',
);

export const VIDEO_STYLES = ['documentary', 'walkthrough'];
