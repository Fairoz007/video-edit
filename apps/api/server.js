/**
 * DocuForge Express API — orchestrates media, script, TTS, and rendering pipelines.
 */
import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createProjectRouter } from './routes/projects.js';
import { createPipelineRouter } from './routes/pipeline.js';
import { createMediaRouter } from './routes/media.js';
import { createRenderRouter } from './routes/render.js';
import { createQueueRouter } from './routes/queue.js';
import { createScrapeRouter } from './routes/scrape.js';
import { createExportsRouter } from './routes/exports.js';
import { initFfmpeg } from './utils/ffmpegPath.js';
import { getDataRoot, getRepoRoot } from '@docuforge/config/repoRoot';
import { resolvePython } from './utils/resolvePython.js';
import { prewarmChatterboxWorker } from './services/chatterboxBridge.js';

const ROOT = getRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const DATA_ROOT = getDataRoot(path.dirname(fileURLToPath(import.meta.url)));

function resolveScriptProviderLabel() {
  const mode = (process.env.SCRIPT_PROVIDER || 'auto').toLowerCase();
  const gemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const groq = Boolean(process.env.GROQ_API_KEY?.trim());
  if (mode === 'gemini' && gemini) {
    return `Gemini (${process.env.GEMINI_MODEL || 'gemini-flash-latest'})`;
  }
  if (mode === 'groq' && groq) {
    return `Groq (${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'})`;
  }
  if (gemini && mode === 'auto') {
    return `auto → Groq then Gemini (${process.env.GEMINI_MODEL || 'gemini-flash-latest'})`;
  }
  if (groq) return `Groq (${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'})`;
  if (gemini) return `Gemini (${process.env.GEMINI_MODEL || 'gemini-flash-latest'})`;
  return 'rule-based fallback';
}

initFfmpeg();

const app = express();
const PORT = process.env.BACKEND_PORT || 3847;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(
  '/exports',
  express.static(path.join(DATA_ROOT, 'exports'), {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    },
  }),
);
app.use('/cache', express.static(path.join(DATA_ROOT, 'cache')));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'docuforge-backend' }));

app.use('/api/projects', createProjectRouter(DATA_ROOT));
app.use('/api/media', createMediaRouter(DATA_ROOT));
app.use('/api/pipeline', createPipelineRouter(DATA_ROOT));
app.use('/api/render', createRenderRouter(DATA_ROOT));
app.use('/api/queue', createQueueRouter(DATA_ROOT));
app.use('/api/scrape', createScrapeRouter(DATA_ROOT));
app.use('/api/exports', createExportsRouter(DATA_ROOT));

/** Electron production: serve Vite build from same origin as API (avoids app:// CORS issues). */
function mountPackagedUi() {
  if (process.env.DOCUFORGE_SERVE_UI !== '1') return;
  const webDist = path.join(ROOT, 'apps', 'web', 'dist');
  const indexHtml = path.join(webDist, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    console.warn('[DocuForge] Packaged UI missing:', indexHtml);
    return;
  }
  console.log('[DocuForge] Serving desktop UI from', webDist);
  app.use(express.static(webDist));
}

mountPackagedUi();

const server = app.listen(PORT, '127.0.0.1', () => {
  const providers = [
    process.env.GEMINI_API_KEY && 'Gemini (script)',
    process.env.GROQ_API_KEY && 'Groq (script)',
    process.env.PEXELS_API_KEY && 'Pexels (video)',
    process.env.PIXABAY_API_KEY && 'Pixabay (video)',
  ].filter(Boolean);
  console.log(`[DocuForge] Backend running on http://localhost:${PORT}`);
  console.log(`[DocuForge] Media APIs: ${providers.length ? providers.join(', ') : 'none configured'}`);
  console.log(
    `[DocuForge] Script: ${resolveScriptProviderLabel()}`,
  );
  const ttsProvider = process.env.TTS_PROVIDER || (process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'chatterbox');
  if (ttsProvider === 'elevenlabs' || (ttsProvider === 'auto' && process.env.ELEVENLABS_API_KEY)) {
    console.log(
      `[DocuForge] TTS: ElevenLabs (${process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2'})`,
    );
  } else {
    const device = process.env.CHATTERBOX_DEVICE?.trim() || 'auto (cuda→mps→cpu)';
    console.log(
      `[DocuForge] TTS: Chatterbox (python: ${resolvePython()}, device: ${device})`,
    );
  }

  const shouldUseChatterbox =
    ttsProvider === 'chatterbox' ||
    (ttsProvider === 'auto' && !process.env.ELEVENLABS_API_KEY);

  if (
    shouldUseChatterbox &&
    process.env.CHATTERBOX_ONESHOT === '0' &&
    process.env.CHATTERBOX_PREWARM_ON_START !== '0'
  ) {
    prewarmChatterboxWorker();
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[DocuForge] Port ${PORT} is already in use. Stop the other backend or run: npm run kill:backend`,
    );
    process.exit(1);
  }
  throw err;
});
