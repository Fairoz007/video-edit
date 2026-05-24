/**
 * Split a rendered video into fixed-length parts (e.g. YouTube Shorts ≤90s).
 */
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { findFfmpegPath } from './ffmpegPath.js';
import { getMediaDurationSec } from './audioDuration.js';
import { verifyVideoFile } from './videoValidate.js';

const execFileAsync = promisify(execFile);

function listSegmentOutputs(outputDir, baseName, ext) {
  const prefix = `${baseName}-short-`;
  return fs
    .readdirSync(outputDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(ext))
    .sort()
    .map((f) => path.join(outputDir, f));
}

/**
 * @param {string} inputPath
 * @param {string} outputDir
 * @param {string} baseName — filename prefix without extension
 * @param {number} [maxDurationSec=90]
 * @returns {Promise<string[]>} absolute paths to each part, in order
 */
export async function splitVideoIntoShortParts(
  inputPath,
  outputDir,
  baseName,
  maxDurationSec = 90,
) {
  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin) {
    throw new Error('FFmpeg not found — required to split YouTube Shorts');
  }

  const ext = path.extname(inputPath) || '.mp4';
  fs.mkdirSync(outputDir, { recursive: true });

  const duration = await getMediaDurationSec(inputPath);
  const singleDest = path.join(outputDir, `${baseName}-short-01${ext}`);

  if (!duration || duration <= maxDurationSec + 0.5) {
    fs.copyFileSync(inputPath, singleDest);
    if (!(await verifyVideoFile(singleDest))) {
      throw new Error('Short export failed — output file is invalid');
    }
    return [singleDest];
  }

  const pattern = path.join(outputDir, `${baseName}-short-%02d${ext}`);

  for (const existing of listSegmentOutputs(outputDir, baseName, ext)) {
    try {
      fs.unlinkSync(existing);
    } catch {
      /* ignore */
    }
  }

  const partCount = Math.ceil(duration / maxDurationSec);
  const timeoutMs = Math.max(120_000, partCount * 60_000);

  await execFileAsync(
    ffmpegBin,
    [
      '-y',
      '-i',
      inputPath,
      '-c',
      'copy',
      '-map',
      '0',
      '-f',
      'segment',
      '-segment_time',
      String(maxDurationSec),
      '-reset_timestamps',
      '1',
      '-segment_start_number',
      '1',
      pattern,
    ],
    { timeout: timeoutMs },
  );

  const parts = listSegmentOutputs(outputDir, baseName, ext);
  if (!parts.length) {
    throw new Error('Short split produced no output files');
  }

  for (const part of parts) {
    if (!(await verifyVideoFile(part))) {
      throw new Error(`Invalid short segment: ${path.basename(part)}`);
    }
  }

  return parts;
}
