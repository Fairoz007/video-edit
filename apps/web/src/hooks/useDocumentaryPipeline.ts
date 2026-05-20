import { useCallback } from 'react';
import axios from 'axios';
import {
  api,
  buildTimeline,
  createProject,
  extractKeywords,
  generateScript,
  getProject,
  scrapeUrlFull,
  startRender,
} from '../utils/api';
import { normalizeMediaList } from '../utils/mediaUrl';
import { isValidHttpUrl, normalizeHttpUrlInput } from '../utils/urls';
import { useProjectStore } from './useProjectStore';

export type InputTab = 'topic' | 'article' | 'youtube' | 'script';

function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.error;
    if (typeof msg === 'string') return msg;
    if (err.code === 'ERR_NETWORK') return 'Backend not reachable. Run npm run dev:backend.';
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

export function useDocumentaryPipeline() {
  const store = useProjectStore();

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
      if (typeof project.id === 'string') store.setProjectId(project.id);
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

  const loadProject = useCallback(
    async (id: string) => {
      store.setError(null);
      try {
        const { data } = await getProject(id);
        hydrateProject(data as Record<string, unknown>);
      } catch (err) {
        store.setError(formatApiError(err));
      }
    },
    [hydrateProject, store],
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
          });
          store.setTimeline(timeline);
          if (timeline.sections?.length) {
            store.setScript({ ...script, sections: timeline.sections });
          }
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
          const { editMode } = useProjectStore.getState().input;
          const { data: timeline } = await buildTimeline({
            script,
            media,
            audioTracks: [],
            editMode: editMode || 'with-narration',
          });
          store.setTimeline(timeline);
          if (timeline.sections?.length) {
            store.setScript({ ...script, sections: timeline.sections });
          }
        }

        return `Scraped ${media.length} asset(s) from "${title}"`;
      } catch (e) {
        store.setError(formatApiError(e));
        return null;
      }
    },
    [validateInput, normalizedInput, store],
  );

  const startRenderFlow = useCallback(async () => {
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
    store.setProgress(0, 'queued', 'Starting render pipeline…');

    try {
      const input = normalizedInput();
      const { voiceSettings, exportOptions, projectId } = useProjectStore.getState();
      const editMode = input.editMode || 'with-narration';
      const { data } = await startRender({
        projectId: projectId || undefined,
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
      });
      store.setProjectId(data.projectId);
    } catch (e) {
      store.setStatus('failed');
      store.setError(formatApiError(e));
    }
  }, [validateInput, normalizedInput, store]);

  const saveProject = useCallback(async () => {
    store.setError(null);
    try {
      const { projectId, input } = useProjectStore.getState();
      if (projectId) {
        await api.put(`/projects/${projectId}`, { input: normalizedInput() });
        return;
      }
      const { data } = await createProject(normalizedInput());
      store.setProjectId(data.id);
    } catch (e) {
      store.setError(formatApiError(e));
    }
  }, [normalizedInput, store]);

  return {
    validateInput,
    generateScriptFlow,
    scrapeMediaFlow,
    startRenderFlow,
    loadProject,
    saveProject,
    hydrateProject,
  };
}
