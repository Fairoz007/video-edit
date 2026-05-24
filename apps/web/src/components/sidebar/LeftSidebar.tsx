import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Image,
  LayoutTemplate,
  Music,
  Captions,
  Settings,
  Film,
  X,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { ProjectsPanel } from '../panels/ProjectsPanel';
import { MediaLibraryPanel } from '../panels/MediaLibraryPanel';
import { TemplatesPanel } from '../panels/TemplatesPanel';
import { MusicPanel } from '../panels/MusicPanel';
import { SubtitlesPanel } from '../panels/SubtitlesPanel';
import { useUiStore, type LeftPanelId } from '../../hooks/useUiStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const NAV = [
  { id: 'projects', label: 'Projects', icon: FolderOpen, panel: ProjectsPanel },
  { id: 'media', label: 'Media', icon: Image, panel: MediaLibraryPanel },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, panel: TemplatesPanel },
  { id: 'music', label: 'Music', icon: Music, panel: MusicPanel },
  { id: 'subtitles', label: 'Subtitles', icon: Captions, panel: SubtitlesPanel },
  { id: 'settings', label: 'Settings', icon: Settings, panel: null },
] as const;

interface Props {
  overlay?: boolean;
}

export function LeftSidebar({ overlay }: Props) {
  const bp = useBreakpoint();
  const {
    activeLeftPanel,
    leftPanelOpen,
    mobilePanel,
    setMobilePanel,
    closeMobilePanels,
    toggleLeftPanel,
    setActiveLeftPanel,
  } = useUiStore();
  const ActivePanel = NAV.find((n) => n.id === activeLeftPanel)?.panel ?? ProjectsPanel;

  const showPanel = overlay ? mobilePanel === 'left' : leftPanelOpen;
  const isMobile = bp === 'mobile';

  if (overlay && !showPanel) {
    return null;
  }

  const openPanel = (id: LeftPanelId) => {
    setActiveLeftPanel(id);
    if (overlay) setMobilePanel('left');
    else if (!leftPanelOpen) toggleLeftPanel();
  };

  if (!overlay && !leftPanelOpen) {
    return (
      <motion.nav
        className="glass-nav w-[52px] flex flex-col items-center py-3 gap-1 shrink-0 my-2 ml-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <button type="button" onClick={toggleLeftPanel} className="btn-icon mb-1" title="Expand library">
          <Film className="w-4 h-4 text-forge-glow" />
        </button>
        {NAV.slice(0, 5).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => {
              toggleLeftPanel();
              setActiveLeftPanel(id);
            }}
            className="btn-icon p-2.5"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </motion.nav>
    );
  }

  return (
    <div
      className={`flex gap-2 shrink-0 h-full py-2 pl-2 z-40 ${
        overlay && !showPanel ? 'relative' : overlay ? 'absolute left-0 top-0 bottom-0' : 'relative'
      }`}
    >
      <motion.nav
        className="glass-nav w-[76px] flex flex-col items-stretch py-3 px-1.5 gap-0.5 shrink-0"
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <div className="mb-3 mx-auto w-10 h-10 rounded-xl accent-gradient flex items-center justify-center shadow-glow-sm">
          <Film className="w-4 h-4 text-white" />
        </div>

        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = activeLeftPanel === id && showPanel;
          return (
            <motion.button
              key={id}
              type="button"
              title={label}
              onClick={() => openPanel(id)}
              className={`relative min-h-[54px] px-1 py-2 rounded-studio-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                isActive ? 'nav-item-active' : 'text-forge-muted hover:text-forge-text-secondary'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Icon className="w-[18px] h-[18px] relative z-10" />
              <span className="text-[9px] font-semibold leading-none relative z-10 tracking-wide">
                {label}
              </span>
            </motion.button>
          );
        })}

        {!isMobile && !overlay && (
          <button type="button" onClick={toggleLeftPanel} className="btn-icon mt-auto mx-auto" title="Collapse">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </motion.nav>

      <AnimatePresence mode="wait">
        {showPanel && (
          <motion.aside
            key={activeLeftPanel}
            initial={{ width: 0, opacity: 0, x: overlay ? -16 : 0 }}
            animate={{ width: overlay ? 300 : 268, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: overlay ? -16 : 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel-elevated overflow-hidden flex flex-col min-h-0 max-h-full w-[min(300px,calc(100vw-5rem))]"
          >
            {overlay && (
              <div className="panel-header shrink-0 py-2.5">
                <span className="panel-title">
                  {NAV.find((n) => n.id === activeLeftPanel)?.label}
                </span>
                <button type="button" onClick={closeMobilePanels} className="btn-icon p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {!overlay && (
              <div className="panel-header shrink-0 py-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-forge-glow" />
                  <span className="panel-title">{NAV.find((n) => n.id === activeLeftPanel)?.label}</span>
                </div>
              </div>
            )}
            <motion.div className="p-4 flex-1 overflow-y-auto flex flex-col min-h-0">
              {activeLeftPanel === 'settings' ? (
                <p className="text-sm text-forge-text-secondary text-center py-10 leading-relaxed">
                  Open the inspector on the right for documentary settings, voice, and export options.
                </p>
              ) : (
                <ActivePanel />
              )}
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
