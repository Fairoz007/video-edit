/**
 * Auto-search and download HD stock video from Pexels / Pixabay APIs.
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { MIN_IMAGE_WIDTH } from '../constants/videoDefaults.js';

const PEXELS_VIDEOS = 'https://api.pexels.com/videos';
const PIXABAY_VIDEOS = 'https://pixabay.com/api/videos/';

const MIN_VIDEO_WIDTH = MIN_IMAGE_WIDTH;
const VIDEO_DOWNLOAD_TIMEOUT_MS = 180_000;

function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

async function downloadFile(url, dest) {
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: VIDEO_DOWNLOAD_TIMEOUT_MS,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  await pipeline(response.data, fs.createWriteStream(dest));
  return dest;
}

/** Prefer widest MP4 (HD/4K) from Pexels `video_files`. */
function pickBestPexelsFile(videoFiles = []) {
  const mp4 = videoFiles.filter(
    (f) => f?.link && (!f.file_type || /mp4/i.test(f.file_type)),
  );
  const candidates = mp4.length ? mp4 : videoFiles.filter((f) => f?.link);
  if (!candidates.length) return null;

  return candidates.sort((a, b) => {
    const aw = a.width || 0;
    const bw = b.width || 0;
    if (bw !== aw) return bw - aw;
    const rank = (q) => (q === 'uhd' || q === '4k' ? 3 : q === 'hd' ? 2 : 1);
    return rank(b.quality) - rank(a.quality);
  })[0];
}

function mapPexelsVideo(v) {
  const file = pickBestPexelsFile(v.video_files);
  if (!file?.link) return null;
  return {
    source: 'pexels',
    type: 'video',
    url: file.link,
    thumb: v.image,
    width: file.width || v.width,
    height: file.height || v.height,
    duration: v.duration,
    quality: (file.width || 0) >= 3840 ? '4k' : (file.width || 0) >= 1920 ? 'hd' : 'sd',
    photographer: v.user?.name,
    id: `pexels-v-${v.id}`,
  };
}

async function searchPexelsVideos(query, perPage = 8) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const { data } = await axios.get(`${PEXELS_VIDEOS}/search`, {
    params: { query, per_page: perPage, orientation: 'landscape' },
    headers: { Authorization: key },
    timeout: 30_000,
  });
  return (data.videos || []).map(mapPexelsVideo).filter(Boolean);
}

/** Pixabay may return empty `large.url` when 4K is unavailable — skip zero-size renditions. */
function isUsablePixabayRendition(rendition) {
  return Boolean(
    rendition?.url?.trim() &&
      (rendition.size == null || rendition.size > 0) &&
      (rendition.width == null || rendition.width > 0),
  );
}

function pickBestPixabayFile(videos = {}) {
  const order = ['large', 'medium', 'small', 'tiny'];
  let best = null;
  for (const tier of order) {
    const f = videos[tier];
    if (!isUsablePixabayRendition(f)) continue;
    if (!best || (f.width || 0) > (best.width || 0)) {
      best = { ...f, tier };
    }
  }
  return best;
}

function mapPixabayVideo(hit) {
  const file = pickBestPixabayFile(hit.videos);
  if (!file?.url) return null;

  const w = file.width || 0;
  const quality = w >= 3840 ? '4k' : w >= 1920 ? 'hd' : 'sd';

  return {
    source: 'pixabay',
    type: 'video',
    url: file.url,
    thumb: file.thumbnail,
    width: file.width,
    height: file.height,
    duration: hit.duration,
    quality,
    id: `pixabay-v-${hit.id}`,
    pageURL: hit.pageURL,
    tags: hit.tags,
    videoType: hit.type,
    photographer: hit.user,
    attribution: hit.user ? `Video by ${hit.user} on Pixabay` : 'Pixabay',
  };
}

async function searchPixabayVideos(query, perPage = 8) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];

  const q = String(query).trim().slice(0, 100);
  if (!q) return [];

  const { data } = await axios.get(PIXABAY_VIDEOS, {
    params: {
      key,
      q,
      per_page: Math.min(Math.max(perPage, 3), 200),
      video_type: 'film',
      min_width: MIN_VIDEO_WIDTH,
      safesearch: true,
      order: 'popular',
      lang: 'en',
    },
    timeout: 30_000,
  });

  if (!data.totalHits) return [];

  return (data.hits || []).map(mapPixabayVideo).filter(Boolean);
}

/** Prefer wide HD clips for documentary B-roll. */
function mediaQualityScore(item) {
  const w = item.width || 0;
  const h = item.height || 0;
  const pixels = w * h;
  let score = pixels;
  if (w >= 3840 || h >= 2160) score += 2000;
  else if (w >= MIN_VIDEO_WIDTH || h >= 1080) score += 1000;
  if (item.duration && item.duration >= 8) score += 200;
  if (item.quality === '4k') score += 400;
  else if (item.quality === 'hd') score += 200;
  return score;
}

export async function searchMedia(query, options = {}) {
  const { limit = 20 } = options;
  const searchQuery = `${query} b-roll`.trim();
  const results = await Promise.allSettled([
    searchPexelsVideos(searchQuery, 10),
    searchPixabayVideos(searchQuery, 10),
  ]);

  const merged = [];
  const seen = new Set();

  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
      if (item.type !== 'video') continue;
      const key = item.url;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged
    .sort((a, b) => mediaQualityScore(b) - mediaQualityScore(a))
    .slice(0, limit);
}

export async function downloadMediaAssets(items, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const manifest = [];
  const seenHashes = new Set();

  for (const item of items) {
    if (!item.url || item.type !== 'video') continue;
    const ext = '.mp4';
    const filename = `${hashUrl(item.url)}${ext}`;
    const dest = path.join(destDir, filename);

    if (seenHashes.has(filename)) continue;
    seenHashes.add(filename);

    try {
      if (!fs.existsSync(dest)) {
        await downloadFile(item.url, dest);
      }
      const stat = fs.statSync(dest);
      if (stat.size < 48_000) {
        fs.unlinkSync(dest);
        continue;
      }
      manifest.push({ ...item, type: 'video', localPath: dest, filename, bytes: stat.size });
    } catch (err) {
      console.warn(`[mediaSearch] Failed to download ${item.url}:`, err.message);
    }
  }

  fs.writeFileSync(path.join(destDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}
