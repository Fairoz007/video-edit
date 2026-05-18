/**
 * Scrape article and YouTube metadata (no AI).
 */
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeUrl(url) {
  const { data: html } = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'DocuForge/1.0' },
  });
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text() ||
    '';
  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';
  const text = $('article p, main p, p')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 60)
    .slice(0, 10)
    .join('\n');

  return { title, description, text, url };
}

export function parseYouTubeUrl(url) {
  try {
    const u = new URL(url);
    const id =
      u.searchParams.get('v') ||
      (u.hostname.includes('youtu.be') ? u.pathname.slice(1) : null);
    return { videoId: id, url };
  } catch {
    return { videoId: null, url };
  }
}
