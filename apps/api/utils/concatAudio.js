import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { findFfmpegPath } from './ffmpegPath.js';

const execFileAsync = promisify(execFile);

/** Concatenate MP3 parts with FFmpeg concat demuxer. */
export async function concatMp3Files(inputPaths, outputPath) {
  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin) {
    throw new Error('FFmpeg required to join ElevenLabs audio chunks');
  }

  const listPath = outputPath.replace(/(\.[^.]+)$/, '-concat-list.txt');
  const lines = inputPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`);
  fs.writeFileSync(listPath, lines.join('\n'), 'utf8');

  try {
    await execFileAsync(ffmpegBin, [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-c',
      'copy',
      outputPath,
    ]);
  } finally {
    try {
      fs.unlinkSync(listPath);
    } catch {
      /* ignore */
    }
  }
}
