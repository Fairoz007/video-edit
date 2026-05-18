/**
 * Load monorepo .env before any other local modules (ESM imports are hoisted).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRepoRoot } from '@docuforge/config/repoRoot';

const ROOT = getRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
dotenv.config({ path: path.join(ROOT, '.env'), override: true });
