/**
 * Hybrid render orchestrator: MoviePy → Remotion → FFmpeg.
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { projectDir } from '../utils/paths.js';
import { extractKeywords } from './keywordExtractor.js';
import { searchMedia, downloadMediaAssets } from './mediaSearch.js';
import { scrapeUrlForVideo } from '../scraper/playwrightScraper.js';
import { generateDocumentaryScript } from './scriptGenerator.js';
import { generateNarrationForTargetDuration } from './voiceGenerator.js';
import { REMOTION_INTRO_GRAPHIC_SEC } from '../constants/videoDefaults.js';
import { writeSubtitles } from './subtitleGenerator.js';
import { buildTimeline, buildWalkthroughTimeline } from './timelineBuilder.js';
import { runMoviePyPipeline } from './moviepyBridge.js';
import { buildRemotionProps, renderRemotionPreview } from './remotionRenderer.js';
import { exportDocumentary } from './videoRenderer.js';
import { verifyVideoFile } from '../utils/videoValidate.js';
import { sanitizeMediaManifest, prepareMoviePyScenes } from '../utils/mediaValidate.js';
import { normalizeHttpUrl } from '../utils/urlValidate.js';

export class RenderPipeline {
  constructor(root) {
    this.root = root;
    this.jobs = new Map();
  }

  async createProject(input) {
    const projectId = uuidv4();
    const dir = projectDir(this.root, projectId);
    const project = {
      id: projectId,
      input,
      status: 'created',
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify(project, null, 2));
    return project;
  }

  async runFullPipeline(projectId, options = {}, onProgress) {
    const dir = projectDir(this.root, projectId);
    const projectPath = path.join(dir, 'project.json');
    const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

    const report = (stage, progress, message) => {
      onProgress?.({ projectId, stage, progress, message });
      project.stage = stage;
      project.progress = progress;
      project.message = message;
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    };

    try {
      // 1. Script
      report('script', 5, 'Generating documentary script...');
      const script = await generateDocumentaryScript(project.input);
      project.script = script;
      fs.writeFileSync(path.join(dir, 'script.json'), JSON.stringify(script, null, 2));

      // 2. Playwright scrape (article / YouTube) — content + media for keywords & timeline
      const sourceUrl =
        normalizeHttpUrl(project.input?.articleUrl) ||
        normalizeHttpUrl(project.input?.youtubeUrl);
      let scrapedMedia = [];
      let scrapedContent = null;
      if (sourceUrl) {
        report('scrape', 12, 'Scraping page with Playwright...');
        const scrapeDir = path.join(dir, 'scraped');
        const scraped = await scrapeUrlForVideo(sourceUrl, scrapeDir);
        scrapedContent = scraped.content;
        project.scrapedContent = scrapedContent;
        scrapedMedia = scraped.media || [];
      }

      // 3. Keywords (Playwright page text + script)
      report('keywords', 18, 'Extracting keywords with Playwright...');
      const keywords = await extractKeywords({
        text: script.fullNarration,
        topic: script.topic,
        articleUrl: project.input?.articleUrl,
        youtubeUrl: project.input?.youtubeUrl,
        scrapedContent,
      });
      project.keywords = keywords;

      report('media', 20, 'Searching and downloading 4K media...');
      const searchTerms = [
        `${script.topic} 4K`,
        ...keywords.keywords.slice(0, 5).map((k) => `${k} 4K documentary`),
      ];
      let allMedia = [...scrapedMedia];
      for (const term of searchTerms.slice(0, 4)) {
        const found = await searchMedia(term, { limit: 8 });
        allMedia = allMedia.concat(found);
      }
      const seenMedia = new Set();
      allMedia = allMedia.filter((m) => {
        const key = m.localPath || m.url;
        if (!key || seenMedia.has(key)) return false;
        seenMedia.add(key);
        return Boolean(m.localPath || m.url);
      });
      const mediaDir = path.join(dir, 'media');
      const stockManifest = await downloadMediaAssets(
        allMedia.filter((m) => !m.localPath),
        mediaDir,
      );
      const manifest = [
        ...scrapedMedia.filter((m) => m.localPath),
        ...stockManifest,
      ];
      project.media = await sanitizeMediaManifest(manifest);
      if (project.media.length < manifest.length) {
        console.warn(
          `[Pipeline] Dropped ${manifest.length - project.media.length} invalid media file(s)`,
        );
      }

      // 4. Narration (~3:00 target)
      report('narration', 35, 'Generating voice narration (3 min target)...');
      const narrationResult = await generateNarrationForTargetDuration(
        script.sections,
        path.join(dir, 'audio'),
        {
          voice: options.voice || project.input?.voice,
          rate: options.rate ?? project.input?.rate,
          pitch: options.pitch ?? project.input?.pitch,
        },
      );
      const { tracks, combinedPath, durationSec: audioDurationSec } = narrationResult;
      project.narration = { tracks, combinedPath, audioDurationSec };

      // 5. Subtitles (animated in Remotion + SRT fallback)
      report('subtitles', 45, 'Creating animated subtitle cues...');
      const { srtPath, cues } = writeSubtitles(script.sections, path.join(dir, 'subtitles'), {
        introOffsetSec: REMOTION_INTRO_GRAPHIC_SEC,
        audioDurationSec,
      });
      project.subtitleCues = cues;

      const videoStyle = project.input?.videoStyle || 'documentary';
      project.videoStyle = videoStyle;

      // 6. Timeline — documentary or walkthrough (Stitch-style slides)
      report('timeline', 50, `Building ${videoStyle} timeline...`);
      let timeline;
      let walkthrough;
      if (videoStyle === 'walkthrough') {
        walkthrough = buildWalkthroughTimeline(script, manifest, { audioDurationSec });
        project.walkthrough = walkthrough;
        timeline = {
          scenes: walkthrough.screens.map((s) => ({
            id: s.id,
            duration: s.duration,
            media: { localPath: s.src, type: s.type },
            transition: s.transition,
          })),
          totalDuration: walkthrough.totalDuration,
        };
      } else {
        timeline = buildTimeline(script, manifest, tracks, { audioDurationSec });
      }
      project.timeline = timeline;
      fs.mkdirSync(path.join(dir, 'timeline'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'timeline', 'timeline.json'), JSON.stringify(timeline, null, 2));
      if (walkthrough) {
        fs.writeFileSync(
          path.join(dir, 'timeline', 'walkthrough.json'),
          JSON.stringify(walkthrough, null, 2),
        );
      }

      // 7. Remotion — TransitionSeries, walkthrough slides, motion graphics
      const compositionId = videoStyle === 'walkthrough' ? 'Walkthrough' : 'Documentary';
      report('remotion', 55, `Rendering with Remotion (${compositionId})...`);
      const remotionProps = buildRemotionProps({
        ...project,
        timeline,
        walkthrough,
        subtitleCues: project.subtitleCues,
      });
      let videoPath = path.join(dir, 'renders', 'remotion-output.mp4');
      fs.mkdirSync(path.dirname(videoPath), { recursive: true });
      try {
        await renderRemotionPreview(remotionProps, videoPath, {
          publicDir: path.join(dir, 'remotion-public'),
          compositionId,
        });
      } catch (err) {
        console.warn('[Pipeline] Remotion failed, falling back to MoviePy:', err.message);
        report('moviepy', 58, 'MoviePy clip sequencing...');
        const moviepyScenes = await prepareMoviePyScenes(timeline.scenes);
        if (!moviepyScenes.length) {
          throw new Error('No valid media clips for MoviePy — check scraped/downloaded assets');
        }
        const moviepyConfig = {
          scenes: moviepyScenes,
          audio: combinedPath,
          output: path.join(dir, 'renders', 'moviepy-output.mp4'),
          fps: 30,
          resolution: options.preset || '1080p',
        };
        fs.writeFileSync(path.join(dir, 'moviepy-config.json'), JSON.stringify(moviepyConfig, null, 2));
        videoPath = path.join(dir, 'renders', 'moviepy-output.mp4');
        await runMoviePyPipeline(path.join(dir, 'moviepy-config.json'), (p) =>
          report('moviepy', 58 + p * 0.12, 'MoviePy rendering...'),
        );
      }

      if (!(await verifyVideoFile(videoPath))) {
        throw new Error('Video render failed — intermediate file is invalid');
      }

      report('ffmpeg', 82, 'Final export (mix audio + encode)...');
      const slug = script.topic.replace(/[^a-z0-9]+/gi, '-').slice(0, 36);
      const exportName = `${slug}-${Date.now()}.${options.format || 'mp4'}`;
      const finalPath = path.join(this.root, 'exports', exportName);
      fs.mkdirSync(path.dirname(finalPath), { recursive: true });

      await exportDocumentary({
        videoPath,
        narrationPath: combinedPath,
        outputPath: finalPath,
        musicPath: options.musicPath || null,
        preset: options.preset || '1080p',
        cinematic: true,
      });

      project.status = 'completed';
      project.outputPath = finalPath;
      project.completedAt = new Date().toISOString();
      report('done', 100, 'Export complete!');
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));

      return project;
    } catch (err) {
      project.status = 'failed';
      project.error = err.message;
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
      throw err;
    }
  }
}
