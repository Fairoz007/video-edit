/**
 * Extend video to match narration / target duration (clone last frame).
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { findFfmpegPath } from './ffmpegPath.js';
import { getMediaDurationSec } from './audioDuration.js';

const execFileAsync = promisify(execFile);

export async function extendVideoToDuration(videoPath, targetSec) {
  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin || !videoPath || !fs.existsSync(videoPath)) return videoPath;

  const current = await getMediaDurationSec(videoPath);
  if (!current || !targetSec || current >= targetSec - 0.25) return videoPath;

  const padSec = Math.max(0.5, targetSec - current);
  const ext = path.extname(videoPath) || '.mp4';
  const paddedPath = videoPath.replace(new RegExp(`${ext.replace('.', '\\.')}$`), `-extended${ext}`);

  try {
    await execFileAsync(
      ffmpegBin,
      [
        '-y',
        '-i',
        videoPath,
        '-vf',
        `tpad=stop_mode=clone:stop_duration=${padSec.toFixed(3)}`,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '20',
        '-pix_fmt',
        'yuv420p',
        '-an',
        '-movflags',
        '+faststart',
        paddedPath,
      ],
      { timeout: 300_000 },
    );
    return fs.existsSync(paddedPath) ? paddedPath : videoPath;
  } catch (err) {
    console.warn('[videoPad] Could not extend video:', err.message);
    return videoPath;
  }
}
