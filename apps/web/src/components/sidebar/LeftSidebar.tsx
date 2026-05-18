import { useState } from 'react';
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
} from 'lucide-react';
import { ProjectsPanel } from '../panels/ProjectsPanel';
import { MediaLibraryPanel } from '../panels/MediaLibraryPanel';
import { TemplatesPanel } from '../panels/TemplatesPanel';
import { MusicPanel } from '../panels/MusicPanel';
import { SubtitlesPanel } from '../panels/SubtitlesPanel';
import { UserProfile } from './UserProfile';
import { useUiStore } from '../../hooks/useUiStore';
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
  const [active, setActive] = useState<string>('projects');
  const bp = useBreakpoint();
  const { leftPanelOpen, mobilePanel, setMobilePanel, closeMobilePanels } = useUiStore();
  const ActivePanel = NAV.find((n) => n.id === active)?.panel ?? ProjectsPanel;

  const showPanel = overlay ? mobilePanel === 'left' : leftPanelOpen;
  const isMobile = bp === 'mobile';

  const openPanel = (id: string) => {
    setActive(id);
    if (overlay) setMobilePanel('left');
  };

  return (
    <div
      className={`flex gap-2 shrink-0 h-full py-2 pl-2 z-40 ${
        overlay && !showPanel ? 'relative' : overlay ? 'absolute left-0 top-0 bottom-0' : 'relative'
      }`}
    >
      <motion.nav
        className="glass-nav w-[52px] flex flex-col items-center py-3 gap-1 shrink-0"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <motion.div
          className="mb-3 w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shadow-glow-sm"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Film className="w-4 h-4 text-white" />
        </motion.div>

        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id && showPanel;
          return (
            <motion.button
              key={id}
              type="button"
              title={label}
              onClick={() => openPanel(id)}
              className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 rounded-xl bg-forge-accent/25 border border-forge-border-bright shadow-glow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-[18px] h-[18px] relative z-10" />
            </motion.button>
          );
        })}

        {!isMobile && <UserProfile />}
      </motion.nav>

      <AnimatePresence mode="wait">
        {showPanel && (
          <motion.aside
            key={active}
            initial={{ width: 0, opacity: 0, x: overlay ? -20 : 0 }}
            animate={{ width: overlay ? 280 : 248, opacity: 1, x: 0 }}
            className="glass-panel-float overflow-hidden flex flex-col min-h-0 max-h-full shadow-float w-[min(280px,calc(100vw-4.5rem))] xl:w-[248px]"
            exit={{ width: 0, opacity: 0, x: overlay ? -20 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {overlay && (
              <div className="flex items-center justify-between px-3 py-2 border-b border-forge-border/40 shrink-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {NAV.find((n) => n.id === active)?.label}
                </span>
                <button type="button" onClick={closeMobilePanels} className="btn-icon p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <motion.div className="p-3 flex-1 overflow-y-auto flex flex-col min-h-0">
              {active === 'settings' ? (
                <div className="text-center py-8">
                  <Settings className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Open the right inspector for settings</p>
                </div>
              ) : (
                <ActivePanel />
              )}
            </motion.div>
            {isMobile && (
              <div className="p-2 border-t border-forge-border/40">
                <UserProfile />
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
