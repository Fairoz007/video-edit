/**
 * Cache short TTS preview clips per voice (default rate/pitch) for the voice picker UI.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOICES_JSON = path.join(__dirname, '../chatterbox/voices.json');

const DEFAULT_RATE = 175;
const DEFAULT_PITCH = 0;

const warmingState = {
  warming: false,
  complete: true,
};

function isPreviewWarmEnabled() {
  const v = (process.env.VOICE_PREVIEW_WARM || '0').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function readVoiceCatalog() {
  return JSON.parse(fs.readFileSync(VOICES_JSON, 'utf8'));
}

/** Which engines to prefetch on startup (comma-separated: turbo, multilingual). Default: turbo only. */
function voiceIdsForWarmup() {
  const catalog = readVoiceCatalog();
  const engines = (process.env.VOICE_PREVIEW_WARM_ENGINES || 'turbo')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const allowAll = engines.includes('all') || engines.includes('*');

  return (catalog.voices || [])
    .filter((v) => {
      if (!v.id) return false;
      if (allowAll) return true;
      const engine = (v.engine || 'turbo').toLowerCase();
      return engines.includes(engine);
    })
    .map((v) => v.id);
}

function readVoiceIds() {
  return (readVoiceCatalog().voices || []).map((v) => v.id).filter(Boolean);
}

function presetsDir(root) {
  return path.join(root, 'cache', 'voice-preview-presets');
}

function presetFilename(voice, rate, pitch) {
  const safe = String(voice).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safe}_r${rate}_p${pitch}.mp3`;
}

function presetPath(root, voice, rate = DEFAULT_RATE, pitch = DEFAULT_PITCH) {
  return path.join(presetsDir(root), presetFilename(voice, rate, pitch));
}

function presetPublicUrl(voice, rate = DEFAULT_RATE, pitch = DEFAULT_PITCH) {
  return `/cache/voice-preview-presets/${presetFilename(voice, rate, pitch)}`;
}

export function getCachedPreset(root, voice, rate = DEFAULT_RATE, pitch = DEFAULT_PITCH) {
  if (!root || !voice) return null;
  const file = presetPath(root, voice, rate, pitch);
  if (!fs.existsSync(file)) return null;
  return {
    url: presetPublicUrl(voice, rate, pitch),
    path: file,
    voice,
    rate,
    pitch,
    cached: true,
  };
}

export function getPreviewCacheStatus(root) {
  if (!isPreviewWarmEnabled()) {
    return { warming: false, complete: true, ready: 0, total: 0, missing: [] };
  }

  const ids = readVoiceIds();
  const total = ids.length;
  let ready = 0;
  const missing = [];

  if (root) {
    for (const id of ids) {
      if (fs.existsSync(presetPath(root, id))) {
        ready += 1;
      } else {
        missing.push(id);
      }
    }
  }

  const complete = !warmingState.warming && ready >= total && total > 0;

  return {
    warming: warmingState.warming,
    complete,
    ready,
    total,
    missing,
  };
}

export function attachPreviewUrls(root, catalog) {
  const voices = (catalog.voices || []).map((voice) => {
    const cached = getCachedPreset(root, voice.id);
    const previewUrl = cached?.url || voice.previewUrl;
    return {
      ...voice,
      previewUrl,
      previewReady: Boolean(previewUrl),
    };
  });

  return {
    ...catalog,
    voices,
    previewCache: getPreviewCacheStatus(root),
  };
}

export function warmVoicePreviews(root) {
  if (!isPreviewWarmEnabled()) {
    warmingState.warming = false;
    warmingState.complete = true;
    return;
  }

  if (!root || warmingState.warming) return;

  const tts = (process.env.TTS_PROVIDER || 'auto').toLowerCase();
  if (tts === 'elevenlabs') {
    warmingState.complete = true;
    return;
  }

  const ids = voiceIdsForWarmup();
  if (!ids.length) {
    warmingState.complete = true;
    return;
  }

  fs.mkdirSync(presetsDir(root), { recursive: true });

  const pending = ids.filter((id) => !fs.existsSync(presetPath(root, id)));
  if (pending.length) {
    console.log(
      `[VoicePreview] Warming ${pending.length} voice(s) (${process.env.VOICE_PREVIEW_WARM_ENGINES || 'turbo'} only)…`,
    );
  }
  if (!pending.length) {
    warmingState.complete = true;
    warmingState.warming = false;
    return;
  }

  warmingState.warming = true;
  warmingState.complete = false;

  (async () => {
    const { generateVoicePreview } = await import('./voiceGenerator.js');
    for (const id of pending) {
      const out = presetPath(root, id);
      try {
        await generateVoicePreview(out, {
          voice: id,
          rate: DEFAULT_RATE,
          pitch: DEFAULT_PITCH,
        });
        console.log(`[VoicePreview] Cached preset: ${id}`);
      } catch (err) {
        console.warn(`[VoicePreview] Failed to cache ${id}:`, err.message);
      }
    }
  })()
    .catch((err) => {
      console.warn('[VoicePreview] Warm failed:', err.message);
    })
    .finally(() => {
      warmingState.warming = false;
      const status = getPreviewCacheStatus(root);
      warmingState.complete = status.complete;
    });
}
