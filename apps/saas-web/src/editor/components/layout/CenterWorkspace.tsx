import { AnimatePresence, motion } from 'framer-motion';
import {
  Captions,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  FolderOpen,
  Image,
  Layers,
  LayoutTemplate,
  Music,
  PanelRight,
  Settings,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { VideoPreview } from '../preview/VideoPreview';
import { Timeline } from '../timeline/Timeline';
import { RenderProgress } from '../render/RenderProgress';
import { TopicInput } from '../input/TopicInput';
import { WorkflowStepper } from '../workflow/WorkflowStepper';
import { useDocumentaryPipeline } from '../../hooks/useDocumentaryPipeline';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useUiStore, type LeftPanelId, type RightPanelId } from '../../hooks/useUiStore';

const LEFT_ACTIONS: Array<{ id: LeftPanelId; label: string; icon: typeof FolderOpen }> = [
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'subtitles', label: 'Subtitles', icon: Captions },
];

const RIGHT_ACTIONS: Array<{ id: RightPanelId; label: string; icon: typeof Settings }> = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'scenes', label: 'Scenes', icon: Layers },
  { id: 'inspector', label: 'Inspector', icon: PanelRight },
  { id: 'ai', label: 'AI tools', icon: Sparkles },
];

function QuickAccessBar() {
  const bp = useBreakpoint();
  const { status } = useProjectStore();
  const { startRenderFlow } = useDocumentaryPipeline();
  const {
    activeLeftPanel,
    activeRightPanel,
    setActiveLeftPanel,
    setActiveRightPanel,
    setLeftPanelOpen,
    setRightPanelOpen,
    setMobilePanel,
    setSourcePanelOpen,
  } = useUiStore();

  const isMobile = bp === 'mobile';

  const openLeft = (id: LeftPanelId) => {
    setActiveLeftPanel(id);
    if (isMobile) setMobilePanel('left');
    else setLeftPanelOpen(true);
  };

  const openRight = (id: RightPanelId) => {
    setActiveRightPanel(id);
    if (bp === 'desktop') setRightPanelOpen(true);
    else setMobilePanel('right');
  };

  return (
    <motion.nav
      className="shrink-0 flex flex-wrap items-center gap-2 rounded-studio-lg border border-forge-border bg-forge-surface/70 px-2 py-2"
      aria-label="Quick access"
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        type="button"
        onClick={() => setSourcePanelOpen(true)}
        className="quick-action text-forge-text bg-white/[0.08] border-forge-border-strong"
      >
        <Wand2 className="w-4 h-4" />
        Source
      </button>

      {LEFT_ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => openLeft(id)}
          className={`quick-action ${
            activeLeftPanel === id
              ? 'text-forge-text bg-white/[0.08] border-forge-border-strong'
              : 'text-forge-text-secondary border-transparent hover:text-forge-text hover:bg-white/[0.05]'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}

      <span className="h-7 w-px bg-forge-border shrink-0" />

      {RIGHT_ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => openRight(id)}
          className={`quick-action ${
            activeRightPanel === id
              ? 'text-forge-text bg-white/[0.08] border-forge-border-strong'
              : 'text-forge-text-secondary border-transparent hover:text-forge-text hover:bg-white/[0.05]'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}

      <button
        type="button"
        onClick={() => startRenderFlow()}
        disabled={status === 'rendering'}
        className="quick-action sm:ml-auto accent-gradient text-white border-transparent disabled:opacity-50"
      >
        <Clapperboard className="w-4 h-4" />
        {status === 'rendering' ? 'Rendering...' : 'Render'}
      </button>
    </motion.nav>
  );
}

export function CenterWorkspace() {
  const { sourcePanelOpen, toggleSourcePanel } = useUiStore();

  return (
    <motion.div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden px-3 pb-3 pt-2 gap-3">
      <motion.div className="shrink-0">
        <WorkflowStepper />
      </motion.div>

      <QuickAccessBar />

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
