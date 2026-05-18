import { Router } from 'express';
import { extractKeywords } from '../services/keywordExtractor.js';
import { searchMedia, downloadMediaAssets } from '../services/mediaSearch.js';
import { cacheDir } from '../utils/paths.js';

export function createMediaRouter(root) {
  const router = Router();

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

  router.post('/search', async (req, res) => {
    try {
      const { query, limit } = req.body;
      const results = await searchMedia(query, { limit: limit || 20 });
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/download', async (req, res) => {
    try {
      const { items, topic } = req.body;
      const dir = cacheDir(root, topic || 'default');
      const manifest = await downloadMediaAssets(items, dir);
      res.json(manifest);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
