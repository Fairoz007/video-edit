/**
 * Groq free-tier LLM script generation (OpenAI-compatible API).
 * Set GROQ_API_KEY in .env — keys start with gsk_.
 */
import axios from 'axios';
import {
  SCRIPT_SYSTEM_PROMPT,
  buildScriptUserPrompt,
  parseScriptJson,
  finalizeScript,
} from './scriptLlmCommon.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export async function generateScriptWithGroq({ topic, researchText, sourceMeta }) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const userPrompt = buildScriptUserPrompt({ topic, researchText, sourceMeta });

  const { data } = await axios.post(
    GROQ_API_URL,
    {
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SCRIPT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 8192,
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
  const parsed = parseScriptJson(raw, 'Groq');
  return finalizeScript({
    parsed,
    topic,
    sourceMeta,
    engine: 'groq',
    model: DEFAULT_MODEL,
    researchText,
  });
}
