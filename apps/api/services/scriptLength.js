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
      expanded.find((s) => s.id === 'modern') ||
      expanded.find((s) => s.id === 'growth') ||
      expanded[Math.floor(expanded.length / 2)];

    if (target && fact) {
      target.narration = `${target.narration} ${fact}`.trim();
      total = expanded.reduce((a, s) => a + countWords(s.narration), 0);
    }
    factIdx++;
    if (!facts.length) break;
  }

  const fillerSentences = [
    'This chapter shaped the broader narrative in ways historians still debate today, connecting past decisions to the world we see now.',
    'Archives, oral histories, and contemporary reporting together paint a picture that is richer than any single headline.',
    'Understanding this period means weighing context, culture, and the incentives that moved people and institutions at the time.',
    'The details matter because they explain not only what happened, but why those events still echo in the present.',
    'Scholars continue to revisit primary sources, adjusting the story as new evidence comes to light.',
    'For viewers following along, keep these threads in mind as we move from origins through growth into the modern era.',
  ];

  let fillerIdx = 0;
  while (total < MIN_NARRATION_WORDS) {
    const targets = expanded.filter((s) => s.id !== 'intro' && s.id !== 'outro');
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
