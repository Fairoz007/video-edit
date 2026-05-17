/**
 * Keyword extraction — Playwright for page/YouTube text, keyword-extractor for terms.
 */
import keywordExtractor from 'keyword-extractor';
import { withPage } from '../scraper/playwrightBrowser.js';
import { parseYouTubeUrl } from '../scraper/urlScraper.js';
import { fetchYouTubeMetadata } from '../scraper/playwrightScraper.js';

const NAV_TIMEOUT = 30000;

const STOP_WORDS = new Set([
  'about', 'after', 'also', 'been', 'before', 'being', 'between', 'both',
  'come', 'could', 'does', 'done', 'each', 'even', 'from', 'have', 'here',
  'into', 'just', 'like', 'made', 'make', 'many', 'more', 'most', 'much',
  'must', 'only', 'other', 'over', 'same', 'some', 'such', 'than', 'that',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
  'under', 'very', 'were', 'what', 'when', 'where', 'which', 'while', 'will',
  'with', 'would', 'your', 'watch', 'video', 'click', 'read', 'page', 'article',
]);

function runKeywordExtractor(text) {
  if (!text?.trim()) return [];
  return keywordExtractor.extract(text, {
    language: 'english',
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true,
  });
}

function significantTokens(text, minLen = 4) {
  const words = (text || '').toLowerCase().match(/\b[a-z][a-z'-]+\b/g) || [];
  const freq = new Map();
  for (const w of words) {
    if (w.length < minLen || STOP_WORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);
}

function phrasesFromHeadings(headings) {
  const out = [];
  for (const h of headings || []) {
    const cleaned = String(h).trim();
    if (cleaned.length > 3 && cleaned.length < 80) out.push(cleaned.toLowerCase());
  }
  return out;
}

/**
 * Playwright: pull title, meta keywords, headings, and body from a live page.
 */
export async function scrapeKeywordsFromUrl(url) {
  return withPage(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForTimeout(1500);

    return page.evaluate(() => {
      const meta = (name) =>
        document.querySelector(`meta[name="${name}"]`)?.content ||
        document.querySelector(`meta[property="${name}"]`)?.content ||
        '';

      const headings = [...document.querySelectorAll('h1, h2, h3')]
        .map((el) => el.textContent?.trim() || '')
        .filter((t) => t.length > 2 && t.length < 120);

      const paragraphs = [...document.querySelectorAll('article p, main p, p')]
        .map((el) => el.textContent?.trim() || '')
        .filter((t) => t.length > 40)
        .slice(0, 8);

      return {
        title: meta('og:title') || document.title || '',
        description: meta('og:description') || meta('description') || '',
        metaKeywords: meta('keywords') || '',
        headings,
        text: paragraphs.join('\n'),
      };
    });
  });
}

function buildCorpus(parts) {
  return parts.filter(Boolean).join('\n');
}

export function extractKeywordsFromText(text) {
  const extracted = runKeywordExtractor(text);
  const tokens = significantTokens(text);
  const combined = [...extracted, ...tokens]
    .map((w) => String(w).trim().toLowerCase())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const unique = [...new Set(combined)];

  return {
    keywords: unique.slice(0, 30),
    terms: extracted,
    tokens: tokens.slice(0, 20),
    engine: 'keyword-extractor',
  };
}

/**
 * @param {string|{ text?: string, topic?: string, articleUrl?: string, youtubeUrl?: string, scrapedContent?: object }} input
 */
export async function extractKeywords(input) {
  const opts = typeof input === 'string' ? { text: input } : input || {};
  const parts = [opts.topic, opts.text];

  let source = 'text';
  let pageMeta = null;

  if (opts.scrapedContent) {
    const c = opts.scrapedContent;
    parts.push(c.title, c.description, c.text);
    if (c.headings) parts.push(...c.headings);
    source = 'scraped-cache';
  }

  const articleUrl = opts.articleUrl;
  const youtubeUrl = opts.youtubeUrl;

  if (youtubeUrl && !opts.scrapedContent) {
    try {
      const yt = await fetchYouTubeMetadata(youtubeUrl);
      parts.push(yt.title, yt.description);
      pageMeta = { type: 'youtube', title: yt.title };
      source = 'playwright-youtube';
    } catch (err) {
      console.warn('[keywords] YouTube scrape failed:', err.message);
    }
  }

  if (articleUrl && !opts.scrapedContent) {
    const { videoId } = parseYouTubeUrl(articleUrl);
    if (!videoId) {
      try {
        const page = await scrapeKeywordsFromUrl(articleUrl);
        parts.push(page.title, page.description, page.metaKeywords, page.text);
        parts.push(...phrasesFromHeadings(page.headings));
        pageMeta = { type: 'article', title: page.title, headings: page.headings?.slice(0, 5) };
        source = 'playwright-article';
      } catch (err) {
        console.warn('[keywords] Article scrape failed:', err.message);
      }
    }
  }

  const corpus = buildCorpus(parts);
  const result = extractKeywordsFromText(corpus);

  return {
    ...result,
    source,
    pageMeta,
    corpusLength: corpus.length,
  };
}
