/**
 * Generate SRT subtitles and Remotion cue lists from narration sections.
 */
import fs from 'fs';
import path from 'path';
import { NARRATION_WORDS_PER_MINUTE } from '../constants/videoDefaults.js';

function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function wrapText(text, maxLen = 42) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + w).length > maxLen) {
      lines.push(line.trim());
      line = w + ' ';
    } else {
      line += w + ' ';
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n');
}

export function buildSubtitleCues(sections, options = {}) {
  const wordsPerSecond = (options.wordsPerMinute || NARRATION_WORDS_PER_MINUTE) / 60;
  const introOffset = options.introOffsetSec || 0;
  let cursor = introOffset;
  const cues = [];

  for (const section of sections) {
    const sentences = section.narration.match(/[^.!?]+[.!?]+/g) || [section.narration];
    const sectionDuration = section.durationEstimate || 12;
    const sentenceShare = sectionDuration / Math.max(1, sentences.length);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      const wordDuration = trimmed.split(/\s+/).length / wordsPerSecond;
      const duration = Math.max(2, Math.min(sentenceShare, wordDuration));
      cues.push({
        text: trimmed,
        startSec: cursor,
        endSec: cursor + duration,
        sectionId: section.id,
      });
      cursor = cursor + duration + 0.08;
    }
  }

  return cues;
}

export function generateSRT(sections, wordsPerSecond = NARRATION_WORDS_PER_MINUTE / 60) {
  let index = 1;
  let cursor = 0;
  const blocks = [];

  for (const section of sections) {
    const sentences = section.narration.match(/[^.!?]+[.!?]+/g) || [section.narration];
    const sectionDuration = section.durationEstimate || 12;
    const sentenceShare = sectionDuration / Math.max(1, sentences.length);

    for (const sentence of sentences) {
      const wordDuration = sentence.split(/\s+/).length / wordsPerSecond;
      const duration = Math.max(2, Math.min(sentenceShare, wordDuration));
      const start = cursor;
      const end = cursor + duration;
      blocks.push(
        `${index}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${wrapText(sentence.trim())}\n`,
      );
      index++;
      cursor = end + 0.1;
    }
  }

  return blocks.join('\n');
}

function scaleCuesToDuration(cues, audioDurationSec, introOffset = 0) {
  if (!cues.length || !audioDurationSec) return cues;
  const contentEnd = cues[cues.length - 1].endSec - introOffset;
  if (!contentEnd || contentEnd <= 0) return cues;
  const scale = audioDurationSec / contentEnd;
  return cues.map((c) => ({
    ...c,
    startSec: introOffset + (c.startSec - introOffset) * scale,
    endSec: introOffset + (c.endSec - introOffset) * scale,
  }));
}

export function writeSubtitles(sections, outputDir, options = {}) {
  fs.mkdirSync(outputDir, { recursive: true });
  const introOffset = options.introOffsetSec || 0;
  let cues = buildSubtitleCues(sections, options);

  if (options.audioDurationSec) {
    cues = scaleCuesToDuration(cues, options.audioDurationSec, introOffset);
  }

  const srt = generateSRT(sections);
  const srtPath = path.join(outputDir, 'subtitles.srt');
  fs.writeFileSync(srtPath, srt, 'utf8');

  const cuesPath = path.join(outputDir, 'subtitle-cues.json');
  fs.writeFileSync(cuesPath, JSON.stringify(cues, null, 2));

  return { srtPath, cuesPath, cues };
}
