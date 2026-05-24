import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root (read-only app bundle in production). */
export function getInstallRoot(): string {
  if (process.env.DOCUFORGE_ROOT) {
    return path.resolve(process.env.DOCUFORGE_ROOT);
  }
  if (app.isPackaged) {
    const appPath = app.getAppPath();
    const serverAtAppPath = path.join(appPath, 'apps', 'api', 'server.js');
    if (fs.existsSync(serverAtAppPath)) return appPath;
    const viaResources = path.join(process.resourcesPath, 'app');
    if (fs.existsSync(path.join(viaResources, 'apps', 'api', 'server.js'))) {
      return viaResources;
    }
    return appPath;
  }
  return path.join(__dirname, '../../..');
}

/** Writable projects / cache / exports (userData when packaged). */
export function getDataRoot(): string {
  if (process.env.DOCUFORGE_DATA) {
    return path.resolve(process.env.DOCUFORGE_DATA);
  }
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'DocuForge');
  }
  return getInstallRoot();
}

export function getBundledEnvPath(): string | null {
  if (!app.isPackaged) return null;
  const p = path.join(process.resourcesPath, '.env');
  return fs.existsSync(p) ? p : null;
}

export function getServerScriptPath(installRoot: string): string {
  const rel = path.join('apps', 'api', 'server.js');
  const candidates = [
    path.join(installRoot, rel),
    path.join(app.getAppPath(), rel),
    path.join(process.resourcesPath, 'app', rel),
    path.join(process.resourcesPath, 'app.asar.unpacked', rel),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(installRoot, rel);
}

export function getWebDistDir(installRoot: string): string {
  return path.join(installRoot, 'apps', 'web', 'dist');
}

export function getWebDistIndex(installRoot: string): string {
  return path.join(getWebDistDir(installRoot), 'index.html');
}
