import { execFile } from 'child_process';
import { promisify } from 'util';
import { findFfmpegPath } from './ffmpegPath.js';

const execFileAsync = promisify(execFile);

/** Probe audio/video duration in seconds via ffprobe (bundled with ffmpeg). */
export async function getMediaDurationSec(filePath) {
  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin) return null;

  const ffprobe = ffmpegBin.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
  try {
    const { stdout } = await execFileAsync(
      ffprobe,
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        filePath,
      ],
      { timeout: 15000 },
    );
    const sec = parseFloat(String(stdout).trim());
    return Number.isFinite(sec) ? sec : null;
  } catch {
    return null;
  }
}
