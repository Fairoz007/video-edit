/**

 * Shared prompts and JSON normalization for Groq / Gemini script generation.

 */

import {

  NARRATION_WORDS_PER_MINUTE,

  SCRIPT_SECTION_IDS,

  SCRIPT_SECTION_DURATION_HINTS,

} from '../constants/videoDefaults.js';

import {

  expandScriptSections,

  countWords,

  narrationDurationSec,

  estimateScriptDurationSec,

  syncSectionDurationsFromNarration,

} from './scriptLength.js';



export const SCRIPT_SYSTEM_PROMPT = `You are an award-winning documentary screenwriter for Netflix/BBC-style YouTube films.



Create a cinematic, emotional, story-driven script — NOT news copy, NOT generic AI narration, NOT a listicle.



STYLE (mandatory):

- Strong storytelling structure; hook viewers in the first 15 seconds (opening section).

- Natural human narration: varied rhythm, short punches mixed with longer reflective lines.

- Cinematic pacing with curiosity loops, suspense, and emotional build.

- Vivid imagery and descriptive storytelling; avoid repetitive sentence patterns.

- Use realistic dialogue or historical/contextual quotes when relevant (woven into narration).

- Every section must flow like a story beat, not an encyclopedia article or press briefing.

- Tone: cinematic, emotional, intelligent, suspenseful, immersive, documentary-quality.

- Do NOT write like a TV news anchor ("Get ready for...", "In this video we will...", "Let's dive in").

- Do NOT use bullet-point facts without narrative glue between them.

- Outro: end with a thought-provoking reflection — NOT a hard sell. No mandatory "subscribe and like" unless it fits organically in one quiet line at the very end.



STRUCTURE — exactly these sections in order:

1. opening — powerful cinematic cold open / hook

2. introduction — subject and central tension

3. backstory — context and rising tension

4. rising_action — main events, emotional build-up

5. revelation — turning point or key reveal

6. climax — peak emotional/dramatic moment

7. conclusion — emotional resolution

8. ending — final haunting or reflective thought



LENGTH: Write as much quality narration as the topic deserves — no fixed runtime cap. Depth and pacing matter more than hitting a word count.

Estimate each section's durationEstimate in seconds from its narration at ~${NARRATION_WORDS_PER_MINUTE} words per minute when spoken.



OUTPUT: valid JSON only, no markdown.



Each section object MUST include:

- id (one of the structure ids above)

- sceneHeading — short cinematic scene title (e.g. "Night Over the City")

- title — chapter label for on-screen use

- visualDirection — camera, lighting, mood, framing (1–3 sentences)

- narration — spoken words ONLY (what the voiceover says; no stage directions in this field)

- brollSuggestions — array of 2–4 concrete stock-footage search phrases for this beat

- audioDesign — background music mood + key SFX (e.g. "low strings swell; distant crowd ambience")

- transitionNotes — how we enter/exit the scene (dissolve, smash cut, match cut, etc.)

- durationEstimate — seconds; should match that section's narration at ~${NARRATION_WORDS_PER_MINUTE} WPM



FACTS: Use only facts supported by the research context. Do not invent controversial claims or fake quotes.`;



function sectionDurationHint(id) {

  return SCRIPT_SECTION_DURATION_HINTS[id] ?? 20;

}



function exampleSection(id, title, sceneHeading) {

  const dur = sectionDurationHint(id);

  return `    {

      "id": "${id}",

      "sceneHeading": "${sceneHeading}",

      "title": "${title}",

      "visualDirection": "...",

      "narration": "...",

      "brollSuggestions": ["...", "..."],

      "audioDesign": "...",

      "transitionNotes": "...",

      "durationEstimate": ${dur}

    }`;

}



export function buildScriptUserPrompt({ topic, researchText, sourceMeta }) {

  const sectionExamples = [

    exampleSection('opening', 'The Hook', 'Before the Storm'),

    exampleSection('introduction', 'The Question', 'Faces in the Crowd'),

    exampleSection('backstory', 'Roots of Fire', 'Archive Room'),

    exampleSection('rising_action', 'Pressure Builds', 'Crossroads'),

    exampleSection('revelation', 'The Truth Emerges', 'Unveiled'),

    exampleSection('climax', 'Breaking Point', 'The Roar'),

    exampleSection('conclusion', 'Aftermath', 'Quiet Dawn'),

    exampleSection('ending', 'What Remains', 'Last Light'),

  ].join(',\n');



  return `Topic: ${topic}



Research context:

${(researchText || 'No extra research.').slice(0, 6000)}



${sourceMeta?.articleUrl || sourceMeta?.sourceUrl ? `Source article: ${sourceMeta.articleUrl || sourceMeta.sourceUrl}` : ''}

${sourceMeta?.youtubeUrl ? `Source video: ${sourceMeta.youtubeUrl}` : ''}



Return JSON with this shape (all 8 sections required, ids exactly as listed):

{

  "topic": "string",

  "sections": [

${sectionExamples}

  ]

}`;

}



function normalizeBroll(value) {

  if (Array.isArray(value)) {

    const list = value.map((v) => String(v || '').trim()).filter(Boolean);

    return list.length ? list : undefined;

  }

  const single = String(value || '').trim();

  return single ? [single] : undefined;

}



function normalizeSections(sections) {

  const list = Array.isArray(sections) ? sections : [];



  return list.map((s) => {

    const id = String(s.id || 'section');

    const title = String(s.title || s.sceneHeading || id);

    const sceneHeading = String(s.sceneHeading || title).trim();

    const visualDirection = String(s.visualDirection || '').trim();

    const audioDesign = String(

      s.audioDesign || s.backgroundMusic || s.musicSfx || '',

    ).trim();

    const transitionNotes = String(s.transitionNotes || s.transition || '').trim();

    const narration = String(s.narration || '').trim();

    const fromWords = narrationDurationSec(narration);

    const fromLlm = Number(s.durationEstimate) || 0;



    return {

      id,

      title,

      sceneHeading: sceneHeading || title,

      narration,

      ...(visualDirection ? { visualDirection } : {}),

      ...(normalizeBroll(s.brollSuggestions) ? { brollSuggestions: normalizeBroll(s.brollSuggestions) } : {}),

      ...(audioDesign ? { audioDesign } : {}),

      ...(transitionNotes ? { transitionNotes } : {}),

      durationEstimate: Math.max(5, fromWords || fromLlm || sectionDurationHint(id)),

    };

  });

}



export function fixDurationSum(sections) {

  return syncSectionDurationsFromNarration(normalizeSections(sections));

}



/** Extract the first balanced `{...}` object (Gemini sometimes appends trailing text). */

function extractFirstJsonObject(text) {

  let trimmed = String(text || '').trim();

  if (trimmed.startsWith('```')) {

    trimmed = trimmed

      .replace(/^```(?:json)?\s*/i, '')

      .replace(/\s*```[\s\S]*$/m, '')

      .trim();

  }



  try {

    return JSON.parse(trimmed);

  } catch {

    /* fall through */

  }



  const start = trimmed.indexOf('{');

  if (start < 0) return null;



  let depth = 0;

  let inString = false;

  let escape = false;



  for (let i = start; i < trimmed.length; i++) {

    const ch = trimmed[i];

    if (inString) {

      if (escape) escape = false;

      else if (ch === '\\') escape = true;

      else if (ch === '"') inString = false;

      continue;

    }

    if (ch === '"') {

      inString = true;

      continue;

    }

    if (ch === '{') depth++;

    else if (ch === '}') {

      depth--;

      if (depth === 0) {

        return JSON.parse(trimmed.slice(start, i + 1));

      }

    }

  }

  return null;

}



export function parseScriptJson(raw, providerLabel = 'LLM') {

  if (!raw) throw new Error(`Empty response from ${providerLabel}`);

  const parsed = extractFirstJsonObject(raw);

  if (!parsed) throw new Error(`${providerLabel} returned non-JSON script`);

  return parsed;

}



export function finalizeScript({ parsed, topic, sourceMeta, engine, model, researchText = '' }) {

  let sections = fixDurationSum(parsed.sections);

  sections = expandScriptSections(sections, researchText);

  const fullNarration = sections.map((s) => s.narration).join('\n\n');

  const wordCount = countWords(fullNarration);

  const estimatedDurationSec = estimateScriptDurationSec(sections);



  if (wordCount < 80) {

    console.warn(

      `[${engine}] Script only ${wordCount} words; video will be short unless narration is expanded.`,

    );

  }



  return {

    topic: parsed.topic || topic,

    sections,

    fullNarration,

    metadata: {

      ...sourceMeta,

      generatedAt: new Date().toISOString(),

      engine,

      model,

      estimatedDurationSec,

      wordCount,

      scriptStyle: 'cinematic_documentary',

    },

  };

}


