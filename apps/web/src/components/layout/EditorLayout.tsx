import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LeftSidebar } from '../sidebar/LeftSidebar';
import { RightSidebar, RightSidebarCompact } from '../sidebar/RightSidebar';
import { CenterWorkspace } from './CenterWorkspace';
import { StatusBanner } from '../ui/StatusBanner';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useUiStore } from '../../hooks/useUiStore';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useRenderPolling } from '../../hooks/useRenderPolling';

export function EditorLayout() {
  const bp = useBreakpoint();
  const { projectId, status, outputPath } = useProjectStore();
  const { mobilePanel, syncLayout, closeMobilePanels } = useUiStore();
  const isMobile = bp === 'mobile';

  useRenderPolling(projectId, status === 'rendering');

  useEffect(() => {
    syncLayout(bp);
  }, [bp, syncLayout]);

  return (
    <motion.div className="flex flex-col h-full min-h-0 relative">
      <StatusBanner />

      <div className="flex flex-1 min-h-0 relative">
        {(isMobile || bp === 'tablet') && mobilePanel !== 'none' && (
          <button
            type="button"
            className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm"
            aria-label="Close panel"
            onClick={closeMobilePanels}
          />
        )}

        <LeftSidebar overlay={isMobile} />
        <CenterWorkspace />
        <RightSidebar overlay={bp !== 'desktop'} />
        <RightSidebarCompact />
      </div>
    </motion.div>
  );
}
