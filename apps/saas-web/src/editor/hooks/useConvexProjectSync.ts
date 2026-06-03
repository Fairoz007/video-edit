'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@docuforge/convex/_generated/api';
import type { Id } from '@docuforge/convex/_generated/dataModel';
import { normalizeMediaList } from '../utils/mediaUrl';
import { useProjectStore } from './useProjectStore';

function mapConvexStatus(
  status: string,
  progress: number,
  outputPath?: string | null,
): 'idle' | 'generating' | 'rendering' | 'completed' | 'failed' {
  if (status === 'completed' || outputPath) return 'completed';
  if (status === 'failed') return 'failed';
  if (status === 'generating') return 'generating';
  if (status === 'rendering' || (progress > 0 && progress < 100)) return 'rendering';
  return 'idle';
}

export function useConvexProjectSync(convexProjectId: Id<'projects'> | undefined) {
  const doc = useQuery(
    api.projects.getDocument,
    convexProjectId ? { projectId: convexProjectId } : 'skip',
  );
  const updateProject = useMutation(api.projects.update);
  const hydrating = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!convexProjectId) return;
    useProjectStore.getState().setConvexProjectId(convexProjectId);
  }, [convexProjectId]);

  useEffect(() => {
    if (!doc) return;
    hydrating.current = true;
    const store = useProjectStore.getState();
    store.setConvexProjectId(convexProjectId!);
    if (typeof doc.id === 'string' && doc.id !== convexProjectId) {
      store.setLegacyProjectId(doc.id);
    }
    if (doc.input && typeof doc.input === 'object') {
      store.setInput(doc.input as typeof store.input);
    }
    if (doc.script) store.setScript(doc.script as typeof store.script);
    if (doc.keywords) store.setKeywords(doc.keywords as typeof store.keywords);
    if (Array.isArray(doc.media)) store.setMedia(normalizeMediaList(doc.media));
    if (doc.timeline) store.setTimeline(doc.timeline as typeof store.timeline);
    if (typeof doc.outputPath === 'string') store.setOutputPath(doc.outputPath);
    store.setProgress(doc.progress ?? 0, doc.stage ?? '', doc.message ?? '');
    store.setStatus(mapConvexStatus(String(doc.status), doc.progress ?? 0, doc.outputPath));
    if (doc.error) store.setError(String(doc.error));
    hydrating.current = false;
  }, [doc, convexProjectId]);

  useEffect(() => {
    if (!convexProjectId) return;

    const unsub = useProjectStore.subscribe((state, prev) => {
      if (hydrating.current) return;
      if (
        state.input === prev.input &&
        state.script === prev.script &&
        state.keywords === prev.keywords &&
        state.media === prev.media &&
        state.timeline === prev.timeline &&
        state.progress === prev.progress &&
        state.stage === prev.stage &&
        state.message === prev.message &&
        state.status === prev.status &&
        state.outputPath === prev.outputPath
      ) {
        return;
      }

      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const s = useProjectStore.getState();
        const convexStatus =
          s.status === 'idle' ? 'draft' : s.status === 'generating' ? 'generating' : s.status;

        updateProject({
          projectId: convexProjectId,
          patch: {
            input: s.input,
            script: s.script ?? undefined,
            keywords: s.keywords ?? undefined,
            media: s.media,
            timeline: s.timeline ?? undefined,
            progress: s.progress,
            stage: s.stage,
            message: s.message,
            status: convexStatus as 'draft' | 'generating' | 'rendering' | 'completed' | 'failed',
            outputPath: s.outputPath ?? undefined,
            voiceSettings: s.voiceSettings,
            exportOptions: s.exportOptions,
            legacyLocalId: s.legacyProjectId ?? undefined,
          },
        }).catch(() => {});
      }, 800);
    });

    return () => {
      clearTimeout(saveTimer.current);
      unsub();
    };
  }, [convexProjectId, updateProject]);

  return { doc, loading: convexProjectId !== undefined && doc === undefined };
}
