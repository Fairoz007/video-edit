import { Router } from 'express';
import { generateDocumentaryScript } from '../services/scriptGenerator.js';
import { extractKeywords } from '../services/keywordExtractor.js';
import { generateNarration } from '../services/voiceGenerator.js';
import { listSystemVoices } from '../services/voiceLister.js';
import { writeSubtitles } from '../services/subtitleGenerator.js';
import { buildTimeline } from '../services/timelineBuilder.js';
import { projectDir } from '../utils/paths.js';
import fs from 'fs';
import path from 'path';

export function createPipelineRouter(root) {
  const router = Router();

  router.post('/script', async (req, res) => {
    try {
      const script = await generateDocumentaryScript(req.body);
      res.json(script);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/keywords', async (req, res) => {
    try {
      const { text, topic, articleUrl, youtubeUrl, scrapedContent } = req.body;
      const result = await extractKeywords({
        text,
        topic,
        articleUrl,
        youtubeUrl,
        scrapedContent,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/voices', async (_req, res) => {
    try {
      const data = await listSystemVoices();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/narration', async (req, res) => {
    try {
      const { sections, projectId, voice, rate } = req.body;
      const dir = projectId
        ? path.join(projectDir(root, projectId), 'audio')
        : path.join(root, 'cache', 'tts-temp');
      const result = await generateNarration(sections, dir, { voice, rate });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/subtitles', (req, res) => {
    const { sections, projectId } = req.body;
    const dir = projectId
      ? path.join(projectDir(root, projectId), 'subtitles')
      : path.join(root, 'cache', 'subs-temp');
    const { srtPath, cuesPath, cues } = writeSubtitles(sections, dir);
    res.json({ path: srtPath, cuesPath, cues });
  });

  router.post('/timeline', (req, res) => {
    const { script, media, audioTracks } = req.body;
    res.json(buildTimeline(script, media, audioTracks));
  });

  router.get('/project/:id/script', (req, res) => {
    const p = path.join(root, 'projects', req.params.id, 'script.json');
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'No script' });
    res.json(JSON.parse(fs.readFileSync(p, 'utf8')));
  });

  return router;
}
