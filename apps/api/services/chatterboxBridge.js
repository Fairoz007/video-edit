/**
 * Persistent Chatterbox-TTS worker (Python) — Turbo + Multilingual v3.
 */
import { spawn } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolvePython } from '../utils/resolvePython.js';
import { chunkText, chatterboxChunkMaxLen } from '../utils/chunkText.js';
import { concatWavFiles } from '../utils/concatAudio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHATTERBOX_DIR = path.join(__dirname, '../chatterbox');
const SCRIPT = path.join(CHATTERBOX_DIR, 'chatterbox_tts.py');
const VOICES_JSON = path.join(CHATTERBOX_DIR, 'voices.json');

let worker = null;
let ready = false;
let resolveReady = null;
let rejectReady = null;
let nextId = 1;
const pending = new Map();
/** After worker start/timeout failure, use one-shot for remaining chunks in this process. */
let workerDisabled = false;
/** While Remotion uses GPU encode + Chromium, block TTS from reloading CUDA models. */
let gpuRenderLock = false;

/** Python worker already prefixes many lines with [Chatterbox]. */
function logChatterboxStderr(chunk) {
  for (const line of chunk.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const msg = trimmed.replace(/^\[Chatterbox\]\s*/, '');
    console.error(`[Chatterbox] ${msg}`);
  }
}

function rejectAllPending(err) {
  for (const [, { reject }] of pending) {
    reject(err);
  }
  pending.clear();
}

function tryParseJsonLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function markWorkerReady(msg) {
  const result = msg?.result;
  if (msg?.ready || msg?.pong || result?.ready || result?.pong) {
    ready = true;
    resolveReady?.();
  }
}

function handleWorkerLine(line) {
  const msg = tryParseJsonLine(line);
  if (!msg) return;

  markWorkerReady(msg);

  const id = msg.id;
  if (id == null) return;
  const entry = pending.get(id);
  if (!entry) return;
  pending.delete(id);
  if (msg.ok) entry.resolve(msg.result);
  else entry.reject(new Error(msg.error || 'Chatterbox request failed'));
}

function spawnWorker() {
  if (worker) return worker;

  const proc = spawn(resolvePython(), ['-u', SCRIPT, '--serve'], {
    cwd: CHATTERBOX_DIR,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
    },
  });

  worker = proc;
  ready = false;

  const rl = readline.createInterface({ input: proc.stdout, crlfDelay: Infinity });
  rl.on('line', (line) => {
    if (line.trim()) handleWorkerLine(line);
  });

  proc.stderr.on('data', (d) => logChatterboxStderr(d.toString()));

  proc.on('error', (err) => {
    rejectAllPending(err);
    rejectReady?.(err);
    worker = null;
    ready = false;
  });

  proc.on('close', (code) => {
    const err = new Error(`Chatterbox worker exited (${code})`);
    rejectAllPending(err);
    if (!ready) rejectReady?.(err);
    worker = null;
    ready = false;
    startingPromise = null;
    resolveReady = null;
    rejectReady = null;
  });

  proc.on('spawn', () => {
    setTimeout(() => {
      if (!ready && worker === proc) {
        try {
          proc.stdin.write(JSON.stringify({ id: 0, cmd: 'ping', payload: {} }) + '\n');
        } catch {
          /* ignore */
        }
      }
    }, 200);
  });

  return proc;
}

export function getChatterboxPython() {
  return resolvePython();
}

let startingPromise = null;

export function setGpuRenderLock(locked) {
  gpuRenderLock = Boolean(locked);
  if (locked) {
    killWorker();
  }
}

export function isGpuRenderLocked() {
  return gpuRenderLock;
}

export async function ensureChatterboxWorker() {
  if (gpuRenderLock) {
    throw new Error('GPU reserved for Remotion video render');
  }
  if (workerDisabled) {
    throw new Error('Chatterbox worker disabled after prior failure');
  }
  if (ready && worker) return worker;

  if (!startingPromise) {
    const timeoutMs = Number(process.env.CHATTERBOX_START_TIMEOUT_MS) || 180_000;

    startingPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        startingPromise = null;
        workerDisabled = true;
        killWorker();
        reject(
          new Error(
            `Chatterbox worker did not start within ${timeoutMs}ms. Run: npm run chatterbox:install`,
          ),
        );
      }, timeoutMs);

      resolveReady = () => {
        clearTimeout(timer);
        resolve(worker);
      };
      rejectReady = (err) => {
        clearTimeout(timer);
        startingPromise = null;
        reject(err);
      };

      spawnWorker();
    });

    startingPromise.catch(() => {
      startingPromise = null;
    });
  }

  return startingPromise;
}

export function requestChatterbox(cmd, payload = {}) {
  return ensureChatterboxWorker().then(
    () =>
      new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        const line = JSON.stringify({ id, cmd, payload }) + '\n';
        worker.stdin.write(line, (err) => {
          if (err) {
            pending.delete(id);
            reject(err);
          }
        });
      }),
  );
}

export async function listChatterboxVoices() {
  return requestChatterbox('list_voices');
}

function killWorker() {
  if (!worker) return;
  try {
    worker.kill('SIGTERM');
  } catch {
    /* ignore */
  }
  worker = null;
  ready = false;
  startingPromise = null;
  resolveReady = null;
  rejectReady = null;
}

function runOneShotSynthesize({ text, outputWav, voice, exaggeration, cfgWeight }) {
  return new Promise((resolve, reject) => {
    const args = ['-u', SCRIPT, '--text', text, '--output', outputWav, '--voice', voice || 'chatterbox-turbo'];
    const proc = spawn(resolvePython(), args, {
      cwd: CHATTERBOX_DIR,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    proc.stderr.on('data', (d) => {
      const t = d.toString();
      stderr += t;
      if (t.trim()) logChatterboxStderr(t);
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Chatterbox exited with code ${code}`));
        return;
      }
      const lines = stdout.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const msg = tryParseJsonLine(lines[i]);
        if (msg?.path) {
          resolve(msg);
          return;
        }
      }
      reject(new Error('Chatterbox one-shot produced no JSON result'));
    });
  });
}

function defaultWorkerTimeoutMs() {
  const fromEnv = Number(process.env.CHATTERBOX_WORKER_TIMEOUT_MS);
  if (fromEnv > 0) return fromEnv;
  return process.env.CHATTERBOX_DEVICE === 'cuda' ? 600_000 : 180_000;
}

async function synthesizeSingleChunk(payload, { useWorker, forceOneshot }) {
  if (!useWorker || forceOneshot || workerDisabled) {
    return runOneShotSynthesize(payload);
  }

  const workerTimeoutMs = defaultWorkerTimeoutMs();
  try {
    return await Promise.race([
      requestChatterbox('synthesize', payload),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Chatterbox worker timeout')), workerTimeoutMs),
      ),
    ]);
  } catch (err) {
    workerDisabled = true;
    killWorker();
    console.warn('[Chatterbox] Worker failed, using one-shot for this session:', err.message);
    return runOneShotSynthesize(payload);
  }
}

export async function synthesizeChatterbox({
  text,
  outputWav,
  voice,
  exaggeration,
  cfgWeight,
  forceOneshot = false,
}) {
  if (gpuRenderLock) {
    throw new Error('TTS paused — Remotion render is using the GPU');
  }

  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('Text is required for Chatterbox synthesis');
  }

  const useWorker = process.env.CHATTERBOX_ONESHOT === '0' && !forceOneshot;
  const maxLen = chatterboxChunkMaxLen();
  const chunks = chunkText(trimmed, maxLen);

  if (chunks.length === 1) {
    return synthesizeSingleChunk(
      { text: trimmed, outputWav, voice, exaggeration, cfgWeight },
      { useWorker, forceOneshot },
    );
  }

  console.log(
    `[Chatterbox] Long narration (${trimmed.length} chars) → ${chunks.length} chunk(s) (max ${maxLen} chars)`,
  );

  const partPaths = [];
  const base = outputWav.replace(/\.wav$/i, '');

  for (let i = 0; i < chunks.length; i++) {
    const partPath = `${base}-part${i}.wav`;
    const part = await synthesizeSingleChunk(
      {
        text: chunks[i],
        outputWav: partPath,
        voice,
        exaggeration,
        cfgWeight,
      },
      { useWorker, forceOneshot },
    );
    const resolved = part?.path ? path.resolve(part.path) : path.resolve(partPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Chatterbox chunk ${i + 1}/${chunks.length} missing: ${resolved}`);
    }
    partPaths.push(resolved);
  }

  const outPath = path.resolve(outputWav);
  await concatWavFiles(partPaths, outPath);

  for (const p of partPaths) {
    if (p !== outPath && fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch {
        /* ignore */
      }
    }
  }

  return {
    path: outPath,
    voice: voice || 'chatterbox-turbo',
    engine: 'turbo',
    chunks: chunks.length,
    device: process.env.CHATTERBOX_DEVICE || 'auto',
  };
}

export async function chatterboxHealth() {
  try {
    return await requestChatterbox('health');
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function shutdownChatterboxWorker() {
  if (!worker || !ready) return;
  requestChatterbox('shutdown').catch(() => {});
  killWorker();
}

/** Start persistent worker and load Turbo weights on GPU. No-op when CHATTERBOX_ONESHOT=1. */
export function prewarmChatterboxWorker() {
  if (process.env.CHATTERBOX_ONESHOT !== '0') return;
  if (process.env.CHATTERBOX_PREWARM_ON_START === '0') return;
  if (gpuRenderLock) return;

  (async () => {
    await ensureChatterboxWorker();
    await requestChatterbox('warmup', { models: ['turbo'] });
    console.log('[Chatterbox] Worker ready — Turbo loaded on', process.env.CHATTERBOX_DEVICE || 'auto');
  })().catch((err) => {
    console.warn('[Chatterbox] Prewarm failed:', err.message);
  });
}
