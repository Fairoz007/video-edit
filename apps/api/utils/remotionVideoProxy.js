/**
 * Downscale heavy source clips for Remotion frame extraction (max-performance mode).
 */
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { findFfmpegPath } from './ffmpegPath.js';

const execFileAsync = promisify(execFile);

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv)$/i;

export function isVideoAssetPath(src) {
  if (!src || typeof src !== 'string') return false;
  return VIDEO_EXT.test(path.extname(src));
}

/**
 * Copy or create a lighter proxy in publicDir. Proxy filenames include `-rproxy.`
 * @returns {Promise<string>} public-relative filename
 */
export async function copyOrProxyVideoForRemotion(src, publicDir, usedNames, index) {
  const ext = path.extname(src) || '.mp4';
  const base = path.basename(src, ext);
  let name = `${base}-rproxy${ext}`;
  if (usedNames.has(name)) {
    name = `asset-${index}-rproxy${ext}`;
  }
  usedNames.add(name);

  const dest = path.join(publicDir, name);
  if (fs.existsSync(dest)) {
    try {
      const srcStat = fs.statSync(src);
      const destStat = fs.statSync(dest);
      if (destStat.size > 1000 && destStat.mtimeMs >= srcStat.mtimeMs - 2000) {
        return name;
      }
    } catch {
      /* re-proxy */
    }
  }

  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin) {
    fs.copyFileSync(src, dest);
    return name;
  }

  const maxWidth = Number(process.env.REMOTION_PROXY_MAX_WIDTH) || 960;
  const timeoutMs = Math.max(60_000, Number(process.env.REMOTION_PROXY_TIMEOUT_MS) || 180_000);

  try {
    await execFileAsync(
      ffmpegBin,
      [
        '-y',
        '-i',
        src,
        '-vf',
        `scale='min(${maxWidth},iw)':-2`,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '28',
        '-an',
        '-movflags',
        '+faststart',
        dest,
      ],
      { timeout: timeoutMs },
    );
  } catch (err) {
    console.warn(
      `[Remotion] Video proxy failed for ${path.basename(src)} — using full copy:`,
      err.message,
    );
    fs.copyFileSync(src, dest);
  }

  return name;
}
