/**
 * Groq free-tier LLM script generation (OpenAI-compatible API).
 * Set GROQ_API_KEY in .env — keys start with gsk_.
 */
import axios from 'axios';
import {
  TARGET_VIDEO_DURATION_SEC,
  INTRO_DURATION_SEC,
  OUTRO_DURATION_SEC,
  MIN_NARRATION_WORDS,
  NARRATION_WORDS_PER_MINUTE,
} from '../constants/videoDefaults.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a professional YouTube documentary scriptwriter.
Write narration for a ${TARGET_VIDEO_DURATION_SEC}-second (${TARGET_VIDEO_DURATION_SEC / 60} minute) video.

Structure (JSON only):
- intro (~${INTRO_DURATION_SEC}s): Hook the viewer, introduce the topic, set expectations.
- history, growth, modern: Factual main story using the research provided.
- outro (~${OUTRO_DURATION_SEC}s): Summarize, thank viewers, and include a clear call to action to subscribe to the channel and like the video.

Rules:
- Return valid JSON only, no markdown.
- Each section needs: id, title, narration (spoken words only), durationEstimate (seconds).
- All durationEstimate values must sum to exactly ${TARGET_VIDEO_DURATION_SEC}.
- Outro narration MUST ask viewers to subscribe and like the video.
- Write in engaging documentary voice at ~${NARRATION_WORDS_PER_MINUTE} words per minute.
- Total narration across all sections MUST be at least ${MIN_NARRATION_WORDS} words (roughly ${TARGET_VIDEO_DURATION_SEC / 60} minutes when spoken).
- Each main section (history, growth, modern) needs rich detail — multiple paragraphs, not one-liners.
- Use only facts from the research context; do not invent controversial claims.`;

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

function normalizeSections(sections) {
  const list = Array.isArray(sections) ? sections : [];
  const sum = list.reduce((a, s) => a + (Number(s.durationEstimate) || 0), 0);
  const scale = sum > 0 ? TARGET_VIDEO_DURATION_SEC / sum : 1;

  return list.map((s) => ({
    id: String(s.id || 'section'),
    title: String(s.title || s.id || 'Section'),
    narration: String(s.narration || '').trim(),
    durationEstimate: Math.max(
      5,
      Math.round((Number(s.durationEstimate) || TARGET_VIDEO_DURATION_SEC / list.length) * scale),
    ),
  }));
}

function fixDurationSum(sections) {
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

export async function generateScriptWithGroq({ topic, researchText, sourceMeta }) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const userPrompt = `Topic: ${topic}

Research context:
${(researchText || 'No extra research.').slice(0, 6000)}

${sourceMeta?.articleUrl ? `Source article: ${sourceMeta.articleUrl}` : ''}
${sourceMeta?.youtubeUrl ? `Source video: ${sourceMeta.youtubeUrl}` : ''}

Return JSON:
{
  "topic": "string",
  "sections": [
    { "id": "intro", "title": "Introduction", "narration": "...", "durationEstimate": ${INTRO_DURATION_SEC} },
    { "id": "history", "title": "...", "narration": "...", "durationEstimate": number },
    { "id": "growth", "title": "...", "narration": "...", "durationEstimate": number },
    { "id": "modern", "title": "...", "narration": "...", "durationEstimate": number },
    { "id": "outro", "title": "Outro", "narration": "... subscribe ... like ...", "durationEstimate": ${OUTRO_DURATION_SEC} }
  ]
}`;

  const { data } = await axios.post(
    GROQ_API_URL,
    {
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.65,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    },
    {
      timeout: 90000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Groq');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Groq returned non-JSON script');
    parsed = JSON.parse(match[0]);
  }

  const sections = fixDurationSum(parsed.sections);
  const fullNarration = sections.map((s) => s.narration).join('\n\n');
  const wordCount = fullNarration.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_NARRATION_WORDS * 0.85) {
    console.warn(
      `[Groq] Script only ${wordCount} words (target ≥${MIN_NARRATION_WORDS}); narration may run short.`,
    );
  }

  return {
    topic: parsed.topic || topic,
    sections,
    fullNarration,
    metadata: {
      ...sourceMeta,
      generatedAt: new Date().toISOString(),
      engine: 'groq',
      model: DEFAULT_MODEL,
      targetDurationSec: TARGET_VIDEO_DURATION_SEC,
    },
  };
}
