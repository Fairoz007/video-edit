#!/usr/bin/env node
/**
 * Build Windows DocuForge portable + installer (.exe).
 * Bundles repo-root .env into the app (API keys from your local .env).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');
const ENV_EXAMPLE = path.join(ROOT, '.env.example');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function log(msg) {
  console.log(`[build:exe] ${msg}`);
}

if (!fs.existsSync(ENV_FILE)) {
  if (fs.existsSync(ENV_EXAMPLE)) {
    fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
    log('Created .env from .env.example — add API keys, then re-run npm run build:exe');
  } else {
    console.error('[build:exe] Missing .env at repo root. Create .env with your API keys first.');
  }
  process.exit(1);
}

log('Building web UI + Electron main…');
run('npm', ['run', 'build']);

log('Packaging Windows executable (electron-builder)…');
run('npx', ['electron-builder', '--win', '--config', 'apps/desktop/electron-builder.config.cjs']);

log('Done. Installers are in release/');
log('  - DocuForge-*-portable.exe  (single file, no install)');
log('  - DocuForge-*-setup.exe     (NSIS installer)');
log('First launch runs full setup (Python deps, Chatterbox, Playwright, FFmpeg) — Python 3.11+ required.');
