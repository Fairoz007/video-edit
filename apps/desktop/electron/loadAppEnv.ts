import fs from 'fs';
import path from 'path';
import { applyEnvFile } from './parseEnv.js';
import { getBundledEnvPath, getDataRoot, getInstallRoot } from './paths.js';

/** Seed userData/.env from bundled resources on first packaged launch. */
function seedUserEnv(dataRoot: string, bundledPath: string | null) {
  if (!bundledPath) return;
  const userEnv = path.join(dataRoot, '.env');
  if (fs.existsSync(userEnv)) return;
  fs.mkdirSync(dataRoot, { recursive: true });
  fs.copyFileSync(bundledPath, userEnv);
}

/**
 * Load .env for Electron + forked API (bundled → install → user data).
 */
export function loadAppEnv(): { installRoot: string; dataRoot: string } {
  const installRoot = getInstallRoot();
  const dataRoot = getDataRoot();
  const bundled = getBundledEnvPath();

  seedUserEnv(dataRoot, bundled);

  if (bundled) {
    process.env.DOCUFORGE_BUNDLED_ENV = bundled;
    applyEnvFile(bundled, false);
  }
  applyEnvFile(path.join(installRoot, '.env'), true);
  applyEnvFile(path.join(dataRoot, '.env'), true);

  process.env.DOCUFORGE_ROOT = installRoot;
  process.env.DOCUFORGE_DATA = dataRoot;

  return { installRoot, dataRoot };
}
