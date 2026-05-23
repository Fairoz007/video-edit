import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const require = createRequire(import.meta.url);

let npmFfmpegBin = null;
try {
  npmFfmpegBin = require('@ffmpeg-installer/ffmpeg').path;
} catch {
  /* @ffmpeg-installer/ffmpeg not installed */
}

const CANDIDATES = [
  process.env.FFMPEG_PATH,
  npmFfmpegBin,
  '/opt/homebrew/bin/ffmpeg',
  '/usr/local/bin/ffmpeg',
  '/usr/bin/ffmpeg',
  'ffmpeg',
].filter(Boolean);

let resolvedPath = null;

export function findFfmpegPath() {
  if (resolvedPath && fs.existsSync(resolvedPath)) return resolvedPath;

  for (const candidate of CANDIDATES) {
    try {
      if (candidate !== 'ffmpeg' && !fs.existsSync(candidate)) continue;
      execFileSync(candidate, ['-version'], { stdio: 'ignore' });
      resolvedPath = candidate;
      ffmpeg.setFfmpegPath(candidate);
      return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}

export function hasFfmpeg() {
  return Boolean(findFfmpegPath());
}

/** ffprobe next to bundled/system ffmpeg (handles `ffmpeg.exe` on Windows), or on PATH. */
export function findFfprobePath() {
  const ffmpegBin = findFfmpegPath();
  if (ffmpegBin && ffmpegBin !== 'ffmpeg') {
    const sibling = ffmpegBin.replace(/ffmpeg(\.exe)?$/i, (_, ext) => `ffprobe${ext || ''}`);
    if (fs.existsSync(sibling)) return sibling;
  }
  for (const candidate of [
    process.env.FFPROBE_PATH,
    '/opt/homebrew/bin/ffprobe',
    '/usr/local/bin/ffprobe',
    '/usr/bin/ffprobe',
    'ffprobe',
  ]) {
    try {
      if (candidate !== 'ffprobe' && !fs.existsSync(candidate)) continue;
      execFileSync(candidate, ['-version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}

export function initFfmpeg() {
  const found = findFfmpegPath();
  if (found) {
    const via = found === npmFfmpegBin ? 'npm (@ffmpeg-installer/ffmpeg)' : found;
    console.log(`[DocuForge] FFmpeg: ${via}`);
  } else {
    console.warn(
      '[DocuForge] FFmpeg not found — run `npm install` (bundled binary) or set FFMPEG_PATH in .env',
    );
  }
  return found;
}
