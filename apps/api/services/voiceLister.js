/**
 * Chatterbox-TTS voice catalog (Turbo + Multilingual v3).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOICES_JSON = path.join(__dirname, '../chatterbox/voices.json');

function readLocalCatalog() {
  const catalog = JSON.parse(fs.readFileSync(VOICES_JSON, 'utf8'));
  return {
    platform: 'chatterbox',
    provider: 'Resemble AI Chatterbox-TTS',
    device: process.env.CHATTERBOX_DEVICE || 'auto',
    models: {
      turbo: 'ResembleAI/chatterbox-turbo',
      multilingual: `ResembleAI/chatterbox (t3=${process.env.CHATTERBOX_MTL_T3 || 'v3'})`,
    },
    voices: catalog.voices,
    defaultVoice: catalog.defaultVoice,
    paralinguisticTags: ['[laugh]', '[chuckle]', '[cough]', '[sigh]'],
  };
}

export async function listSystemVoices() {
  return readLocalCatalog();
}

const LEGACY_VOICE_MAP = {
  'samantha-en': 'chatterbox-turbo',
  'alex-en': 'chatterbox-turbo',
  alex: 'chatterbox-turbo',
  samantha: 'chatterbox-turbo',
  Samantha: 'chatterbox-turbo',
  Alex: 'chatterbox-turbo',
  'narrator-en': 'chatterbox-turbo-narrator',
  'expressive-en': 'chatterbox-turbo-expressive',
  'default-mtl-en': 'chatterbox-multilingual-v3-en',
};

export function pickVoice(voices, requested) {
  const fallback = 'chatterbox-turbo';
  if (!voices?.length) {
    return LEGACY_VOICE_MAP[requested] || requested || fallback;
  }
  const mapped = LEGACY_VOICE_MAP[requested] || requested;
  if (mapped && voices.some((v) => v.id === mapped || v.name === mapped)) {
    return mapped;
  }
  return voices.find((v) => v.id === fallback)?.id || voices[0].id;
}

export function getVoiceMeta(voices, voiceId) {
  return voices?.find((v) => v.id === voiceId) || null;
}
