'use client';

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import axios from 'axios';
import { api as convexApi } from '@docuforge/convex/_generated/api';
import {
  api,
  buildTimeline,
  extractKeywords,
  generateScript,
  restartRender,
  scrapeUrlFull,
  cancelRender,
  startRender,
  syncProjectToLegacy,
  type DocumentaryInput,
  type TimelineResult,
} from '../utils/api';
import { normalizeMediaList } from '../utils/mediaUrl';
import { isValidHttpUrl, normalizeHttpUrlInput } from '../utils/urls';
import { useProjectStore } from './useProjectStore';

export type InputTab = 'topic' | 'article' | 'youtube' | 'script';

function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.error;
    if (typeof msg === 'string') return msg;
    if (err.code === 'ERR_NETWORK') {
      return 'Render API not reachable. Run npm run dev:web or set NEXT_PUBLIC_API_URL.';
    }
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

function applyTimelineToStore(
  store: ReturnType<typeof useProjectStore.getState>,
  script: NonNullable<ReturnType<typeof useProjectStore.getState>['script']>,
  timeline: TimelineResult,
) {
  store.setTimeline(timeline);
  if (timeline.sections?.length) {
    store.setScript({ ...script, sections: timeline.sections });
  }
}

function buildLegacyPayload(state: ReturnType<typeof useProjectStore.getState>, legacyId: string) {
  return {
    id: legacyId,
    input: state.input,
    script: state.script,
    keywords: state.keywords,
    media: state.media,
    timeline: state.timeline,
    status: state.status === 'idle' ? 'draft' : state.status,
    progress: state.progress,
    stage: state.stage,
    message: state.message,
    outputPath: state.outputPath,
    voiceSettings: state.voiceSettings,
    exportOptions: state.exportOptions,
    createdAt: new Date().toISOString(),
  };
}

export function useDocumentaryPipeline() {
  const store = useProjectStore();
  const updateConvex = useMutation(convexApi.projects.update);

  const ensureLegacyProjectId = useCallback(async (): Promise<string> => {
    const state = useProjectStore.getState();
    if (state.legacyProjectId) return state.legacyProjectId;

    const legacyId = crypto.randomUUID();
    await syncProjectToLegacy(legacyId, buildLegacyPayload(state, legacyId));

    if (state.convexProjectId) {
      await updateConvex({
        projectId: state.convexProjectId,
        patch: { legacyLocalId: legacyId },
      });
    }

    store.setLegacyProjectId(legacyId);
    return legacyId;
  }, [store, updateConvex]);

  const validateInput = useCallback(
    (tab: InputTab): string | null => {
      if (tab === 'script') {
        if (!store.input.scriptText?.trim()) {
          return 'Upload a .txt script or paste content from the demo template.';
        }
        return null;
      }
      if (tab === 'topic') {
        if (!store.input.topic?.trim()) return 'Enter a documentary topic.';
        return null;
      }
      const url = tab === 'article' ? store.input.articleUrl : store.input.youtubeUrl;
      if (!url?.trim()) return `Enter a ${tab === 'article' ? 'article' : 'YouTube'} URL.`;
      if (!isValidHttpUrl(url)) return 'Enter a valid http:// or https:// URL.';
      return null;
    },
    [store.input],
  );

  const normalizedInput = useCallback(
    () => ({
      ...store.input,
      articleUrl: normalizeHttpUrlInput(store.input.articleUrl),
      youtubeUrl: normalizeHttpUrlInput(store.input.youtubeUrl),
    }),
    [store.input],
  );

  const hydrateProject = useCallback(
    (project: Record<string, unknown>) => {
      if (project.input && typeof project.input === 'object') {
        store.setInput(project.input as typeof store.input);
      }
      if (project.script) store.setScript(project.script as typeof store.script);
      if (project.keywords) store.setKeywords(project.keywords as typeof store.keywords);
      if (Array.isArray(project.media)) store.setMedia(normalizeMediaList(project.media));
      if (project.timeline) store.setTimeline(project.timeline as typeof store.timeline);
      if (typeof project.id === 'string') store.setLegacyProjectId(project.id);
      if (typeof project.outputPath === 'string') store.setOutputPath(project.outputPath);
      if (typeof project.progress === 'number') {
        store.setProgress(
          project.progress,
          String(project.stage || ''),
          String(project.message || ''),
        );
      }
      const st = project.status as string;
      const prog = typeof project.progress === 'number' ? project.progress : 0;
      if (st === 'completed' || project.stage === 'done' || project.outputPath) {
        store.setStatus('completed');
      } else if (st === 'failed') store.setStatus('failed');
      else if (prog > 0 && prog < 100) store.setStatus('rendering');
      else store.setStatus('idle');
    },
    [store],
  );

  const generateScriptFlow = useCallback(
    async (tab: InputTab) => {
      const err = validateInput(tab);
      if (err) {
        store.setError(err);
        return;
      }
      store.setError(null);
      store.setStatus('generating');
      try {
        const input = normalizedInput();
        const { data: script } = await generateScript(input);
        store.setScript(script);
        store.setInput({ topic: script.topic || input.topic });
        const { data: kw } = await extractKeywords({
          text: script.fullNarration,
          topic: input.topic || script.topic,
          articleUrl: input.articleUrl,
          youtubeUrl: input.youtubeUrl,
        });
        store.setKeywords(kw);

        if (store.media.length > 0) {
          const { data: timeline } = await buildTimeline({
            script,
            media: store.media,
            audioTracks: [],
            editMode: input.editMode || 'with-narration',
            templateId: input.templateId,
          });
          applyTimelineToStore(store, script, timeline);
        }
        store.setStatus('idle');
      } catch (e) {
        store.setStatus('failed');
        store.setError(formatApiError(e));
      }
    },
    [validateInput, normalizedInput, store],
  );

  const scrapeMediaFlow = useCallback(
    async (tab: InputTab): Promise<string | null> => {
      if (tab === 'topic') {
        store.setError('Switch to Article URL or YouTube to scrape media.');
        return null;
      }
      const err = validateInput(tab);
      if (err) {
        store.setError(err);
        return null;
      }
      const sourceUrl =
        tab === 'article' ? normalizedInput().articleUrl : normalizedInput().youtubeUrl;
      if (!sourceUrl) return null;

      store.setError(null);
      try {
        const { data } = await scrapeUrlFull(sourceUrl, store.input.topic);
        const media = normalizeMediaList(data.media || []);
        store.setMedia(media);
        const title = data.content?.title || 'Page';
        if (!store.input.topic && data.content?.title) {
          store.setInput({ topic: data.content.title.slice(0, 80) });
        }

        const script = useProjectStore.getState().script;
        if (script) {
          const { editMode, templateId } = useProjectStore.getState().input;
          const { data: timeline } = await buildTimeline({
            script,
            media,
            audioTracks: [],
            editMode: editMode || 'with-narration',
            templateId,
          });
          applyTimelineToStore(store, script, timeline);
        }

        return `Scraped ${media.length} asset(s) from "${title}"`;
      } catch (e) {
        store.setError(formatApiError(e));
        return null;
      }
    },
    [validateInput, normalizedInput, store],
  );

  const cancelRenderFlow = useCallback(async () => {
    const legacyId = useProjectStore.getState().legacyProjectId;
    if (!legacyId) {
      store.setStatus('idle');
      store.setProgress(0, '', '');
      return;
    }
    try {
      await cancelRender(legacyId);
      store.setStatus('idle');
      store.setProgress(0, 'cancelled', 'Render stopped');
      store.setError(null);
    } catch (e) {
      store.setError(formatApiError(e));
    }
  }, [store]);

  const runRender = useCallback(
    async (restart: boolean) => {
      const state = useProjectStore.getState();
      if (!state.script) {
        const tab: InputTab = state.input.scriptText?.trim()
          ? 'script'
          : state.input.youtubeUrl
            ? 'youtube'
            : state.input.articleUrl
              ? 'article'
              : 'topic';
        const err = validateInput(tab);
        if (err) {
          store.setError(err);
          return;
        }
      }

      store.setError(null);
      store.setStatus('rendering');
      store.setProgress(0, 'queued', restart ? 'Restarting render…' : 'Starting render pipeline…');

      try {
        const legacyId = await ensureLegacyProjectId();
        await syncProjectToLegacy(legacyId, buildLegacyPayload(useProjectStore.getState(), legacyId));

        const input = normalizedInput();
        const { voiceSettings, exportOptions } = useProjectStore.getState();
        const editMode = input.editMode || 'with-narration';
        const payload = {
          projectId: legacyId,
          input: {
            ...input,
            editMode,
            voice: voiceSettings.voice,
            rate: voiceSettings.rate,
            pitch: voiceSettings.pitch,
          },
          options: {
            ...exportOptions,
            editMode,
            videoOnly: editMode === 'video-only',
            voice: voiceSettings.voice,
            rate: voiceSettings.rate,
            pitch: voiceSettings.pitch,
          },
        };

        const { data } = restart ? await restartRender(payload) : await startRender(payload);
        store.setLegacyProjectId(data.projectId);
      } catch (e) {
        store.setStatus('failed');
        store.setError(formatApiError(e));
      }
    },
    [validateInput, normalizedInput, store, ensureLegacyProjectId],
  );

  const startRenderFlow = useCallback(() => runRender(false), [runRender]);
  const restartRenderFlow = useCallback(() => runRender(true), [runRender]);

  const rebuildTimelineFlow = useCallback(
    async (inputOverrides?: Partial<DocumentaryInput>) => {
      const state = useProjectStore.getState();
      const input = { ...state.input, ...inputOverrides };
      if (!state.script || state.media.length === 0) return false;
      if (input.videoStyle === 'walkthrough') return false;

      store.setError(null);
      try {
        const { data: timeline } = await buildTimeline({
          script: state.script,
          media: state.media,
          audioTracks: [],
          editMode: input.editMode || 'with-narration',
          templateId: input.templateId,
        });
        applyTimelineToStore(store, state.script, timeline);
        return true;
      } catch (e) {
        store.setError(formatApiError(e));
        return false;
      }
    },
    [store],
  );

  const saveProject = useCallback(async () => {
    store.setError(null);
    try {
      await ensureLegacyProjectId();
      const state = useProjectStore.getState();
      if (state.legacyProjectId) {
        await syncProjectToLegacy(
          state.legacyProjectId,
          buildLegacyPayload(state, state.legacyProjectId),
        );
      }
    } catch (e) {
      store.setError(formatApiError(e));
    }
  }, [store, ensureLegacyProjectId]);

  return {
    validateInput,
    generateScriptFlow,
    scrapeMediaFlow,
    startRenderFlow,
    cancelRenderFlow,
    restartRenderFlow,
    rebuildTimelineFlow,
    saveProject,
    hydrateProject,
    ensureLegacyProjectId,
  };
}
