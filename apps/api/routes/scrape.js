import { Router } from 'express';
import {
  scrapePageContent,
  extractMediaFromUrl,
  downloadPageMedia,
  scrapeUrlForVideo,
  fetchYouTubeMetadata,
} from '../scraper/playwrightScraper.js';
import { closeBrowser } from '../scraper/playwrightBrowser.js';
import { cacheDir } from '../utils/paths.js';

export function createScrapeRouter(root) {
  const router = Router();

  router.post('/content', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'url required' });
      const content = await scrapePageContent(url);
      res.json(content);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/media/preview', async (req, res) => {
    try {
      const { url, maxItems } = req.body;
      if (!url) return res.status(400).json({ error: 'url required' });
      const items = await extractMediaFromUrl(url, { maxItems: maxItems || 24 });
      res.json({ url, items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/media/download', async (req, res) => {
    try {
      const { url, topic, maxDownloads } = req.body;
      if (!url) return res.status(400).json({ error: 'url required' });
      const dir = cacheDir(root, `scrape-${topic || hashTopic(url)}`);
      const manifest = await downloadPageMedia(url, dir, { maxDownloads: maxDownloads || 16 });
      res.json({ dir, manifest });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/full', async (req, res) => {
    try {
      const { url, topic } = req.body;
      if (!url) return res.status(400).json({ error: 'url required' });
      const dir = cacheDir(root, `scrape-full-${topic || hashTopic(url)}`);
      const result = await scrapeUrlForVideo(url, dir);
      res.json({ dir, ...result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/youtube', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'url required' });
      const meta = await fetchYouTubeMetadata(url);
      res.json(meta);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/shutdown', async (_req, res) => {
    await closeBrowser();
    res.json({ ok: true });
  });

  return router;
}

function hashTopic(url) {
  return Buffer.from(url).toString('base64url').slice(0, 16);
}
