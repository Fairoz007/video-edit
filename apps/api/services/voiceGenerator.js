/**
 * Narration — ElevenLabs (cloud) or Chatterbox-TTS (local).
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { findFfmpegPath, hasFfmpeg } from '../utils/ffmpegPath.js';
import { getMediaDurationSec } from '../utils/audioDuration.js';
import {
  listSystemVoices,
  pickVoice,
  getVoiceMeta,
  isElevenLabsVoice,
} from './voiceLister.js';
import { synthesizeChatterbox } from './chatterboxBridge.js';
import { synthesizeElevenLabs, isElevenLabsEnabled } from './elevenlabsBridge.js';

const execFileAsync = promisify(execFile);

const PREVIEW_SAMPLE =
  'Hello, I am your documentary narrator. This is a preview of your selected voice.';

function shouldFallbackToChatterbox(err, providerMode) {
  const status = err.status ?? err.response?.status ?? err.cause?.response?.status;
  if (status !== 402 && status !== 429 && status !== 401) return false;
  if (providerMode === 'auto') return true;
  return process.env.ELEVENLABS_FALLBACK_CHATTERBOX === '1';
}

function isChatterboxMemoryError(err) {
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('paging file is too small') ||
    msg.includes('os error 1455') ||
    msg.includes('out of memory') ||
    msg.includes('cuda out of memory')
  );
}

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
  const { rate, pitch } = resolveVoiceOptions(options);
  const mp3Path = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(mp3Path), { recursive: true });

  const catalog = options.voiceCatalog || (await listSystemVoices());
  const voices = catalog.voices || [];
  const providerMode = (process.env.TTS_PROVIDER || 'auto').toLowerCase();
  let voice = resolveVoiceOptions(options).voice;
  if (
    isElevenLabsEnabled() &&
    providerMode !== 'chatterbox' &&
    (providerMode === 'elevenlabs' || isElevenLabsVoice(voice, voices))
  ) {
    voice = pickVoice(voices, voice || catalog.defaultVoice);
  }

  const useElevenLabs =
    isElevenLabsEnabled() &&
    providerMode !== 'chatterbox' &&
    (providerMode === 'elevenlabs' || isElevenLabsVoice(voice, voices));

  if (useElevenLabs) {
    try {
      const rawMp3 = mp3Path.replace(/\.mp3$/i, '-el-raw.mp3');
      const result = await synthesizeElevenLabs({
        text,
        outputPath: rawMp3,
        voiceId: voice,
        rate,
      });

      let finalPath = result.path;
      if (pitch !== 0) {
        const pitched = rawMp3.replace(/\.mp3$/i, '-pitch.mp3');
        finalPath = await postProcessSpeech(rawMp3, pitched, { rate: 175, pitch });
        if (finalPath !== mp3Path && fs.existsSync(rawMp3)) {
          try {
            fs.unlinkSync(rawMp3);
          } catch {
            /* ignore */
          }
        }
      }

      if (path.resolve(finalPath) !== path.resolve(mp3Path)) {
        fs.copyFileSync(finalPath, mp3Path);
        if (finalPath !== rawMp3 && fs.existsSync(finalPath)) {
          try {
            fs.unlinkSync(finalPath);
          } catch {
            /* ignore */
          }
        }
      }

      return {
        path: mp3Path,
        voice: result.voiceId || voice,
        rate,
        pitch,
        provider: 'elevenlabs',
        model: result.model,
      };
    } catch (err) {
      if (!shouldFallbackToChatterbox(err, providerMode)) throw err;
      console.warn('[TTS] ElevenLabs unavailable, using Chatterbox:', err.message);
      voice = pickVoice(voices, 'chatterbox-turbo');
    }
  }

  const wavPath = mp3Path.replace(/\.mp3$/i, '.wav');
  try {
    const synthResult = await synthesizeChatterbox({
      text,
      outputWav: wavPath,
      voice,
      forceOneshot: options.forceOneshot,
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

    return { path: finalMp3, voice, rate, pitch, provider: 'chatterbox' };
  } catch (err) {
    if (isChatterboxMemoryError(err)) {
      try {
        console.warn('[TTS] Chatterbox memory error on GPU, retrying on CPU one-shot...');
        const prevDevice = process.env.CHATTERBOX_DEVICE;
        process.env.CHATTERBOX_DEVICE = 'cpu';
        const cpuResult = await synthesizeChatterbox({
          text,
          outputWav: wavPath,
          voice,
          forceOneshot: true,
        });
        const cpuWav = cpuResult?.path ? path.resolve(cpuResult.path) : wavPath;
        const processedWav = cpuWav.replace(/\.wav$/i, '-proc.wav');
        await postProcessSpeech(cpuWav, processedWav, { rate, pitch });
        const finalMp3 = await convertAudio(processedWav, mp3Path);
        process.env.CHATTERBOX_DEVICE = prevDevice;
        return { path: finalMp3, voice, rate, pitch, provider: 'chatterbox' };
      } catch {
        // continue to ElevenLabs fallback below
      }
    }

    // Windows CUDA can fail with OSError 1455; auto-fallback to ElevenLabs if available.
    if (isChatterboxMemoryError(err) && isElevenLabsEnabled()) {
      console.warn('[TTS] Chatterbox memory error, falling back to ElevenLabs:', err.message);
      const elVoice =
        voices.find((v) => v.engine === 'elevenlabs')?.id || process.env.ELEVENLABS_VOICE_ID;
      if (elVoice) {
        const rawMp3 = mp3Path.replace(/\.mp3$/i, '-el-fallback.mp3');
        const result = await synthesizeElevenLabs({
          text,
          outputPath: rawMp3,
          voiceId: elVoice,
          rate,
        });
        if (path.resolve(result.path) !== path.resolve(mp3Path)) {
          fs.copyFileSync(result.path, mp3Path);
          try {
            fs.unlinkSync(result.path);
          } catch {
            /* ignore */
          }
        }
        return {
          path: mp3Path,
          voice: result.voiceId || elVoice,
          rate,
          pitch,
          provider: 'elevenlabs',
          model: result.model,
        };
      }
    }

    if (isChatterboxMemoryError(err)) {
      throw new Error(
        `Chatterbox failed due to GPU/virtual memory pressure (${err.message}). ` +
          'Set CHATTERBOX_DEVICE=cpu in .env or increase Windows paging file size.',
      );
    }
    throw err;
  }
}

export async function generateVoicePreview(outputPath, options = {}) {
  const text = options.text || PREVIEW_SAMPLE;
  return synthesizeToMp3(text, outputPath, {
    ...options,
    forceOneshot: options.forceOneshot ?? process.env.VOICE_PREVIEW_ONESHOT === '1',
  });
}

export async function generateNarration(sections, outputDir, options = {}) {
  fs.mkdirSync(outputDir, { recursive: true });

  const catalog = await listSystemVoices();
  const { voices, defaultVoice } = catalog;
  const { voice: requestedVoice, rate, pitch } = resolveVoiceOptions(options);
  const voice = pickVoice(voices, requestedVoice || defaultVoice);

  const fullText = sections.map((s) => s.narration).filter(Boolean).join('\n\n');
  const combinedBase = path.join(outputDir, 'narration-full.mp3');
  const { path: combinedPath, provider, model } = await synthesizeToMp3(fullText, combinedBase, {
    voice,
    rate,
    pitch,
    voiceCatalog: catalog,
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
    provider: provider || 'chatterbox',
    model,
    format: path.extname(combinedPath).slice(1),
    ffmpegAvailable: hasFfmpeg(),
  };
}

/**
 * Generate narration at natural TTS pace; video length follows the script/audio.
 * Optional targetDurationSec (env VIDEO_TARGET_DURATION_SEC) only enables legacy stretch retries.
 */
export async function generateNarrationForTargetDuration(sections, outputDir, options = {}) {
  const targetSec = options.targetDurationSec ?? null;
  let rate = resolveVoiceOptions(options).rate;
  let result = await generateNarration(sections, outputDir, { ...options, rate });
  let durationSec = await getMediaDurationSec(result.combinedPath);

  if (targetSec && targetSec > 0 && durationSec && durationSec < targetSec * 0.88) {
    const meta = getVoiceMeta((await listSystemVoices()).voices, result.voice);
    const isEl = meta?.engine === 'elevenlabs';
    const minAcceptable = targetSec * 0.88;
    const maxAttempts = isEl ? 2 : 6;

    for (let attempt = 0; attempt < maxAttempts && durationSec < minAcceptable; attempt++) {
      const ratio = durationSec / targetSec;
      rate = Math.max(80, Math.min(220, Math.floor(rate * ratio * 0.88)));
      console.log(
        `[TTS] Audio ${durationSec.toFixed(1)}s < ${targetSec}s override — retry ${attempt + 1} at rate ${rate}`,
      );
      result = await generateNarration(sections, outputDir, { ...options, rate });
      durationSec = await getMediaDurationSec(result.combinedPath);
    }
  }

  return {
    ...result,
    durationSec: durationSec || null,
    rate,
  };
}

