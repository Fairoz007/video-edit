/**
 * Parse user-uploaded .txt documentary scripts into pipeline JSON.
 *
 * Format: see templates/documentary-script-demo.txt
 */
import {
  TARGET_VIDEO_DURATION_SEC,
  SCRIPT_SECTION_IDS,
  SCRIPT_SECTION_DURATION_HINTS,
} from '../constants/videoDefaults.js';
import { fixDurationSum } from './scriptLlmCommon.js';
import { countWords } from './scriptLength.js';

const SECTION_ALIASES = {
  opening: ['opening', 'open', 'cold_open', 'coldopen', 'hook'],
  introduction: ['introduction', 'intro_section'],
  backstory: ['backstory', 'history', 'origins', 'background'],
  rising_action: ['rising_action', 'rising', 'risingaction', 'growth', 'main'],
  revelation: ['revelation', 'reveal', 'turning_point', 'turningpoint'],
  climax: ['climax', 'peak'],
  conclusion: ['conclusion', 'resolve', 'resolution'],
  ending: ['ending', 'end', 'outro', 'coda'],
};

const FIELD_KEYS = {
  sceneHeading: ['scene heading', 'scene', 'heading'],
  title: ['title', 'chapter'],
  durationEstimate: ['duration', 'duration (seconds)', 'length', 'seconds'],
  visualDirection: ['visual direction', 'visual', 'visuals'],
  brollSuggestions: ['b-roll', 'broll', 'b roll', 'b-roll suggestions'],
  audioDesign: [
    'audio',
    'audio design',
    'background music',
    'background music/sfx',
    'music/sfx',
    'music',
    'sfx',
  ],
  transitionNotes: ['transition', 'transition notes', 'transitions'],
  narration: ['narration', 'voiceover', 'voice-over', 'narrator'],
};

function normalizeKey(line) {
  return line
    .toLowerCase()
    .replace(/[#*:]/g, '')
    .trim();
}

function resolveFieldKey(line) {
  const key = normalizeKey(line);
  for (const [field, aliases] of Object.entries(FIELD_KEYS)) {
    if (aliases.some((a) => key === a || key.startsWith(`${a} `))) return field;
  }
  return null;
}

function resolveSectionId(raw) {
  const key = String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  if (SCRIPT_SECTION_IDS.includes(key)) return key;
  for (const [id, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.includes(key)) return id;
  }
  return key || 'section';
}

function parseTopicLine(text) {
  const match = text.match(/^TOPIC:\s*(.+)$/im);
  return match ? match[1].trim() : '';
}

function splitSections(text) {
  const body = text.replace(/^TOPIC:\s*.+$/im, '').trim();
  const parts = body.split(
    /(?=^\s*(?:\[[\w\s_-]+\]|===\s*[\w\s_-]+\s*===)\s*$)/im,
  );
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseSectionHeader(block) {
  const firstLine = block.split(/\r?\n/)[0]?.trim() || '';
  const bracket = firstLine.match(/^\[([\w\s_-]+)\]\s*$/i);
  if (bracket) return { id: resolveSectionId(bracket[1]), body: block.slice(firstLine.length).trim() };

  const equals = firstLine.match(/^===\s*([\w\s_-]+)\s*===\s*$/i);
  if (equals) return { id: resolveSectionId(equals[1]), body: block.slice(firstLine.length).trim() };

  return { id: 'section', body: block };
}

function parseBrollValue(value) {
  return value
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSectionBody(body) {
  const section = {
    narration: '',
    durationEstimate: null,
  };
  const lines = body.split(/\r?\n/);
  let currentField = null;
  const narrationLines = [];

  for (const line of lines) {
    const fieldMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (fieldMatch) {
      const field = resolveFieldKey(fieldMatch[1]);
      if (field) {
        currentField = field;
        const value = fieldMatch[2].trim();
        if (field === 'narration') {
          if (value) narrationLines.push(value);
        } else if (field === 'brollSuggestions') {
          section.brollSuggestions = parseBrollValue(value);
        } else if (field === 'durationEstimate') {
          const n = parseInt(value, 10);
          if (!Number.isNaN(n)) section.durationEstimate = n;
        } else {
          section[field] = value;
        }
        continue;
      }
    }

    if (currentField === 'narration') {
      narrationLines.push(line);
    }
  }

  section.narration = narrationLines.join('\n').trim();
  return section;
}

export function parseUploadedScriptText(text, options = {}) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('Script file is empty.');

  const topicFromFile = parseTopicLine(raw);
  const topic = (options.topic || topicFromFile || 'Untitled Documentary').trim();
  const blocks = splitSections(raw);

  if (!blocks.length) {
    throw new Error(
      'No sections found. Use [opening], [introduction], etc. — see the demo template.',
    );
  }

  const sections = blocks.map((block) => {
    const { id, body } = parseSectionHeader(block);
    const parsed = parseSectionBody(body);
    const durationEstimate =
      parsed.durationEstimate ??
      SCRIPT_SECTION_DURATION_HINTS[id] ??
      Math.round(TARGET_VIDEO_DURATION_SEC / SCRIPT_SECTION_IDS.length);

    return {
      id,
      title: parsed.title || parsed.sceneHeading || id.replace(/_/g, ' '),
      sceneHeading: parsed.sceneHeading || parsed.title || id.replace(/_/g, ' '),
      narration: parsed.narration,
      ...(parsed.visualDirection ? { visualDirection: parsed.visualDirection } : {}),
      ...(parsed.brollSuggestions?.length
        ? { brollSuggestions: parsed.brollSuggestions }
        : {}),
      ...(parsed.audioDesign ? { audioDesign: parsed.audioDesign } : {}),
      ...(parsed.transitionNotes ? { transitionNotes: parsed.transitionNotes } : {}),
      durationEstimate,
    };
  });

  const withNarration = sections.filter((s) => s.narration);
  if (!withNarration.length) {
    throw new Error('No narration found. Add a "Narration:" block under each section.');
  }

  const normalized = fixDurationSum(withNarration);
  const fullNarration = normalized.map((s) => s.narration).join('\n\n');

  return {
    topic,
    sections: normalized,
    fullNarration,
    metadata: {
      generatedAt: new Date().toISOString(),
      engine: 'user-upload',
      targetDurationSec: TARGET_VIDEO_DURATION_SEC,
      scriptStyle: 'cinematic_documentary',
      wordCount: countWords(fullNarration),
    },
  };
}
