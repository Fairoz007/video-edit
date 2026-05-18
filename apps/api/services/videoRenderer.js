/**
 * FFmpeg — single-pass export tuned for Electron, browsers, and QuickTime.
 */
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { findFfmpegPath } from '../utils/ffmpegPath.js';
import { verifyVideoFile } from '../utils/videoValidate.js';
import { getMediaDurationSec } from '../utils/audioDuration.js';
import { extendVideoToDuration } from '../utils/videoPad.js';

/** rename fails across drives on Windows (EXDEV); copy+unlink instead. */
function moveFileSync(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (err?.code !== 'EXDEV') throw err;
    fs.copyFileSync(src, dest);
    fs.unlinkSync(src);
  }
}

const RESOLUTIONS = {
  '1080p': { w: 1920, h: 1080 },
  '4k': { w: 3840, h: 2160 },
  youtube: { w: 1920, h: 1080 },
  shorts: { w: 1080, h: 1920 },
  reels: { w: 1080, h: 1920 },
};

const BROWSER_VIDEO_OPTS = [
  '-preset',
  'medium',
  '-crf',
  '18',
  '-pix_fmt',
  'yuv420p',
  '-profile:v',
  'high',
  '-level',
  '4.0',
  '-movflags',
  '+faststart',
  '-tag:v',
  'avc1',
];

const BROWSER_AUDIO_OPTS = ['-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '192k'];

function runFfmpeg(command) {
  const bin = findFfmpegPath();
  if (bin) command.setFfmpegPath(bin);
  return new Promise((resolve, reject) => {
    command.on('end', resolve).on('error', reject).run();
  });
}

function scalePadFilter(w, h, cinematic = true) {
  const base = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black`;
  if (!cinematic) return `${base},format=yuv420p`;
  return `${base},eq=contrast=1.06:brightness=0.02:saturation=1.08,vignette=PI/5,fade=t=in:st=0:d=0.8,format=yuv420p`;
}

/**
 * One-pass: scale, optional grade, mux narration (+ optional music), browser-safe encode.
 */
/**
 * Video-only export — scale/grade encode without narration mux.
 */
export async function exportVideoOnly({
  videoPath,
  outputPath,
  preset = '1080p',
  cinematic = true,
}) {
  if (!fs.existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`);

  const { w, h } = RESOLUTIONS[preset] || RESOLUTIONS['1080p'];
  const tempPath = path.join(
    os.tmpdir(),
    `docuforge-export-${Date.now()}-${path.basename(outputPath).replace(/[^\w.-]/g, '_')}`,
  );
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

  const vf = scalePadFilter(w, h, cinematic);

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(videoPath)
      .videoFilters(vf)
      .outputOptions([
        '-c:v',
        'libx264',
        ...BROWSER_VIDEO_OPTS,
        '-an',
        '-movflags',
        '+faststart',
      ]);

    const bin = findFfmpegPath();
    if (bin) cmd.setFfmpegPath(bin);

    cmd
      .format('mp4')
      .output(tempPath)
      .on('end', async () => {
        try {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          moveFileSync(tempPath, outputPath);
          const ok = await verifyVideoFile(outputPath);
          if (!ok) {
            reject(new Error('Export failed validation (incomplete or corrupt MP4)'));
            return;
          }
          resolve(outputPath);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        reject(err);
      })
      .run();
  });
}

export async function exportDocumentary({
  videoPath,
  narrationPath,
  outputPath,
  musicPath = null,
  preset = '1080p',
  ducking = 0.22,
  cinematic = true,
}) {
  if (!fs.existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`);
  if (!narrationPath) {
    return exportVideoOnly({ videoPath, outputPath, preset, cinematic });
  }
  if (!fs.existsSync(narrationPath)) throw new Error(`Narration not found: ${narrationPath}`);

  const narrationSec = await getMediaDurationSec(narrationPath);
  if (narrationSec && narrationSec > 1) {
    videoPath = await extendVideoToDuration(videoPath, narrationSec);
  }

  const { w, h } = RESOLUTIONS[preset] || RESOLUTIONS['1080p'];
  // FFmpeg needs a .mp4 extension (or explicit -f mp4) — ".mp4.part" breaks format detection.
  const tempPath = path.join(
    os.tmpdir(),
    `docuforge-export-${Date.now()}-${path.basename(outputPath).replace(/[^\w.-]/g, '_')}`,
  );
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

  const vf = scalePadFilter(w, h, cinematic);

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg().input(videoPath).input(narrationPath);

    if (musicPath && fs.existsSync(musicPath)) {
      cmd = cmd.input(musicPath);
      cmd
        .complexFilter(
          [
            `[0:v]${vf}[vout]`,
            `[1:a]aformat=sample_rates=48000:channel_layouts=stereo[narr]`,
            `[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${ducking}[bg]`,
            `[narr][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
          ].join(';'),
        )
        .outputOptions([
          '-map',
          '[vout]',
          '-map',
          '[aout]',
          '-c:v',
          'libx264',
          ...BROWSER_VIDEO_OPTS,
          ...BROWSER_AUDIO_OPTS,
          '-shortest',
        ]);
    } else {
      cmd
        .complexFilter([`[0:v]${vf}[vout]`, `[1:a]aformat=sample_rates=48000:channel_layouts=stereo[aout]`].join(';'))
        .outputOptions([
          '-map',
          '[vout]',
          '-map',
          '[aout]',
          '-c:v',
          'libx264',
          ...BROWSER_VIDEO_OPTS,
          ...BROWSER_AUDIO_OPTS,
          '-shortest',
        ]);
    }

    const bin = findFfmpegPath();
    if (bin) cmd.setFfmpegPath(bin);

    cmd
      .format('mp4')
      .output(tempPath)
      .on('end', async () => {
        try {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          moveFileSync(tempPath, outputPath);
          const ok = await verifyVideoFile(outputPath);
          if (!ok) {
            reject(new Error('Export failed validation (incomplete or corrupt MP4)'));
            return;
          }
          resolve(outputPath);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        reject(err);
      })
      .run();
  });
}

export async function burnSubtitles(inputVideo, srtPath, outputPath) {
  const escaped = srtPath.replace(/:/g, '\\:').replace(/'/g, "\\'");
  const filter = `subtitles='${escaped}':force_style='FontName=Arial Bold,FontSize=32,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=3,Shadow=2,MarginV=56,Bold=1'`;

  await runFfmpeg(
    ffmpeg(inputVideo)
      .outputOptions(['-vf', filter, '-c:a', 'copy', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'])
      .output(outputPath),
  );
  return outputPath;
}

export function getResolution(preset) {
  return RESOLUTIONS[preset] || RESOLUTIONS['1080p'];
}
