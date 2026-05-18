/**
 * Google Gemini script generation (Generative Language API).
 * Set GEMINI_API_KEY in .env — keys start with AIza.
 */
import axios from 'axios';
import {
  SCRIPT_SYSTEM_PROMPT,
  buildScriptUserPrompt,
  parseScriptJson,
  finalizeScript,
} from './scriptLlmCommon.js';

const GEMINI_API_BASE =
  process.env.GEMINI_API_BASE?.trim() ||
  'https://generativelanguage.googleapis.com/v1beta';

const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest';

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function resolveGeminiModel() {
  return DEFAULT_MODEL;
}

export async function generateScriptWithGemini({ topic, researchText, sourceMeta }) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const model = resolveGeminiModel();
  const userPrompt = buildScriptUserPrompt({ topic, researchText, sourceMeta });
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent`;

  let data;
  try {
    ({ data } = await axios.post(
      url,
      {
        systemInstruction: {
          parts: [{ text: SCRIPT_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      },
      {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
      },
    ));
  } catch (err) {
    const msg =
      err.response?.data?.error?.message ||
      err.response?.data?.error?.status ||
      err.message;
    throw new Error(`Gemini API error: ${msg}`);
  }

  const raw = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .filter(Boolean)
    .join('');

  const parsed = parseScriptJson(raw, 'Gemini');
  return finalizeScript({
    parsed,
    topic,
    sourceMeta,
    engine: 'gemini',
    model,
    researchText,
  });
}
