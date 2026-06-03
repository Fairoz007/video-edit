'use client';

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
  script?: Parameters<ReturnType<typeof useProjectStore.getState>['setScript']>[0];
  keywords?: { keywords: string[] };
  media?: unknown[];
  timeline?: Parameters<ReturnType<typeof useProjectStore.getState>['setTimeline']>[0];
  input?: DocumentaryInput;
  error?: string;
}

/** Poll Express render worker while legacy project is rendering. */
export function useRenderPolling(legacyProjectId: string | null, enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!legacyProjectId || !enabled) return;

    const poll = async () => {
      const {
        setProgress,
        setStatus,
        setOutputPath,
        setScript,
        setKeywords,
        setMedia,
        setTimeline,
        setInput,
        setError,
      } = useProjectStore.getState();

      try {
        const { data } = await getRenderStatus(legacyProjectId);
        const doc = data as ProjectJson;

        setProgress(doc.progress || 0, doc.stage || '', doc.message || '');
        if (doc.script) setScript(doc.script);
        if (doc.keywords) setKeywords(doc.keywords);
        if (Array.isArray(doc.media)) setMedia(normalizeMediaList(doc.media));
        if (doc.timeline) setTimeline(doc.timeline);
        if (doc.input) setInput(doc.input);

        if (doc.outputPath) {
          setOutputPath(doc.outputPath);
          setStatus('completed');
        } else if (doc.status === 'failed' || doc.error) {
          setStatus('failed');
          setError(doc.error || 'Render failed');
        } else if (doc.status === 'cancelled') {
          setStatus('idle');
        } else if ((doc.progress ?? 0) >= 100 || doc.stage === 'done') {
          setStatus('completed');
        }
      } catch {
        /* backend may be restarting */
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);
    return () => clearInterval(intervalRef.current);
  }, [legacyProjectId, enabled]);
}
