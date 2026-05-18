/**
 * Playwright scraper — view pages, extract content, download images/videos for editing.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { pipeline } from 'stream/promises';
import { withPage } from './playwrightBrowser.js';
import { parseYouTubeUrl } from './urlScraper.js';
import {
  MIN_VIDEO_BYTES,
  verifyReadableImage,
  verifyReadableVideo,
} from '../utils/mediaValidate.js';

const NAV_TIMEOUT = 30000;
const MIN_IMAGE_BYTES = 25000;
const MIN_IMAGE_WIDTH = 1200;

function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

function extFromUrl(url, fallback = '.jpg') {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpe?g|png|webp|gif|mp4|webm|mov)(\?|$)/i);
    if (match) return `.${match[1].toLowerCase().replace('jpeg', 'jpg')}`;
  } catch {
    /* ignore */
  }
  return fallback;
}

function normalizeUrl(base, href) {
  if (!href || href.startsWith('data:') || href.startsWith('blob:')) return null;
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/** Prefer full-resolution Wikimedia assets over thumb URLs. */
function preferHighResUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname.includes('wikimedia.org') && u.pathname.includes('/thumb/')) {
      const parts = u.pathname.split('/thumb/')[1]?.split('/') || [];
      if (parts.length >= 2) {
        const fileName = parts[parts.length - 2];
        const basePath = parts[0];
        return `${u.protocol}//${u.host}/wiki/Special:FilePath/${fileName}?width=3840`;
      }
    }
  } catch {
    /* keep original */
  }
  return url;
}

function downloadHeadersForUrl(url) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };
  try {
    const host = new URL(url).hostname;
    if (host.includes('wikimedia.org') || host.includes('wikipedia.org')) {
      headers.Referer = 'https://en.wikipedia.org/';
      headers.Accept = 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8';
    }
  } catch {
    /* ignore */
  }
  return headers;
}

async function downloadToFile(url, dest, extraHeaders = {}) {
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 120000,
    maxRedirects: 5,
    headers: { ...downloadHeadersForUrl(url), ...extraHeaders },
    validateStatus: (s) => s >= 200 && s < 400,
  });
  await pipeline(response.data, fs.createWriteStream(dest));
  const stat = fs.statSync(dest);
  return stat.size;
}

/**
 * Extract page text + Open Graph metadata by rendering the page.
 */
export async function scrapePageContent(url) {
  return withPage(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForTimeout(1500);

    const data = await page.evaluate(() => {
      const og = (prop) =>
        document.querySelector(`meta[property="${prop}"]`)?.content ||
        document.querySelector(`meta[name="${prop}"]`)?.content ||
        '';

      const paragraphs = Array.from(
        document.querySelectorAll('article p, main p, [role="main"] p, p'),
      )
        .map((el) => el.textContent?.trim() || '')
        .filter((t) => t.length > 60);

      return {
        title: og('og:title') || document.title || '',
        description: og('og:description') || og('description') || '',
        ogImage: og('og:image') || '',
        ogVideo: og('og:video') || og('og:video:url') || '',
        text: paragraphs.slice(0, 12).join('\n'),
        canonical: document.querySelector('link[rel="canonical"]')?.href || location.href,
      };
    });

    return { url, ...data };
  });
}

/**
 * Collect image/video URLs from a rendered page (no download).
 */
export async function extractMediaFromUrl(url, options = {}) {
  const { maxItems = 24 } = options;

  return withPage(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForTimeout(2000);

    // Lazy-load images by scrolling
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 200));
      }
      window.scrollTo(0, 0);
    });

    const raw = await page.evaluate(({ pageUrl, limit }) => {
      const items = [];
      const seen = new Set();

      const add = (href, type, extra = {}) => {
        if (!href || href.startsWith('data:') || href.startsWith('blob:')) return;
        try {
          const abs = new URL(href, pageUrl).href;
          if (seen.has(abs)) return;
          seen.add(abs);
          items.push({ url: abs, type, ...extra });
        } catch {
          /* invalid */
        }
      };

      const ogImage = document.querySelector('meta[property="og:image"]')?.content;
      const ogVideo =
        document.querySelector('meta[property="og:video"]')?.content ||
        document.querySelector('meta[property="og:video:url"]')?.content;
      if (ogImage) add(ogImage, 'image', { source: 'og' });
      if (ogVideo) add(ogVideo, 'video', { source: 'og' });

      document.querySelectorAll('video[src], video source[src]').forEach((el) => {
        const src = el.getAttribute('src');
        if (src) add(src, 'video', { source: 'video-tag' });
      });

      document.querySelectorAll('img[src], img[data-src], img[data-lazy-src]').forEach((img) => {
        const src =
          img.getAttribute('src') ||
          img.getAttribute('data-src') ||
          img.getAttribute('data-lazy-src');
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        if (w > 0 && w < 120) return;
        if (h > 0 && h < 120) return;
        add(src, 'image', { source: 'img', width: w, height: h });
      });

      document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href');
        if (/\.(mp4|webm|mov)(\?|$)/i.test(href || '')) {
          add(href, 'video', { source: 'link' });
        }
      });

      return items.slice(0, limit);
    }, { pageUrl: url, limit: maxItems });

    return raw
      .map((item) => ({
        ...item,
        url: preferHighResUrl(normalizeUrl(url, item.url)),
        id: `scrape-${hashUrl(item.url)}`,
        source: 'playwright',
        quality: (item.width || 0) >= 1920 ? '4k' : 'hd',
      }))
      .filter((item) => item.url)
      .sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));
  });
}

/**
 * Download media assets discovered on a page into destDir.
 */
export async function downloadPageMedia(url, destDir, options = {}) {
  const { maxDownloads = 16 } = options;
  fs.mkdirSync(destDir, { recursive: true });

  const discovered = await extractMediaFromUrl(url, { maxItems: maxDownloads * 3 });
  const manifest = [];
  let count = 0;

  for (const item of discovered) {
    if (item.type === 'image' && item.width && item.width < MIN_IMAGE_WIDTH) continue;
    if (count >= maxDownloads) break;
    if (!item.url) continue;

    const isVideo = item.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(item.url);
    const ext = isVideo ? extFromUrl(item.url, '.mp4') : extFromUrl(item.url, '.jpg');
    const filename = `${hashUrl(item.url)}${ext}`;
    const dest = path.join(destDir, filename);

    if (fs.existsSync(dest)) {
      const existingOk = isVideo
        ? await verifyReadableVideo(dest)
        : verifyReadableImage(dest);
      if (existingOk) {
        manifest.push({
          ...item,
          type: isVideo ? 'video' : 'image',
          localPath: dest,
          filename,
        });
        count++;
      } else {
        fs.unlinkSync(dest);
      }
      continue;
    }

    try {
      const bytes = await downloadToFile(item.url, dest);
      if (isVideo) {
        if (bytes < MIN_VIDEO_BYTES) {
          fs.unlinkSync(dest);
          continue;
        }
        if (!(await verifyReadableVideo(dest))) {
          if (verifyReadableImage(dest)) {
            manifest.push({
              ...item,
              type: 'image',
              localPath: dest,
              filename,
              bytes,
            });
            count++;
          } else {
            fs.unlinkSync(dest);
            console.warn(`[playwright] Invalid video skipped: ${item.url}`);
          }
          continue;
        }
      } else if (bytes < MIN_IMAGE_BYTES || !verifyReadableImage(dest)) {
        fs.unlinkSync(dest);
        continue;
      }
      manifest.push({
        ...item,
        type: isVideo ? 'video' : 'image',
        localPath: dest,
        filename,
        bytes,
      });
      count++;
    } catch (err) {
      console.warn(`[playwright] Download failed ${item.url}:`, err.message);
    }
  }

  const metaPath = path.join(destDir, 'scrape-meta.json');
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ sourceUrl: url, scrapedAt: new Date().toISOString(), count: manifest.length }, null, 2),
  );
  fs.writeFileSync(path.join(destDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

/**
 * YouTube: metadata + high-res thumbnail (not full video — use for B-roll stills).
 */
export async function fetchYouTubeMetadata(url) {
  const { videoId } = parseYouTubeUrl(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const meta = await withPage(async (page) => {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForTimeout(2000);

    return page.evaluate(() => ({
      title:
        document.querySelector('meta[property="og:title"]')?.content?.replace(/ - YouTube$/, '') ||
        document.title?.replace(/ - YouTube$/, '') ||
        '',
      description: document.querySelector('meta[property="og:description"]')?.content || '',
      thumbnail:
        document.querySelector('meta[property="og:image"]')?.content ||
        document.querySelector('link[itemprop="thumbnailUrl"]')?.href ||
        '',
    }));
  });

  const thumbnails = [
    meta.thumbnail,
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ].filter(Boolean);

  return {
    videoId,
    url: pageUrl,
    ...meta,
    thumbnails: [...new Set(thumbnails)],
  };
}

/**
 * Download YouTube thumbnail images for timeline use.
 */
export async function downloadYouTubeThumbnails(url, destDir) {
  const yt = await fetchYouTubeMetadata(url);
  fs.mkdirSync(destDir, { recursive: true });

  const manifest = [];
  for (const thumbUrl of yt.thumbnails.slice(0, 3)) {
    const filename = `${hashUrl(thumbUrl)}.jpg`;
    const dest = path.join(destDir, filename);
    try {
      if (!fs.existsSync(dest)) await downloadToFile(thumbUrl, dest);
      manifest.push({
        source: 'youtube-thumbnail',
        type: 'image',
        url: thumbUrl,
        localPath: dest,
        filename,
        id: `yt-${yt.videoId}-${hashUrl(thumbUrl)}`,
        title: yt.title,
      });
      break;
    } catch {
      /* try next thumbnail */
    }
  }

  fs.writeFileSync(
    path.join(destDir, 'youtube-meta.json'),
    JSON.stringify({ ...yt, downloadedThumbnails: manifest.length }, null, 2),
  );
  return { metadata: yt, manifest };
}

/**
 * Full scrape: content + downloaded media for a URL (article or YouTube).
 */
export async function scrapeUrlForVideo(url, destDir) {
  const { videoId } = parseYouTubeUrl(url);
  const isYouTube = Boolean(videoId);

  if (isYouTube) {
    const { metadata, manifest } = await downloadYouTubeThumbnails(url, destDir);
    return {
      content: {
        title: metadata.title,
        description: metadata.description,
        text: metadata.description,
        url,
      },
      media: manifest,
      source: 'youtube',
    };
  }

  const [content, media] = await Promise.all([
    scrapePageContent(url),
    downloadPageMedia(url, destDir),
  ]);

  return { content, media, source: 'web' };
}
