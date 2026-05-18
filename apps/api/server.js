/**
 * DocuForge Express API — orchestrates media, script, TTS, and rendering pipelines.
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { createProjectRouter } from './routes/projects.js';
import { createPipelineRouter } from './routes/pipeline.js';
import { createMediaRouter } from './routes/media.js';
import { createRenderRouter } from './routes/render.js';
import { createQueueRouter } from './routes/queue.js';
import { createScrapeRouter } from './routes/scrape.js';
import { createExportsRouter } from './routes/exports.js';
import { initFfmpeg } from './utils/ffmpegPath.js';
import { getRepoRoot } from '@docuforge/config/repoRoot';
import { warmVoicePreviews } from './services/voicePreviewCache.js';

const ROOT = getRepoRoot(path.dirname(fileURLToPath(import.meta.url)));

dotenv.config({ path: path.join(ROOT, '.env') });
initFfmpeg();

const app = express();
const PORT = process.env.BACKEND_PORT || 3847;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(
  '/exports',
  express.static(path.join(ROOT, 'exports'), {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    },
  }),
);
app.use('/cache', express.static(path.join(ROOT, 'cache')));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'docuforge-backend' }));

app.use('/api/projects', createProjectRouter(ROOT));
app.use('/api/media', createMediaRouter(ROOT));
app.use('/api/pipeline', createPipelineRouter(ROOT));
app.use('/api/render', createRenderRouter(ROOT));
app.use('/api/queue', createQueueRouter(ROOT));
app.use('/api/scrape', createScrapeRouter(ROOT));
app.use('/api/exports', createExportsRouter(ROOT));

const server = app.listen(PORT, '127.0.0.1', () => {
  const providers = [
    process.env.GROQ_API_KEY && 'Groq (script)',
    process.env.UNSPLASH_ACCESS_KEY && 'Unsplash',
    process.env.PEXELS_API_KEY && 'Pexels',
    process.env.PIXABAY_API_KEY && 'Pixabay',
  ].filter(Boolean);
  console.log(`[DocuForge] Backend running on http://localhost:${PORT}`);
  console.log(`[DocuForge] Media APIs: ${providers.length ? providers.join(', ') : 'none configured'}`);
  console.log(
    `[DocuForge] Script: ${process.env.GROQ_API_KEY ? `Groq (${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'})` : 'rule-based fallback'}`,
  );
  console.log(
    `[DocuForge] TTS: Chatterbox-Turbo + Multilingual v3 (python: ${process.env.CHATTERBOX_PYTHON || 'python3.11'})`,
  );
  warmVoicePreviews(ROOT);
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
