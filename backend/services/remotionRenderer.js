/**
 * Remotion bundle + render — default documentary output with motion graphics.
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
} from '../constants/videoDefaults.js';
import { verifyVideoFile } from '../utils/videoValidate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

function isAbsoluteAssetPath(src) {
  return path.isAbsolute(src) || /^[a-zA-Z]:\\/.test(src);
}

/**
 * Copy/symlink absolute media paths into a Remotion public dir and return relative names.
 */
export function prepareRemotionPublicAssets(scenes, publicDir) {
  // Fresh dir with real files — symlinks break Remotion's bundle HTTP server (404).
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
  fs.mkdirSync(publicDir, { recursive: true });
  const usedNames = new Set();
  let copied = 0;

  const preparedScenes = (scenes || []).map((scene, i) => {
    const src = scene?.src;
    if (!src || src.startsWith('http://') || src.startsWith('https://')) {
      return scene;
    }
    if (!isAbsoluteAssetPath(src)) {
      return scene;
    }
    if (!fs.existsSync(src)) {
      console.warn(`[Remotion] Missing asset: ${src}`);
      return scene;
    }

    const ext = path.extname(src) || '.jpg';
    let name = path.basename(src);
    if (usedNames.has(name)) {
      name = `scene-${i}${ext}`;
    }
    usedNames.add(name);

    const dest = path.join(publicDir, name);
    fs.copyFileSync(src, dest);
    copied++;

    return { ...scene, src: name };
  });

  console.log(`[Remotion] Prepared ${copied} asset(s) in ${publicDir}`);
  return { publicDir, scenes: preparedScenes };
}

export async function renderRemotionPreview(props, outputPath, options = {}) {
  const entry = path.join(ROOT, 'remotion', 'index.ts');
  if (!fs.existsSync(entry)) {
    throw new Error('Remotion entry not found at remotion/index.ts');
  }

  const publicDir =
    options.publicDir || path.join(path.dirname(outputPath), 'remotion-public');
  const { scenes } = prepareRemotionPublicAssets(props.scenes || [], publicDir);
  const renderProps = { ...props, scenes };

  const bundleLocation = await bundle({
    entryPoint: entry,
    rootDir: ROOT,
    publicDir,
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'Documentary',
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
        console.log(`[Remotion] ${pct}%`);
      }
    },
  });

  const ok = await verifyVideoFile(outputPath);
  if (!ok) {
    throw new Error('Remotion output is invalid or incomplete');
  }

  return outputPath;
}

export function buildRemotionProps(project) {
  const { script, media, timeline } = project;
  const sectionById = Object.fromEntries((script?.sections || []).map((s) => [s.id, s]));

  const transitions = ['crossfade', 'slide', 'zoom', 'fade'];
  const scenes =
    timeline?.scenes?.map((s, i) => ({
      src: s.media?.localPath || s.media?.url || '',
      type: s.media?.type || 'image',
      duration: s.duration,
      transition: s.transition || transitions[i % transitions.length],
      caption: sectionById[s.sectionId]?.title,
      sectionTitle: s.sectionTitle || sectionById[s.sectionId]?.title,
    })) ||
    media?.map((m, i) => ({
      src: m.localPath || m.url,
      type: m.type || 'image',
      duration: 5,
      sectionTitle: script?.sections?.[i % (script?.sections?.length || 1)]?.title,
    })) ||
    [];

  return {
    title: script?.topic || 'Documentary',
    sections: script?.sections || [],
    scenes: scenes.filter((s) => s.src),
    subtitleCues: project.subtitleCues || [],
    totalDuration: timeline?.totalDuration || TARGET_VIDEO_DURATION_SEC,
    introGraphicSec: REMOTION_INTRO_GRAPHIC_SEC,
    outroGraphicSec: REMOTION_OUTRO_GRAPHIC_SEC,
    channelName: process.env.CHANNEL_NAME || script?.topic || 'DocuForge',
    fps: 30,
    width: 1920,
    height: 1080,
  };
}
