/**
 * Shared prompts and JSON normalization for Groq / Gemini script generation.
 */
import {
  TARGET_VIDEO_DURATION_SEC,
  MIN_NARRATION_WORDS,
  NARRATION_WORDS_PER_MINUTE,
  SCRIPT_SECTION_IDS,
  SCRIPT_SECTION_DURATION_HINTS,
} from '../constants/videoDefaults.js';
import { expandScriptSections, countWords } from './scriptLength.js';

export const SCRIPT_SYSTEM_PROMPT = `You are an award-winning documentary screenwriter for Netflix/BBC-style YouTube films.

Create a cinematic, emotional, story-driven script — NOT news copy, NOT generic AI narration, NOT a listicle.

STYLE (mandatory):
- Strong storytelling structure; hook viewers in the first 15 seconds (opening section).
- Natural human narration: varied rhythm, short punches mixed with longer reflective lines.
- Cinematic pacing with curiosity loops, suspense, and emotional build.
- Vivid imagery and descriptive storytelling; avoid repetitive sentence patterns.
- Use realistic dialogue or historical/contextual quotes when relevant (woven into narration).
- Every section must flow like a story beat, not an encyclopedia article or press briefing.
- Tone: cinematic, emotional, intelligent, suspenseful, immersive, documentary-quality.
- Do NOT write like a TV news anchor ("Get ready for...", "In this video we will...", "Let's dive in").
- Do NOT use bullet-point facts without narrative glue between them.
- Outro: end with a thought-provoking reflection — NOT a hard sell. No mandatory "subscribe and like" unless it fits organically in one quiet line at the very end.

STRUCTURE — exactly these sections in order:
1. opening — powerful cinematic cold open / hook
2. introduction — subject and central tension
3. backstory — context and rising tension
4. rising_action — main events, emotional build-up
5. revelation — turning point or key reveal
6. climax — peak emotional/dramatic moment
7. conclusion — emotional resolution
8. ending — final haunting or reflective thought

TARGET LENGTH: ${TARGET_VIDEO_DURATION_SEC} seconds (~${TARGET_VIDEO_DURATION_SEC / 60} minutes) when spoken at ~${NARRATION_WORDS_PER_MINUTE} WPM.
Total spoken narration MUST be at least ${MIN_NARRATION_WORDS} words across all sections.

OUTPUT: valid JSON only, no markdown.

Each section object MUST include:
- id (one of the structure ids above)
- sceneHeading — short cinematic scene title (e.g. "Night Over the City")
- title — chapter label for on-screen use
- visualDirection — camera, lighting, mood, framing (1–3 sentences)
- narration — spoken words ONLY (what the voiceover says; no stage directions in this field)
- brollSuggestions — array of 2–4 concrete stock-footage search phrases for this beat
- audioDesign — background music mood + key SFX (e.g. "low strings swell; distant crowd ambience")
- transitionNotes — how we enter/exit the scene (dissolve, smash cut, match cut, etc.)
- durationEstimate — seconds; all sections must sum to exactly ${TARGET_VIDEO_DURATION_SEC}

FACTS: Use only facts supported by the research context. Do not invent controversial claims or fake quotes.`;

function sectionDurationHint(id) {
  return SCRIPT_SECTION_DURATION_HINTS[id] ?? Math.round(TARGET_VIDEO_DURATION_SEC / SCRIPT_SECTION_IDS.length);
}

function exampleSection(id, title, sceneHeading) {
  const dur = sectionDurationHint(id);
  return `    {
      "id": "${id}",
      "sceneHeading": "${sceneHeading}",
      "title": "${title}",
      "visualDirection": "...",
      "narration": "...",
      "brollSuggestions": ["...", "..."],
      "audioDesign": "...",
      "transitionNotes": "...",
      "durationEstimate": ${dur}
    }`;
}

export function buildScriptUserPrompt({ topic, researchText, sourceMeta }) {
  const sectionExamples = [
    exampleSection('opening', 'The Hook', 'Before the Storm'),
    exampleSection('introduction', 'The Question', 'Faces in the Crowd'),
    exampleSection('backstory', 'Roots of Fire', 'Archive Room'),
    exampleSection('rising_action', 'Pressure Builds', 'Crossroads'),
    exampleSection('revelation', 'The Truth Emerges', 'Unveiled'),
    exampleSection('climax', 'Breaking Point', 'The Roar'),
    exampleSection('conclusion', 'Aftermath', 'Quiet Dawn'),
    exampleSection('ending', 'What Remains', 'Last Light'),
  ].join(',\n');

  return `Topic: ${topic}

Research context:
${(researchText || 'No extra research.').slice(0, 6000)}

${sourceMeta?.articleUrl || sourceMeta?.sourceUrl ? `Source article: ${sourceMeta.articleUrl || sourceMeta.sourceUrl}` : ''}
${sourceMeta?.youtubeUrl ? `Source video: ${sourceMeta.youtubeUrl}` : ''}

Return JSON with this shape (all 8 sections required, ids exactly as listed):
{
  "topic": "string",
  "sections": [
${sectionExamples}
  ]
}`;
}

function normalizeBroll(value) {
  if (Array.isArray(value)) {
    const list = value.map((v) => String(v || '').trim()).filter(Boolean);
    return list.length ? list : undefined;
  }
  const single = String(value || '').trim();
  return single ? [single] : undefined;
}

function normalizeSections(sections) {
  const list = Array.isArray(sections) ? sections : [];
  const sum = list.reduce((a, s) => a + (Number(s.durationEstimate) || 0), 0);
  const scale = sum > 0 ? TARGET_VIDEO_DURATION_SEC / sum : 1;

  return list.map((s) => {
    const id = String(s.id || 'section');
    const title = String(s.title || s.sceneHeading || id);
    const sceneHeading = String(s.sceneHeading || title).trim();
    const visualDirection = String(s.visualDirection || '').trim();
    const audioDesign = String(
      s.audioDesign || s.backgroundMusic || s.musicSfx || '',
    ).trim();
    const transitionNotes = String(s.transitionNotes || s.transition || '').trim();

    return {
      id,
      title,
      sceneHeading: sceneHeading || title,
      narration: String(s.narration || '').trim(),
      ...(visualDirection ? { visualDirection } : {}),
      ...(normalizeBroll(s.brollSuggestions) ? { brollSuggestions: normalizeBroll(s.brollSuggestions) } : {}),
      ...(audioDesign ? { audioDesign } : {}),
      ...(transitionNotes ? { transitionNotes } : {}),
      durationEstimate: Math.max(
        5,
        Math.round((Number(s.durationEstimate) || TARGET_VIDEO_DURATION_SEC / list.length) * scale),
      ),
    };
  });
}

export function fixDurationSum(sections) {
  const normalized = normalizeSections(sections);
  const diff =
    TARGET_VIDEO_DURATION_SEC -
    normalized.reduce((a, s) => a + s.durationEstimate, 0);
  if (normalized.length && diff !== 0) {
    normalized[normalized.length - 1].durationEstimate = Math.max(
      5,
      normalized[normalized.length - 1].durationEstimate + diff,
    );
  }
  return normalized;
}

export function parseScriptJson(raw, providerLabel = 'LLM') {
  if (!raw) throw new Error(`Empty response from ${providerLabel}`);
  try {
    return JSON.parse(raw);
  } catch {
    const match = String(raw).match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`${providerLabel} returned non-JSON script`);
    return JSON.parse(match[0]);
  }
}

export function finalizeScript({ parsed, topic, sourceMeta, engine, model, researchText = '' }) {
  let sections = fixDurationSum(parsed.sections);
  sections = expandScriptSections(sections, researchText);
  const fullNarration = sections.map((s) => s.narration).join('\n\n');
  const wordCount = countWords(fullNarration);
  if (wordCount < MIN_NARRATION_WORDS * 0.85) {
    console.warn(
      `[${engine}] Script only ${wordCount} words (target ≥${MIN_NARRATION_WORDS}); narration may run short.`,
    );
  }

  return {
    topic: parsed.topic || topic,
    sections,
    fullNarration,
    metadata: {
      ...sourceMeta,
      generatedAt: new Date().toISOString(),
      engine,
      model,
      targetDurationSec: TARGET_VIDEO_DURATION_SEC,
      scriptStyle: 'cinematic_documentary',
    },
  };
}
