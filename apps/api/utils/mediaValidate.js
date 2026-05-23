/**
 * Validate scraped/downloaded media before timeline + MoviePy/Remotion.
 */
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { findFfprobePath } from './ffmpegPath.js';

const execFileAsync = promisify(execFile);

export const MIN_VIDEO_BYTES = 48_000;
export const MIN_IMAGE_BYTES = 8_000;

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv)(\?|$)/i;

function readMagic(filePath, len = 16) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, 0);
    return buf;
  } finally {
    fs.closeSync(fd);
  }
}

export function isImageMagic(buffer) {
  if (!buffer || buffer.length < 4) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return true;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return true;
  }
  return false;
}

export function isVideoMagic(buffer) {
  if (!buffer || buffer.length < 12) return false;
  if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') return true;
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return true;
  return false;
}

export function looksLikeHtml(buffer) {
  const head = buffer.toString('utf8', 0, Math.min(buffer.length, 64)).toLowerCase();
  return head.includes('<!doctype') || head.includes('<html') || head.includes('<?xml');
}

/** True when ffprobe finds a decodable video stream. */
export async function verifyReadableVideo(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  if (stat.size < MIN_VIDEO_BYTES) return false;

  const magic = readMagic(filePath);
  if (looksLikeHtml(magic) || (!isVideoMagic(magic) && !isImageMagic(magic))) {
    return false;
  }

  const ffprobe = findFfprobePath();
  if (!ffprobe) {
    return isVideoMagic(magic) && stat.size > MIN_VIDEO_BYTES;
  }

  try {
    const { stdout } = await execFileAsync(
      ffprobe,
      [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=codec_type',
        '-of',
        'csv=p=0',
        filePath,
      ],
      { timeout: 45_000, maxBuffer: 2 * 1024 * 1024 },
    );
    return stdout.trim() === 'video';
  } catch {
    return isVideoMagic(magic) && stat.size > MIN_VIDEO_BYTES;
  }
}

export function verifyReadableImage(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  if (stat.size < MIN_IMAGE_BYTES) return false;
  const magic = readMagic(filePath);
  if (looksLikeHtml(magic)) return false;
  return isImageMagic(magic);
}

/**
 * Normalize one manifest entry: fix type, drop corrupt files.
 */
export async function sanitizeMediaAsset(item) {
  if (!item?.localPath || !fs.existsSync(item.localPath)) {
    if (item?.url && !item.localPath) return item;
    return null;
  }

  const path = item.localPath;
  const url = item.url || '';
  const declaredVideo =
    item.type === 'video' || VIDEO_EXT.test(path) || VIDEO_EXT.test(url);

  if (declaredVideo) {
    if (await verifyReadableVideo(path)) {
      return { ...item, type: 'video' };
    }
    if (verifyReadableImage(path)) {
      console.warn(`[media] Reclassified as image (invalid video): ${path}`);
      return { ...item, type: 'image' };
    }
    console.warn(`[media] Dropping unreadable video: ${path}`);
    try {
      fs.unlinkSync(path);
    } catch {
      /* ignore */
    }
    return null;
  }

  if (verifyReadableImage(path)) {
    return { ...item, type: 'image' };
  }

  console.warn(`[media] Dropping unreadable image: ${path}`);
  try {
    fs.unlinkSync(path);
  } catch {
    /* ignore */
  }
  return null;
}

export async function sanitizeMediaManifest(manifest = []) {
  const out = [];
  for (const item of manifest) {
    const clean = await sanitizeMediaAsset(item);
    if (clean) out.push(clean);
  }
  return out;
}

/** Scene payload for moviepy_renderer.py */
export async function prepareMoviePyScene(scene) {
  const path = scene.media?.localPath || scene.path;
  if (!path || !fs.existsSync(path)) return null;

  let type = scene.media?.type || scene.type || 'image';
  if (type === 'video' && !(await verifyReadableVideo(path))) {
    if (verifyReadableImage(path)) type = 'image';
    else return null;
  } else if (type !== 'video' && !verifyReadableImage(path)) {
    if (await verifyReadableVideo(path)) type = 'video';
    else return null;
  }

  return {
    path,
    duration: scene.duration,
    type,
    transition: scene.transition || 'crossfade',
    effect: scene.effect || (type === 'image' ? 'ken-burns' : 'none'),
  };
}

export async function prepareMoviePyScenes(timelineScenes) {
  const prepared = [];
  for (const scene of timelineScenes) {
    const row = await prepareMoviePyScene(scene);
    if (row) prepared.push(row);
  }
  return prepared;
}
