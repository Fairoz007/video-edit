#!/usr/bin/env node
/**
 * First-time / post-clone setup — runs automatically on `npm install` (postinstall).
 *
 * - Creates .env from .env.example if missing
 * - Installs Python deps (Chatterbox + MoviePy)
 * - Downloads Chatterbox model weights (Hugging Face cache)
 * - Installs Playwright Chromium for scraping
 * - Verifies FFmpeg (bundled) + Chatterbox health
 *
 * Skip:  DOCUFORGE_SKIP_SETUP=1 npm install
 * Force: DOCUFORGE_FORCE_SETUP=1 npm run setup
 * Packaged (strict, exit 1 on failure): DOCUFORGE_PACKAGED_SETUP=1
 */
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const requireFromRoot = createRequire(path.join(ROOT, 'package.json'));
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.join(__dirname, '..');
const DATA_ROOT = process.env.DOCUFORGE_DATA
  ? path.resolve(process.env.DOCUFORGE_DATA)
  : ROOT;
const STAMP_PATH = path.join(DATA_ROOT, 'cache', '.docuforge-setup.json');
const ENV_EXAMPLE = path.join(ROOT, '.env.example');
const ENV_FILE = path.join(DATA_ROOT, '.env');
const CHATTERBOX_DIR = path.join(ROOT, 'apps', 'api', 'chatterbox');
const CHATTERBOX_SCRIPT = path.join(CHATTERBOX_DIR, 'chatterbox_tts.py');
const PLAYWRIGHT_CLI = path.join(ROOT, 'node_modules', 'playwright', 'cli.js');
const PLAYWRIGHT_BROWSERS_PATH =
  process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(DATA_ROOT, 'playwright-browsers');
const PIP_REQS = [
  path.join(CHATTERBOX_DIR, 'requirements.txt'),
  path.join(ROOT, 'apps', 'api', 'moviepy', 'requirements.txt'),
];

const SKIP = process.env.DOCUFORGE_SKIP_SETUP === '1';
const FORCE = process.env.DOCUFORGE_FORCE_SETUP === '1';
const STRICT =
  process.env.DOCUFORGE_STRICT_SETUP === '1' || process.env.DOCUFORGE_PACKAGED_SETUP === '1';

const NODE = process.execPath;

function log(step, msg) {
  console.log(`[setup:${step}] ${msg}`);
}

function warn(msg) {
  console.warn(`[setup:warn] ${msg}`);
}

function fail(msg) {
  warn(msg);
  if (STRICT) process.exit(1);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: STRICT ? 'pipe' : 'inherit',
    cwd: opts.cwd || ROOT,
    env: { ...process.env, ...opts.env },
    encoding: STRICT ? 'utf8' : undefined,
    shell: opts.shell ?? false,
  });

  if (STRICT) {
    const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
    if (out) {
      for (const line of out.split(/\r?\n/)) {
        const t = line.trim();
        if (t) console.log(t);
      }
    }
  }

  return r.status === 0;
}

function commandExists(bin) {
  const r = spawnSync(bin, ['--version'], { stdio: 'ignore', shell: true });
  return r.status === 0;
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

function resolvePyLauncherExecutable(version) {
  const r = spawnSync('py', [`-${version}`, '-c', 'import sys; print(sys.executable)'], {
    encoding: 'utf8',
    shell: true,
  });
  return r.status === 0 ? (r.stdout || '').trim() : null;
}

function resolvePython() {
  const fromEnv = process.env.CHATTERBOX_PYTHON || process.env.PYTHON_FOR_CHATTERBOX;

  if (fromEnv && /^3\.\d{1,2}$/.test(fromEnv)) {
    const exe = resolvePyLauncherExecutable(fromEnv);
    if (exe) return exe;
  }

  const candidates = [fromEnv, 'python3.13', 'python3.12', 'python3.11', 'python3', 'python'].filter(
    Boolean,
  );

  for (const bin of candidates) {
    if (!bin || /^3\.\d{1,2}$/.test(bin)) continue;
    if (!commandExists(bin)) continue;
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8', shell: true });
    if (r.status === 0) return bin;
  }

  if (commandExists('py')) {
    for (const ver of ['3.13', '3.12', '3.11']) {
      const exe = resolvePyLauncherExecutable(ver);
      if (exe) return exe;
    }
  }

  return null;
}

function ensureWorkspaceDirs() {
  for (const dir of ['projects', 'cache', 'exports']) {
    const full = path.join(DATA_ROOT, dir);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
    const keep = path.join(full, '.gitkeep');
    if (!fs.existsSync(keep)) fs.writeFileSync(keep, '');
  }
  fs.mkdirSync(PLAYWRIGHT_BROWSERS_PATH, { recursive: true });
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
  fs.writeFileSync(
    STAMP_PATH,
    JSON.stringify({ ...data, complete: true, at: new Date().toISOString() }, null, 2),
  );
}

function verifyBundledFfmpeg() {
  try {
    const mod = requireFromRoot('@ffmpeg-installer/ffmpeg');
    const bin = mod?.path;
    if (bin && fs.existsSync(bin)) {
      log('ffmpeg', `Bundled FFmpeg OK (${bin})`);
      return true;
    }
  } catch {
    /* fall through */
  }
  if (commandExists('ffmpeg')) {
    log('ffmpeg', 'Found ffmpeg on PATH');
    return true;
  }
  warn('FFmpeg not found — video export may fail.');
  return false;
}

function pipInstall(python) {
  log('pip', `Using ${python}`);
  if (!run(python, ['-m', 'pip', 'install', '--upgrade', 'pip'])) {
    throw new Error('pip upgrade failed');
  }
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
  pipInstallCudaTorch(python);
}

function pipInstallCudaTorch(python) {
  if (process.platform !== 'win32' || !commandExists('nvidia-smi')) return;
  log('pip', 'NVIDIA GPU detected — installing PyTorch with CUDA 12.4…');
  const ok = run(python, [
    '-m',
    'pip',
    'install',
    '--force-reinstall',
    'torch==2.6.0',
    'torchaudio==2.6.0',
    '--index-url',
    'https://download.pytorch.org/whl/cu124',
  ]);
  if (!ok) {
    warn('CUDA PyTorch install failed — TTS will fall back to CPU.');
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
  const stdout = (r.stdout || '').trim();
  if (stdout && STRICT) {
    for (const line of stdout.split('\n')) {
      const t = line.trim();
      if (t) console.log(t);
    }
  }

  if (r.status !== 0) {
    throw new Error(stderr || `Chatterbox setup exited with code ${r.status}`);
  }

  const jsonLine = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('{'))
    .pop();
  let result;
  try {
    result = JSON.parse(jsonLine || stdout);
  } catch {
    throw new Error('Chatterbox setup did not return JSON');
  }
  if (!result.ok) {
    throw new Error('Chatterbox setup failed');
  }
  log('chatterbox', `Models ready on ${result.device}: ${(result.warmed || []).join(', ')}`);
  return result;
}

function verifyChatterboxHealth(python) {
  log('verify', 'Running Chatterbox health check…');
  const r = spawnSync(python, [CHATTERBOX_SCRIPT, '--health'], {
    cwd: CHATTERBOX_DIR,
    encoding: 'utf8',
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  });
  const combined = `${r.stdout || ''}\n${r.stderr || ''}`.trim();
  if (STRICT && combined) {
    for (const line of combined.split('\n')) {
      const t = line.trim();
      if (t) console.log(t.startsWith('[Chatterbox]') ? t : `[Chatterbox] ${t}`);
    }
  }
  if (r.status !== 0) {
    throw new Error(combined || 'Chatterbox health check failed');
  }
  const jsonLine = (r.stdout || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('{'))
    .pop();
  try {
    const health = JSON.parse(jsonLine || '{}');
    if (health.ok === false) {
      throw new Error(health.error || 'Chatterbox health returned not ok');
    }
    log('verify', 'Chatterbox health OK');
    return health;
  } catch (err) {
    if (err.message?.includes('Chatterbox')) throw err;
    log('verify', 'Chatterbox health check completed');
    return { ok: true };
  }
}

function installPlaywright() {
  if (!fs.existsSync(PLAYWRIGHT_CLI)) {
    throw new Error(`Playwright CLI missing: ${PLAYWRIGHT_CLI}`);
  }
  log('playwright', `Installing Chromium → ${PLAYWRIGHT_BROWSERS_PATH}`);
  const ok = run(NODE, [PLAYWRIGHT_CLI, 'install', 'chromium'], {
    env: {
      PLAYWRIGHT_BROWSERS_PATH,
      ELECTRON_RUN_AS_NODE: process.env.ELECTRON_RUN_AS_NODE || undefined,
    },
  });
  if (!ok) {
    throw new Error('Playwright Chromium install failed');
  }
  log('playwright', 'Chromium ready');
  return true;
}

async function main() {
  if (SKIP) {
    log('skip', 'DOCUFORGE_SKIP_SETUP=1 — skipping auto setup');
    return;
  }

  console.log('\n[DocuForge] Running setup…\n');

  ensureWorkspaceDirs();
  ensureEnvFile();
  loadEnvFile();

  const stamp = readStamp();
  const ffmpegOk = verifyBundledFfmpeg();
  if (!ffmpegOk && STRICT) {
    fail('FFmpeg is required but was not found in the app bundle.');
  }

  const python = resolvePython();
  if (!python) {
    fail(
      'Python 3.11+ not found. Install from https://www.python.org/downloads/ and enable "Add to PATH", then run setup again.',
    );
    if (!STRICT) {
      try {
        installPlaywright();
      } catch {
        /* optional in dev without python */
      }
    }
    return;
  }

  let modelResult = null;
  let pipOk = Boolean(stamp?.pip);
  let playwrightOk = Boolean(stamp?.playwright);

  try {
    if (!stamp?.pip || FORCE) {
      pipInstall(python);
      pipOk = true;
    } else {
      log('pip', 'Dependencies already installed (use DOCUFORGE_FORCE_SETUP=1 to reinstall)');
    }

    if (!stamp?.chatterboxModels || FORCE) {
      modelResult = downloadChatterboxModels(python);
    } else {
      log(
        'chatterbox',
        `Models already cached (${(stamp.chatterboxModels || []).join(', ')})`,
      );
      modelResult = { warmed: stamp.chatterboxModels, device: stamp.device || 'unknown' };
    }

    verifyChatterboxHealth(python);

    if (!stamp?.playwright || FORCE) {
      installPlaywright();
      playwrightOk = true;
    } else {
      log('playwright', 'Chromium already installed');
      playwrightOk = true;
    }

    writeStamp({
      pip: pipOk,
      python,
      chatterboxModels: modelResult?.warmed || stamp?.chatterboxModels || ['turbo'],
      device: modelResult?.device || stamp?.device,
      playwright: playwrightOk,
      ffmpeg: ffmpegOk,
    });

    console.log('\n[DocuForge] Setup complete — all required components are installed.\n');
  } catch (err) {
    fail(err.message || String(err));
    if (!STRICT) {
      warn('Setup incomplete. Fix the issue above and run: npm run setup');
      try {
        if (!stamp?.playwright) installPlaywright();
      } catch {
        /* best effort */
      }
    }
    return;
  }
}

main().catch((err) => {
  console.error('[setup:fatal]', err);
  process.exit(1);
});
