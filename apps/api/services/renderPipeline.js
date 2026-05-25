/**
 * Hybrid render orchestrator: MoviePy → Remotion → FFmpeg.
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { projectDir } from '../utils/paths.js';
import { extractKeywords } from './keywordExtractor.js';
import { searchMediaForScript, downloadMediaAssets } from './mediaSearch.js';
import { scrapeUrlForVideo } from '../scraper/playwrightScraper.js';
import { generateDocumentaryScript } from './scriptGenerator.js';
import { generateNarrationForTargetDuration } from './voiceGenerator.js';
import { estimateScriptDurationSec } from './scriptLength.js';
import { writeSubtitles } from './subtitleGenerator.js';
import { buildTimeline, buildWalkthroughTimeline } from './timelineBuilder.js';
import { runMoviePyPipeline } from './moviepyBridge.js';
import { buildRemotionProps, renderRemotionPreview } from './remotionRenderer.js';
import { exportDocumentary, exportVideoOnly } from './videoRenderer.js';
import {
  balanceSectionDurations,
  syncSectionDurationsFromAudio,
} from '../utils/sectionTiming.js';
import {
  getDocumentaryTemplate,
  getIntroGraphicSec,
  resolveVisualTheme,
} from '@docuforge/config/documentaryTemplates';
import { verifyVideoFile } from '../utils/videoValidate.js';
import { sanitizeMediaManifest, prepareMoviePyScenes } from '../utils/mediaValidate.js';
import { ensureMediaManifest } from '../utils/placeholderMedia.js';
import { expandScriptSections } from './scriptLength.js';
import { normalizeHttpUrl } from '../utils/urlValidate.js';
import {
  resolveBackgroundMusicPath,
  defaultMusicVolume,
} from '../utils/backgroundMusic.js';
import { RenderCancelledError } from './renderErrors.js';
import { splitVideoIntoShortParts } from '../utils/splitVideo.js';
import {
  clearCheckpoint,
  findNarrationAudioPath,
  hasPrepArtifacts,
  inferCheckpointFromDisk,
  isStepDone,
  loadCheckpoint,
  loadSubtitlesFromDisk,
  markStep,
  mergeCheckpoints,
  saveCheckpoint,
  snapshotCheckpointFromDisk,
  variantStep,
} from '../utils/renderCheckpoint.js';

export class RenderPipeline {
  constructor(root) {
    this.root = root;
    /** @type {Map<string, { cancelled: boolean, cancelRemotion: (() => void) | null, moviePyProc: import('child_process').ChildProcess | null, cancel: () => void }>} */
    this.jobs = new Map();
  }

  _beginJob(projectId) {
    const existing = this.jobs.get(projectId);
    existing?.cancel();

    const job = {
      cancelled: false,
      cancelRemotion: null,
      moviePyProc: null,
      cancel() {
        job.cancelled = true;
        job.cancelRemotion?.();
        if (job.moviePyProc?.pid && !job.moviePyProc.killed) {
          try {
            job.moviePyProc.kill('SIGTERM');
          } catch {
            /* process may have exited */
          }
        }
      },
    };
    this.jobs.set(projectId, job);
    return job;
  }

  _assertNotCancelled(projectId) {
    if (this.jobs.get(projectId)?.cancelled) {
      throw new RenderCancelledError();
    }
  }

  _markProjectCancelled(projectId) {
    const dir = projectDir(this.root, projectId);
    const projectPath = path.join(dir, 'project.json');
    if (!fs.existsSync(projectPath)) return false;
    const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
    if (project.status === 'completed') return false;
    project.status = 'cancelled';
    project.stage = 'cancelled';
    project.message = 'Render stopped — use Resume to continue from Remotion';
    project.cancelledAt = new Date().toISOString();
    project.canResume = hasPrepArtifacts(dir, project.input?.editMode === 'video-only');
    project.resumeAvailable = project.canResume;
    delete project.error;
    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    return true;
  }

  cancelRender(projectId) {
    const job = this.jobs.get(projectId);
    if (job) job.cancel();
    try {
      snapshotCheckpointFromDisk(projectDir(this.root, projectId));
    } catch {
      /* best-effort */
    }
    return this._markProjectCancelled(projectId) || Boolean(job);
  }

  async createProject(input) {
    const projectId = uuidv4();
    const dir = projectDir(this.root, projectId);
    const project = {
      id: projectId,
      input: input || {},
      status: 'created',
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify(project, null, 2));
    return project;
  }

  loadOrCreateProject(projectId, input = {}) {
    const dir = projectDir(this.root, projectId);
    const projectPath = path.join(dir, 'project.json');
    if (fs.existsSync(projectPath)) {
      return JSON.parse(fs.readFileSync(projectPath, 'utf8'));
    }
    const project = {
      id: projectId,
      input: input && typeof input === 'object' ? { ...input } : {},
      status: 'created',
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    return project;
  }

  mergeProjectInput(projectId, input) {
    if (!input || typeof input !== 'object') return null;
    const projectPath = path.join(projectDir(this.root, projectId), 'project.json');
    const project = this.loadOrCreateProject(projectId);
    project.input = { ...(project.input || {}), ...input };
    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    return project;
  }

  _hydrateFromDisk(project, dir) {
    const scriptPath = path.join(dir, 'script.json');
    if (!project.script && fs.existsSync(scriptPath)) {
      project.script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
    }
    const mediaManifest = path.join(dir, 'media', 'manifest.json');
    if (!project.media?.length && fs.existsSync(mediaManifest)) {
      project.media = JSON.parse(fs.readFileSync(mediaManifest, 'utf8'));
    }
    const narrationPath =
      project.narration?.combinedPath || findNarrationAudioPath(dir);
    if (narrationPath) {
      project.narration = { ...(project.narration || {}), combinedPath: narrationPath };
    }
    return project;
  }

  async runResumePipeline(projectId, options = {}, onProgress) {
    return this.runFullPipeline(projectId, { ...options, resume: true }, onProgress);
  }

  async runFullPipeline(projectId, options = {}, onProgress) {
    const dir = projectDir(this.root, projectId);
    const projectPath = path.join(dir, 'project.json');
    const renderJob = this._beginJob(projectId);
    const resume = Boolean(options.resume);
    let checkpoint = loadCheckpoint(dir);
    if (!resume) {
      clearCheckpoint(dir);
      checkpoint = loadCheckpoint(dir);
    } else {
      const inferred = inferCheckpointFromDisk(dir);
      checkpoint = mergeCheckpoints(checkpoint, inferred);
      saveCheckpoint(dir, {
        completed: checkpoint.completed,
        resumedAt: new Date().toISOString(),
      });
    }

    let project = this.loadOrCreateProject(projectId, options.input);
    project = this._hydrateFromDisk(project, dir);

    if (options.input && typeof options.input === 'object') {
      project.input = { ...(project.input || {}), ...options.input };
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    }

    const videoOnly =
      project.input?.editMode === 'video-only' ||
      options.editMode === 'video-only' ||
      options.videoOnly === true;

    project.resumeAvailable = hasPrepArtifacts(dir, videoOnly);
    project.canResume = resume || project.resumeAvailable;
    if (project.canResume) {
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    }

    if (videoOnly) {
      project.input = { ...(project.input || {}), editMode: 'video-only' };
      project.videoOnly = true;
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    }

    project.status = 'rendering';
    project.error = undefined;

    const report = (stage, progress, message) => {
      this._assertNotCancelled(projectId);
      onProgress?.({ projectId, stage, progress, message });
      project.stage = stage;
      project.progress = progress;
      project.message = message;
      project.status = 'rendering';
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    };

    try {
      this._assertNotCancelled(projectId);

      const exportFullAndShorts = Boolean(options.exportFullAndShorts);
      const autoShortsOnly =
        Boolean(options.autoYouTubeShorts) && !exportFullAndShorts;
      const includeShorts = exportFullAndShorts || autoShortsOnly;
      const mainTemplateId =
        options.templateId || project.input?.templateId || 'template_cinematic_docuforge';
      const shortsTemplateId =
        options.shortsTemplateId ||
        project.shortsTemplateId ||
        'template_youtube_shorts';
      const mainPreset = options.preset || '1080p';

      project.exportFullAndShorts = exportFullAndShorts;
      project.autoYouTubeShorts = includeShorts;
      project.shortsTemplateId = shortsTemplateId;

      const scriptPath = path.join(dir, 'script.json');
      const mediaManifestPath = path.join(dir, 'media', 'manifest.json');
      const prepDone =
        resume &&
        (isStepDone(checkpoint, 'prep') || hasPrepArtifacts(dir, videoOnly)) &&
        fs.existsSync(scriptPath);

      let script;
      let media;
      let tracks = [];
      let combinedPath = null;
      let audioDurationSec = null;
      let effectiveNarrationSec;

      if (prepDone) {
        report('script', 45, 'Resume — reusing script, media & narration from last run');
        script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
        project.script = script;
        let rawMedia = [];
        if (fs.existsSync(mediaManifestPath)) {
          rawMedia = JSON.parse(fs.readFileSync(mediaManifestPath, 'utf8'));
        }
        const mediaDir = path.join(dir, 'media');
        media = await ensureMediaManifest(
          await sanitizeMediaManifest(rawMedia),
          mediaDir,
          12,
        );
        project.media = media;
        const narrationFile = findNarrationAudioPath(dir);
        if (!videoOnly && narrationFile) {
          combinedPath = narrationFile;
          effectiveNarrationSec = estimateScriptDurationSec(script.sections);
        } else {
          effectiveNarrationSec = estimateScriptDurationSec(script.sections);
        }
      } else {
      // 1. Script
      const uploadedScript = Boolean(project.input?.scriptText?.trim());
      report(
        'script',
        5,
        uploadedScript ? 'Parsing uploaded script…' : 'Generating documentary script…',
      );
      script = await generateDocumentaryScript(project.input);
      project.script = script;
      fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));

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

      if (!uploadedScript) {
        const researchForScript = [scrapedContent?.text, script.fullNarration]
          .filter(Boolean)
          .join('\n\n');
        script.sections = expandScriptSections(script.sections, researchForScript);
        script.fullNarration = script.sections.map((s) => s.narration).join('\n\n');
      }
      project.script = script;
      fs.writeFileSync(path.join(dir, 'script.json'), JSON.stringify(script, null, 2));

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

      report('media', 20, 'Searching stock video matched to each script section...');
      const stockVideos = await searchMediaForScript(script, {
        keywords: keywords.keywords || [],
        limit: 32,
      });
      let allMedia = [
        ...scrapedMedia.filter((m) => m.type === 'video'),
        ...stockVideos,
      ];
      const seenMedia = new Set();
      allMedia = allMedia.filter((m) => {
        const key = m.localPath || m.url;
        if (!key || seenMedia.has(key)) return false;
        seenMedia.add(key);
        return Boolean(m.localPath || m.url);
      });
      const mediaDir = path.join(dir, 'media');
      fs.mkdirSync(mediaDir, { recursive: true });
      const stockManifest = await downloadMediaAssets(
        allMedia.filter((m) => !m.localPath),
        mediaDir,
      );
      const manifest = [
        ...scrapedMedia.filter((m) => m.localPath),
        ...stockManifest,
      ];
      media = await sanitizeMediaManifest(manifest);

      // Recovery path: if a previous run already downloaded stock clips into media/manifest.json,
      // reuse them before falling back to placeholders.
      if (!media.length) {
        const cachedManifestPath = path.join(mediaDir, 'manifest.json');
        if (fs.existsSync(cachedManifestPath)) {
          try {
            const cached = JSON.parse(fs.readFileSync(cachedManifestPath, 'utf8'));
            if (Array.isArray(cached) && cached.length) {
              const recovered = await sanitizeMediaManifest(cached);
              if (recovered.length) {
                media = recovered;
                console.warn(
                  `[Pipeline] Recovered ${recovered.length} media file(s) from cached manifest`,
                );
              }
            }
          } catch {
            /* ignore malformed cached manifest */
          }
        }
      }

      media = await ensureMediaManifest(media, mediaDir, 12);
      project.media = media;
      fs.writeFileSync(mediaManifestPath, JSON.stringify(project.media, null, 2));
      if (project.media.length < manifest.length) {
        console.warn(
          `[Pipeline] Dropped ${manifest.length - project.media.length} invalid media file(s)`,
        );
      }

      effectiveNarrationSec = estimateScriptDurationSec(script.sections);

      // 4. Narration — length follows script; skipped in video-only edit mode
      if (videoOnly) {
        report('narration', 35, 'Skipped — video-only edit (no narration)');
        project.narration = null;
      } else {
        report('narration', 35, 'Generating voice narration from script...');
        const narrationResult = await generateNarrationForTargetDuration(
          script.sections,
          path.join(dir, 'audio'),
          {
            voice: options.voice || project.input?.voice,
            rate: options.rate ?? project.input?.rate,
            pitch: options.pitch ?? project.input?.pitch,
          },
        );
        ({ tracks, combinedPath, durationSec: audioDurationSec } = narrationResult);
        effectiveNarrationSec =
          audioDurationSec && audioDurationSec > 5
            ? audioDurationSec
            : estimateScriptDurationSec(script.sections);
        project.narration = { tracks, combinedPath, audioDurationSec: effectiveNarrationSec };

        script.sections = syncSectionDurationsFromAudio(script.sections, effectiveNarrationSec);
        script.sections = balanceSectionDurations(script.sections);
        project.script = script;
        fs.writeFileSync(path.join(dir, 'script.json'), JSON.stringify(script, null, 2));
      }

        markStep(dir, 'prep');
        checkpoint = loadCheckpoint(dir);
      }

      const videoStyle = project.input?.videoStyle || 'documentary';
      project.videoStyle = videoStyle;

      const musicPath = resolveBackgroundMusicPath(this.root, {
        explicitPath: options.musicPath,
        projectId,
      });

      const variants = [];
      if (videoStyle === 'walkthrough' || !includeShorts) {
        variants.push({
          key: 'full',
          templateId: mainTemplateId,
          preset: mainPreset,
          splitShorts: false,
          suffix: 'full',
        });
      } else if (exportFullAndShorts) {
        variants.push({
          key: 'full',
          templateId: mainTemplateId,
          preset: mainPreset,
          splitShorts: false,
          suffix: 'full',
        });
        variants.push({
          key: 'shorts',
          templateId: shortsTemplateId,
          preset: 'shorts',
          splitShorts: true,
          suffix: 'shorts',
        });
      } else {
        variants.push({
          key: 'shorts',
          templateId: shortsTemplateId,
          preset: 'shorts',
          splitShorts: true,
          suffix: 'shorts',
        });
      }

      const shortsMaxSec = Number(options.shortsMaxDurationSec) || 90;
      const exportFormat = options.format || 'mp4';
      const slug = script.topic.replace(/[^a-z0-9]+/gi, '-').slice(0, 36);
      const exportDir = path.join(this.root, 'exports');
      fs.mkdirSync(exportDir, { recursive: true });
      const exportTs = Date.now();

      const allOutputPaths = [];
      const fullOutputPaths = [];
      const shortsOutputPaths = [];
      const compositionId = videoStyle === 'walkthrough' ? 'Walkthrough' : 'Documentary';

      for (let vi = 0; vi < variants.length; vi++) {
        const variant = variants[vi];
        const progressLo = 50 + (vi / variants.length) * 42;
        const progressHi = 50 + ((vi + 1) / variants.length) * 42;
        const variantLabel =
          variant.key === 'shorts' ? 'YouTube Shorts' : 'full documentary';

        project.renderTemplateId = variant.templateId;
        project.renderPreset = variant.preset;

        const templateId = variant.templateId;
        const introGraphicSec = getIntroGraphicSec(templateId);

        const vSuffix = variant.suffix;
        const timelinePath = path.join(dir, 'timeline', `timeline-${vSuffix}.json`);
        const remotionPath = path.join(dir, 'renders', `remotion-${vSuffix}.mp4`);
        const publicDir = path.join(dir, `remotion-public-${vSuffix}`);

        let timeline;
        let walkthrough;
        let subtitleCues = [];
        let wordCues = [];

        let loadedCachedTimeline = false;
        if (resume && isStepDone(checkpoint, variantStep(vSuffix, 'timeline')) && fs.existsSync(timelinePath)) {
          const cached = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
          const cachedTemplate = cached.templateId;
          if (!cachedTemplate || cachedTemplate === templateId) {
            timeline = cached;
            project.timeline = timeline;
            loadedCachedTimeline = true;
            report('timeline', progressLo, `Resume — loaded timeline (${variantLabel})`);
          } else {
            console.warn(
              `[Pipeline] Template changed (${cachedTemplate} → ${templateId}) — rebuilding timeline`,
            );
          }
        }
        if (!loadedCachedTimeline) {
        report(
          'timeline',
          progressLo,
          `Building ${videoStyle} timeline (${variantLabel})...`,
        );
        if (videoStyle === 'walkthrough') {
          walkthrough = buildWalkthroughTimeline(script, media, {
            audioDurationSec: effectiveNarrationSec,
          });
          project.walkthrough = walkthrough;
          timeline = {
            scenes: walkthrough.screens.map((s) => ({
              id: s.id,
              duration: s.duration,
              trimStart: s.trimStart || 0,
              trimEnd: s.trimEnd || 0,
              playbackRate: s.playbackRate || 1,
              loop: Boolean(s.loop),
              audioVolume: s.audioVolume || 0,
              media: { localPath: s.src, type: s.type },
              transition: s.transition,
            })),
            totalDuration: walkthrough.totalDuration,
          };
        } else {
          if (!Array.isArray(media) || !media.length) {
            const mediaDir = path.join(dir, 'media');
            media = await ensureMediaManifest([], mediaDir, 12);
            project.media = media;
          }
          const docTemplate = getDocumentaryTemplate(templateId);
          const visualTheme = resolveVisualTheme(docTemplate);
          project.visualTemplate = docTemplate;
          timeline = buildTimeline(script, media, tracks, {
            audioDurationSec: effectiveNarrationSec,
            videoOnly,
            editMode: project.input?.editMode,
            templateId: docTemplate.id,
            visualTheme,
            introGraphicSec,
          });
          if (timeline.sections?.length) {
            script.sections = timeline.sections;
            project.script = script;
          }
        }
        project.timeline = timeline;
        fs.mkdirSync(path.join(dir, 'timeline'), { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'timeline', `timeline-${variant.suffix}.json`),
          JSON.stringify(timeline, null, 2),
        );
        if (vi === variants.length - 1) {
          fs.writeFileSync(
            path.join(dir, 'timeline', 'timeline.json'),
            JSON.stringify(timeline, null, 2),
          );
        }
        markStep(dir, variantStep(vSuffix, 'timeline'));
        checkpoint = loadCheckpoint(dir);
        }

        if (videoOnly) {
          report('subtitles', progressLo + 2, 'Skipped — video-only edit');
        } else if (
          resume &&
          isStepDone(checkpoint, variantStep(vSuffix, 'subtitles'))
        ) {
          const loaded = loadSubtitlesFromDisk(dir, vSuffix);
          subtitleCues = loaded.cues;
          wordCues = loaded.wordCues;
          report(
            'subtitles',
            progressLo + 2,
            `Resume — loaded subtitles (${variantLabel})`,
          );
        } else {
          report('subtitles', progressLo + 2, `Subtitles (${variantLabel})...`);
          const subtitleSections = syncSectionDurationsFromAudio(
            script.sections,
            effectiveNarrationSec,
          );
          const subtitleDir = path.join(dir, 'subtitles', vSuffix);
          const written = writeSubtitles(subtitleSections, subtitleDir, {
            templateId: templateId || getDocumentaryTemplate().id,
            introOffsetSec: introGraphicSec,
            audioDurationSec: effectiveNarrationSec,
          });
          subtitleCues = written.cues;
          wordCues = written.wordCues;
          markStep(dir, variantStep(vSuffix, 'subtitles'));
          checkpoint = loadCheckpoint(dir);
        }
        project.subtitleCues = subtitleCues;
        project.wordCues = wordCues;

        if (walkthrough) {
          fs.writeFileSync(
            path.join(dir, 'timeline', 'walkthrough.json'),
            JSON.stringify(walkthrough, null, 2),
          );
        }

        let videoPath = remotionPath;
        fs.mkdirSync(path.dirname(videoPath), { recursive: true });

        if (resume && isStepDone(checkpoint, variantStep(vSuffix, 'remotion')) && (await verifyVideoFile(remotionPath))) {
          report(
            'remotion',
            progressLo + 8,
            `Resume — using saved Remotion video (${variantLabel})`,
          );
        } else {
        report(
          'remotion',
          progressLo + 5,
          `Remotion render (${variantLabel}) — can take several minutes…`,
        );
        const remotionProps = buildRemotionProps({
          ...project,
          timeline,
          walkthrough,
          subtitleCues,
          wordCues,
        });
        const remotionProgressSpan = Math.max(8, (progressHi - progressLo) * 0.55);
        try {
          await renderRemotionPreview(remotionProps, videoPath, {
            publicDir,
            compositionId,
            renderJob,
            preservePublicDir: resume,
            fastRender: Boolean(options.fastRender),
            onProgress: ({ pct, elapsedSec, renderedFrames }) => {
              const sub = progressLo + 5 + (remotionProgressSpan * pct) / 100;
              const frameNote =
                renderedFrames != null ? ` · ${renderedFrames} frames` : '';
              report(
                'remotion',
                Math.min(progressHi - 2, sub),
                `Remotion ${pct}% (${elapsedSec}s${frameNote}) — ${variantLabel}`,
              );
            },
          });
          markStep(dir, variantStep(vSuffix, 'remotion'));
          checkpoint = loadCheckpoint(dir);
        } catch (err) {
          if (err instanceof RenderCancelledError || renderJob.cancelled) {
            throw err;
          }
          console.warn(
            `[Pipeline] Remotion failed (${variant.key}), falling back to MoviePy:`,
            err.message,
          );
          this._assertNotCancelled(projectId);
          report('moviepy', progressLo + 8, `MoviePy (${variantLabel})...`);
          const moviepyScenes = await prepareMoviePyScenes(timeline.scenes);
          if (!moviepyScenes.length) {
            throw new Error(
              'No valid media clips for MoviePy — check scraped/downloaded assets',
            );
          }
          const moviepyConfig = {
            scenes: moviepyScenes,
            ...(combinedPath ? { audio: combinedPath } : {}),
            output: path.join(dir, 'renders', `moviepy-${variant.suffix}.mp4`),
            fps: 30,
            resolution: variant.preset,
          };
          fs.writeFileSync(
            path.join(dir, `moviepy-config-${variant.suffix}.json`),
            JSON.stringify(moviepyConfig, null, 2),
          );
          videoPath = path.join(dir, 'renders', `moviepy-${variant.suffix}.mp4`);
          await runMoviePyPipeline(
            path.join(dir, `moviepy-config-${variant.suffix}.json`),
            (p) =>
              report(
                'moviepy',
                progressLo + 8 + p * 0.12,
                `MoviePy (${variantLabel})...`,
              ),
            renderJob,
          );
        }
        }

        if (!(await verifyVideoFile(videoPath))) {
          throw new Error(`Video render failed (${variant.key}) — output invalid`);
        }

        const theme = resolveVisualTheme(getDocumentaryTemplate(templateId));
        const musicVolume =
          options.musicVolume ??
          options.ducking ??
          theme?.musicDuckLevel ??
          defaultMusicVolume();

        if (musicPath && vi === 0) {
          project.backgroundMusic = {
            path: musicPath,
            filename: path.basename(musicPath),
            volume: musicVolume,
          };
          fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
        }

        const encodeTarget = variant.splitShorts
          ? path.join(dir, 'renders', `export-${variant.suffix}.${exportFormat}`)
          : path.join(exportDir, `${slug}-${exportTs}-${variant.key}.${exportFormat}`);

        let ffmpegDone = false;
        if (resume && isStepDone(checkpoint, variantStep(vSuffix, 'ffmpeg'))) {
          if (variant.splitShorts) {
            const existingShorts = fs
              .readdirSync(exportDir)
              .filter((f) => f.includes('-short-') && f.endsWith(`.${exportFormat}`))
              .map((f) => path.join(exportDir, f))
              .sort();
            if (existingShorts.length) {
              shortsOutputPaths.push(...existingShorts);
              allOutputPaths.push(...existingShorts);
              ffmpegDone = true;
            }
          } else if (fs.existsSync(encodeTarget) && (await verifyVideoFile(encodeTarget))) {
            fullOutputPaths.push(encodeTarget);
            allOutputPaths.push(encodeTarget);
            ffmpegDone = true;
          }
        }

        if (!ffmpegDone) {
        report(
          'ffmpeg',
          progressHi - 4,
          variant.splitShorts
            ? `Export Shorts 9:16 (${variantLabel})...`
            : musicPath
              ? `Export ${variantLabel} (mix audio)...`
              : `Export ${variantLabel}...`,
        );
        fs.mkdirSync(path.dirname(encodeTarget), { recursive: true });

        if (videoOnly) {
          await exportVideoOnly({
            videoPath,
            outputPath: encodeTarget,
            preset: variant.preset,
            cinematic: true,
            musicPath,
            ducking: musicVolume,
          });
        } else {
          await exportDocumentary({
            videoPath,
            narrationPath: combinedPath,
            outputPath: encodeTarget,
            preset: variant.preset,
            musicPath,
            ducking: musicVolume,
            cinematic: true,
          });
        }

        if (variant.splitShorts) {
          this._assertNotCancelled(projectId);
          report(
            'shorts',
            progressHi - 1,
            `Splitting Shorts (≤${shortsMaxSec}s each)...`,
          );
          const shortBase = `${slug}-${exportTs}-short`;
          const parts = await splitVideoIntoShortParts(
            encodeTarget,
            exportDir,
            shortBase,
            shortsMaxSec,
          );
          try {
            fs.unlinkSync(encodeTarget);
          } catch {
            /* temp vertical master */
          }
          shortsOutputPaths.push(...parts);
          allOutputPaths.push(...parts);
        } else {
          fullOutputPaths.push(encodeTarget);
          allOutputPaths.push(encodeTarget);
        }
        markStep(dir, variantStep(vSuffix, 'ffmpeg'));
        checkpoint = loadCheckpoint(dir);
        } else {
          report('ffmpeg', progressHi - 4, `Resume — export already done (${variantLabel})`);
          if (variant.splitShorts && shortsOutputPaths.length) {
            /* kept from prior run */
          } else if (fs.existsSync(encodeTarget)) {
            fullOutputPaths.push(encodeTarget);
            allOutputPaths.push(encodeTarget);
          }
        }
      }

      if (includeShorts) {
        project.shortsMaxDurationSec = shortsMaxSec;
        project.shortsPartCount = shortsOutputPaths.length;
      }
      if (fullOutputPaths.length) {
        project.fullOutputPath = fullOutputPaths[0];
      }
      if (shortsOutputPaths.length) {
        project.shortsOutputPaths = shortsOutputPaths;
      }

      project.status = 'completed';
      project.outputPath = allOutputPaths[0];
      project.outputPaths = allOutputPaths;
      project.completedAt = new Date().toISOString();

      let doneMessage = 'Export complete!';
      if (exportFullAndShorts && fullOutputPaths.length && shortsOutputPaths.length) {
        doneMessage = `Export complete — full video + ${shortsOutputPaths.length} Short part${shortsOutputPaths.length === 1 ? '' : 's'}`;
      } else if (shortsOutputPaths.length) {
        doneMessage = `Export complete — ${shortsOutputPaths.length} Short${shortsOutputPaths.length === 1 ? '' : 's'} ready`;
      }

      report('done', 100, doneMessage);
      clearCheckpoint(dir);
      project.canResume = false;
      project.resumeAvailable = false;
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));

      return project;
    } catch (err) {
      if (err instanceof RenderCancelledError || renderJob.cancelled) {
        project.status = 'cancelled';
        project.stage = 'cancelled';
        project.message = 'Render stopped';
        project.cancelledAt = new Date().toISOString();
        delete project.error;
        fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
        return project;
      }
      project.status = 'failed';
      project.error = err.message;
      project.canResume = true;
      project.resumeAvailable = true;
      saveCheckpoint(dir, {
        failedAt: new Date().toISOString(),
        failedStage: project.stage,
        failedMessage: err.message,
      });
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
      throw err;
    } finally {
      this.jobs.delete(projectId);
    }
  }
}
