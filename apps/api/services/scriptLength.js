import {
  MIN_NARRATION_WORDS,
  TARGET_VIDEO_DURATION_SEC,
} from '../constants/videoDefaults.js';

export function countWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Pad thin fallback scripts so TTS can reach ~3:00. */
export function expandScriptSections(sections, researchText = '') {
  const facts =
    String(researchText || '')
      .match(/[^.!?]+[.!?]+/g)
      ?.map((s) => s.trim())
      .filter((s) => s.length > 40) || [];

  let total = sections.reduce((a, s) => a + countWords(s.narration), 0);
  if (total >= MIN_NARRATION_WORDS) return sections;

  const expanded = sections.map((s) => ({ ...s }));
  let factIdx = 0;

  while (total < MIN_NARRATION_WORDS && factIdx < facts.length * 3) {
    const fact = facts[factIdx % Math.max(facts.length, 1)];
    const target =
      expanded.find((s) => s.id === 'rising_action') ||
      expanded.find((s) => s.id === 'climax') ||
      expanded.find((s) => s.id === 'backstory') ||
      expanded[Math.floor(expanded.length / 2)];

    if (target && fact) {
      target.narration = `${target.narration} ${fact}`.trim();
      total = expanded.reduce((a, s) => a + countWords(s.narration), 0);
    }
    factIdx++;
    if (!facts.length) break;
  }

  const fillerSentences = [
    'The weight of that moment still lingers — not in dates on a page, but in the lives reshaped around it.',
    'Listen closely, and you can hear the thread connecting then to now, thin but unbroken.',
    'History rarely moves in straight lines; it bends through doubt, courage, and accidents no one planned for.',
    'What looked inevitable from a distance was, up close, a series of fragile choices under pressure.',
    'The archive remembers what headlines forget: hesitation, hope, and the silence between decisions.',
    'To hold this story whole, you have to feel its rhythm — slow where it breathes, sharp where it breaks.',
  ];

  let fillerIdx = 0;
  while (total < MIN_NARRATION_WORDS) {
    const targets = expanded.filter((s) => s.id !== 'opening' && s.id !== 'ending');
    if (!targets.length) break;
    const target = targets[fillerIdx % targets.length];
    const extra = facts.length
      ? facts[fillerIdx % facts.length]
      : fillerSentences[fillerIdx % fillerSentences.length];
    target.narration = `${target.narration} ${extra}`.trim();
    total = expanded.reduce((a, sec) => a + countWords(sec.narration), 0);
    fillerIdx++;
    if (fillerIdx > MIN_NARRATION_WORDS * 2) break;
  }

  const sum = expanded.reduce((a, s) => a + (s.durationEstimate || 0), 0);
  const scale = sum > 0 ? TARGET_VIDEO_DURATION_SEC / sum : 1;
  for (const s of expanded) {
    s.durationEstimate = Math.max(5, Math.round((s.durationEstimate || 20) * scale));
  }

  return expanded;
}
