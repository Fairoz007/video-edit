/**
 * Auto-search and download high-resolution (4K-friendly) media from stock APIs.
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { MIN_IMAGE_WIDTH } from '../constants/videoDefaults.js';

const PEXELS = 'https://api.pexels.com/v1';
const PIXABAY = 'https://pixabay.com/api/';
const UNSPLASH = 'https://api.unsplash.com';

function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

async function downloadFile(url, dest) {
  const response = await axios.get(url, { responseType: 'stream', timeout: 60000 });
  await pipeline(response.data, fs.createWriteStream(dest));
  return dest;
}

async function searchPexels(query, perPage = 8) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const { data } = await axios.get(`${PEXELS}/search`, {
    params: { query, per_page: perPage },
    headers: { Authorization: key },
  });
  return (data.photos || []).map((p) => ({
    source: 'pexels',
    type: 'image',
    url: p.src.original || p.src.large2x || p.src.large,
    thumb: p.src.medium,
    width: p.width,
    height: p.height,
    quality: '4k',
    photographer: p.photographer,
    id: `pexels-${p.id}`,
  })).concat(
    (data.videos || []).map((v) => ({
      source: 'pexels',
      type: 'video',
      url: v.video_files?.[0]?.link,
      thumb: v.image,
      id: `pexels-v-${v.id}`,
    })).filter((v) => v.url),
  );
}

async function searchPixabay(query, perPage = 8) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];
  const { data } = await axios.get(PIXABAY, {
    params: { key, q: query, per_page: perPage, image_type: 'photo' },
  });
  return (data.hits || []).map((h) => ({
    source: 'pixabay',
    type: h.type === 'film' ? 'video' : 'image',
    url: h.fullHDURL || h.largeImageURL || h.webformatURL,
    thumb: h.previewURL,
    width: h.imageWidth,
    height: h.imageHeight,
    quality: '4k',
    id: `pixabay-${h.id}`,
  }));
}

function unsplashHeaders() {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  return { Authorization: `Client-ID ${key}` };
}

async function searchUnsplash(query, perPage = 8) {
  const headers = unsplashHeaders();
  if (!headers) return [];
  const { data } = await axios.get(`${UNSPLASH}/search/photos`, {
    params: { query, per_page: perPage },
    headers,
  });
  return (data.results || []).map((p) => ({
    source: 'unsplash',
    type: 'image',
    url: p.urls.full || p.urls.raw || p.urls.regular,
    thumb: p.urls.small,
    width: p.width,
    height: p.height,
    quality: '4k',
    id: `unsplash-${p.id}`,
    photoId: p.id,
    downloadLocation: p.links?.download_location,
    photographer: p.user?.name,
    attribution: `Photo by ${p.user?.name} on Unsplash`,
  }));
}

/** Unsplash API: trigger download count before fetching the image. */
async function triggerUnsplashDownload(item) {
  const headers = unsplashHeaders();
  if (!headers || !item.photoId) return item.url;
  try {
    const endpoint =
      item.downloadLocation || `${UNSPLASH}/photos/${item.photoId}/download`;
    const { data } = await axios.get(endpoint, { headers });
    return data.url || item.url;
  } catch {
    return item.url;
  }
}

/** Prefer 4K / large assets for documentary B-roll. */
function mediaQualityScore(item) {
  const w = item.width || 0;
  const h = item.height || 0;
  const pixels = w * h;
  if (pixels >= 3840 * 2160) return 1000 + pixels;
  if (w >= MIN_IMAGE_WIDTH || h >= 1080) return 500 + pixels;
  if (item.quality === '4k') return 400;
  return pixels;
}

export async function searchMedia(query, options = {}) {
  const { limit = 20 } = options;
  const searchQuery = `${query} 4K ultra HD documentary`.trim();
  const results = await Promise.allSettled([
    searchPexels(searchQuery, 8),
    searchPixabay(searchQuery, 8),
    searchUnsplash(searchQuery, 8),
  ]);

  const merged = [];
  const seen = new Set();

  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
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
    if (!item.url) continue;
    const ext = item.type === 'video' ? '.mp4' : '.jpg';
    const filename = `${hashUrl(item.url)}${ext}`;
    const dest = path.join(destDir, filename);

    if (seenHashes.has(filename)) continue;
    seenHashes.add(filename);

    try {
      if (!fs.existsSync(dest)) {
        const fetchUrl =
          item.source === 'unsplash' ? await triggerUnsplashDownload(item) : item.url;
        await downloadFile(fetchUrl, dest);
      }
      const stat = fs.statSync(dest);
      if (item.type !== 'video' && stat.size < 12000) {
        fs.unlinkSync(dest);
        continue;
      }
      manifest.push({ ...item, localPath: dest, filename, bytes: stat.size });
    } catch (err) {
      console.warn(`[mediaSearch] Failed to download ${item.url}:`, err.message);
    }
  }

  fs.writeFileSync(path.join(destDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}
