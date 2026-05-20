import { Router } from 'express';
import { generateDocumentaryScript } from '../services/scriptGenerator.js';
import { extractKeywords } from '../services/keywordExtractor.js';
import { generateNarration, generateVoicePreview } from '../services/voiceGenerator.js';
import { listSystemVoices } from '../services/voiceLister.js';
import { chatterboxHealth } from '../services/chatterboxBridge.js';
import { elevenLabsHealth } from '../services/elevenlabsBridge.js';
import {
  getCachedPreset,
  getPreviewCacheStatus,
  warmVoicePreviews,
} from '../services/voicePreviewCache.js';
import { writeSubtitles } from '../services/subtitleGenerator.js';
import { buildTimeline } from '../services/timelineBuilder.js';
import { listDocumentaryTemplates } from '@docuforge/config/documentaryTemplates';
import { projectDir } from '../utils/paths.js';
import fs from 'fs';
import path from 'path';

export function createPipelineRouter(root) {
  const router = Router();

  router.get('/templates', (_req, res) => {
    res.json({ templates: listDocumentaryTemplates(), defaultId: 'template_cinematic_docuforge' });
  });

  router.get('/script-template', (_req, res) => {
    const filePath = path.join(root, 'templates', 'documentary-script-demo.txt');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Script template not found' });
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="documentary-script-demo.txt"',
    );
    res.send(fs.readFileSync(filePath, 'utf8'));
  });

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
      const data = await listSystemVoices(root);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/voice/previews/status', (_req, res) => {
    res.json(getPreviewCacheStatus(root));
  });

  router.post('/voice/previews/warm', async (_req, res) => {
    try {
      warmVoicePreviews(root);
      res.json({ ok: true, ...getPreviewCacheStatus(root) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/voice/health', async (_req, res) => {
    try {
      const [chatterbox, elevenlabs] = await Promise.all([
        chatterboxHealth(),
        elevenLabsHealth(),
      ]);
      res.json({ chatterbox, elevenlabs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/voice/preview', async (req, res) => {
    try {
      const { voice, rate, pitch, text } = req.body;
      const cached = getCachedPreset(root, voice, rate, pitch);
      if (cached && !text) {
        return res.json({ ...cached, provider: 'chatterbox' });
      }

      const cacheDir = path.join(root, 'cache', 'voice-preview');
      fs.mkdirSync(cacheDir, { recursive: true });
      const filename = `preview-${Date.now()}.mp3`;
      const outputPath = path.join(cacheDir, filename);
      const result = await generateVoicePreview(outputPath, { voice, rate, pitch, text });
      res.json({
        url: `/cache/voice-preview/${filename}`,
        path: result.path,
        voice: result.voice,
        rate: result.rate,
        pitch: result.pitch,
        cached: false,
        provider: result.provider || 'chatterbox',
        model: result.model,
      });
    } catch (err) {
      console.error('[TTS] Preview failed:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/narration', async (req, res) => {
    try {
      const { sections, projectId, voice, rate, pitch } = req.body;
      const dir = projectId
        ? path.join(projectDir(root, projectId), 'audio')
        : path.join(root, 'cache', 'tts-temp');
      const result = await generateNarration(sections, dir, { voice, rate, pitch });
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
    const { script, media, audioTracks, audioDurationSec, editMode } = req.body;
    const timeline = buildTimeline(script, media, audioTracks, {
      audioDurationSec,
      editMode,
      videoOnly: editMode === 'video-only',
    });
    res.json(timeline);
  });

  router.get('/project/:id/script', (req, res) => {
    const p = path.join(root, 'projects', req.params.id, 'script.json');
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'No script' });
    res.json(JSON.parse(fs.readFileSync(p, 'utf8')));
  });

  return router;
}
