import {
  NARRATION_WORDS_PER_MINUTE,
  SCRIPT_SECTION_DURATION_HINTS,
} from '../constants/videoDefaults.js';

export function countWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Spoken seconds for a narration block at configured WPM. */
export function narrationDurationSec(text, wpm = NARRATION_WORDS_PER_MINUTE) {
  const words = countWords(text);
  if (!words) return 0;
  return Math.max(5, Math.round((words / wpm) * 60));
}

/** Sum of per-section duration estimates (from narration or explicit hints). */
export function estimateScriptDurationSec(sections) {
  if (!sections?.length) return 60;
  return sections.reduce(
    (a, s) =>
      a +
      (s.durationEstimate > 0
        ? s.durationEstimate
        : narrationDurationSec(s.narration)),
    0,
  );
}

/** Align section durationEstimate with each section's narration word count. */
export function syncSectionDurationsFromNarration(sections) {
  if (!sections?.length) return sections;
  return sections.map((s) => {
    const fromWords = narrationDurationSec(s.narration);
    const explicit = Number(s.durationEstimate);
    return {
      ...s,
      durationEstimate: Math.max(5, fromWords || explicit || 10),
    };
  });
}

/**
 * Normalize section timing from narration (no fixed total length or filler padding).
 */
export function expandScriptSections(sections, _researchText = '') {
  return syncSectionDurationsFromNarration(sections);
}
