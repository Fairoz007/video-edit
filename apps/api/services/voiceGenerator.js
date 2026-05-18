/**
 * Narration via Resemble AI Chatterbox-TTS (Turbo + Multilingual v3).
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { findFfmpegPath, hasFfmpeg } from '../utils/ffmpegPath.js';
import { getMediaDurationSec } from '../utils/audioDuration.js';
import { TARGET_VIDEO_DURATION_SEC } from '../constants/videoDefaults.js';
import { listSystemVoices, pickVoice } from './voiceLister.js';
import { synthesizeChatterbox } from './chatterboxBridge.js';

const execFileAsync = promisify(execFile);

const PREVIEW_SAMPLE =
  'Hello, I am your documentary narrator. [chuckle] Chatterbox-Turbo is ready.';

function resolveVoiceOptions(options = {}) {
  const voice = options.voice || process.env.TTS_VOICE || 'chatterbox-turbo';
  const rate = String(options.rate ?? process.env.TTS_RATE ?? 175);
  const pitch = Number(options.pitch ?? process.env.TTS_PITCH ?? 0);
  return {
    voice,
    rate: Math.min(400, Math.max(80, parseInt(rate, 10) || 175)),
    pitch: Math.min(12, Math.max(-12, Number.isFinite(pitch) ? pitch : 0)),
  };
}

async function convertAudio(inputPath, outputPath) {
  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin) {
    if (inputPath.endsWith('.wav')) {
      const wavOut = outputPath.replace(/\.mp3$/i, '.wav');
      if (path.resolve(inputPath) !== path.resolve(wavOut)) {
        fs.copyFileSync(inputPath, wavOut);
      }
      return wavOut;
    }
    throw new Error(
      'FFmpeg is not installed. Run `npm install` in the project (bundled ffmpeg) or set FFMPEG_PATH in .env.',
    );
  }

  const mp3Out = outputPath.replace(/\.(m4a|wav|aiff)$/i, '.mp3');
  await execFileAsync(ffmpegBin, ['-y', '-i', inputPath, '-acodec', 'libmp3lame', '-q:a', '2', mp3Out]);
  return mp3Out;
}

/** Apply WPM speed and semitone pitch via FFmpeg atempo + asetrate. */
async function postProcessSpeech(inputPath, outputPath, { rate = 175, pitch = 0 }) {
  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin) return inputPath;

  const tempo = Math.min(2, Math.max(0.5, rate / 175));
  const needsTempo = Math.abs(tempo - 1) > 0.02;
  const needsPitch = pitch !== 0;

  if (!needsTempo && !needsPitch) {
    if (path.resolve(inputPath) !== path.resolve(outputPath)) {
      fs.copyFileSync(inputPath, outputPath);
    }
    return outputPath;
  }

  const filters = [];
  if (needsPitch) {
    const factor = Math.pow(2, pitch / 12);
    filters.push(`asetrate=48000*${factor},aresample=48000`);
  }
  if (needsTempo) {
    let remaining = tempo;
    while (remaining > 2) {
      filters.push('atempo=2');
      remaining /= 2;
    }
    while (remaining < 0.5) {
      filters.push('atempo=0.5');
      remaining /= 0.5;
    }
    if (Math.abs(remaining - 1) > 0.02) {
      filters.push(`atempo=${remaining.toFixed(4)}`);
    }
  }

  const outExt = path.extname(outputPath).toLowerCase();
  const codec = outExt === '.wav' ? ['-acodec', 'pcm_s16le'] : ['-acodec', 'libmp3lame', '-q:a', '2'];

  await execFileAsync(ffmpegBin, [
    '-y',
    '-i',
    inputPath,
    '-af',
    filters.join(','),
    ...codec,
    outputPath,
  ]);

  return outputPath;
}

async function synthesizeToMp3(text, outputPath, options = {}) {
  const { voice, rate, pitch } = resolveVoiceOptions(options);
  const mp3Path = path.resolve(outputPath);
  const wavPath = mp3Path.replace(/\.mp3$/i, '.wav');
  fs.mkdirSync(path.dirname(mp3Path), { recursive: true });

  const synthResult = await synthesizeChatterbox({
    text,
    outputWav: wavPath,
    voice,
  });
  const synthWav = synthResult?.path ? path.resolve(synthResult.path) : wavPath;
  if (!fs.existsSync(synthWav)) {
    throw new Error(`Chatterbox did not produce audio at ${synthWav}`);
  }

  const processedWav = synthWav.replace(/\.wav$/i, '-proc.wav');
  await postProcessSpeech(synthWav, processedWav, { rate, pitch });

  const finalMp3 = await convertAudio(processedWav, mp3Path);

  for (const p of [synthWav, processedWav, wavPath]) {
    if (fs.existsSync(p) && p !== finalMp3) {
      try {
        fs.unlinkSync(p);
      } catch {
        /* ignore */
      }
    }
  }

  return { path: finalMp3, voice, rate, pitch };
}

export async function generateVoicePreview(outputPath, options = {}) {
  const text = options.text || PREVIEW_SAMPLE;
  return synthesizeToMp3(text, outputPath, options);
}

export async function generateNarration(sections, outputDir, options = {}) {
  fs.mkdirSync(outputDir, { recursive: true });

  const { voices, defaultVoice } = await listSystemVoices();
  const { voice: requestedVoice, rate, pitch } = resolveVoiceOptions(options);
  const voice = pickVoice(voices, requestedVoice || defaultVoice);

  const fullText = sections.map((s) => s.narration).filter(Boolean).join('\n\n');
  const combinedBase = path.join(outputDir, 'narration-full.mp3');
  const { path: combinedPath } = await synthesizeToMp3(fullText, combinedBase, {
    voice,
    rate,
    pitch,
  });

  const tracks = sections.map((section) => ({
    sectionId: section.id,
    path: combinedPath,
    text: section.narration,
  }));

  return {
    tracks,
    combinedPath,
    voice,
    rate,
    pitch,
    provider: 'chatterbox',
    format: path.extname(combinedPath).slice(1),
    ffmpegAvailable: hasFfmpeg(),
  };
}

/**
 * Generate narration and slow TTS rate until audio is close to target duration (~3:00).
 */
export async function generateNarrationForTargetDuration(sections, outputDir, options = {}) {
  const targetSec = options.targetDurationSec ?? TARGET_VIDEO_DURATION_SEC;
  let rate = resolveVoiceOptions(options).rate;
  let result = await generateNarration(sections, outputDir, { ...options, rate });
  let durationSec = await getMediaDurationSec(result.combinedPath);

  for (let attempt = 0; attempt < 4 && durationSec && durationSec < targetSec * 0.9; attempt++) {
    const ratio = durationSec / targetSec;
    rate = Math.max(100, Math.min(220, Math.floor(rate * ratio * 0.92)));
    console.log(`[TTS] Audio ${durationSec.toFixed(1)}s < ${targetSec}s — retry at rate ${rate}`);
    result = await generateNarration(sections, outputDir, { ...options, rate });
    durationSec = await getMediaDurationSec(result.combinedPath);
  }

  if (durationSec && durationSec < targetSec * 0.92 && result.combinedPath) {
    const padded = await padAudioToDuration(result.combinedPath, targetSec);
    if (padded) {
      result.combinedPath = padded;
      durationSec = await getMediaDurationSec(padded);
    }
  }

  return {
    ...result,
    durationSec: durationSec || targetSec,
    targetDurationSec: targetSec,
    rate,
  };
}

async function padAudioToDuration(audioPath, targetSec) {
  const ffmpegBin = findFfmpegPath();
  if (!ffmpegBin) return null;

  const current = await getMediaDurationSec(audioPath);
  if (!current || current >= targetSec * 0.95) return null;

  const padSec = Math.max(1, targetSec - current);
  const paddedPath = audioPath.replace(/(\.[^.]+)$/, '-padded$1');

  try {
    await execFileAsync(
      ffmpegBin,
      [
        '-y',
        '-i',
        audioPath,
        '-f',
        'lavfi',
        '-i',
        `anullsrc=r=48000:cl=stereo:d=${padSec}`,
        '-filter_complex',
        '[0:a][1:a]concat=n=2:v=0:a=1[out]',
        '-map',
        '[out]',
        '-c:a',
        'libmp3lame',
        '-q:a',
        '2',
        paddedPath,
      ],
      { timeout: 120_000 },
    );
    return fs.existsSync(paddedPath) ? paddedPath : null;
  } catch (err) {
    console.warn('[TTS] Could not pad audio:', err.message);
    return null;
  }
}
