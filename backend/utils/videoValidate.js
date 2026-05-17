import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { findFfmpegPath } from './ffmpegPath.js';

const execFileAsync = promisify(execFile);

/** True when the file is a readable MP4 with video + audio streams. */
export async function verifyVideoFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  if (stat.size < 16_384) return false;

  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin) return stat.size > 100_000;

  try {
    await execFileAsync(ffmpegBin, ['-v', 'error', '-i', filePath, '-f', 'null', '-'], {
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}
