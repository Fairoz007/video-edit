/**
 * Auto-build documentary timeline — synced to narration length (~3:00).
 */
import {
  TARGET_VIDEO_DURATION_SEC,
  REMOTION_INTRO_GRAPHIC_SEC,
  REMOTION_OUTRO_GRAPHIC_SEC,
} from '../constants/videoDefaults.js';

const CONTENT_DURATION =
  TARGET_VIDEO_DURATION_SEC - REMOTION_INTRO_GRAPHIC_SEC - REMOTION_OUTRO_GRAPHIC_SEC;

const TRANSITIONS = ['crossfade', 'slide', 'zoom', 'fade'];

function expandMediaPool(manifest, minClips) {
  if (!manifest.length) return [];
  if (manifest.length >= minClips) return manifest;
  const out = [...manifest];
  while (out.length < minClips) {
    out.push(manifest[out.length % manifest.length]);
  }
  return out;
}

export function buildTimeline(script, mediaManifest, audioTracks, options = {}) {
  const sectionCount = Math.max(1, script.sections.length);
  const audioDurationSec = options.audioDurationSec;

  const contentTarget =
    audioDurationSec && audioDurationSec > 30 ? audioDurationSec : CONTENT_DURATION;

  const minClips = Math.max(sectionCount * 2, 12);
  const pool = expandMediaPool(mediaManifest, minClips);
  const mediaPerSection = Math.max(2, Math.floor(pool.length / sectionCount));

  const sectionDurations = script.sections.map(
    (s) => s.durationEstimate || contentTarget / sectionCount,
  );
  const narrationTotal = sectionDurations.reduce((a, b) => a + b, 0);
  const scale = narrationTotal > 0 ? contentTarget / narrationTotal : 1;

  const scenes = [];
  let mediaIndex = 0;
  let timeCursor = REMOTION_INTRO_GRAPHIC_SEC;

  for (let i = 0; i < sectionCount; i++) {
    const section = script.sections[i];
    const sectionDuration = sectionDurations[i] * scale;
    const clipCount = Math.min(mediaPerSection, pool.length);
    const clipDuration = sectionDuration / clipCount;

    for (let j = 0; j < clipCount; j++) {
      const asset = pool[mediaIndex % pool.length];
      mediaIndex++;
      scenes.push({
        id: `scene-${i}-${j}`,
        sectionId: section.id,
        start: timeCursor,
        duration: Math.max(2.5, clipDuration),
        media: asset,
        transition: TRANSITIONS[(i + j) % TRANSITIONS.length],
        effect: asset.type === 'image' ? 'ken-burns' : 'none',
        narration: j === 0 ? section.narration : '',
        sectionTitle: j === 0 ? section.title : undefined,
      });
      timeCursor += clipDuration;
    }
  }

  const totalDuration =
    REMOTION_INTRO_GRAPHIC_SEC + contentTarget + REMOTION_OUTRO_GRAPHIC_SEC;

  return {
    scenes,
    totalDuration,
    contentDuration: contentTarget,
    audioDurationSec: audioDurationSec || null,
    fps: 30,
    tracks: {
      video: scenes,
      audio: audioTracks || [],
      subtitles: script.sections,
    },
  };
}
