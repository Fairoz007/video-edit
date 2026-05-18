/**
 * Pre-generated Chatterbox preview clips per voice (default rate/pitch).
 * Built on API startup so the UI can play instantly.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateVoicePreview } from './voiceGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOICES_JSON = path.join(__dirname, '../chatterbox/voices.json');

export const DEFAULT_PREVIEW_RATE = 175;
export const DEFAULT_PREVIEW_PITCH = 0;

const LANGUAGE_SAMPLES = {
  en: 'Hello, this is your DocuForge narrator.',
  fr: 'Bonjour, voici votre narrateur DocuForge.',
  es: 'Hola, soy su narrador de DocuForge.',
  de: 'Hallo, hier ist Ihr DocuForge-Erzähler.',
  zh: '你好，这是您的 DocuForge 解说员。',
  ja: 'こんにちは、DocuForge のナレーターです。',
  hi: 'नमस्ते, यह आपका DocuForge कथावाचक है।',
  ar: 'مرحباً، هذا راوي DocuForge الخاص بك.',
  pt: 'Olá, este é o seu narrador DocuForge.',
  it: 'Ciao, sono il narratore DocuForge.',
  ko: '안녕하세요, DocuForge 내레이터입니다.',
  nl: 'Hallo, dit is uw DocuForge verteller.',
  pl: 'Cześć, jestem narratorem DocuForge.',
  ru: 'Здравствуйте, это ваш рассказчик DocuForge.',
  tr: 'Merhaba, DocuForge anlatıcınız.',
};

let warming = false;
let warmPromise = null;

export function presetsDir(root) {
  return path.join(root, 'cache', 'voice-preview', 'presets');
}

export function manifestPath(root) {
  return path.join(root, 'cache', 'voice-preview', 'manifest.json');
}

export function presetFilePath(root, voiceId) {
  return path.join(presetsDir(root), `${voiceId}.mp3`);
}

export function presetPublicUrl(voiceId) {
  return `/cache/voice-preview/presets/${voiceId}.mp3`;
}

export function previewTextForVoice(voice) {
  if (voice?.previewText) return voice.previewText;
  const lang = (voice?.language || 'en').toLowerCase().slice(0, 2);
  return LANGUAGE_SAMPLES[lang] || LANGUAGE_SAMPLES.en;
}

export function isDefaultPreviewOptions(rate, pitch) {
  const r = rate ?? DEFAULT_PREVIEW_RATE;
  const p = pitch ?? DEFAULT_PREVIEW_PITCH;
  return r === DEFAULT_PREVIEW_RATE && p === DEFAULT_PREVIEW_PITCH;
}

export function readManifest(root) {
  const p = manifestPath(root);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function writeManifest(root, voices) {
  const dir = path.dirname(manifestPath(root));
  fs.mkdirSync(dir, { recursive: true });
  const payload = {
    version: 1,
    rate: DEFAULT_PREVIEW_RATE,
    pitch: DEFAULT_PREVIEW_PITCH,
    generatedAt: new Date().toISOString(),
    voices,
  };
  fs.writeFileSync(manifestPath(root), JSON.stringify(payload, null, 2));
  return payload;
}

export function getCachedPreset(root, voiceId, rate, pitch) {
  if (!isDefaultPreviewOptions(rate, pitch)) return null;
  const file = presetFilePath(root, voiceId);
  if (!fs.existsSync(file)) return null;
  return {
    url: presetPublicUrl(voiceId),
    path: file,
    cached: true,
    voice: voiceId,
    rate: DEFAULT_PREVIEW_RATE,
    pitch: DEFAULT_PREVIEW_PITCH,
  };
}

function readVoiceCatalog() {
  try {
    const catalog = JSON.parse(fs.readFileSync(VOICES_JSON, 'utf8'));
    return catalog.voices || [];
  } catch {
    return [];
  }
}

export function getPreviewCacheStatus(root) {
  const voices = readVoiceCatalog();
  const ready = [];
  const missing = [];
  for (const v of voices) {
    if (fs.existsSync(presetFilePath(root, v.id))) ready.push(v.id);
    else missing.push(v.id);
  }
  return {
    warming,
    complete: missing.length === 0,
    total: voices.length,
    ready: ready.length,
    missing,
    manifest: readManifest(root),
  };
}

export async function ensureVoicePreviews(root, { force = false } = {}) {
  fs.mkdirSync(presetsDir(root), { recursive: true });
  const voices = readVoiceCatalog();
  const manifestVoices = {};

  for (const voice of voices) {
    const outPath = presetFilePath(root, voice.id);
    if (!force && fs.existsSync(outPath)) {
      manifestVoices[voice.id] = {
        url: presetPublicUrl(voice.id),
        language: voice.language,
        engine: voice.engine,
        label: voice.label,
      };
      continue;
    }

    const text = previewTextForVoice(voice);
    console.log(`[TTS] Building preview: ${voice.label} (${voice.language})`);
    try {
      await generateVoicePreview(outPath, {
        voice: voice.id,
        rate: DEFAULT_PREVIEW_RATE,
        pitch: DEFAULT_PREVIEW_PITCH,
        text,
      });
      manifestVoices[voice.id] = {
        url: presetPublicUrl(voice.id),
        language: voice.language,
        engine: voice.engine,
        label: voice.label,
        text,
      };
    } catch (err) {
      console.error(`[TTS] Preview failed for ${voice.id}:`, err.message);
    }
  }

  writeManifest(root, manifestVoices);
  return manifestVoices;
}

export function warmVoicePreviews(root) {
  if (process.env.CHATTERBOX_WARM_PREVIEWS === '0') {
    return Promise.resolve();
  }
  if (warmPromise) return warmPromise;

  warming = true;
  warmPromise = ensureVoicePreviews(root)
    .then((voices) => {
      console.log(`[TTS] Voice preview cache ready (${Object.keys(voices).length} voices)`);
    })
    .catch((err) => {
      console.error('[TTS] Voice preview cache warmup failed:', err.message);
    })
    .finally(() => {
      warming = false;
    });

  return warmPromise;
}

export function attachPreviewUrls(root, catalog) {
  const voices = catalog.voices.map((v) => {
    const cached = getCachedPreset(root, v.id, DEFAULT_PREVIEW_RATE, DEFAULT_PREVIEW_PITCH);
    return cached ? { ...v, previewUrl: cached.url, previewReady: true } : { ...v, previewReady: false };
  });
  const status = getPreviewCacheStatus(root);
  return {
    ...catalog,
    voices,
    previewCache: {
      warming: status.warming,
      complete: status.complete,
      ready: status.ready,
      total: status.total,
    },
  };
}
