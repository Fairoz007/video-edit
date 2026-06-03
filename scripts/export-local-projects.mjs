#!/usr/bin/env node
/**
 * Export local projects (each project.json) for Convex import (Phase 1).
 *
 * Usage:
 *   node scripts/export-local-projects.mjs
 *   node scripts/export-local-projects.mjs --out migration-bundle.json
 *
 * Import in SaaS dashboard: "Import local projects" (batch upload).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRepoRoot } from '../packages/config/repoRoot.js';

const ROOT = getRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const projectsDir = path.join(ROOT, 'projects');
const outArg = process.argv.indexOf('--out');
const outPath =
  outArg >= 0 && process.argv[outArg + 1]
    ? path.resolve(process.argv[outArg + 1])
    : path.join(ROOT, 'migration-bundle.json');

if (!fs.existsSync(projectsDir)) {
  console.error(`No projects/ directory at ${projectsDir}`);
  process.exit(1);
}

const ids = fs.readdirSync(projectsDir).filter((name) => {
  const p = path.join(projectsDir, name, 'project.json');
  return fs.existsSync(p) && fs.statSync(path.join(projectsDir, name)).isDirectory();
});

const projects = [];
for (const id of ids) {
  const raw = fs.readFileSync(path.join(projectsDir, id, 'project.json'), 'utf8');
  try {
    const doc = JSON.parse(raw);
    if (!doc.id) doc.id = id;
    projects.push(doc);
  } catch (err) {
    console.warn(`[skip] ${id}: ${err.message}`);
  }
}

const bundle = {
  exportedAt: new Date().toISOString(),
  count: projects.length,
  projects,
};

fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2));
console.log(`Exported ${projects.length} project(s) → ${outPath}`);
console.log('Import via SaaS dashboard or Convex mutation projects.importFromLegacyBatch');
