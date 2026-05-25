/**
 * Pipeline checkpoint — resume export after a failed or interrupted render.
 */
import fs from 'fs';
import path from 'path';

export function checkpointPath(projectDir) {
  return path.join(projectDir, 'pipeline-checkpoint.json');
}

export function loadCheckpoint(projectDir) {
  const p = checkpointPath(projectDir);
  if (!fs.existsSync(p)) return { version: 1, completed: {}, updatedAt: null };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { version: 1, completed: {}, updatedAt: null };
  }
}

export function saveCheckpoint(projectDir, patch) {
  const prev = loadCheckpoint(projectDir);
  const next = {
    ...prev,
    ...patch,
    completed: { ...prev.completed, ...(patch.completed || {}) },
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(checkpointPath(projectDir), JSON.stringify(next, null, 2));
  return next;
}

export function markStep(projectDir, stepKey, extra = {}) {
  return saveCheckpoint(projectDir, {
    completed: { [stepKey]: true },
    lastCompletedStep: stepKey,
    ...extra,
  });
}

export function isStepDone(checkpoint, stepKey) {
  return Boolean(checkpoint?.completed?.[stepKey]);
}

export function variantStep(variantSuffix, phase) {
  return `variant:${variantSuffix}:${phase}`;
}

export function clearCheckpoint(projectDir) {
  const p = checkpointPath(projectDir);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

/** Narration may be narration-full.mp3 or combined.mp3 depending on TTS path. */
export function findNarrationAudioPath(projectDir) {
  const audioDir = path.join(projectDir, 'audio');
  const candidates = [
    path.join(audioDir, 'narration-full.mp3'),
    path.join(audioDir, 'combined.mp3'),
    path.join(audioDir, 'narration.mp3'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).size > 1000) return p;
  }
  if (fs.existsSync(audioDir)) {
    const mp3 = fs
      .readdirSync(audioDir)
      .filter((f) => f.endsWith('.mp3'))
      .map((f) => path.join(audioDir, f))
      .filter((p) => fs.statSync(p).size > 1000)
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (mp3[0]) return mp3[0];
  }
  return null;
}

export function hasPrepArtifacts(projectDir, videoOnly = false) {
  const scriptPath = path.join(projectDir, 'script.json');
  const mediaManifest = path.join(projectDir, 'media', 'manifest.json');
  if (!fs.existsSync(scriptPath) || !fs.existsSync(mediaManifest)) return false;
  if (videoOnly) return true;
  return Boolean(findNarrationAudioPath(projectDir));
}

/**
 * Rebuild checkpoint from files on disk (works even if checkpoint.json was never written).
 */
export function inferCheckpointFromDisk(projectDir) {
  const completed = {};
  const scriptPath = path.join(projectDir, 'script.json');
  const mediaManifest = path.join(projectDir, 'media', 'manifest.json');

  if (fs.existsSync(scriptPath) && fs.existsSync(mediaManifest)) {
    completed.prep = true;
  }

  for (const suffix of ['full', 'shorts']) {
    const timelineFile = path.join(projectDir, 'timeline', `timeline-${suffix}.json`);
    if (fs.existsSync(timelineFile)) {
      completed[variantStep(suffix, 'timeline')] = true;
    }
    const wordCues = path.join(projectDir, 'subtitles', suffix, 'word-cues.json');
    if (fs.existsSync(wordCues)) {
      completed[variantStep(suffix, 'subtitles')] = true;
    }
    const remotionFile = path.join(projectDir, 'renders', `remotion-${suffix}.mp4`);
    if (fs.existsSync(remotionFile) && fs.statSync(remotionFile).size > 50_000) {
      completed[variantStep(suffix, 'remotion')] = true;
    }
  }

  return { version: 1, completed, inferred: true, updatedAt: new Date().toISOString() };
}

export function mergeCheckpoints(saved, inferred) {
  return {
    version: 1,
    completed: { ...(inferred?.completed || {}), ...(saved?.completed || {}) },
    updatedAt: new Date().toISOString(),
  };
}

/** Persist checkpoint from whatever files already exist (call on cancel / before resume). */
export function snapshotCheckpointFromDisk(projectDir) {
  const inferred = inferCheckpointFromDisk(projectDir);
  const saved = loadCheckpoint(projectDir);
  const merged = mergeCheckpoints(saved, inferred);
  fs.writeFileSync(checkpointPath(projectDir), JSON.stringify(merged, null, 2));
  return merged;
}

export function loadSubtitlesFromDisk(projectDir, suffix) {
  const base = path.join(projectDir, 'subtitles', suffix);
  const cuesPath = path.join(base, 'subtitle-cues.json');
  const wordsPath = path.join(base, 'word-cues.json');
  let cues = [];
  let wordCues = [];
  if (fs.existsSync(cuesPath)) {
    try {
      cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
    } catch {
      /* ignore */
    }
  }
  if (fs.existsSync(wordsPath)) {
    try {
      wordCues = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
    } catch {
      /* ignore */
    }
  }
  return { cues, wordCues };
}
