/**
 * Auto-build documentary timeline — synced to narration / script length.
 */
import {
  REMOTION_INTRO_GRAPHIC_SEC,
  REMOTION_OUTRO_GRAPHIC_SEC,
  WALKTHROUGH_SEC_PER_SCREEN,
} from '../constants/videoDefaults.js';
import { estimateScriptDurationSec } from './scriptLength.js';
import { scoreMediaForSection } from './mediaSearch.js';
import {
  balanceSectionDurations,
  syncSectionsToVideoTimeline,
} from '../utils/sectionTiming.js';
import { readSourceDurationSec, syncSceneVideoTiming } from '../utils/sceneClipTiming.js';

const COLOR_GRADES = ['warm_golden', 'cool_blue', 'cinematic_teal_orange', 'warm_contrast'];

function resolveContentDuration(script, audioDurationSec) {
  if (audioDurationSec && audioDurationSec > 30) return audioDurationSec;
  const fromScript = estimateScriptDurationSec(script?.sections || []);
  return Math.max(30, fromScript);
}


function expandMediaPool(manifest, minClips) {
  if (!manifest.length) return [];
  if (manifest.length >= minClips) return manifest;
  const out = [...manifest];
  while (out.length < minClips) {
    out.push(manifest[out.length % manifest.length]);
  }
  return out;
}

function mediaKey(item) {
  return item?.localPath || item?.url || '';
}

function mediaDurationSec(item) {
  const duration = Number(item?.duration || item?.durationSec || item?.metadata?.duration);
  return Number.isFinite(duration) && duration > 0 ? duration : null;
}

function buildClipEdit(asset, targetDuration, options = {}) {
  const playbackRate = Number(options.playbackRate || asset?.playbackRate || 1);
  const safePlaybackRate = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
  const sourceDuration = mediaDurationSec(asset);
  const isVideo = asset?.type === 'video';

  if (!isVideo || !sourceDuration) {
    return {
      duration: targetDuration,
      trimStart: 0,
      trimEnd: 0,
      playbackRate: safePlaybackRate,
      loop: false,
      audioVolume: 0,
    };
  }

  const requestedStart = Number(asset.trimStart || asset.inPoint || asset.startOffset || 0);
  const trimStart = Math.max(0, Math.min(requestedStart, Math.max(0, sourceDuration - 0.5)));
  const playableAfterStart = Math.max(0.1, sourceDuration - trimStart);
  const sourceNeeded = targetDuration * safePlaybackRate;
  const trimEnd = Math.max(0, playableAfterStart - sourceNeeded);
  const editedSourceLength = Math.max(0.1, playableAfterStart - trimEnd);
  const editedTimelineDuration = editedSourceLength / safePlaybackRate;

  return {
    duration: Math.max(0.5, Math.min(targetDuration, editedTimelineDuration)),
    trimStart,
    trimEnd,
    playbackRate: safePlaybackRate,
    loop: editedTimelineDuration < targetDuration * 0.85,
    audioVolume: Number.isFinite(Number(asset.audioVolume)) ? Number(asset.audioVolume) : 0,
  };
}

/** Pick clips for a section — prefer section-tagged stock from script-aligned search. */
function pickClipsForSection(section, pool, clipCount, usedKeys, globalTerms = []) {
  const available = pool.filter((m) => {
    const key = mediaKey(m);
    return key && !usedKeys.has(key);
  });

  const ranked = available
    .map((item) => ({
      item,
      score:
        (item.sectionId === section.id ? 3000 : 0) +
        (item.sectionRelevance ?? item.relevance ?? 0) +
        scoreMediaForSection(item, section, globalTerms),
    }))
    .sort((a, b) => b.score - a.score);

  const sectionFirst = ranked.filter((r) => r.item.sectionId === section.id);
  const source = sectionFirst.length >= clipCount ? sectionFirst : ranked;

  const picked = [];
  for (let j = 0; j < clipCount && source.length > 0; j++) {
    const choice =
      source.find((r) => {
        const key = mediaKey(r.item);
        return key && !usedKeys.has(key);
      }) || source[j % source.length];
    const key = mediaKey(choice.item);
    if (!key) continue;
    usedKeys.add(key);
    picked.push(choice.item);
  }
  return picked;
}

function pickFallbackClip(pool, usedKeys, fallbackIndex) {
  if (!pool.length) return { asset: null, nextIndex: fallbackIndex };

  for (let attempts = 0; attempts < pool.length; attempts++) {
    const idx = (fallbackIndex + attempts) % pool.length;
    const asset = pool[idx];
    const key = mediaKey(asset);
    if (key && !usedKeys.has(key)) {
      usedKeys.add(key);
      return { asset, nextIndex: idx + 1 };
    }
  }

  return {
    asset: pool[fallbackIndex % pool.length],
    nextIndex: fallbackIndex + 1,
  };
}

function presentationToTimelineTransition(presentation) {
  const map = {
    fade: 'fade',
    slide: 'slide',
    wipe: 'wipe',
    flip: 'flip',
    clock: 'clock',
    dissolve: 'crossfade',
    ripple: 'wipe',
    none: 'none',
    crossfade: 'crossfade',
    zoom: 'zoom',
  };
  return map[presentation] || 'crossfade';
}

function transitionListForTemplate(visualTheme) {
  const seq = visualTheme?.transitions?.sequence;
  if (Array.isArray(seq) && seq.length) {
    return seq.map(presentationToTimelineTransition);
  }

  const t =
    visualTheme?.transitions?.presentation ||
    visualTheme?.transitions?.defaultType ||
    'crossfade';
  if (t === 'wipe') return ['wipe', 'slide', 'flip', 'wipe', 'crossfade'];
  if (t === 'flip') return ['flip', 'wipe', 'slide', 'crossfade', 'clock'];
  if (t === 'clock') return ['clock', 'dissolve', 'fade', 'slide', 'wipe'];
  if (t === 'dissolve' || t === 'ripple') {
    return ['crossfade', 'fade', 'dissolve', 'crossfade', 'slide'];
  }
  if (t === 'fade') return ['fade', 'crossfade', 'fade', 'slide', 'wipe'];
  return ['crossfade', 'slide', 'wipe', 'fade', 'flip'];
}

function maxClipsForTemplate(templateId) {
  if (
    templateId === 'template_hype_sports' ||
    templateId === 'template_shorts_viral_burst' ||
    templateId === 'template_shorts_neon_pulse'
  ) {
    return 3;
  }
  if (
    templateId === 'template_premium_longform' ||
    templateId === 'template_shorts_story_mode'
  ) {
    return 1;
  }
  if (templateId === 'template_epic_cinematic') return 2;
  return 2;
}

export function buildTimeline(script, mediaManifest, audioTracks, options = {}) {
  const videoOnly =
    options.videoOnly === true || options.editMode === 'video-only';
  const visualTheme = options.visualTheme || null;
  const templateId = options.templateId || 'template_cinematic_docuforge';
  const introGraphicSec = options.introGraphicSec ?? REMOTION_INTRO_GRAPHIC_SEC;
  const TRANSITIONS = transitionListForTemplate(visualTheme);
  const maxClipsPerSection = maxClipsForTemplate(templateId);
  const globalLut = visualTheme?.globalLut || 'cinematic_teal_orange';
  const kenBurnsFrom = visualTheme?.bgEffects?.scaleMin ?? 1.0;
  const kenBurnsTo = visualTheme?.bgEffects?.scaleMax ?? 1.08;
  const sectionCount = Math.max(1, script.sections.length);
  const audioDurationSec = videoOnly ? null : options.audioDurationSec;

  const contentTarget = resolveContentDuration(script, audioDurationSec);

  const minClips = Math.max(sectionCount * 2, 12);
  const pool = expandMediaPool(mediaManifest, minClips);
  const mediaPerSection = Math.max(2, Math.floor(pool.length / sectionCount));
  const globalMatchTerms = [
    script.topic,
    ...(script.sections || []).flatMap((s) => s.brollSuggestions || []),
  ].filter(Boolean);
  const usedMediaKeys = new Set();

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
  let fallbackMediaIndex = 0;
  let timeCursor = introGraphicSec;

  for (let i = 0; i < sectionCount; i++) {
    const section = balancedSections[i];
    const sectionDuration = sectionDurations[i] * scale;
    const clipCount = Math.min(maxClipsPerSection, mediaPerSection, pool.length);
    const clipDuration = sectionDuration / clipCount;
    const colorGrade = globalLut || COLOR_GRADES[i % COLOR_GRADES.length];
    const isFirstSectionScene = (j) => j === 0;

    let sectionClips = pickClipsForSection(
      section,
      pool,
      clipCount,
      usedMediaKeys,
      globalMatchTerms,
    );
    if (sectionClips.length < clipCount) {
      while (sectionClips.length < clipCount && pool.length > 0) {
        const fallback = pickFallbackClip(pool, usedMediaKeys, fallbackMediaIndex);
        fallbackMediaIndex = fallback.nextIndex;
        if (!fallback.asset) break;
        sectionClips.push(fallback.asset);
      }
    }

    for (let j = 0; j < clipCount; j++) {
      const fallback = sectionClips[j]
        ? { asset: sectionClips[j], nextIndex: fallbackMediaIndex }
        : pickFallbackClip(pool, usedMediaKeys, fallbackMediaIndex);
      fallbackMediaIndex = fallback.nextIndex;
      const asset = fallback.asset;
      if (!asset) continue;
      const edit = buildClipEdit(asset, Math.max(2.5, clipDuration));
      const atSectionEdge = j === 0 || j === clipCount - 1;
      const sourceDurationSec = readSourceDurationSec({ media: asset });
      scenes.push(
        syncSceneVideoTiming({
        id: `scene-${i}-${j}`,
        sectionId: section.id,
        sectionIndex: i,
        start: timeCursor,
        duration: edit.duration,
        trimStart: edit.trimStart,
        trimEnd: edit.trimEnd,
        playbackRate: edit.playbackRate,
        loop: edit.loop,
        audioVolume: edit.audioVolume,
        sourceDurationSec: sourceDurationSec ?? undefined,
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
        }),
      );
      timeCursor += scenes[scenes.length - 1].duration;
    }
  }

  let contentEnd = Math.max(0, timeCursor - introGraphicSec);
  if (contentEnd < contentTarget * 0.95 && scenes.length > 0) {
    const stretch = contentTarget / Math.max(contentEnd, 1);
    for (let i = 0; i < scenes.length; i++) {
      const stretched = Math.max(2.5, scenes[i].duration * stretch);
      scenes[i] = syncSceneVideoTiming({
        ...scenes[i],
        duration: stretched,
      });
    }
    timeCursor = introGraphicSec;
    for (const scene of scenes) {
      scene.start = timeCursor;
      timeCursor += scene.duration;
    }
    contentEnd = contentTarget;
  }

  const totalDuration = introGraphicSec + contentEnd + REMOTION_OUTRO_GRAPHIC_SEC;

  const syncedSections = syncSectionsToVideoTimeline(balancedSections, scenes, contentEnd);

  return {
    scenes,
    totalDuration,
    contentDuration: contentEnd,
    audioDurationSec: audioDurationSec || null,
    videoOnly,
    templateId,
    introGraphicSec,
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
  const usedKeys = new Set();
  const assets = [];
  for (const section of sections.slice(0, maxScreens)) {
    const clips = pickClipsForSection(section, pool, 1, usedKeys);
    if (clips[0]) assets.push(clips[0]);
  }
  while (assets.length < maxScreens && assets.length < pool.length) {
    const next = pool.find((m) => !usedKeys.has(mediaKey(m)));
    if (!next) break;
    usedKeys.add(mediaKey(next));
    assets.push(next);
  }

  const screens = assets.map((asset, i) => {
    const section =
      sections.find((s) => s.id === asset.sectionId) ||
      sections[i % Math.max(1, sections.length)];
    const edit = buildClipEdit(asset, secPerScreen);
    return {
      id: `screen-${i}`,
      title: section?.title || asset.title || `Screen ${i + 1}`,
      description: section?.narration?.slice(0, 120) || asset.alt || '',
      src: asset.localPath || asset.url,
      type: asset.type || 'image',
      duration: edit.duration,
      trimStart: edit.trimStart,
      trimEnd: edit.trimEnd,
      playbackRate: edit.playbackRate,
      loop: edit.loop,
      audioVolume: edit.audioVolume,
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
