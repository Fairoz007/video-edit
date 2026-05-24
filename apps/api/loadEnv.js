/**
 * Load monorepo .env before any other local modules (ESM imports are hoisted).
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDataRoot, getRepoRoot } from '@docuforge/config/repoRoot';

const ROOT = getRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const DATA_ROOT = getDataRoot(path.dirname(fileURLToPath(import.meta.url)));

const paths = [
  process.env.DOCUFORGE_BUNDLED_ENV,
  path.join(ROOT, '.env'),
  path.join(DATA_ROOT, '.env'),
].filter(Boolean);

for (const envPath of paths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}
