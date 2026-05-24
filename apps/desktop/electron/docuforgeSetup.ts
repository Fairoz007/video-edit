import { spawn, spawnSync } from 'child_process';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from 'electron';

const require = createRequire(import.meta.url);

export interface SetupRequirement {
  id: string;
  label: string;
  ready: boolean;
  required: boolean;
  detail?: string;
}

export interface DocuForgeSetupStatus {
  isPackaged: boolean;
  pythonFound: boolean;
  pythonPath: string | null;
  pipReady: boolean;
  modelsReady: boolean;
  playwrightReady: boolean;
  ffmpegReady: boolean;
  setupComplete: boolean;
  skipped: boolean;
  setupScriptExists: boolean;
  requirements: SetupRequirement[];
  stamp: {
    pip?: boolean;
    chatterboxModels?: string[];
    playwright?: boolean;
    ffmpeg?: boolean;
    complete?: boolean;
    device?: string;
    python?: string;
  } | null;
}

function getStampPath(dataRoot: string): string {
  return path.join(dataRoot, 'cache', '.docuforge-setup.json');
}

function getSkipPath(dataRoot: string): string {
  return path.join(dataRoot, '.docuforge-setup-skipped');
}

export function getPlaywrightBrowsersPath(dataRoot: string): string {
  return path.join(dataRoot, 'playwright-browsers');
}

function readStamp(dataRoot: string): DocuForgeSetupStatus['stamp'] {
  try {
    return JSON.parse(fs.readFileSync(getStampPath(dataRoot), 'utf8'));
  } catch {
    return null;
  }
}

function resolvePyLauncher(version: string): string | null {
  const r = spawnSync('py', [`-${version}`, '-c', 'import sys; print(sys.executable)'], {
    encoding: 'utf8',
    shell: true,
  });
  return r.status === 0 ? (r.stdout || '').trim() || null : null;
}

function commandExists(bin: string): boolean {
  const r = spawnSync(bin, ['--version'], { stdio: 'ignore', shell: true });
  return r.status === 0;
}

/** Resolve Python for Chatterbox (matches scripts/setup.mjs). */
export function resolvePythonExecutable(): string | null {
  const fromEnv = process.env.CHATTERBOX_PYTHON || process.env.PYTHON_FOR_CHATTERBOX;

  if (fromEnv && /^3\.\d{1,2}$/.test(fromEnv)) {
    const exe = resolvePyLauncher(fromEnv);
    if (exe) return exe;
  }

  const candidates = [fromEnv, 'python3.13', 'python3.12', 'python3.11', 'python3', 'python'].filter(
    Boolean,
  );
  for (const bin of candidates) {
    if (!bin || /^3\.\d{1,2}$/.test(bin)) continue;
    if (!commandExists(bin)) continue;
    return bin;
  }

  if (process.platform === 'win32' && commandExists('py')) {
    for (const ver of ['3.13', '3.12', '3.11']) {
      const exe = resolvePyLauncher(ver);
      if (exe) return exe;
    }
  }

  return null;
}

function checkBundledFfmpeg(installRoot: string): boolean {
  try {
    const mod = require(path.join(installRoot, 'node_modules', '@ffmpeg-installer', 'ffmpeg'));
    const bin = mod?.path;
    return Boolean(bin && fs.existsSync(bin));
  } catch {
    return commandExists('ffmpeg');
  }
}

function checkPlaywrightBrowsers(dataRoot: string): boolean {
  const root = getPlaywrightBrowsersPath(dataRoot);
  if (!fs.existsSync(root)) return false;
  try {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    return entries.some((e) => e.isDirectory() && e.name.startsWith('chromium'));
  } catch {
    return false;
  }
}

export function buildRequirements(
  installRoot: string,
  dataRoot: string,
  stamp: DocuForgeSetupStatus['stamp'],
): SetupRequirement[] {
  const pythonPath = resolvePythonExecutable();
  const pipReady = Boolean(stamp?.pip);
  const modelsReady = Boolean(stamp?.chatterboxModels?.length);
  const playwrightReady = Boolean(stamp?.playwright) || checkPlaywrightBrowsers(dataRoot);
  const ffmpegReady = Boolean(stamp?.ffmpeg) || checkBundledFfmpeg(installRoot);

  return [
    {
      id: 'python',
      label: 'Python 3.11+',
      required: true,
      ready: Boolean(pythonPath),
      detail: pythonPath || 'Not found — install from python.org',
    },
    {
      id: 'pip',
      label: 'Python packages (Chatterbox + MoviePy)',
      required: true,
      ready: pipReady,
    },
    {
      id: 'chatterbox',
      label: 'Chatterbox voice models (~2–4 GB)',
      required: true,
      ready: modelsReady,
      detail: stamp?.chatterboxModels?.join(', '),
    },
    {
      id: 'playwright',
      label: 'Playwright Chromium (URL scraping)',
      required: true,
      ready: playwrightReady,
    },
    {
      id: 'ffmpeg',
      label: 'FFmpeg (video export)',
      required: true,
      ready: ffmpegReady,
      detail: ffmpegReady ? 'Bundled with app' : 'Missing from install',
    },
  ];
}

export function readDocuForgeSetupStatus(
  installRoot: string,
  dataRoot: string,
): DocuForgeSetupStatus {
  const stamp = readStamp(dataRoot);
  const pythonPath = resolvePythonExecutable();
  const requirements = buildRequirements(installRoot, dataRoot, stamp);
  const pipReady = requirements.find((r) => r.id === 'pip')!.ready;
  const modelsReady = requirements.find((r) => r.id === 'chatterbox')!.ready;
  const playwrightReady = requirements.find((r) => r.id === 'playwright')!.ready;
  const ffmpegReady = requirements.find((r) => r.id === 'ffmpeg')!.ready;
  const setupComplete =
    Boolean(stamp?.complete) ||
    (pipReady && modelsReady && playwrightReady && ffmpegReady && Boolean(pythonPath));

  const setupScript = path.join(installRoot, 'scripts', 'setup.mjs');

  return {
    isPackaged: app.isPackaged,
    pythonFound: Boolean(pythonPath),
    pythonPath,
    pipReady,
    modelsReady,
    playwrightReady,
    ffmpegReady,
    setupComplete,
    skipped: fs.existsSync(getSkipPath(dataRoot)),
    setupScriptExists: fs.existsSync(setupScript),
    requirements,
    stamp,
  };
}

export function skipDocuForgeSetup(dataRoot: string): void {
  fs.mkdirSync(dataRoot, { recursive: true });
  fs.writeFileSync(
    getSkipPath(dataRoot),
    JSON.stringify({ at: new Date().toISOString() }, null, 2),
  );
}

export function clearDocuForgeSetupSkip(dataRoot: string): void {
  const p = getSkipPath(dataRoot);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function shouldPromptDocuForgeSetup(installRoot: string, dataRoot: string): boolean {
  const status = readDocuForgeSetupStatus(installRoot, dataRoot);
  if (!status.isPackaged) return false;
  if (status.skipped) return false;
  if (status.setupComplete) return false;
  return status.setupScriptExists;
}

export function applyPackagedRuntimeEnv(dataRoot: string): void {
  process.env.PLAYWRIGHT_BROWSERS_PATH = getPlaywrightBrowsersPath(dataRoot);
}

export function runDocuForgeSetup(
  installRoot: string,
  dataRoot: string,
  onLog: (line: string) => void,
): Promise<{ ok: boolean; error?: string; status?: DocuForgeSetupStatus }> {
  const script = path.join(installRoot, 'scripts', 'setup.mjs');
  if (!fs.existsSync(script)) {
    return Promise.resolve({ ok: false, error: 'Setup script not found in the app bundle.' });
  }

  clearDocuForgeSetupSkip(dataRoot);
  applyPackagedRuntimeEnv(dataRoot);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], {
      cwd: installRoot,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        DOCUFORGE_ROOT: installRoot,
        DOCUFORGE_DATA: dataRoot,
        DOCUFORGE_PACKAGED_SETUP: '1',
        DOCUFORGE_STRICT_SETUP: '1',
        PLAYWRIGHT_BROWSERS_PATH: getPlaywrightBrowsersPath(dataRoot),
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    const forward = (chunk: Buffer) => {
      for (const line of chunk.toString().split(/\r?\n/)) {
        const t = line.trim();
        if (t) onLog(t);
      }
    };

    child.stdout?.on('data', forward);
    child.stderr?.on('data', forward);

    child.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    child.on('close', (code) => {
      const status = readDocuForgeSetupStatus(installRoot, dataRoot);
      if (code === 0 && status.setupComplete) {
        resolve({ ok: true, status });
      } else {
        const missing = status.requirements
          .filter((r) => r.required && !r.ready)
          .map((r) => r.label)
          .join(', ');
        resolve({
          ok: false,
          status,
          error:
            missing.length > 0
              ? `Setup incomplete. Still needed: ${missing}`
              : `Setup exited with code ${code ?? 'unknown'}.`,
        });
      }
    });
  });
}

/** Re-export legacy names used by preload IPC. */
export const readChatterboxSetupStatus = readDocuForgeSetupStatus;
export const shouldPromptChatterboxSetup = shouldPromptDocuForgeSetup;
export const skipChatterboxSetup = skipDocuForgeSetup;
export const runChatterboxSetup = runDocuForgeSetup;
