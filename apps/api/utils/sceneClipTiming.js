/**
 * Keep timeline scene duration aligned with real video file length for Remotion/MoviePy.
 */
import path from 'path';
import fs from 'fs';
import { getMediaDurationSec } from './mediaValidate.js';

export function readSourceDurationSec(scene) {
  const fromScene = Number(scene?.sourceDurationSec);
  if (Number.isFinite(fromScene) && fromScene > 0) return fromScene;
  const fromMedia = Number(scene?.media?.duration ?? scene?.media?.durationSec);
  if (Number.isFinite(fromMedia) && fromMedia > 0) return fromMedia;
  return null;
}

/** Timeline seconds available from source after trims, at playback rate 1. */
export function getMaxPlayableSec(scene) {
  const source = readSourceDurationSec(scene);
  if (!source) return null;
  const trimStart = Math.max(0, Number(scene?.trimStart) || 0);
  const trimEnd = Math.max(0, Number(scene?.trimEnd) || 0);
  const rate = Number(scene?.playbackRate) > 0 ? Number(scene.playbackRate) : 1;
  const playable = source - trimStart - trimEnd;
  if (!Number.isFinite(playable) || playable <= 0.05) return 0.1;
  return playable / rate;
}

/**
 * If timeline duration exceeds footage, enable loop; otherwise cap to playable length.
 * @param {object} scene
 * @returns {object}
 */
export function syncSceneVideoTiming(scene) {
  if (scene?.type !== 'video' && scene?.media?.type !== 'video') return scene;

  const maxPlay = getMaxPlayableSec(scene);
  if (maxPlay == null) return scene;

  const timelineDur = Math.max(0.5, Number(scene.duration) || 2.5);
  const needsLoop = timelineDur > maxPlay + 0.08;

  return {
    ...scene,
    duration: needsLoop ? timelineDur : Math.min(timelineDur, maxPlay),
    loop: needsLoop ? true : Boolean(scene.loop),
  };
}

function resolveAssetPath(src, publicDir) {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://')) return null;
  if (path.isAbsolute(src) || /^[a-zA-Z]:\\/.test(src)) {
    return fs.existsSync(src) ? src : null;
  }
  if (publicDir) {
    const joined = path.join(publicDir, src);
    return fs.existsSync(joined) ? joined : null;
  }
  return null;
}

/** Probe files and apply loop/trim-safe timing before Remotion render. */
export async function prepareRemotionScenes(scenes, publicDir) {
  const out = [];
  for (const scene of scenes || []) {
    let row = { ...scene };
    const isVideo = row.type === 'video' || row.media?.type === 'video';
    if (!isVideo) {
      out.push(row);
      continue;
    }

    const filePath = resolveAssetPath(row.src, publicDir);
    if (filePath) {
      const probed = await getMediaDurationSec(filePath);
      if (probed) row.sourceDurationSec = probed;
    }

    row = syncSceneVideoTiming(row);
    out.push(row);
  }
  return out;
}
