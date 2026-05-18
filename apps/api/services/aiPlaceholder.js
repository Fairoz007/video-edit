/**
 * Future-ready hooks for AI integrations — NOT implemented.
 * Add OpenAI, Ollama, Whisper, ElevenLabs here when needed.
 */

export const AI_PROVIDERS = {
  groq: { enabled: Boolean(process.env.GROQ_API_KEY), envKey: 'GROQ_API_KEY' },
  gemini: { enabled: Boolean(process.env.GEMINI_API_KEY), envKey: 'GEMINI_API_KEY' },
  openai: { enabled: false, envKey: 'OPENAI_API_KEY' },
  ollama: { enabled: false, baseUrl: 'http://localhost:11434' },
  whisper: { enabled: false, envKey: 'WHISPER_MODEL' },
  elevenlabs: {
    enabled: Boolean(process.env.ELEVENLABS_API_KEY?.trim()),
    envKey: 'ELEVENLABS_API_KEY',
  },
};

export function isAIEnabled(provider) {
  return AI_PROVIDERS[provider]?.enabled === true;
}

export async function generateScriptWithAI(input) {
  const { generateDocumentaryScript } = await import('./scriptGenerator.js');
  return generateDocumentaryScript(input);
}
