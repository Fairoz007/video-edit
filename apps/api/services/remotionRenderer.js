/**
 * Remotion bundle + render — documentary & walkthrough compositions.
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  TARGET_VIDEO_DURATION_SEC,
  REMOTION_INTRO_GRAPHIC_SEC,
  REMOTION_OUTRO_GRAPHIC_SEC,
  WALKTHROUGH_SEC_PER_SCREEN,
} from '../constants/videoDefaults.js';
import {
  getDocumentaryTemplate,
  getIntroGraphicSec,
  resolveVisualTheme,
} from '@docuforge/config/documentaryTemplates';
import { verifyVideoFile } from '../utils/videoValidate.js';
import { getRepoRoot } from '@docuforge/config/repoRoot';

const ROOT = getRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const REMOTION_ENTRY = path.join(ROOT, 'packages', 'remotion', 'index.ts');

function isAbsoluteAssetPath(src) {
  return path.isAbsolute(src) || /^[a-zA-Z]:\\/.test(src);
}

function copyAssetToPublic(src, publicDir, usedNames, index, fallbackExt = '.jpg') {
  if (!src || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  if (!isAbsoluteAssetPath(src)) {
    return src;
  }
  if (!fs.existsSync(src)) {
    console.warn(`[Remotion] Missing asset: ${src}`);
    return src;
  }

  const ext = path.extname(src) || fallbackExt;
  let name = path.basename(src);
  if (usedNames.has(name)) {
    name = `asset-${index}${ext}`;
  }
  usedNames.add(name);

  const dest = path.join(publicDir, name);
  fs.copyFileSync(src, dest);
  return name;
}

/**
 * Copy absolute media paths into a Remotion public dir and return relative names.
 */
export function prepareRemotionPublicAssets(scenes, publicDir, extraAssets = []) {
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
  fs.mkdirSync(publicDir, { recursive: true });
  const usedNames = new Set();
  let copied = 0;

  const preparedScenes = (scenes || []).map((scene, i) => {
    const src = scene?.src;
    const name = copyAssetToPublic(src, publicDir, usedNames, i);
    if (name !== src && isAbsoluteAssetPath(src)) copied++;
    return { ...scene, src: name };
  });

  const preparedExtras = {};
  for (const [key, src] of Object.entries(extraAssets)) {
    if (!src) continue;
    const name = copyAssetToPublic(src, publicDir, usedNames, copied);
    if (name !== src && isAbsoluteAssetPath(src)) copied++;
    preparedExtras[key] = name;
  }

  console.log(`[Remotion] Prepared ${copied} asset(s) in ${publicDir}`);
  return { publicDir, scenes: preparedScenes, extras: preparedExtras };
}

export function resolveCompositionId(project) {
  const style = project?.input?.videoStyle || project?.videoStyle || 'documentary';
  return style === 'walkthrough' ? 'Walkthrough' : 'Documentary';
}

export function buildWalkthroughProps(project) {
  const { script, media, walkthrough } = project;
  const screens =
    walkthrough?.screens?.map((s, i) => ({
      id: s.id || `screen-${i}`,
      title: s.title || `Screen ${i + 1}`,
      description: s.description || '',
      src: s.src || s.media?.localPath || s.media?.url || '',
      duration: s.duration || WALKTHROUGH_SEC_PER_SCREEN,
      transition: s.transition || ['fade', 'slide', 'fade', 'wipe'][i % 4],
    })) ||
    (media || []).slice(0, 16).map((m, i) => ({
      id: `screen-${i}`,
      title: script?.sections?.[i % (script?.sections?.length || 1)]?.title || `Screen ${i + 1}`,
      description: script?.sections?.[i]?.narration?.slice(0, 120) || '',
      src: m.localPath || m.url || '',
      duration: WALKTHROUGH_SEC_PER_SCREEN,
      transition: ['fade', 'slide', 'fade', 'wipe'][i % 4],
    }));

  return {
    projectName: walkthrough?.projectName || script?.topic || 'Walkthrough',
    screens: screens.filter((s) => s.src),
    narrationAudioSrc:
      project.input?.editMode === 'video-only'
        ? undefined
        : project.narration?.combinedPath || undefined,
    fps: 30,
    width: 1920,
    height: 1080,
  };
}

function buildChapterBadges(timeline, fps, introSec) {
  const badges = [];
  const seen = new Set();
  for (const scene of timeline?.scenes || []) {
    if (!scene.chapterBadgeLabel || seen.has(scene.sectionId)) continue;
    seen.add(scene.sectionId);
    const sectionScenes = timeline.scenes.filter((s) => s.sectionId === scene.sectionId);
    const sectionDuration = sectionScenes.reduce((a, s) => a + (s.duration || 0), 0);
    const fromFrame = Math.round((scene.start || introSec) * fps);
    const visibleSec = Math.min(4, Math.max(2.5, sectionDuration * 0.35));
    badges.push({
      label: scene.chapterBadgeLabel,
      fromFrame,
      durationFrames: Math.round(visibleSec * fps),
    });
  }
  return badges;
}

export function buildRemotionProps(project) {
  const compositionId = resolveCompositionId(project);
  if (compositionId === 'Walkthrough') {
    return buildWalkthroughProps(project);
  }

  const { script, media, timeline } = project;
  const sectionById = Object.fromEntries((script?.sections || []).map((s) => [s.id, s]));

  const transitions = ['crossfade', 'slide', 'zoom', 'fade', 'wipe'];
  const template = getDocumentaryTemplate(project.input?.templateId);
  const visualTheme = resolveVisualTheme(template);
  const fps = 30;
  const introSec = getIntroGraphicSec(template.id, fps);

  const scenes =
    timeline?.scenes?.map((s, i) => ({
      src: s.media?.localPath || s.media?.url || '',
      type: s.media?.type || 'image',
      duration: s.duration,
      transition: s.transition || transitions[i % transitions.length],
      caption: sectionById[s.sectionId]?.title,
      sectionTitle: s.sectionTitle || sectionById[s.sectionId]?.title,
      sectionIndex: s.sectionIndex ?? 0,
      colorGrade: s.colorGrade,
      lowerThird: s.lowerThird,
      kenBurnsFrom: s.kenBurnsFrom ?? visualTheme.bgEffects.scaleMin,
      kenBurnsTo: s.kenBurnsTo ?? visualTheme.bgEffects.scaleMax,
      panStartX: s.sectionIndex % 2 === 0 ? 0 : 20,
      panEndX: s.sectionIndex % 2 === 0 ? -20 : 0,
    })) ||
    media?.map((m, i) => ({
      src: m.localPath || m.url,
      type: m.type || 'image',
      duration: 5,
      sectionTitle: script?.sections?.[i % (script?.sections?.length || 1)]?.title,
    })) ||
    [];

  const chapterBadges = timeline ? buildChapterBadges(timeline, fps, introSec) : [];

  return {
    title: script?.topic || 'Documentary',
    sections: script?.sections || [],
    scenes: scenes.filter((s) => s.src),
    subtitleCues: project.subtitleCues || [],
    wordCues: project.wordCues || [],
    chapterBadges,
    visualTheme,
    templateId: template.id,
    totalDuration: timeline?.totalDuration || TARGET_VIDEO_DURATION_SEC,
    introGraphicSec: introSec,
    outroGraphicSec: REMOTION_OUTRO_GRAPHIC_SEC,
    channelName: process.env.CHANNEL_NAME || 'DocuForge',
    narrationAudioSrc:
      project.input?.editMode === 'video-only'
        ? undefined
        : project.narration?.combinedPath || undefined,
    fps: 30,
    width: 1920,
    height: 1080,
  };
}

export async function renderRemotionPreview(props, outputPath, options = {}) {
  const entry = REMOTION_ENTRY;
  if (!fs.existsSync(entry)) {
    throw new Error(`Remotion entry not found at ${entry}`);
  }

  const compositionId = options.compositionId || 'Documentary';
  const isWalkthrough = compositionId === 'Walkthrough';
  const publicDir =
    options.publicDir || path.join(path.dirname(outputPath), 'remotion-public');

  const scenesOrScreens = isWalkthrough ? props.screens || [] : props.scenes || [];
  const { scenes, extras } = prepareRemotionPublicAssets(
    scenesOrScreens,
    publicDir,
    props.narrationAudioSrc
      ? { narration: props.narrationAudioSrc }
      : {},
  );

  const renderProps = {
    ...props,
    ...(isWalkthrough ? { screens: scenes } : { scenes }),
    narrationAudioSrc: extras.narration || props.narrationAudioSrc,
  };

  const bundleLocation = await bundle({
    entryPoint: entry,
    rootDir: ROOT,
    publicDir,
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps: renderProps,
  });

  let lastRemotionPct = -1;
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    audioCodec: 'aac',
    outputLocation: outputPath,
    inputProps: renderProps,
    chromiumOptions: { disableWebSecurity: true },
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct >= lastRemotionPct + 10 || pct === 100) {
        lastRemotionPct = pct;
        console.log(`[Remotion:${compositionId}] ${pct}%`);
      }
    },
  });

  const ok = await verifyVideoFile(outputPath);
  if (!ok) {
    throw new Error('Remotion output is invalid or incomplete');
  }

  return outputPath;
}
