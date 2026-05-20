/**
 * Solid-color placeholder clips when stock/scrape media is missing or invalid.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { findFfmpegPath } from './ffmpegPath.js';

const execFileAsync = promisify(execFile);

const PLACEHOLDER_COLORS = [
  '0x1a1a2e',
  '0x16213e',
  '0x0f3460',
  '0x1b262c',
  '0x2d132c',
  '0x3d1f47',
  '0x1f4068',
  '0x2c3e50',
  '0x34495e',
  '0x2c2c54',
  '0x40407a',
  '0x706fd3',
];

const PLACEHOLDER_DURATION_SEC = 4;

export async function createPlaceholderAssets(mediaDir, count = 12) {
  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin) return [];

  fs.mkdirSync(mediaDir, { recursive: true });
  const assets = [];

  for (let i = 0; i < count; i++) {
    const filename = `placeholder-${String(i).padStart(2, '0')}.mp4`;
    const dest = path.join(mediaDir, filename);
    const color = PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length];

    if (!fs.existsSync(dest)) {
      await execFileAsync(
        ffmpegBin,
        [
          '-y',
          '-f',
          'lavfi',
          '-i',
          `color=c=${color}:s=1920x1080:d=${PLACEHOLDER_DURATION_SEC}`,
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          '-t',
          String(PLACEHOLDER_DURATION_SEC),
          dest,
        ],
        { timeout: 60_000 },
      );
    }

    if (fs.existsSync(dest)) {
      assets.push({
        source: 'placeholder',
        type: 'video',
        localPath: dest,
        filename,
        id: `placeholder-${i}`,
        quality: '1080p',
        duration: PLACEHOLDER_DURATION_SEC,
      });
    }
  }

  return assets;
}

export async function ensureMediaManifest(manifest, mediaDir, minCount = 12) {
  const valid = (manifest || []).filter((m) => m?.localPath && fs.existsSync(m.localPath));
  if (valid.length >= minCount) return valid;

  const placeholders = await createPlaceholderAssets(mediaDir, Math.max(minCount, 12));
  return [...valid, ...placeholders].slice(0, Math.max(minCount, valid.length + placeholders.length));
}
