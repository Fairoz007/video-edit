import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { VideoPreview } from '../preview/VideoPreview';
import { Timeline } from '../timeline/Timeline';
import { RenderProgress } from '../render/RenderProgress';
import { TopicInput } from '../input/TopicInput';
import { WorkflowStepper } from '../workflow/WorkflowStepper';
import { useUiStore } from '../../hooks/useUiStore';

export function CenterWorkspace() {
  const { sourcePanelOpen, toggleSourcePanel } = useUiStore();

  return (
    <motion.div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden px-3 pb-3 pt-2 gap-3">
      <motion.div className="shrink-0">
        <WorkflowStepper />
      </motion.div>

      <motion.div className="flex-1 min-h-0 overflow-hidden">
        <VideoPreview />
      </motion.div>

      <motion.section className="shrink-0 flex flex-col">
        <button
          type="button"
          onClick={toggleSourcePanel}
          className="w-full flex items-center justify-between px-3 py-2 rounded-t-studio-lg rounded-b-none studio-panel-elevated border-b-0 text-left group"
        >
          <span className="section-label">Source & Generation</span>
          <span className="flex items-center gap-1.5 text-xs text-forge-muted group-hover:text-forge-text-secondary">
            {sourcePanelOpen ? 'Collapse' : 'Expand'}
            {sourcePanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {sourcePanelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <TopicInput embedded />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.div className="shrink-0">
        <Timeline />
      </motion.div>

      <motion.div className="shrink-0">
        <RenderProgress />
      </motion.div>
    </motion.div>
  );
}
