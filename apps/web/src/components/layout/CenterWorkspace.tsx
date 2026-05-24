import { AnimatePresence, motion } from 'framer-motion';
import {
  Captions,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Image,
  LayoutTemplate,
  Music,
  Settings,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { VideoPreview } from '../preview/VideoPreview';
import { ProjectOverview } from '../preview/ProjectOverview';
import { Timeline } from '../timeline/Timeline';
import { RenderProgress } from '../render/RenderProgress';
import { TopicInput } from '../input/TopicInput';
import { WorkflowStepper } from '../workflow/WorkflowStepper';
import { useBreakpoint } from '../../hooks/useBreakpoint';
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
  { id: 'scenes', label: 'Scenes', icon: Sparkles },
];

function WorkspaceTabs() {
  const bp = useBreakpoint();
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
      className="glass-toolbar shrink-0 flex items-center gap-1 px-2 py-1.5 overflow-x-auto"
      aria-label="Workspace"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        type="button"
        onClick={() => setSourcePanelOpen(true)}
        className="quick-action text-forge-glow border-forge-border-accent quick-action-active"
      >
        <Wand2 className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Source</span>
      </button>

      <span className="h-5 w-px bg-forge-border/80 shrink-0 mx-0.5" />

      {LEFT_ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => openLeft(id)}
          title={label}
          className={`quick-action border-transparent ${
            activeLeftPanel === id ? 'quick-action-active' : 'text-forge-text-secondary hover:text-forge-text'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{label}</span>
        </button>
      ))}

      <span className="h-5 w-px bg-forge-border/80 shrink-0 mx-0.5 ml-auto" />

      {RIGHT_ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => openRight(id)}
          title={label}
          className={`quick-action border-transparent ${
            activeRightPanel === id ? 'quick-action-active' : 'text-forge-text-secondary hover:text-forge-text'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
    </motion.nav>
  );
}

export function CenterWorkspace() {
  const { sourcePanelOpen, toggleSourcePanel } = useUiStore();

  return (
    <motion.div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden px-3 pb-2 pt-2 gap-2.5">
      <motion.div className="shrink-0">
        <WorkflowStepper />
      </motion.div>

      <WorkspaceTabs />

      <motion.div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_min(272px,26%)] gap-3 overflow-hidden">
        <div className="min-h-0 min-w-0 flex flex-col">
          <VideoPreview />
        </div>
        <ProjectOverview className="hidden xl:flex" />
      </motion.div>

      <motion.section className="shrink-0 flex flex-col">
        <button
          type="button"
          onClick={toggleSourcePanel}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-t-studio-lg glass-panel border-b-0 text-left group hover:border-forge-border-accent/30 transition-colors"
        >
          <span className="section-label">Source & generation</span>
          <span className="flex items-center gap-1.5 text-xs text-forge-muted group-hover:text-forge-glow transition-colors">
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
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden glass-panel rounded-t-none border-t-0"
            >
              <TopicInput embedded />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.div className="shrink-0 min-h-[220px]">
        <Timeline />
      </motion.div>

      <motion.div className="shrink-0">
        <RenderProgress />
      </motion.div>
    </motion.div>
  );
}
