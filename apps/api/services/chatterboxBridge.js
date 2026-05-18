/**
 * Persistent Chatterbox-TTS worker (Python) — Turbo + Multilingual v3.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolvePython } from '../utils/resolvePython.js';

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
let stdoutBuffer = '';

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

function handleWorkerLine(line) {
  const msg = tryParseJsonLine(line);
  if (!msg) return;

  if (msg.ready || msg.pong) {
    ready = true;
    resolveReady?.();
  }

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
  resolveReady = null;
  rejectReady = null;

  proc.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop() || '';
    for (const line of lines) {
      if (line.trim()) handleWorkerLine(line);
    }
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
    proc.stdin.write(JSON.stringify({ id: 0, cmd: 'ping', payload: {} }) + '\n');
  });

  return proc;
}

export function getChatterboxPython() {
  return resolvePython();
}

let startingPromise = null;

export async function ensureChatterboxWorker() {
  if (ready && worker) return worker;

  if (!startingPromise) {
    const timeoutMs = Number(process.env.CHATTERBOX_START_TIMEOUT_MS) || 180_000;

    startingPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        startingPromise = null;
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

function runOneShotSynthesize({ text, outputWav, voice, exaggeration, cfgWeight }) {
  return new Promise((resolve, reject) => {
    const args = ['-u', SCRIPT, '--text', text, '--output', outputWav, '--voice', voice || 'chatterbox-turbo'];
    const proc = spawn(resolvePython(), args, {
      cwd: process.cwd(),
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
  return process.env.CHATTERBOX_DEVICE === 'cuda' ? 300_000 : 120_000;
}

export async function synthesizeChatterbox({
  text,
  outputWav,
  voice,
  exaggeration,
  cfgWeight,
  forceOneshot = false,
}) {
  const payload = { text, outputWav, voice, exaggeration, cfgWeight };
  const useWorker = process.env.CHATTERBOX_ONESHOT === '0' && !forceOneshot;

  if (!useWorker) {
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
    console.warn('[Chatterbox] Worker failed, using one-shot:', err.message);
    return runOneShotSynthesize(payload);
  }
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
  worker = null;
  ready = false;
}
