/**
 * Auto-build documentary timeline — synced to narration length (~3:00).
 */
import {
  TARGET_VIDEO_DURATION_SEC,
  REMOTION_INTRO_GRAPHIC_SEC,
  REMOTION_OUTRO_GRAPHIC_SEC,
  WALKTHROUGH_SEC_PER_SCREEN,
} from '../constants/videoDefaults.js';
import {
  balanceSectionDurations,
  syncSectionsToVideoTimeline,
} from '../utils/sectionTiming.js';

const COLOR_GRADES = ['warm_golden', 'cool_blue', 'cinematic_teal_orange', 'warm_contrast'];

const CONTENT_DURATION =
  TARGET_VIDEO_DURATION_SEC - REMOTION_INTRO_GRAPHIC_SEC - REMOTION_OUTRO_GRAPHIC_SEC;


function expandMediaPool(manifest, minClips) {
  if (!manifest.length) return [];
  if (manifest.length >= minClips) return manifest;
  const out = [...manifest];
  while (out.length < minClips) {
    out.push(manifest[out.length % manifest.length]);
  }
  return out;
}

function transitionListForTemplate(visualTheme) {
  const t = visualTheme?.transitions?.defaultType || 'crossfade';
  if (t === 'wipe' || t === 'smash_cut') return ['wipe', 'wipe', 'crossfade', 'slide'];
  if (t === 'fade') return ['fade', 'fade', 'crossfade', 'fade'];
  return ['crossfade', 'crossfade', 'wipe', 'slide'];
}

function maxClipsForTemplate(templateId) {
  if (templateId === 'template_hype_sports') return 3;
  if (templateId === 'template_premium_longform') return 1;
  return 2;
}

export function buildTimeline(script, mediaManifest, audioTracks, options = {}) {
  const videoOnly =
    options.videoOnly === true || options.editMode === 'video-only';
  const visualTheme = options.visualTheme || null;
  const templateId = options.templateId || 'template_cinematic_docuforge';
  const TRANSITIONS = transitionListForTemplate(visualTheme);
  const maxClipsPerSection = maxClipsForTemplate(templateId);
  const globalLut = visualTheme?.globalLut || 'cinematic_teal_orange';
  const kenBurnsFrom = visualTheme?.bgEffects?.scaleMin ?? 1.0;
  const kenBurnsTo = visualTheme?.bgEffects?.scaleMax ?? 1.08;
  const sectionCount = Math.max(1, script.sections.length);
  const audioDurationSec = videoOnly ? null : options.audioDurationSec;

  const contentTarget = Math.max(
    CONTENT_DURATION,
    audioDurationSec && audioDurationSec > 30 ? audioDurationSec : 0,
  );

  const minClips = Math.max(sectionCount * 2, 12);
  const pool = expandMediaPool(mediaManifest, minClips);
  const mediaPerSection = Math.max(2, Math.floor(pool.length / sectionCount));

  let sections = script.sections;
  if (videoOnly) {
    sections = syncSectionsToVideoTimeline(sections, [], contentTarget);
  }

  let balancedSections = balanceSectionDurations(sections);
  const sectionDurations = balancedSections.map(
    (s) => s.durationEstimate || contentTarget / sectionCount,
  );
  const narrationTotal = sectionDurations.reduce((a, b) => a + b, 0);
  const scale = narrationTotal > 0 ? contentTarget / narrationTotal : 1;

  const scenes = [];
  let mediaIndex = 0;
  let timeCursor = REMOTION_INTRO_GRAPHIC_SEC;

  for (let i = 0; i < sectionCount; i++) {
    const section = balancedSections[i];
    const sectionDuration = sectionDurations[i] * scale;
    const clipCount = Math.min(maxClipsPerSection, mediaPerSection, pool.length);
    const clipDuration = sectionDuration / clipCount;
    const colorGrade = globalLut || COLOR_GRADES[i % COLOR_GRADES.length];
    const isFirstSectionScene = (j) => j === 0;

    for (let j = 0; j < clipCount; j++) {
      const asset = pool[mediaIndex % pool.length];
      mediaIndex++;
      const duration = Math.max(2.5, clipDuration);
      const atSectionEdge = j === 0 || j === clipCount - 1;
      scenes.push({
        id: `scene-${i}-${j}`,
        sectionId: section.id,
        sectionIndex: i,
        start: timeCursor,
        duration,
        media: asset,
        transition: atSectionEdge ? 'crossfade' : TRANSITIONS[(i + j) % TRANSITIONS.length],
        effect: asset.type === 'image' ? 'ken-burns' : 'none',
        colorGrade,
        narration: videoOnly ? '' : isFirstSectionScene(j) ? section.narration : '',
        sectionTitle: isFirstSectionScene(j) ? section.title : undefined,
        lowerThird:
          isFirstSectionScene(j) && section.lowerThirdName
            ? {
                name: section.lowerThirdName,
                title: section.lowerThirdTitle,
                fromFrame: 12,
                durationFrames: 100,
              }
            : isFirstSectionScene(j)
              ? {
                  name: section.subjectName || section.title,
                  title: section.lowerThirdSubtitle,
                  fromFrame: 12,
                  durationFrames: 100,
                }
              : undefined,
        chapterBadgeLabel: isFirstSectionScene(j) ? section.title : undefined,
        kenBurnsFrom,
        kenBurnsTo,
      });
      timeCursor += duration;
    }
  }

  let contentEnd = Math.max(0, timeCursor - REMOTION_INTRO_GRAPHIC_SEC);
  if (contentEnd < contentTarget * 0.95 && scenes.length > 0) {
    const stretch = contentTarget / Math.max(contentEnd, 1);
    for (const scene of scenes) {
      scene.duration = Math.max(2.5, scene.duration * stretch);
    }
    timeCursor = REMOTION_INTRO_GRAPHIC_SEC;
    for (const scene of scenes) {
      scene.start = timeCursor;
      timeCursor += scene.duration;
    }
    contentEnd = contentTarget;
  }

  const totalDuration =
    REMOTION_INTRO_GRAPHIC_SEC + contentEnd + REMOTION_OUTRO_GRAPHIC_SEC;

  const syncedSections = syncSectionsToVideoTimeline(balancedSections, scenes, contentEnd);

  return {
    scenes,
    totalDuration,
    contentDuration: contentEnd,
    audioDurationSec: audioDurationSec || null,
    videoOnly,
    sections: syncedSections,
    fps: 30,
    tracks: {
      video: scenes,
      audio: videoOnly ? [] : audioTracks || [],
      subtitles: videoOnly ? [] : syncedSections,
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
