import { useEffect, useRef } from 'react';
import { getRenderStatus } from '../utils/api';
import { useProjectStore } from './useProjectStore';

export function useRenderPolling(projectId: string | null, enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const { setProgress, setStatus, setOutputPath } = useProjectStore();

  useEffect(() => {
    if (!projectId || !enabled) return;

    const poll = async () => {
      try {
        const { data } = await getRenderStatus(projectId);
        setProgress(data.progress || 0, data.stage || '', data.message || '');
        if (data.status === 'completed') {
          setStatus('completed');
          setOutputPath(data.outputPath || null);
          clearInterval(intervalRef.current);
        } else if (data.status === 'failed') {
          setStatus('failed');
          clearInterval(intervalRef.current);
        }
      } catch {
        /* backend may still be starting */
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);
    return () => clearInterval(intervalRef.current);
  }, [projectId, enabled, setProgress, setStatus, setOutputPath]);
}
