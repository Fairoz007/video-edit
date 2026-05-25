import { useEffect, useRef } from 'react';
import { getRenderStatus } from '../utils/api';
import { normalizeMediaList } from '../utils/mediaUrl';
import { useProjectStore } from './useProjectStore';
import type { DocumentaryInput } from '../utils/api';

interface ProjectJson {
  status?: string;
  progress?: number;
  stage?: string;
  message?: string;
  outputPath?: string;
  outputPaths?: string[];
  canResume?: boolean;
  script?: Parameters<ReturnType<typeof useProjectStore.getState>['setScript']>[0];
  keywords?: { keywords: string[] };
  media?: unknown[];
  timeline?: Parameters<ReturnType<typeof useProjectStore.getState>['setTimeline']>[0];
  input?: DocumentaryInput;
  error?: string;
}

export function useRenderPolling(projectId: string | null, enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!projectId || !enabled) return;

    const poll = async () => {
      const {
        setProgress,
        setStatus,
        setOutputPath,
        setOutputPaths,
        setScript,
        setKeywords,
        setMedia,
        setTimeline,
        setError,
        setCanResume,
      } = useProjectStore.getState();

      try {
        const { data } = await getRenderStatus(projectId);

        setProgress(data.progress || 0, data.stage || '', data.message || '');
        if (data.script) setScript(data.script);
        if (data.keywords) setKeywords(data.keywords);
        if (Array.isArray(data.media)) setMedia(normalizeMediaList(data.media));
        if (data.timeline) setTimeline(data.timeline);
        // Do not overwrite documentary/export choices while rendering — server project.json is stale.
        if (typeof data.canResume === 'boolean') setCanResume(data.canResume);

        if (Array.isArray(data.outputPaths) && data.outputPaths.length) {
          setOutputPaths(data.outputPaths);
        } else if (data.outputPath) {
          setOutputPath(data.outputPath);
        }

        const done =
          data.status === 'completed' ||
          data.stage === 'done' ||
          Boolean(data.outputPath);

        if (done) {
          setStatus('completed');
          setError(null);
          clearInterval(intervalRef.current);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setError(data.error || data.message || 'Render failed');
          clearInterval(intervalRef.current);
        } else if (data.status === 'cancelled' || data.stage === 'cancelled') {
          setStatus('idle');
          setProgress(0, 'cancelled', data.message || 'Render stopped');
          setError(null);
          clearInterval(intervalRef.current);
        } else {
          setStatus('rendering');
        }
      } catch {
        /* backend may still be starting */
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);
    return () => clearInterval(intervalRef.current);
  }, [projectId, enabled]);
}
