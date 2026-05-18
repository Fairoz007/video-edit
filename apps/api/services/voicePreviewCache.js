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
  complete: false,
};

function readVoiceIds() {
  const catalog = JSON.parse(fs.readFileSync(VOICES_JSON, 'utf8'));
  return (catalog.voices || []).map((v) => v.id).filter(Boolean);
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
    return {
      ...voice,
      previewUrl: cached?.url,
      previewReady: Boolean(cached),
    };
  });

  return {
    ...catalog,
    voices,
    previewCache: getPreviewCacheStatus(root),
  };
}

export function warmVoicePreviews(root) {
  if (!root || warmingState.warming) return;

  const ids = readVoiceIds();
  if (!ids.length) {
    warmingState.complete = true;
    return;
  }

  fs.mkdirSync(presetsDir(root), { recursive: true });

  const pending = ids.filter((id) => !fs.existsSync(presetPath(root, id)));
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
