/**
 * Documentary script — Groq LLM when GROQ_API_KEY is set, else rule-based fallback.
 * Default target length: 3:00 with intro, main sections, and outro (subscribe / like).
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  TARGET_VIDEO_DURATION_SEC,
  INTRO_DURATION_SEC,
  OUTRO_DURATION_SEC,
} from '../constants/videoDefaults.js';
import { generateScriptWithGroq, isGroqConfigured } from './groqScript.js';
import { expandScriptSections } from './scriptLength.js';
import { isValidHttpUrl, normalizeHttpUrl } from '../utils/urlValidate.js';

const FALLBACK_SECTIONS = {
  intro: {
    title: 'Introduction',
    templates: [
      'Welcome. In the next few minutes, we dive deep into the story of {topic}.',
      'Stay with us — this journey covers origins, growth, and where things stand today.',
    ],
    duration: INTRO_DURATION_SEC,
  },
  history: {
    title: 'Origins',
    templates: [
      'The origins of {topic} trace back to a world that looked very different.',
      'Early records suggest that {fact}',
    ],
    duration: 35,
  },
  growth: {
    title: 'Rise & Growth',
    templates: [
      'Expansion marked a turning point for {topic}.',
      '{fact}',
      'Innovation and ambition drove unprecedented momentum.',
    ],
    duration: 40,
  },
  modern: {
    title: 'Today',
    templates: [
      'Today, {topic} stands at the intersection of tradition and transformation.',
      '{fact}',
      'The modern era continues to write new chapters in this narrative.',
    ],
    duration: 45,
  },
  outro: {
    title: 'Outro',
    templates: [
      'That wraps our look at {topic}. If this story resonated with you, hit the like button so more viewers can find it.',
      'Subscribe for more documentaries like this — we publish new deep dives regularly. Thank you for watching.',
    ],
    duration: OUTRO_DURATION_SEC,
  },
};

function fillTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
}

async function fetchWikipediaSummary(topic) {
  try {
    const title = encodeURIComponent(topic.replace(/ /g, '_'));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
    const { data } = await axios.get(url, { timeout: 10000 });
    return {
      extract: data.extract || '',
      description: data.description || '',
      title: data.title || topic,
    };
  } catch {
    return { extract: '', description: '', title: topic };
  }
}

async function scrapeArticleUrl(url) {
  try {
    const { scrapePageContent } = await import('../scraper/playwrightScraper.js');
    const page = await scrapePageContent(url);
    return page.text || page.description || '';
  } catch {
    try {
      const { data: html } = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'DocuForge/1.0 (documentary generator)' },
      });
      const $ = cheerio.load(html);
      $('script, style, nav, footer, header').remove();
      const paragraphs = $('article p, main p, .content p, p')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((t) => t.length > 80)
        .slice(0, 8);
      return paragraphs.join(' ');
    } catch {
      return '';
    }
  }
}

function sentenceChunks(text, max = 5) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.slice(0, max).map((s) => s.trim()).filter(Boolean);
}

async function gatherResearchContext(input) {
  const { topic, youtubeUrl: rawYoutubeUrl } = input;
  const articleUrl = normalizeHttpUrl(input.articleUrl);
  const youtubeUrl = normalizeHttpUrl(rawYoutubeUrl);

  if (input.articleUrl?.trim() && !articleUrl) {
    console.warn(
      `[Script] Ignoring invalid article URL (must start with http:// or https://): ${input.articleUrl.slice(0, 80)}`,
    );
  }
  if (rawYoutubeUrl?.trim() && !youtubeUrl) {
    console.warn(
      `[Script] Ignoring invalid YouTube URL (must start with http:// or https://): ${rawYoutubeUrl.slice(0, 80)}`,
    );
  }

  let primaryTopic = topic || 'Untitled Documentary';
  let sourceText = '';

  if (articleUrl) {
    sourceText = await scrapeArticleUrl(articleUrl);
    if (!topic) primaryTopic = new URL(articleUrl).hostname.replace('www.', '');
  }

  if (youtubeUrl) {
    try {
      const { fetchYouTubeMetadata } = await import('../scraper/youtubeScraper.js');
      const yt = await fetchYouTubeMetadata(youtubeUrl);
      if (!topic) primaryTopic = yt.title?.replace(/ - YouTube$/, '') || 'YouTube Documentary';
      if (yt.description) sourceText = yt.description.slice(0, 2000);
    } catch {
      if (!topic) primaryTopic = 'YouTube Documentary';
    }
  }

  const wiki = await fetchWikipediaSummary(primaryTopic);
  const researchText = [wiki.extract, sourceText, wiki.description].filter(Boolean).join('\n\n');

  return {
    primaryTopic: wiki.title || primaryTopic,
    researchText,
    wiki,
    sourceMeta: {
      wikipedia: wiki.description,
      sourceUrl: articleUrl || null,
      youtubeUrl: youtubeUrl || null,
    },
  };
}

function generateFallbackScript(primaryTopic, researchText, sourceMeta) {
  const facts = sentenceChunks(researchText, 5);
  const fact = (i) => facts[i % facts.length] || `the legacy of ${primaryTopic} continues to unfold.`;
  const vars = { topic: primaryTopic, fact: fact(0) };
  const sections = [];

  for (const [id, cfg] of Object.entries(FALLBACK_SECTIONS)) {
    const narration = cfg.templates.map((t) => fillTemplate(t, { ...vars, fact: fact(sections.length) })).join(' ');
    sections.push({
      id,
      title: cfg.title,
      narration,
      durationEstimate: cfg.duration,
    });
  }

  const sum = sections.reduce((a, s) => a + s.durationEstimate, 0);
  const scale = TARGET_VIDEO_DURATION_SEC / sum;
  for (const s of sections) {
    s.durationEstimate = Math.round(s.durationEstimate * scale);
  }

  const expanded = expandScriptSections(sections, researchText);
  const fullNarration = expanded.map((s) => s.narration).join('\n\n');

  return {
    topic: primaryTopic,
    sections: expanded,
    fullNarration,
    metadata: {
      ...sourceMeta,
      generatedAt: new Date().toISOString(),
      engine: 'rule-based-templates',
      targetDurationSec: TARGET_VIDEO_DURATION_SEC,
    },
  };
}

export async function generateDocumentaryScript(input) {
  const { primaryTopic, researchText, wiki, sourceMeta } = await gatherResearchContext(input);

  if (isGroqConfigured()) {
    try {
      const groqScript = await generateScriptWithGroq({
        topic: primaryTopic,
        researchText: researchText || wiki.extract,
        sourceMeta,
      });
      groqScript.sections = expandScriptSections(
        groqScript.sections,
        researchText || wiki.extract,
      );
      groqScript.fullNarration = groqScript.sections.map((s) => s.narration).join('\n\n');
      return groqScript;
    } catch (err) {
      console.warn('[Script] Groq failed, using fallback:', err.message);
    }
  }

  return generateFallbackScript(primaryTopic, researchText || wiki.extract, sourceMeta);
}
