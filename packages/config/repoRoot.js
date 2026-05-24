import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Resolve monorepo root (package.json with `workspaces`).
 * Honors DOCUFORGE_ROOT for Electron / custom layouts.
 */
/** Writable data dir (projects, cache, exports). Defaults to install root in dev. */
export function getDataRoot(startDir = path.dirname(fileURLToPath(import.meta.url))) {
  if (process.env.DOCUFORGE_DATA) {
    return path.resolve(process.env.DOCUFORGE_DATA);
  }
  if (process.env.DOCUFORGE_ROOT) {
    return path.resolve(process.env.DOCUFORGE_ROOT);
  }
  return getRepoRoot(startDir);
}

export function getRepoRoot(startDir = path.dirname(fileURLToPath(import.meta.url))) {
  if (process.env.DOCUFORGE_ROOT) {
    return path.resolve(process.env.DOCUFORGE_ROOT);
  }

  let dir = path.resolve(startDir);
  for (;;) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (Array.isArray(pkg.workspaces) || pkg.workspaces?.packages) {
          return dir;
        }
      } catch {
        /* try parent */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error('Could not find DocuForge monorepo root (no workspaces in package.json)');
}
