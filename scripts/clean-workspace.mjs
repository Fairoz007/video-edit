#!/usr/bin/env node
/**
 * Remove all generated workspace data (projects, cache, exports, out).
 * Keeps .gitkeep files so empty dirs stay in git.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
  { dir: path.join(root, 'projects'), label: 'projects' },
  { dir: path.join(root, 'cache'), label: 'cache' },
  { dir: path.join(root, 'exports'), label: 'exports' },
  { dir: path.join(root, 'out'), label: 'out' },
];

function cleanDir(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    console.log(`[skip] ${label}/ (not found)`);
    return 0;
  }
  let removed = 0;
  for (const name of fs.readdirSync(dirPath)) {
    if (name === '.gitkeep') continue;
    const full = path.join(dirPath, name);
    fs.rmSync(full, { recursive: true, force: true });
    removed++;
  }
  console.log(`[clean] ${label}/ — removed ${removed} item(s)`);
  return removed;
}

let total = 0;
for (const { dir, label } of TARGETS) {
  total += cleanDir(dir, label);
}
console.log(`Done. Removed ${total} top-level entries. Workspace is clean.`);
