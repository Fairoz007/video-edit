/**
 * Voice catalog — Chatterbox (local) + ElevenLabs (API).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isElevenLabsEnabled,
  listElevenLabsVoices,
  parseElevenLabsVoiceId,
} from './elevenlabsBridge.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOICES_JSON = path.join(__dirname, '../chatterbox/voices.json');

function readChatterboxCatalog() {
  const catalog = JSON.parse(fs.readFileSync(VOICES_JSON, 'utf8'));
  return {
    platform: 'chatterbox',
    provider: 'chatterbox',
    device: process.env.CHATTERBOX_DEVICE || 'auto',
    models: {
      turbo: 'ResembleAI/chatterbox-turbo',
      multilingual: `ResembleAI/chatterbox (t3=${process.env.CHATTERBOX_MTL_T3 || 'v3'})`,
    },
    voices: (catalog.voices || []).map((v) => ({
      ...v,
      provider: 'chatterbox',
      engine: v.engine || 'turbo',
    })),
    defaultVoice: catalog.defaultVoice,
    paralinguisticTags: ['[laugh]', '[chuckle]', '[cough]', '[sigh]'],
  };
}

function preferElevenLabs() {
  const mode = (process.env.TTS_PROVIDER || 'auto').toLowerCase();
  if (mode === 'chatterbox') return false;
  if (mode === 'elevenlabs') return isElevenLabsEnabled();
  return isElevenLabsEnabled();
}

export async function listSystemVoices(root) {
  const chatterbox = readChatterboxCatalog();
  let elevenlabs = [];

  if (isElevenLabsEnabled()) {
    try {
      elevenlabs = await listElevenLabsVoices();
    } catch (err) {
      console.warn('[Voices] ElevenLabs list failed:', err.message);
    }
  }

  const useEl = preferElevenLabs() && elevenlabs.length > 0;
  const voices = useEl
    ? [...elevenlabs, ...chatterbox.voices]
    : [...chatterbox.voices, ...elevenlabs];

  const envDefault = process.env.TTS_VOICE?.trim();
  let defaultVoice = envDefault || null;
  if (defaultVoice && !voices.some((v) => v.id === defaultVoice)) {
    defaultVoice = null;
  }
  if (!defaultVoice && useEl) {
    const elDefault = process.env.ELEVENLABS_VOICE_ID?.trim();
    if (elDefault) {
      const elId = elDefault.startsWith('elevenlabs:')
        ? elDefault
        : `elevenlabs:${elDefault}`;
      if (voices.some((v) => v.id === elId)) defaultVoice = elId;
    }
  }
  if (!defaultVoice) {
    defaultVoice = useEl
      ? elevenlabs[0]?.id || chatterbox.defaultVoice
      : chatterbox.defaultVoice || elevenlabs[0]?.id;
  }

  const catalog = {
    platform: useEl ? 'elevenlabs' : 'chatterbox',
    provider: useEl ? 'ElevenLabs' : 'Resemble AI Chatterbox-TTS',
    device: useEl ? 'cloud' : chatterbox.device,
    models: useEl
      ? { default: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2' }
      : chatterbox.models,
    voices,
    defaultVoice,
    paralinguisticTags: useEl ? [] : chatterbox.paralinguisticTags,
    providers: {
      elevenlabs: isElevenLabsEnabled(),
      chatterbox: true,
    },
  };

  if (!root) return catalog;
  const { attachPreviewUrls } = await import('./voicePreviewCache.js');
  return attachPreviewUrls(root, catalog);
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
  const fallback =
    voices?.find((v) => v.engine === 'elevenlabs')?.id ||
    voices?.find((v) => v.id === 'chatterbox-turbo')?.id ||
    'chatterbox-turbo';

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

export function isElevenLabsVoice(voiceId, voices) {
  if (parseElevenLabsVoiceId(voiceId)) return true;
  const meta = getVoiceMeta(voices, voiceId);
  return meta?.engine === 'elevenlabs' || meta?.provider === 'elevenlabs';
}
