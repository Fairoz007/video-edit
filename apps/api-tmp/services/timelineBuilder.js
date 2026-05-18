/**
 * Auto-build documentary timeline — synced to narration length (~3:00).
 */
import {
  TARGET_VIDEO_DURATION_SEC,
  REMOTION_INTRO_GRAPHIC_SEC,
  REMOTION_OUTRO_GRAPHIC_SEC,
  WALKTHROUGH_SEC_PER_SCREEN,
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

const WALKTHROUGH_TRANSITIONS = ['fade', 'slide', 'fade', 'wipe'];

/**
 * Walkthrough timeline — one slide per media asset with Stitch-style pacing.
 */
export function buildWalkthroughTimeline(script, mediaManifest, options = {}) {
  const secPerScreen = options.secPerScreen || WALKTHROUGH_SEC_PER_SCREEN;
  const pool = (mediaManifest || []).filter((m) => m.localPath || m.url);
  const sections = script?.sections || [];
  const maxScreens = options.maxScreens || 16;
  const assets = pool.slice(0, maxScreens);

  const screens = assets.map((asset, i) => {
    const section = sections[i % Math.max(1, sections.length)];
    return {
      id: `screen-${i}`,
      title: section?.title || asset.title || `Screen ${i + 1}`,
      description: section?.narration?.slice(0, 120) || asset.alt || '',
      src: asset.localPath || asset.url,
      type: asset.type || 'image',
      duration: secPerScreen,
      transition: WALKTHROUGH_TRANSITIONS[i % WALKTHROUGH_TRANSITIONS.length],
    };
  });

  const totalDuration = screens.reduce((a, s) => a + s.duration, 0) || secPerScreen;

  return {
    screens,
    totalDuration,
    fps: 30,
    style: 'walkthrough',
    projectName: script?.topic || 'Walkthrough',
  };
}
