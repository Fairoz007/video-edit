#!/usr/bin/env node
/** Run chatterbox_tts.py with resolved Python (reads .env for CHATTERBOX_PYTHON). */
import { spawnSync, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'apps', 'api', 'chatterbox', 'chatterbox_tts.py');
const ENV_FILE = path.join(ROOT, '.env');

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return;
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

function resolvePython() {
  loadEnv();
  const candidates = [
    process.env.CHATTERBOX_PYTHON,
    'python3.11',
    'python3.12',
    'python3',
    'python',
  ].filter(Boolean);
  for (const bin of candidates) {
    try {
      execSync(`command -v ${bin}`, { stdio: 'ignore', shell: true });
      return bin;
    } catch {
      /* next */
    }
  }
  console.error('[chatterbox] Python not found. Install 3.11+ and run npm run setup');
  process.exit(1);
}

const python = resolvePython();
const args = process.argv.slice(2);
const r = spawnSync(python, [SCRIPT, ...args], {
  cwd: path.join(ROOT, 'apps', 'api', 'chatterbox'),
  stdio: 'inherit',
  env: { ...process.env, PYTHONUNBUFFERED: '1' },
});
process.exit(r.status ?? 1);
