/** Default documentary length and Remotion timing (seconds). */
export const TARGET_VIDEO_DURATION_SEC = parseInt(
  process.env.VIDEO_TARGET_DURATION_SEC || '180',
  10,
);

export const INTRO_DURATION_SEC = 20;
export const OUTRO_DURATION_SEC = 20;

export const REMOTION_INTRO_GRAPHIC_SEC = 5;
export const REMOTION_OUTRO_GRAPHIC_SEC = 8;

/** Spoken pacing — used for script length and subtitle timing. */
export const NARRATION_WORDS_PER_MINUTE = parseInt(
  process.env.NARRATION_WPM || '150',
  10,
);

export const MIN_NARRATION_WORDS = Math.round(
  (TARGET_VIDEO_DURATION_SEC / 60) * NARRATION_WORDS_PER_MINUTE,
);

/** Stock/scrape media — prefer assets at least this wide (4K-friendly). */
export const MIN_IMAGE_WIDTH = parseInt(process.env.MIN_IMAGE_WIDTH || '1920', 10);

export const SCRIPT_SECTION_IDS = ['intro', 'history', 'growth', 'modern', 'outro'];

/** Walkthrough / Stitch-style screen pacing (seconds per slide). */
export const WALKTHROUGH_SEC_PER_SCREEN = parseFloat(
  process.env.WALKTHROUGH_SEC_PER_SCREEN || '4',
);

export const VIDEO_STYLES = ['documentary', 'walkthrough'];
