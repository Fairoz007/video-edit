/**
 * Remotion bundle + render — documentary & walkthrough compositions.
 */
import { bundle } from '@remotion/bundler';
import { makeCancelSignal, renderMedia, selectComposition } from '@remotion/renderer';
import { isUserCancelledRender, RenderCancelledError } from './renderErrors.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  REMOTION_INTRO_GRAPHIC_SEC,
  REMOTION_OUTRO_GRAPHIC_SEC,
  WALKTHROUGH_SEC_PER_SCREEN,
} from '../constants/videoDefaults.js';
import { estimateScriptDurationSec } from './scriptLength.js';
import {
  getDocumentaryTemplate,
  getIntroGraphicSec,
  resolveVisualTheme,
} from '@docuforge/config/documentaryTemplates';
import { prepareRemotionScenes } from '../utils/sceneClipTiming.js';
import { copyOrProxyVideoForRemotion, isVideoAssetPath } from '../utils/remotionVideoProxy.js';
import { verifyVideoFile } from '../utils/videoValidate.js';
import { setGpuRenderLock } from './chatterboxBridge.js';
import { getResolution } from './videoRenderer.js';
import { getRepoRoot } from '@docuforge/config/repoRoot';
import {
  isMaxPerformanceMode,
  logRemotionPerformancePlan,
  preferLineSubtitles,
  resolveChromiumOptions,
  resolveHardwareAcceleration,
  resolveJpegQuality,
  resolveOffthreadVideoCacheBytes,
  resolveOffthreadVideoThreads,
  resolveConcurrencyForScenes,
  resolveDelayRenderTimeoutMs,
  resolveRemotionConcurrency,
  resolveVideoBitrate,
  resolveX264Preset,
  shouldStripHeavyEffects,
} from '../utils/remotionPerformance.js';

/** Reuse webpack bundle when re-rendering the same public asset folder (resume/retry). */
const bundleCache = new Map();

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
  if (fs.existsSync(dest)) {
    try {
      const srcStat = fs.statSync(src);
      const destStat = fs.statSync(dest);
      if (srcStat.size === destStat.size && srcStat.size > 0) {
        return name;
      }
    } catch {
      /* re-copy */
    }
  }
  fs.copyFileSync(src, dest);
  return name;
}

async function prepareSceneAsset(src, publicDir, usedNames, index) {
  if (!src || src.startsWith('http://') || src.startsWith('https://')) return src;
  if (!isAbsoluteAssetPath(src)) return src;
  if (!fs.existsSync(src)) {
    console.warn(`[Remotion] Missing asset: ${src}`);
    return src;
  }
  if (isVideoAssetPath(src) && isMaxPerformanceMode()) {
    return copyOrProxyVideoForRemotion(src, publicDir, usedNames, index);
  }
  return copyAssetToPublic(src, publicDir, usedNames, index);
}

/**
 * Copy absolute media paths into a Remotion public dir and return relative names.
 */
export async function prepareRemotionPublicAssets(scenes, publicDir, extraAssets = {}, opts = {}) {
  const preserve = Boolean(opts.preserveExisting);
  if (!preserve && fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
  fs.mkdirSync(publicDir, { recursive: true });
  const usedNames = new Set();
  let copied = 0;
  let proxied = 0;

  const preparedScenes = await Promise.all(
    (scenes || []).map(async (scene, i) => {
      const src = scene?.src;
      const name = await prepareSceneAsset(src, publicDir, usedNames, i);
      if (name !== src && isAbsoluteAssetPath(src)) {
        copied++;
        if (String(name).includes('-rproxy.')) proxied++;
      }
      return { ...scene, src: name };
    }),
  );

  const preparedExtras = {};
  for (const [key, src] of Object.entries(extraAssets)) {
    if (!src) continue;
    const name = await prepareSceneAsset(src, publicDir, usedNames, copied);
    if (name !== src && isAbsoluteAssetPath(src)) copied++;
    preparedExtras[key] = name;
  }

  const proxyNote = proxied > 0 ? ` · ${proxied} video proxy(ies)` : '';
  console.log(`[Remotion] Prepared ${copied} asset(s) in ${publicDir}${proxyNote}`);
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
      type: s.type || s.media?.type || 'image',
      duration: s.duration || WALKTHROUGH_SEC_PER_SCREEN,
      trimStart: s.trimStart || 0,
      trimEnd: s.trimEnd || 0,
      playbackRate: s.playbackRate || 1,
      loop: Boolean(s.loop),
      audioVolume: s.audioVolume || 0,
      transition: s.transition || ['fade', 'slide', 'fade', 'wipe'][i % 4],
    })) ||
    (media || []).slice(0, 16).map((m, i) => ({
      id: `screen-${i}`,
      title: script?.sections?.[i % (script?.sections?.length || 1)]?.title || `Screen ${i + 1}`,
      description: script?.sections?.[i]?.narration?.slice(0, 120) || '',
      src: m.localPath || m.url || '',
      type: m.type || 'image',
      duration: WALKTHROUGH_SEC_PER_SCREEN,
      trimStart: m.trimStart || 0,
      trimEnd: m.trimEnd || 0,
      playbackRate: m.playbackRate || 1,
      loop: Boolean(m.loop),
      audioVolume: m.audioVolume || 0,
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

/** Speed mode — keeps template colors/transitions; drops motion blur, leaks, grain, kinetic subs. */
function applyRenderPerformanceProfile(renderProps, { fastRender = false } = {}) {
  if (!shouldStripHeavyEffects(fastRender) || !renderProps.visualTheme) {
    return { props: renderProps, fastApplied: false };
  }

  const theme = renderProps.visualTheme;
  const tr = theme.transitions || {};
  const visualTheme = {
    ...theme,
    filmGrain: 0,
    effects: {
      ...(theme.effects || {}),
      motionBlur: false,
      lightLeak: false,
      accentShapes: false,
      pulseVignette: false,
      filmGrain: 0,
      chromaticAberration: false,
      glitchIntensity: 0,
    },
    transitions: {
      ...tr,
      durationFrames: Math.min(Number(tr.durationFrames) || 15, 10),
    },
  };

  let wordCues = renderProps.wordCues;
  if (preferLineSubtitles() && Array.isArray(wordCues) && wordCues.length > 0) {
    wordCues = [];
  }

  return {
    props: { ...renderProps, visualTheme, wordCues },
    fastApplied: true,
  };
}

export function buildRemotionProps(project) {
  const compositionId = resolveCompositionId(project);
  if (compositionId === 'Walkthrough') {
    return buildWalkthroughProps(project);
  }

  const { script, media, timeline } = project;
  const sectionById = Object.fromEntries((script?.sections || []).map((s) => [s.id, s]));

  const transitions = ['crossfade', 'slide', 'zoom', 'fade', 'wipe'];
  const template = getDocumentaryTemplate(
    timeline?.templateId || project.renderTemplateId || project.input?.templateId,
  );
  let visualTheme = resolveVisualTheme(template);
  const fps = 30;
  const preset = project.renderPreset || '1080p';
  const { w: width, h: height } = getResolution(preset);
  const introSec = getIntroGraphicSec(template.id, fps);

  const scenes =
    timeline?.scenes?.map((s, i) => ({
      src: s.media?.localPath || s.media?.url || '',
      type: s.media?.type || 'image',
      duration: s.duration,
      trimStart: s.trimStart || 0,
      trimEnd: s.trimEnd || 0,
      playbackRate: s.playbackRate || 1,
      sourceDurationSec: s.sourceDurationSec ?? s.media?.duration,
      loop: Boolean(s.loop),
      audioVolume: s.audioVolume || 0,
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
  const sceneList = scenes.filter((s) => s.src);
  const heavySceneCount = sceneList.length;

  if (heavySceneCount > 8 && visualTheme?.effects) {
    visualTheme = {
      ...visualTheme,
      effects: {
        ...visualTheme.effects,
        motionBlur: false,
      },
    };
  }

  return {
    title: script?.topic || 'Documentary',
    sections: script?.sections || [],
    scenes: sceneList,
    subtitleCues: project.subtitleCues || [],
    wordCues: project.wordCues || [],
    chapterBadges,
    visualTheme,
    templateId: template.id,
    totalDuration:
      timeline?.totalDuration ||
      estimateScriptDurationSec(script?.sections) +
        (introSec ?? REMOTION_INTRO_GRAPHIC_SEC) +
        REMOTION_OUTRO_GRAPHIC_SEC,
    introGraphicSec: introSec,
    outroGraphicSec: REMOTION_OUTRO_GRAPHIC_SEC,
    channelName: process.env.CHANNEL_NAME || 'DocuForge',
    narrationAudioSrc:
      project.input?.editMode === 'video-only'
        ? undefined
        : project.narration?.combinedPath || undefined,
    fps: 30,
    width,
    height,
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
  let renderProps = { ...props };
  const perf = applyRenderPerformanceProfile(renderProps, {
    fastRender: Boolean(options.fastRender) || isMaxPerformanceMode(),
  });
  renderProps = perf.props;
  if (perf.fastApplied) {
    console.log(
      '[Remotion] Speed profile — motion blur/light leaks/grain off, shorter transitions, line subtitles',
    );
  } else if (options.fastRender && renderProps.visualTheme?.effects) {
    renderProps = {
      ...renderProps,
      visualTheme: {
        ...renderProps.visualTheme,
        effects: { ...renderProps.visualTheme.effects, motionBlur: false },
      },
    };
  }

  const { scenes, extras } = await prepareRemotionPublicAssets(
    scenesOrScreens,
    publicDir,
    renderProps.narrationAudioSrc ? { narration: renderProps.narrationAudioSrc } : {},
    { preserveExisting: Boolean(options.preservePublicDir) },
  );

  let timedScenes = isWalkthrough
    ? scenes
    : await prepareRemotionScenes(scenes, publicDir);

  if (perf.fastApplied && !isWalkthrough) {
    timedScenes = timedScenes.map((s) => ({
      ...s,
      transition: 'crossfade',
      kenBurnsFrom: 1,
      kenBurnsTo: 1,
      panStartX: 0,
      panEndX: 0,
    }));
  }

  const finalProps = {
    ...renderProps,
    ...(isWalkthrough ? { screens: timedScenes } : { scenes: timedScenes }),
    narrationAudioSrc: extras.narration || renderProps.narrationAudioSrc,
  };

  const bundleKey = path.resolve(publicDir);
  let bundleLocation = bundleCache.get(bundleKey);
  if (!bundleLocation || !fs.existsSync(bundleLocation)) {
    bundleLocation = await bundle({
      entryPoint: entry,
      rootDir: ROOT,
      publicDir,
      webpackOverride: (config) => config,
    });
    bundleCache.set(bundleKey, bundleLocation);
  } else {
    console.log('[Remotion] Reusing cached webpack bundle');
  }

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps: finalProps,
  });

  const totalFrames = composition.durationInFrames || 0;
  const fps = composition.fps || 30;
  const durationMin = Math.round((totalFrames / fps / 60) * 10) / 10;
  let concurrency = resolveRemotionConcurrency();
  concurrency = resolveConcurrencyForScenes(timedScenes, concurrency);
  const hardwareAcceleration = resolveHardwareAcceleration();
  const chromiumOptions = resolveChromiumOptions();
  const videoBitrate = resolveVideoBitrate();
  const x264Preset = resolveX264Preset();
  const offthreadVideoCacheSizeInBytes = resolveOffthreadVideoCacheBytes();
  const offthreadVideoThreads = resolveOffthreadVideoThreads();
  const framesPerWorkerSec = Math.max(1.2, concurrency * 1.1);
  const etaMin = Math.round((totalFrames / framesPerWorkerSec / 60) * 10) / 10;

  logRemotionPerformancePlan({ concurrency, hardwareAcceleration, chromiumOptions });
  console.log(
    `[Remotion] ${compositionId} · ${totalFrames} frames (${durationMin} min) · ${composition.width}x${composition.height}`,
  );
  if (videoBitrate) {
    console.log(`[Remotion] GPU video encode · bitrate ${videoBitrate}`);
  }
  if (offthreadVideoCacheSizeInBytes) {
    const cacheMb = Math.round(offthreadVideoCacheSizeInBytes / 1024 / 1024);
    console.log(
      `[Remotion] OffthreadVideo cache ${cacheMb}MB · extract threads ${offthreadVideoThreads || 'auto'}`,
    );
  }
  console.log(`[Remotion] Rough ETA ~${etaMin} min (varies with effects & video clips)`);

  const { cancelSignal, cancel } = makeCancelSignal();
  if (options.renderJob) {
    options.renderJob.cancelRemotion = cancel;
    if (options.renderJob.cancelled) cancel();
  }

  const durationSec =
    (composition.durationInFrames || 0) / (composition.fps || 30) || 60;
  const delayRenderTimeoutMs = resolveDelayRenderTimeoutMs();
  const timeoutMs = Math.max(
    delayRenderTimeoutMs,
    Number(process.env.REMOTION_RENDER_TIMEOUT_MS) || 600_000,
    Math.ceil(durationSec * 2500),
  );
  const jpegQuality = resolveJpegQuality(options.fastRender || perf.fastApplied);

  let lastRemotionPct = -1;
  let lastHeartbeat = 0;
  const renderStarted = Date.now();

  const onProgress = ({ progress, renderedFrames, encodedFrames }) => {
    const pct = Math.min(100, Math.floor(progress * 100));
    const now = Date.now();
    if (pct > lastRemotionPct || now - lastHeartbeat > 12_000 || pct === 100) {
      if (pct > lastRemotionPct) lastRemotionPct = pct;
      lastHeartbeat = now;
      const elapsed = Math.round((now - renderStarted) / 1000);
      const frameInfo =
        renderedFrames != null
          ? ` · ${renderedFrames}/${totalFrames || '?'} frames`
          : '';
      console.log(`[Remotion:${compositionId}] ${pct}% (${elapsed}s${frameInfo})`);
      options.onProgress?.({
        progress,
        pct,
        elapsedSec: elapsed,
        renderedFrames,
        encodedFrames,
      });
    }
  };

  setGpuRenderLock(true);
  try {
    const renderOpts = {
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      pixelFormat: 'yuv420p',
      audioCodec: 'aac',
      outputLocation: outputPath,
      inputProps: finalProps,
      cancelSignal,
      concurrency,
      jpegQuality,
      chromiumOptions,
      hardwareAcceleration,
      disallowParallelEncoding: false,
      timeoutInMilliseconds: timeoutMs,
      onProgress,
    };
    if (videoBitrate) renderOpts.videoBitrate = videoBitrate;
    if (x264Preset) renderOpts.x264Preset = x264Preset;
    if (offthreadVideoCacheSizeInBytes) {
      renderOpts.offthreadVideoCacheSizeInBytes = offthreadVideoCacheSizeInBytes;
    }
    if (offthreadVideoThreads) {
      renderOpts.offthreadVideoThreads = offthreadVideoThreads;
    }

    await renderMedia(renderOpts);
  } catch (err) {
    if (isUserCancelledRender(err) || options.renderJob?.cancelled) {
      throw new RenderCancelledError();
    }

    const hwFailed =
      hardwareAcceleration === 'prefer-hardware' &&
      /hardware|acceleration|encoder|nvenc|qsv|vaapi/i.test(String(err?.message || ''));
    if (hwFailed) {
      console.warn(
        '[Remotion] GPU encode failed — retrying with software encoding:',
        err.message,
      );
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        pixelFormat: 'yuv420p',
        audioCodec: 'aac',
        outputLocation: outputPath,
        inputProps: finalProps,
        cancelSignal,
        concurrency,
        jpegQuality,
        chromiumOptions,
        hardwareAcceleration: 'prefer-software',
        x264Preset: x264Preset || 'veryfast',
        disallowParallelEncoding: false,
        timeoutInMilliseconds: timeoutMs,
        ...(offthreadVideoCacheSizeInBytes
          ? { offthreadVideoCacheSizeInBytes }
          : {}),
        ...(offthreadVideoThreads ? { offthreadVideoThreads } : {}),
        onProgress,
      });
    } else {
      const elapsed = Math.round((Date.now() - renderStarted) / 1000);
      throw new Error(
        `${err.message || err} (after ${elapsed}s — lower REMOTION_CONCURRENCY if out of memory)`,
      );
    }
  } finally {
    setGpuRenderLock(false);
  }

  if (options.renderJob?.cancelled) {
    throw new RenderCancelledError();
  }

  const ok = await verifyVideoFile(outputPath);
  if (!ok) {
    throw new Error('Remotion output is invalid or incomplete');
  }

  return outputPath;
}
