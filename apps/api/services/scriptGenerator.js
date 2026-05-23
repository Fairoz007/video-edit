/**
 * Documentary script — Gemini / Groq LLM when configured, else rule-based fallback.
 * SCRIPT_PROVIDER: gemini | groq | auto (default: try Groq then Gemini).
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  INTRO_DURATION_SEC,
  OUTRO_DURATION_SEC,
  SCRIPT_SECTION_DURATION_HINTS,
} from '../constants/videoDefaults.js';
import { generateScriptWithGroq, isGroqConfigured } from './groqScript.js';
import { generateScriptWithGemini, isGeminiConfigured } from './geminiScript.js';
import {
  expandScriptSections,
  estimateScriptDurationSec,
  syncSectionDurationsFromNarration,
} from './scriptLength.js';
import { parseUploadedScriptText } from './scriptTextParser.js';
import { isValidHttpUrl, normalizeHttpUrl } from '../utils/urlValidate.js';

const FALLBACK_SECTIONS = {
  opening: {
    sceneHeading: 'Before the Story Begins',
    title: 'Cold Open',
    visualDirection: 'Slow push-in on a wide landscape at dusk; shallow depth of field.',
    brollSuggestions: ['cinematic aerial landscape dusk', 'silhouette figure horizon'],
    audioDesign: 'Low drone pad; distant wind; single piano note.',
    transitionNotes: 'Fade in from black; hold on silence before first word.',
    templates: [
      'Some stories do not announce themselves. They arrive like weather — quiet at first, then impossible to ignore.',
      'This is the story of {topic}. And it begins long before anyone thought to name it.',
    ],
    duration: SCRIPT_SECTION_DURATION_HINTS.opening ?? INTRO_DURATION_SEC,
  },
  introduction: {
    sceneHeading: 'The Central Question',
    title: 'Why It Matters',
    visualDirection: 'Medium shots of people, places, or objects tied to the subject; natural light.',
    brollSuggestions: ['documentary portrait natural light', 'urban detail close-up'],
    audioDesign: 'Sparse strings; room tone underneath.',
    transitionNotes: 'Match cut from wide to intimate.',
    templates: [
      'To understand {topic}, you have to sit with a question that will not go away.',
      '{fact}',
    ],
    duration: SCRIPT_SECTION_DURATION_HINTS.introduction ?? 18,
  },
  backstory: {
    sceneHeading: 'Roots in Shadow',
    title: 'Backstory',
    visualDirection: 'Archival texture, grain, slower camera; maps or documents if relevant.',
    brollSuggestions: ['vintage archive footage', 'old photographs documentary'],
    audioDesign: 'Muted percussion; tape hiss texture optional.',
    transitionNotes: 'Dissolve between eras.',
    templates: [
      'The past does not stay past. For {topic}, the earliest chapters still pull on the present.',
      '{fact}',
    ],
    duration: SCRIPT_SECTION_DURATION_HINTS.backstory ?? 22,
  },
  rising_action: {
    sceneHeading: 'Pressure Builds',
    title: 'Rising Action',
    visualDirection: 'Handheld energy, quicker cuts, contrast rising.',
    brollSuggestions: ['crowd movement timelapse', 'dramatic sky clouds'],
    audioDesign: 'Rhythm enters; heartbeat-adjacent low pulse.',
    transitionNotes: 'Smash cuts on key words; L-cuts on narration.',
    templates: [
      'Then the ground shifted. What had been background noise became the main event.',
      '{fact}',
      'Momentum gathered — and with it, stakes no one could pretend were small.',
    ],
    duration: SCRIPT_SECTION_DURATION_HINTS.rising_action ?? 35,
  },
  revelation: {
    sceneHeading: 'The Unveiling',
    title: 'Revelation',
    visualDirection: 'Hold on faces; stillness after motion; light change.',
    brollSuggestions: ['dramatic reveal light window', 'eyes close-up documentary'],
    audioDesign: 'Music drops to near-silence; one sustained note.',
    transitionNotes: 'Slow zoom on pivotal image.',
    templates: [
      'And then — the detail that changes everything. Not louder. Clearer.',
      '{fact}',
    ],
    duration: SCRIPT_SECTION_DURATION_HINTS.revelation ?? 25,
  },
  climax: {
    sceneHeading: 'Breaking Point',
    title: 'Climax',
    visualDirection: 'Peak contrast, full frame action or emotional close-up.',
    brollSuggestions: ['dramatic climax cinematic', 'storm light documentary'],
    audioDesign: 'Full score swell; impact SFX sparingly.',
    transitionNotes: 'Crossfade to white flash optional, then back.',
    templates: [
      'This was the moment {topic} stopped being an idea and became a force — felt in real rooms, real lives.',
      '{fact}',
    ],
    duration: SCRIPT_SECTION_DURATION_HINTS.climax ?? 32,
  },
  conclusion: {
    sceneHeading: 'Aftermath',
    title: 'Conclusion',
    visualDirection: 'Softer light, wider frames, breathing room.',
    brollSuggestions: ['sunrise calm landscape', 'empty street morning'],
    audioDesign: 'Warm strings resolve; ambience returns.',
    transitionNotes: 'Gentle dissolve between shots.',
    templates: [
      'When the noise faded, what remained was not a headline — but a changed landscape around {topic}.',
      '{fact}',
    ],
    duration: SCRIPT_SECTION_DURATION_HINTS.conclusion ?? 18,
  },
  ending: {
    sceneHeading: 'Last Light',
    title: 'Ending',
    visualDirection: 'Single powerful image; hold; fade toward black.',
    brollSuggestions: ['cinematic sunset silhouette', 'night city lights bokeh'],
    audioDesign: 'Music resolves to silence; one final ambient texture.',
    transitionNotes: 'Fade to black; end on held image.',
    templates: [
      'Stories like this do not end. They echo — in what we choose to remember, and what we dare to do next.',
      'If {topic} taught us anything, it is that the future is still being written. The question is who holds the pen.',
    ],
    duration: SCRIPT_SECTION_DURATION_HINTS.ending ?? OUTRO_DURATION_SEC,
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
      sceneHeading: cfg.sceneHeading,
      visualDirection: cfg.visualDirection,
      brollSuggestions: cfg.brollSuggestions,
      audioDesign: cfg.audioDesign,
      transitionNotes: cfg.transitionNotes,
      narration,
      durationEstimate: cfg.duration,
    });
  }

  const expanded = syncSectionDurationsFromNarration(
    expandScriptSections(sections, researchText),
  );
  const fullNarration = expanded.map((s) => s.narration).join('\n\n');

  return {
    topic: primaryTopic,
    sections: expanded,
    fullNarration,
    metadata: {
      ...sourceMeta,
      generatedAt: new Date().toISOString(),
      engine: 'rule-based-templates',
      estimatedDurationSec: estimateScriptDurationSec(expanded),
    },
  };
}

async function applyLlmScript(script, researchText) {
  script.sections = expandScriptSections(script.sections, researchText);
  script.fullNarration = script.sections.map((s) => s.narration).join('\n\n');
  return script;
}

async function tryGenerateLlmScript(primaryTopic, researchText, sourceMeta) {
  const provider = (process.env.SCRIPT_PROVIDER || 'auto').toLowerCase();
  const research = researchText || '';
  const args = { topic: primaryTopic, researchText: research, sourceMeta };

  const attempts = [];
  if (provider === 'gemini') {
    if (isGeminiConfigured()) attempts.push(['Gemini', () => generateScriptWithGemini(args)]);
    if (isGroqConfigured()) attempts.push(['Groq', () => generateScriptWithGroq(args)]);
  } else if (provider === 'groq') {
    if (isGroqConfigured()) attempts.push(['Groq', () => generateScriptWithGroq(args)]);
  } else {
    if (isGroqConfigured()) attempts.push(['Groq', () => generateScriptWithGroq(args)]);
    if (isGeminiConfigured()) attempts.push(['Gemini', () => generateScriptWithGemini(args)]);
  }

  for (const [name, fn] of attempts) {
    try {
      return await applyLlmScript(await fn(), research);
    } catch (err) {
      console.warn(`[Script] ${name} failed:`, err.message);
    }
  }
  return null;
}

export async function generateDocumentaryScript(input) {
  const uploaded = String(input?.scriptText || '').trim();
  if (uploaded) {
    return parseUploadedScriptText(uploaded, { topic: input?.topic });
  }

  const { primaryTopic, researchText, wiki, sourceMeta } = await gatherResearchContext(input);
  const research = researchText || wiki.extract;

  const llmScript = await tryGenerateLlmScript(primaryTopic, research, sourceMeta);
  if (llmScript) return llmScript;

  return generateFallbackScript(primaryTopic, research, sourceMeta);
}
