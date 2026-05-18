#!/usr/bin/env node
/**
 * First-time / post-clone setup — runs automatically on `npm install` (postinstall).
 *
 * - Creates .env from .env.example if missing
 * - Installs Python deps (Chatterbox + MoviePy)
 * - Downloads Chatterbox model weights (Hugging Face cache)
 * - Installs Playwright Chromium for scraping
 *
 * Skip:  DOCUFORGE_SKIP_SETUP=1 npm install
 * Force: DOCUFORGE_FORCE_SETUP=1 npm run setup
 * Models: CHATTERBOX_SETUP_MODELS=turbo,mtl  (default: turbo only)
 */
import { spawnSync, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAMP_PATH = path.join(ROOT, 'cache', '.docuforge-setup.json');
const ENV_EXAMPLE = path.join(ROOT, '.env.example');
const ENV_FILE = path.join(ROOT, '.env');
const CHATTERBOX_DIR = path.join(ROOT, 'apps', 'api', 'chatterbox');
const CHATTERBOX_SCRIPT = path.join(CHATTERBOX_DIR, 'chatterbox_tts.py');
const PIP_REQS = [
  path.join(CHATTERBOX_DIR, 'requirements.txt'),
  path.join(ROOT, 'apps', 'api', 'moviepy', 'requirements.txt'),
];

const SKIP = process.env.DOCUFORGE_SKIP_SETUP === '1';
const FORCE = process.env.DOCUFORGE_FORCE_SETUP === '1';

function log(step, msg) {
  console.log(`[setup:${step}] ${msg}`);
}

function warn(msg) {
  console.warn(`[setup:warn] ${msg}`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, ...opts.env },
    ...opts,
  });
  return r.status === 0;
}

function commandExists(bin) {
  try {
    execSync(`command -v ${bin}`, { stdio: 'ignore', shell: true });
    return true;
  } catch {
    return false;
  }
}

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;
  const text = fs.readFileSync(ENV_FILE, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function resolvePython() {
  const fromEnv = process.env.CHATTERBOX_PYTHON || process.env.PYTHON_FOR_CHATTERBOX;
  const candidates = [fromEnv, 'python3.11', 'python3.12', 'python3', 'python'].filter(Boolean);
  for (const bin of candidates) {
    if (!commandExists(bin)) continue;
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return bin;
  }
  return null;
}

function ensureWorkspaceDirs() {
  for (const dir of ['projects', 'cache', 'exports']) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
    const keep = path.join(full, '.gitkeep');
    if (!fs.existsSync(keep)) fs.writeFileSync(keep, '');
  }
}

function ensureEnvFile() {
  if (fs.existsSync(ENV_FILE)) {
    log('env', 'Using existing .env');
    return;
  }
  if (!fs.existsSync(ENV_EXAMPLE)) {
    warn('No .env.example found — create .env manually.');
    return;
  }
  fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
  log('env', 'Created .env from .env.example — add your API keys when ready.');
}

function readStamp() {
  try {
    return JSON.parse(fs.readFileSync(STAMP_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeStamp(data) {
  fs.mkdirSync(path.dirname(STAMP_PATH), { recursive: true });
  fs.writeFileSync(STAMP_PATH, JSON.stringify({ ...data, at: new Date().toISOString() }, null, 2));
}

function pipInstall(python) {
  log('pip', `Using ${python}`);
  for (const req of PIP_REQS) {
    if (!fs.existsSync(req)) {
      warn(`Missing requirements file: ${req}`);
      continue;
    }
    log('pip', `Installing ${path.relative(ROOT, req)}`);
    const ok = run(python, ['-m', 'pip', 'install', '-r', req]);
    if (!ok) {
      throw new Error(`pip install failed for ${req}`);
    }
  }
}

function downloadChatterboxModels(python) {
  const models = process.env.CHATTERBOX_SETUP_MODELS || 'turbo';
  log('chatterbox', `Downloading models (${models}) — first run can take several minutes…`);
  const r = spawnSync(python, [CHATTERBOX_SCRIPT, '--setup'], {
    cwd: CHATTERBOX_DIR,
    encoding: 'utf8',
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  });

  const stderr = (r.stderr || '').trim();
  if (stderr) {
    for (const line of stderr.split('\n')) {
      const t = line.trim();
      if (t) console.error(t.startsWith('[Chatterbox]') ? t : `[Chatterbox] ${t}`);
    }
  }

  if (r.status !== 0) {
    throw new Error(stderr || `Chatterbox setup exited with code ${r.status}`);
  }

  let result;
  try {
    result = JSON.parse((r.stdout || '').trim());
  } catch {
    throw new Error('Chatterbox setup did not return JSON');
  }
  if (!result.ok) {
    throw new Error('Chatterbox setup failed');
  }
  log('chatterbox', `Ready on ${result.device}: ${(result.warmed || []).join(', ')}`);
  return result;
}

function installPlaywright() {
  log('playwright', 'Installing Chromium for URL scraping…');
  if (!run('npx', ['playwright', 'install', 'chromium'])) {
    warn('Playwright install failed — run: npm run playwright:install');
  }
}

function checkFfmpeg() {
  if (commandExists('ffmpeg')) {
    log('ffmpeg', 'Found on PATH');
    return;
  }
  warn('ffmpeg not found on PATH — install it (e.g. brew install ffmpeg) for video export.');
}

async function main() {
  if (SKIP) {
    log('skip', 'DOCUFORGE_SKIP_SETUP=1 — skipping auto setup');
    return;
  }

  console.log('\n[DocuForge] Running automatic setup (post-clone)…\n');

  ensureWorkspaceDirs();
  ensureEnvFile();
  loadEnvFile();
  checkFfmpeg();

  const stamp = readStamp();
  const python = resolvePython();

  if (!python) {
    warn(
      'Python not found. Install Python 3.11+ and re-run: npm run setup\n' +
        '  macOS: brew install python@3.11\n' +
        '  Then: npm run setup',
    );
    installPlaywright();
    return;
  }

  try {
    if (!stamp?.pip || FORCE) {
      pipInstall(python);
    } else {
      log('pip', 'Dependencies already installed (use DOCUFORGE_FORCE_SETUP=1 to reinstall)');
    }

    if (!stamp?.chatterboxModels || FORCE) {
      const modelResult = downloadChatterboxModels(python);
      writeStamp({
        pip: true,
        python,
        chatterboxModels: modelResult.warmed || ['turbo'],
        device: modelResult.device,
      });
    } else {
      log(
        'chatterbox',
        `Models already cached (${(stamp.chatterboxModels || []).join(', ')}) — ` +
          'use DOCUFORGE_FORCE_SETUP=1 to re-download',
      );
    }
  } catch (err) {
    warn(err.message || String(err));
    warn('Setup incomplete. Fix the issue above and run: npm run setup');
    installPlaywright();
    return;
  }

  installPlaywright();
  console.log('\n[DocuForge] Setup complete. Run: npm run dev\n');
}

main().catch((err) => {
  console.error('[setup:fatal]', err);
  process.exit(1);
});
