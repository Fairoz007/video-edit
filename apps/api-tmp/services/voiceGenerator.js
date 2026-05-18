/**
 * Offline TTS — macOS `say`, Windows System.Speech, Linux `espeak`.
 * Converts with FFmpeg when available, else macOS `afconvert`.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { findFfmpegPath, hasFfmpeg } from '../utils/ffmpegPath.js';
import { getMediaDurationSec } from '../utils/audioDuration.js';
import { TARGET_VIDEO_DURATION_SEC } from '../constants/videoDefaults.js';
import { listSystemVoices, pickVoice } from './voiceLister.js';

const execFileAsync = promisify(execFile);

function resolveVoiceOptions(options = {}) {
  const voice = options.voice || process.env.TTS_VOICE;
  const rate = String(options.rate ?? process.env.TTS_RATE ?? 175);
  return { voice, rate: Math.min(400, Math.max(80, parseInt(rate, 10) || 175)) };
}

async function convertAudio(inputPath, outputPath) {
  const ffmpegBin = findFfmpegPath();
  if (ffmpegBin) {
    const mp3Out = outputPath.replace(/\.(m4a|wav)$/i, '.mp3');
    await execFileAsync(ffmpegBin, [
      '-y',
      '-i',
      inputPath,
      '-acodec',
      'libmp3lame',
      '-q:a',
      '2',
      mp3Out,
    ]);
    return mp3Out;
  }

  if (os.platform() === 'darwin') {
    const wavOut = outputPath.replace(/\.mp3$/i, '.wav');
    await execFileAsync('afconvert', ['-f', 'WAVE', '-d', 'LEI16', inputPath, wavOut]);
    return wavOut;
  }

  if (inputPath.endsWith('.wav')) {
    const wavOut = outputPath.replace(/\.mp3$/i, '.wav');
    if (path.resolve(inputPath) !== path.resolve(wavOut)) {
      fs.copyFileSync(inputPath, wavOut);
    }
    return wavOut;
  }

  throw new Error(
    'FFmpeg is not installed. Run `npm install` in the project (bundled ffmpeg) or set FFMPEG_PATH in .env, then restart the backend.',
  );
}

async function ttsMacOS(text, outputPath, voice, rate) {
  const aiffPath = outputPath.replace(/\.[^.]+$/, '.aiff');
  const safeText = text.slice(0, 5000);
  await execFileAsync('say', ['-v', voice, '-r', String(rate), '-o', aiffPath, safeText]);

  const converted = await convertAudio(aiffPath, outputPath);
  if (fs.existsSync(aiffPath) && converted !== aiffPath) fs.unlinkSync(aiffPath);
  return converted;
}

async function ttsWindows(text, outputPath, voice, rate) {
  const wavPath = outputPath.replace(/\.mp3$/i, '.wav');
  const safeText = text.replace(/'/g, "''").slice(0, 5000);
  const rateArg = Math.min(10, Math.max(-10, Math.round(((rate - 175) / 9))));

  const ps = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = ${rateArg}
try { $synth.SelectVoice('${voice.replace(/'/g, "''")}') } catch {}
$synth.SetOutputToWaveFile('${wavPath.replace(/'/g, "''")}')
$synth.Speak(@'
${safeText}
'@)
$synth.Dispose()
`;
  await execFileAsync('powershell', ['-NoProfile', '-Command', ps], { maxBuffer: 8 * 1024 * 1024 });

  const converted = await convertAudio(wavPath, outputPath);
  if (fs.existsSync(wavPath) && converted !== wavPath) fs.unlinkSync(wavPath);
  return converted;
}

async function ttsLinux(text, outputPath, voice, rate) {
  const wavPath = outputPath.replace(/\.mp3$/i, '.wav');
  const args = ['-w', wavPath, '-s', String(Math.round(rate / 2))];
  if (voice && voice !== 'default') args.push('-v', voice);
  args.push(text.slice(0, 5000));
  await execFileAsync('espeak', args);
  return convertAudio(wavPath, outputPath);
}

async function concatAudioFiles(trackPaths, outputPath) {
  const ffmpegBin = findFfmpegPath();
  const ext = path.extname(trackPaths[0] || '.mp3').toLowerCase();
  const outPath =
    ext === '.wav'
      ? outputPath.replace(/\.mp3$/i, '.wav')
      : ext === '.m4a'
        ? outputPath.replace(/\.mp3$/i, '.m4a')
        : outputPath.replace(/\.(m4a|wav)$/i, '.mp3');

  if (ffmpegBin && trackPaths.length > 1) {
    const listFile = path.join(path.dirname(outPath), 'concat-list.txt');
    const listContent = trackPaths
      .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
      .join('\n');
    fs.writeFileSync(listFile, listContent);
    await execFileAsync(ffmpegBin, [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listFile,
      '-acodec',
      ext === '.m4a' ? 'aac' : 'libmp3lame',
      '-q:a',
      '2',
      outPath,
    ]);
    return outPath;
  }

  if (trackPaths.length === 1) {
    fs.copyFileSync(trackPaths[0], outPath);
    return outPath;
  }

  return null;
}

export async function generateNarration(sections, outputDir, options = {}) {
  fs.mkdirSync(outputDir, { recursive: true });

  const { voices, defaultVoice } = await listSystemVoices();
  const { voice: requestedVoice, rate } = resolveVoiceOptions(options);
  const voice = pickVoice(voices, requestedVoice || defaultVoice);

  const platform = os.platform();
  const tracks = [];

  for (const section of sections) {
    const basePath = path.join(outputDir, `narration-${section.id}.mp3`);
    const text = section.narration || '';

    let outPath;
    if (platform === 'darwin') outPath = await ttsMacOS(text, basePath, voice, rate);
    else if (platform === 'win32') outPath = await ttsWindows(text, basePath, voice, rate);
    else outPath = await ttsLinux(text, basePath, voice, rate);

    tracks.push({
      sectionId: section.id,
      path: outPath,
      text: section.narration,
    });
  }

  const combinedBase = path.join(outputDir, 'narration-full.mp3');
  let combinedPath = await concatAudioFiles(
    tracks.map((t) => t.path),
    combinedBase,
  );

  if (!combinedPath) {
    const fullText = sections.map((s) => s.narration).filter(Boolean).join('\n\n');
    if (platform === 'darwin') {
      combinedPath = await ttsMacOS(fullText, combinedBase, voice, rate);
    } else if (platform === 'win32') {
      combinedPath = await ttsWindows(fullText, combinedBase, voice, rate);
    } else {
      combinedPath = await ttsLinux(fullText, combinedBase, voice, rate);
    }
  }

  return {
    tracks,
    combinedPath,
    voice,
    rate,
    format: path.extname(combinedPath).slice(1),
    ffmpegAvailable: hasFfmpeg(),
  };
}

/**
 * Generate narration and slow TTS rate until audio is close to target duration (~3:00).
 */
export async function generateNarrationForTargetDuration(
  sections,
  outputDir,
  options = {},
) {
  const targetSec = options.targetDurationSec ?? TARGET_VIDEO_DURATION_SEC;
  let rate = resolveVoiceOptions(options).rate;
  let result = await generateNarration(sections, outputDir, { ...options, rate });
  let durationSec = await getMediaDurationSec(result.combinedPath);

  for (let attempt = 0; attempt < 4 && durationSec && durationSec < targetSec * 0.9; attempt++) {
    const ratio = durationSec / targetSec;
    rate = Math.max(100, Math.min(220, Math.floor(rate * ratio * 0.92)));
    console.log(
      `[TTS] Audio ${durationSec.toFixed(1)}s < ${targetSec}s — retry at rate ${rate}`,
    );
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

/** Append silence so narration meets target length when TTS is still short. */
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
