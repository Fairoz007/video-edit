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
} from 'lucide-react';
import { ProjectsPanel } from '../panels/ProjectsPanel';
import { MediaLibraryPanel } from '../panels/MediaLibraryPanel';
import { TemplatesPanel } from '../panels/TemplatesPanel';
import { MusicPanel } from '../panels/MusicPanel';
import { SubtitlesPanel } from '../panels/SubtitlesPanel';
import { UserProfile } from './UserProfile';
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
  } =
    useUiStore();
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
        className="glass-nav w-12 flex flex-col items-center py-3 gap-1 shrink-0 my-3 ml-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <button type="button" onClick={toggleLeftPanel} className="btn-icon" title="Expand library">
          <Film className="w-4 h-4 text-forge-glow" />
        </button>
        {NAV.slice(0, 4).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => {
              toggleLeftPanel();
              setActiveLeftPanel(id);
            }}
            className="btn-icon p-2"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </motion.nav>
    );
  }

  return (
    <div
      className={`flex gap-2 shrink-0 h-full py-3 pl-3 z-40 ${
        overlay && !showPanel ? 'relative' : overlay ? 'absolute left-0 top-0 bottom-0' : 'relative'
      }`}
    >
      <motion.nav
        className="glass-nav w-[88px] flex flex-col items-stretch py-3 px-2 gap-1 shrink-0"
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <div className="mb-2 mx-auto w-9 h-9 rounded-studio accent-gradient flex items-center justify-center">
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
              className={`relative min-h-[52px] px-2 py-2 rounded-studio transition-colors duration-200 flex flex-col items-center justify-center gap-1 ${
                isActive ? 'text-forge-text bg-white/[0.08]' : 'text-forge-muted hover:text-forge-text-secondary hover:bg-white/[0.04]'
              }`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-forge-accent"
                />
              )}
              <Icon className="w-[18px] h-[18px] relative z-10" />
              <span className="text-[10px] font-semibold leading-none relative z-10">{label}</span>
            </motion.button>
          );
        })}

        {!isMobile && !overlay && (
          <button type="button" onClick={toggleLeftPanel} className="btn-icon mt-auto" title="Collapse">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {!isMobile && <UserProfile />}
      </motion.nav>

      <AnimatePresence mode="wait">
        {showPanel && (
          <motion.aside
            key={activeLeftPanel}
            initial={{ width: 0, opacity: 0, x: overlay ? -16 : 0 }}
            animate={{ width: overlay ? 300 : 260, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: overlay ? -16 : 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="studio-panel overflow-hidden flex flex-col min-h-0 max-h-full w-[min(300px,calc(100vw-4.5rem))]"
          >
            {overlay && (
              <motion.div className="flex items-center justify-between px-4 py-3 border-b border-forge-border shrink-0">
                <span className="text-label-sm text-forge-text-secondary">
                  {NAV.find((n) => n.id === activeLeftPanel)?.label}
                </span>
                <button type="button" onClick={closeMobilePanels} className="btn-icon p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
            {!overlay && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border shrink-0">
                <span className="text-sm font-semibold text-forge-text">
                  {NAV.find((n) => n.id === activeLeftPanel)?.label}
                </span>
              </div>
            )}
            <motion.div className="p-4 flex-1 overflow-y-auto flex flex-col min-h-0">
              {activeLeftPanel === 'settings' ? (
                <p className="text-sm text-forge-text-secondary text-center py-8">
                  Open the inspector panel on the right for project settings.
                </p>
              ) : (
                <ActivePanel />
              )}
            </motion.div>
            {isMobile && (
              <div className="p-3 border-t border-forge-border">
                <UserProfile />
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
