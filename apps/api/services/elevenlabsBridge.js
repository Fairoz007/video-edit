/**
 * ElevenLabs text-to-speech (cloud API).
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { chunkText } from '../utils/chunkText.js';

const API_BASE = 'https://api.elevenlabs.io/v1';

let voicesCache = null;
let voicesCacheAt = 0;
const VOICES_TTL_MS = 10 * 60 * 1000;

export function isElevenLabsEnabled() {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export function resolveElevenLabsModel() {
  return (
    process.env.ELEVENLABS_MODEL?.trim() ||
    'eleven_multilingual_v2'
  );
}

function apiKey() {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) {
    throw new Error('ELEVENLABS_API_KEY is not set in .env');
  }
  return key;
}

/** User-facing message from ElevenLabs API errors (402 credits, 429 rate limit, etc.). */
export function formatElevenLabsError(err) {
  const status = err.response?.status;
  let detail = err.message;
  const raw = err.response?.data;
  if (raw) {
    try {
      const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
      const json = JSON.parse(text);
      detail =
        json.detail?.message ||
        (typeof json.detail === 'string' ? json.detail : null) ||
        json.message ||
        detail;
    } catch {
      /* ignore parse errors */
    }
  }
  if (status === 402) {
    return (
      'ElevenLabs credits exhausted (payment required). Add credits at https://elevenlabs.io/subscription ' +
      'or set TTS_PROVIDER=chatterbox in .env to use local Chatterbox TTS.'
    );
  }
  if (status === 429) {
    return `ElevenLabs rate limit: ${detail}`;
  }
  if (status === 401) {
    return 'ElevenLabs API key invalid or unauthorized. Check ELEVENLABS_API_KEY in .env.';
  }
  if (status) {
    return `ElevenLabs TTS failed (${status}): ${detail}`;
  }
  return detail || 'ElevenLabs TTS failed';
}

function client() {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      'xi-api-key': apiKey(),
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    timeout: Number(process.env.ELEVENLABS_TIMEOUT_MS) || 300_000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    responseType: 'arraybuffer',
  });
}

/** Map app voice id `elevenlabs:<voice_id>` → ElevenLabs voice_id */
export function parseElevenLabsVoiceId(voiceId) {
  if (!voiceId) return null;
  if (voiceId.startsWith('elevenlabs:')) {
    return voiceId.slice('elevenlabs:'.length);
  }
  return null;
}

export function pinnedElevenLabsVoiceIds() {
  const raw = process.env.ELEVENLABS_VOICE_IDS?.trim();
  if (!raw) return null;
  const ids = raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length ? ids : null;
}

export function toElevenLabsVoiceId(appVoiceId) {
  const parsed = parseElevenLabsVoiceId(appVoiceId);
  if (parsed) return parsed;
  const pinned = pinnedElevenLabsVoiceIds();
  if (appVoiceId && pinned?.includes(appVoiceId)) return appVoiceId;
  const envDefault = process.env.ELEVENLABS_VOICE_ID?.trim();
  if (envDefault) return envDefault;
  return null;
}

function mapVoice(v) {
  const voiceId = v.voice_id || v.id;
  return {
    id: `elevenlabs:${voiceId}`,
    name: v.name || voiceId,
    label: `ElevenLabs — ${v.name || voiceId}`,
    engine: 'elevenlabs',
    provider: 'elevenlabs',
    elevenlabsVoiceId: voiceId,
    locale: v.labels?.language || v.labels?.accent || 'en',
    description: v.description || v.category || 'ElevenLabs voice',
    previewUrl: v.preview_url,
    previewReady: Boolean(v.preview_url),
  };
}

export async function listElevenLabsVoices(force = false) {
  if (!isElevenLabsEnabled()) return [];

  const now = Date.now();
  if (!force && voicesCache && now - voicesCacheAt < VOICES_TTL_MS) {
    return voicesCache;
  }

  const http = axios.create({
    baseURL: API_BASE,
    headers: { 'xi-api-key': apiKey() },
    timeout: 60_000,
  });

  const { data } = await http.get('/voices');
  let list = (data.voices || []).map(mapVoice).filter((v) => v.elevenlabsVoiceId);

  const pinned = pinnedElevenLabsVoiceIds();
  if (pinned?.length) {
    const byId = new Map(list.map((v) => [v.elevenlabsVoiceId, v]));
    const ordered = [];
    for (const id of pinned) {
      let voice = byId.get(id);
      if (!voice) {
        try {
          const { data: one } = await http.get(`/voices/${id}`);
          voice = mapVoice(one);
        } catch {
          console.warn(`[ElevenLabs] Pinned voice not found: ${id}`);
        }
      }
      if (voice) ordered.push(voice);
    }
    list = ordered;
  }

  voicesCache = list;
  voicesCacheAt = now;
  return list;
}

function rateToElevenLabsSpeed(rate = 175) {
  const wpm = Math.min(400, Math.max(80, Number(rate) || 175));
  return Math.min(1.2, Math.max(0.7, wpm / 175));
}

export async function synthesizeElevenLabs({
  text,
  outputPath,
  voiceId,
  rate = 175,
}) {
  const elVoice = toElevenLabsVoiceId(voiceId);
  if (!elVoice) {
    throw new Error(
      'Invalid ElevenLabs voice. Pick a voice from the list or set ELEVENLABS_VOICE_ID in .env',
    );
  }

  const chunks = chunkText(text);
  if (!chunks.length) {
    throw new Error('Text is required for ElevenLabs synthesis');
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const http = client();
  const modelId = resolveElevenLabsModel();
  const speed = rateToElevenLabsSpeed(rate);
  const stability = Number(process.env.ELEVENLABS_STABILITY ?? 0.5);
  const similarity = Number(process.env.ELEVENLABS_SIMILARITY ?? 0.75);

  const partPaths = [];

  for (let i = 0; i < chunks.length; i++) {
    const partPath =
      chunks.length === 1
        ? outputPath
        : outputPath.replace(/(\.[^.]+)$/, `-part${i}$1`);

    let data;
    try {
      ({ data } = await http.post(
        `/text-to-speech/${elVoice}`,
        {
          text: chunks[i],
          model_id: modelId,
          voice_settings: {
            stability,
            similarity_boost: similarity,
            speed,
          },
        },
        { responseType: 'arraybuffer' },
      ));
    } catch (err) {
      const wrapped = new Error(formatElevenLabsError(err));
      wrapped.status = err.response?.status;
      wrapped.cause = err;
      throw wrapped;
    }

    fs.writeFileSync(partPath, Buffer.from(data));
    partPaths.push(partPath);
  }

  if (partPaths.length === 1) {
    return {
      path: partPaths[0],
      voiceId: `elevenlabs:${elVoice}`,
      model: modelId,
      provider: 'elevenlabs',
    };
  }

  const { concatMp3Files } = await import('../utils/concatAudio.js');
  await concatMp3Files(partPaths, outputPath);
  for (const p of partPaths) {
    if (p !== outputPath && fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch {
        /* ignore */
      }
    }
  }

  return {
    path: outputPath,
    voiceId: `elevenlabs:${elVoice}`,
    model: modelId,
    provider: 'elevenlabs',
  };
}

export async function elevenLabsHealth() {
  if (!isElevenLabsEnabled()) {
    return { ok: false, error: 'ELEVENLABS_API_KEY not configured' };
  }
  const base = {
    provider: 'elevenlabs',
    model: resolveElevenLabsModel(),
  };
  try {
    const voices = await listElevenLabsVoices(true);
    return {
      ...base,
      ok: true,
      voiceCount: voices.length,
    };
  } catch (err) {
    return {
      ...base,
      ok: false,
      error: err.response?.data?.detail?.message || err.message,
    };
  }
}
