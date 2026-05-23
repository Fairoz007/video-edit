/**
 * Auto-search and download HD stock video from Pexels / Pixabay APIs.
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { MIN_IMAGE_WIDTH } from '../constants/videoDefaults.js';
import { isVideoMagic, looksLikeHtml, MIN_VIDEO_BYTES } from '../utils/mediaValidate.js';

const PEXELS_VIDEOS = 'https://api.pexels.com/videos';
const PIXABAY_VIDEOS = 'https://pixabay.com/api/videos/';

const MIN_VIDEO_WIDTH = MIN_IMAGE_WIDTH;
const VIDEO_DOWNLOAD_TIMEOUT_MS = 180_000;
const DOWNLOAD_HEADERS = {
  'User-Agent': 'DocuForge/1.0 (stock video download)',
  Accept: 'video/mp4,video/*,*/*',
};

function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

function readFileMagic(filePath, len = 16) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, 0);
    return buf;
  } finally {
    fs.closeSync(fd);
  }
}

function isValidDownloadedVideo(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  if (stat.size < MIN_VIDEO_BYTES) return false;
  const magic = readFileMagic(filePath);
  if (looksLikeHtml(magic)) return false;
  return isVideoMagic(magic);
}

async function downloadFile(url, dest) {
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: VIDEO_DOWNLOAD_TIMEOUT_MS,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: DOWNLOAD_HEADERS,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  });
  await pipeline(response.data, fs.createWriteStream(dest));
  return dest;
}

/** Prefer HD 1080p — reliable for edit; 4K when only option. */
function pickBestPexelsFile(videoFiles = []) {
  const mp4 = videoFiles.filter(
    (f) => f?.link && (!f.file_type || /mp4/i.test(f.file_type)),
  );
  const candidates = mp4.length ? mp4 : videoFiles.filter((f) => f?.link);
  if (!candidates.length) return null;

  return candidates.sort((a, b) => {
    const aw = a.width || 0;
    const bw = b.width || 0;
    const aScore =
      (aw >= 1920 && aw < 2560 ? 3000 : 0) +
      (aw >= 1280 ? 1000 : 0) +
      aw;
    const bScore =
      (bw >= 1920 && bw < 2560 ? 3000 : 0) +
      (bw >= 1280 ? 1000 : 0) +
      bw;
    if (bScore !== aScore) return bScore - aScore;
    const rank = (q) => (q === 'hd' ? 2 : q === 'sd' ? 1 : 3);
    return rank(b.quality) - rank(a.quality);
  })[0];
}

function mapPexelsVideo(v) {
  const file = pickBestPexelsFile(v.video_files);
  if (!file?.link) return null;
  const tags = (v.tags || [])
    .map((t) => (typeof t === 'string' ? t : t?.name))
    .filter(Boolean)
    .join(' ');
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
    tags: tags || v.url?.split('/').pop(),
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

function isUsablePixabayRendition(rendition) {
  return Boolean(
    rendition?.url?.trim() &&
      (rendition.size == null || rendition.size > 0) &&
      (rendition.width == null || rendition.width > 0),
  );
}

function pickBestPixabayFile(videos = {}) {
  const order = ['medium', 'large', 'small', 'tiny'];
  let best = null;
  for (const tier of order) {
    const f = videos[tier];
    if (!isUsablePixabayRendition(f)) continue;
    const w = f.width || 0;
    const score = (w >= 1920 && w < 2560 ? 3000 : 0) + (w >= 1280 ? 1000 : 0) + w;
    const bestScore = best
      ? (best.width >= 1920 && best.width < 2560 ? 3000 : 0) +
        (best.width >= 1280 ? 1000 : 0) +
        (best.width || 0)
      : -1;
    if (!best || score > bestScore) {
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
      min_width: 1280,
      safesearch: true,
      order: 'popular',
      lang: 'en',
    },
    timeout: 30_000,
  });

  if (!data.totalHits) return [];

  return (data.hits || []).map(mapPixabayVideo).filter(Boolean);
}

function mediaQualityScore(item) {
  const w = item.width || 0;
  const h = item.height || 0;
  const pixels = w * h;
  let score = pixels;
  if (w >= 3840 || h >= 2160) score += 500;
  else if (w >= MIN_VIDEO_WIDTH || h >= 1080) score += 1000;
  if (item.duration && item.duration >= 8) score += 200;
  if (item.quality === 'hd') score += 200;
  return score;
}

const MATCH_STOPWORDS = new Set([
  'world',
  'cup',
  'with',
  'from',
  'that',
  'this',
  'video',
  'footage',
  'film',
  'story',
  'about',
  'over',
  'into',
  'their',
  'there',
  'would',
  'could',
  'should',
  'people',
  'country',
  'nation',
  'become',
  'because',
  'through',
  'every',
  'still',
  'other',
  'which',
  'when',
  'where',
  'documentary',
  'cinematic',
  'style',
  'effect',
  'visual',
  'visuals',
]);

const VISUAL_KEYWORDS =
  /\b(aerial|drone|crowd|rally|protest|street|sunrise|sunset|portrait|archive|temple|mosque|city|landscape|timelapse|rain|night|empty|factory|train|flag|smoke|fire|ocean|mountain|forest|beach|office|newsroom|police|barricade|celebration|silhouette|bokeh|closeup|close-up|rooftop|highway|market|school|classroom|vigil|candlelight|sleeping|watching|scrolling|debate|shouting|clash|riot|parliament|election|highway|neighborhood|dawn|dusk|morning|evening)\b/i;

const STOCK_QUERY_FILLER =
  /\b(cinematic|documentary|footage|stock|b-roll|broll|style|effect|archive|visuals|montage|slow-motion|slow motion|dramatic|emotional|massive|grainy|chaotic|quiet|peaceful|gentle|slow|fast|hold|fade|cut|match|contrasted|contrasted with)\b/gi;

function tokenizeForMatch(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !MATCH_STOPWORDS.has(w));
}

/** Normalize a phrase for Pexels/Pixabay (visual nouns, not essay titles). */
export function sanitizeStockQuery(phrase) {
  let s = String(phrase || '')
    .trim()
    .replace(/["'`]/g, '')
    .replace(/\s+/g, ' ');
  if (!s) return '';

  s = s.replace(STOCK_QUERY_FILLER, ' ').replace(/\s+/g, ' ').trim();
  s = s
    .replace(/\b[A-Z]{2,}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (s.length < 6) {
    const parts = String(phrase).split(/\s+/);
    const idx = parts.findIndex((w) => VISUAL_KEYWORDS.test(w));
    if (idx >= 0) s = parts.slice(idx).join(' ').replace(STOCK_QUERY_FILLER, ' ').trim();
  }

  return s.slice(0, 80).trim();
}

function extractVisualPhrases(text) {
  const phrases = [];
  for (const part of String(text || '').split(/[,.;]/)) {
    const p = part.trim();
    if (p.length >= 10 && p.length <= 72 && VISUAL_KEYWORDS.test(p)) {
      const q = sanitizeStockQuery(p);
      if (q.length >= 6) phrases.push(q);
    }
  }
  return phrases;
}

/** Search queries for one script section (b-roll first, then visual direction). */
export function buildSectionSearchQueries(section) {
  const queries = [];
  const seen = new Set();
  const add = (raw) => {
    const q = sanitizeStockQuery(raw);
    if (q.length < 4 || seen.has(q.toLowerCase())) return;
    seen.add(q.toLowerCase());
    queries.push(q);
  };

  for (const b of section?.brollSuggestions || []) add(b);

  if (section?.visualDirection) {
    const firstClause = section.visualDirection.split(/[.;]/)[0]?.trim();
    if (firstClause) add(firstClause);
    for (const p of extractVisualPhrases(section.visualDirection)) add(p);
  }

  if (queries.length < 2 && section?.sceneHeading) {
    add(section.sceneHeading);
  }

  if (queries.length < 2 && section?.narration) {
    const tokens = tokenizeForMatch(section.narration).slice(0, 5);
    if (tokens.length >= 2) add(tokens.slice(0, 3).join(' '));
  }

  return queries.slice(0, 4);
}

/** All phrases/tokens used to rank a clip against a section. */
export function buildSectionMatchTerms(section, globalTerms = []) {
  const terms = [];
  const seen = new Set();
  const add = (t) => {
    const s = String(t || '').trim().toLowerCase();
    if (s.length < 3 || seen.has(s)) return;
    seen.add(s);
    terms.push(s);
  };

  for (const q of buildSectionSearchQueries(section)) add(q);
  for (const b of section?.brollSuggestions || []) add(b);
  if (section?.visualDirection) {
    add(section.visualDirection);
    for (const p of extractVisualPhrases(section.visualDirection)) add(p);
  }
  if (section?.title) add(section.title);
  if (section?.sceneHeading) add(section.sceneHeading);
  for (const w of tokenizeForMatch(section?.narration)) add(w);
  for (const g of globalTerms.slice(0, 6)) add(g);

  return terms;
}

function itemHaystack(item) {
  return `${item.tags || ''} ${item.searchQuery || ''} ${item.id || ''} ${item.photographer || ''}`.toLowerCase();
}

function relevanceScore(item, searchTerms, { requireTopicHit = true } = {}) {
  const hay = itemHaystack(item);
  let score = mediaQualityScore(item);
  const terms = searchTerms.filter(Boolean);
  let primaryHits = 0;

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    const phrase = String(term).toLowerCase().trim();
    const weight = i === 0 ? 900 : i < 3 ? 500 : 250;
    if (phrase.length >= 5 && hay.includes(phrase)) {
      score += weight;
      if (i < 2) primaryHits++;
    }
    for (const w of tokenizeForMatch(phrase)) {
      if (hay.includes(w)) {
        score += i === 0 ? 220 : 120;
        if (i < 2) primaryHits++;
      }
    }
  }

  if (requireTopicHit && terms.length > 0 && primaryHits === 0) score -= 2000;

  return score;
}

/** Score how well a downloaded clip fits a script section. */
export function scoreMediaForSection(item, section, globalTerms = []) {
  const terms = buildSectionMatchTerms(section, globalTerms);
  let score = relevanceScore(item, terms, { requireTopicHit: false });

  if (item.sectionId && item.sectionId === section?.id) score += 2500;
  if (item.searchQuery && terms.some((t) => t.includes(item.searchQuery.toLowerCase()))) {
    score += 600;
  }

  return score;
}

/** Build search phrases from topic, keywords, and script b-roll hints. */
export function buildContentSearchTerms({
  topic = '',
  keywords = [],
  brollSuggestions = [],
} = {}) {
  const terms = [];
  const seen = new Set();
  const add = (t) => {
    const s = String(t || '').trim().replace(/\s+/g, ' ');
    if (s.length < 3 || seen.has(s.toLowerCase())) return;
    seen.add(s.toLowerCase());
    terms.push(s.slice(0, 100));
  };

  add(topic);
  for (const k of keywords) add(k);
  for (const b of brollSuggestions) add(b);

  return terms.slice(0, 14);
}

export async function searchMedia(query, options = {}) {
  const { limit = 20, searchTerms = [] } = options;
  const q = (sanitizeStockQuery(query) || String(query).trim()).slice(0, 100);
  if (!q) return [];

  const terms = searchTerms.length ? searchTerms : [q];
  const results = await Promise.allSettled([
    searchPexelsVideos(q, 12),
    searchPixabayVideos(q, 12),
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
      merged.push({ ...item, relevance: relevanceScore(item, terms) });
    }
  }

  return merged
    .sort((a, b) => (b.relevance || 0) - (a.relevance || 0) || mediaQualityScore(b) - mediaQualityScore(a))
    .slice(0, limit);
}

/**
 * Search stock video per script section so clips match b-roll + visual direction.
 */
export async function searchMediaForScript(script, { keywords = [], limit = 32 } = {}) {
  const sections = script?.sections || [];
  if (!sections.length) {
    return searchMediaForContent({
      topic: script?.topic || '',
      keywords,
      brollSuggestions: [],
      limit,
    });
  }

  const globalTerms = buildContentSearchTerms({
    topic: script.topic,
    keywords,
    brollSuggestions: [],
  });
  const perQuery = Math.max(3, Math.ceil(limit / Math.max(sections.length * 2, 8)));
  const byUrl = new Map();

  for (const section of sections) {
    const queries = buildSectionSearchQueries(section);
    const matchTerms = buildSectionMatchTerms(section, globalTerms);
    if (!queries.length) continue;

    for (const query of queries.slice(0, 3)) {
      const batch = await searchMedia(query, {
        limit: perQuery + 2,
        searchTerms: matchTerms,
      });

      for (const item of batch) {
        if (!item.url) continue;
        const sectionRelevance = scoreMediaForSection(item, section, globalTerms);
        const enriched = {
          ...item,
          sectionId: section.id,
          searchQuery: query,
          sectionRelevance,
          relevance: sectionRelevance,
        };

        const prev = byUrl.get(item.url);
        if (!prev || enriched.sectionRelevance > (prev.sectionRelevance || 0)) {
          byUrl.set(item.url, enriched);
        }
      }
    }
  }

  const merged = [...byUrl.values()].sort(
    (a, b) =>
      (b.sectionRelevance || b.relevance || 0) - (a.sectionRelevance || a.relevance || 0) ||
      mediaQualityScore(b) - mediaQualityScore(a),
  );

  if (merged.length < Math.min(8, limit)) {
    const fallback = await searchMediaForContent({
      topic: script.topic,
      keywords,
      brollSuggestions: sections.flatMap((s) => s.brollSuggestions || []),
      limit: limit - merged.length,
    });
    for (const item of fallback) {
      if (!item.url || byUrl.has(item.url)) continue;
      byUrl.set(item.url, item);
    }
  }

  return [...byUrl.values()]
    .sort(
      (a, b) =>
        (b.sectionRelevance || b.relevance || 0) - (a.sectionRelevance || a.relevance || 0),
    )
    .slice(0, limit);
}

/** Search Pexels + Pixabay using script topic, keywords, and b-roll suggestions. */
export async function searchMediaForContent({
  topic = '',
  keywords = [],
  brollSuggestions = [],
  limit = 24,
} = {}) {
  const terms = buildContentSearchTerms({ topic, keywords, brollSuggestions });
  if (!terms.length) return [];

  const perTerm = Math.max(4, Math.ceil(limit / Math.min(terms.length, 8)));
  const merged = [];
  const seen = new Set();

  for (const term of terms.slice(0, 8)) {
    const q = sanitizeStockQuery(term) || term;
    const batch = await searchMedia(q, { limit: perTerm, searchTerms: terms });
    for (const item of batch) {
      if (!item.url || seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
    }
  }

  return merged
    .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
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
      if (!fs.existsSync(dest) || !isValidDownloadedVideo(dest)) {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        await downloadFile(item.url, dest);
      }
      if (!isValidDownloadedVideo(dest)) {
        console.warn(`[mediaSearch] Invalid video file (not MP4): ${filename}`);
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        continue;
      }
      const stat = fs.statSync(dest);
      manifest.push({ ...item, type: 'video', localPath: dest, filename, bytes: stat.size });
    } catch (err) {
      console.warn(`[mediaSearch] Failed to download ${item.url}:`, err.message);
      if (fs.existsSync(dest)) {
        try {
          fs.unlinkSync(dest);
        } catch {
          /* ignore */
        }
      }
    }
  }

  fs.writeFileSync(path.join(destDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}
