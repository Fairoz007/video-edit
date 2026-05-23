import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Layers, Scan, Sparkles, Rocket, X, ChevronRight } from 'lucide-react';
import { DocumentarySettings } from '../settings/DocumentarySettings';
import { VoiceSettings } from '../settings/VoiceSettings';
import { MusicControls } from '../settings/MusicControls';
import { ExportSettings } from '../settings/ExportSettings';
import { AIEnhancementTools } from '../settings/AIEnhancementTools';
import { ScenesPanel } from '../panels/ScenesPanel';
import { InspectorPanel } from '../panels/InspectorPanel';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline } from '../../hooks/useDocumentaryPipeline';
import { isVideoOnlyEditMode } from '../../utils/timelineSync';
import { useUiStore, type RightPanelId } from '../../hooks/useUiStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const TABS = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'scenes', label: 'Scenes', icon: Layers },
  { id: 'inspector', label: 'Inspector', icon: Scan },
  { id: 'ai', label: 'AI', icon: Sparkles },
] as const;

interface Props {
  overlay?: boolean;
}

export function RightSidebar({ overlay }: Props) {
  const { status, exportOptions, voiceSettings, input } = useProjectStore();
  const { startRenderFlow } = useDocumentaryPipeline();
  const videoOnly = isVideoOnlyEditMode(input.editMode);
  const {
    activeRightPanel,
    rightPanelOpen,
    mobilePanel,
    closeMobilePanels,
    setMobilePanel,
    toggleRightPanel,
    setActiveRightPanel,
  } =
    useUiStore();
  const bp = useBreakpoint();

  const showPanel = overlay ? mobilePanel === 'right' : rightPanelOpen;
  const selectTab = (id: RightPanelId) => {
    setActiveRightPanel(id);
    if (overlay) setMobilePanel('right');
    else if (!rightPanelOpen) toggleRightPanel();
  };

  if (!showPanel && !overlay) {
    return (
      <motion.nav
        className="hidden xl:flex flex-col items-center py-3 pr-3 gap-1 shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <button type="button" onClick={toggleRightPanel} className="glass-nav btn-icon p-2.5" title="Inspector">
          <ChevronRight className="w-4 h-4" />
        </button>
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => {
              toggleRightPanel();
              setActiveRightPanel(id);
            }}
            className="glass-nav btn-icon p-2.5"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </motion.nav>
    );
  }

  if (!showPanel && overlay) {
    return null;
  }

  const panel = (
    <div className="studio-panel flex flex-col flex-1 min-h-0 overflow-hidden h-full">
      <div className="flex border-b border-forge-border px-2 py-2 gap-1 shrink-0">
        {overlay && (
          <button type="button" onClick={closeMobilePanels} className="btn-icon p-2 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`flex-1 min-w-[64px] flex items-center justify-center gap-1.5 py-2 px-2 rounded-studio transition-all text-[10px] font-semibold uppercase tracking-wide ${
              activeRightPanel === id
                ? 'bg-white/[0.08] text-forge-text border border-forge-border-strong'
                : 'text-forge-muted hover:text-forge-text-secondary hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden 2xl:inline">{label}</span>
          </button>
        ))}
        {!overlay && (
          <button type="button" onClick={toggleRightPanel} className="btn-icon shrink-0" title="Collapse">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <AnimatePresence mode="wait">
          {activeRightPanel === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <DocumentarySettings />
              {!videoOnly && <VoiceSettings />}
              <MusicControls />
              <ExportSettings />
            </motion.div>
          )}
          {activeRightPanel === 'scenes' && (
            <motion.div key="scenes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScenesPanel />
            </motion.div>
          )}
          {activeRightPanel === 'inspector' && (
            <motion.div key="inspector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InspectorPanel />
            </motion.div>
          )}
          {activeRightPanel === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AIEnhancementTools />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div className="p-4 border-t border-forge-border shrink-0 bg-forge-surface/50">
        <motion.button
          type="button"
          onClick={() => startRenderFlow()}
          disabled={status === 'rendering'}
          className="w-full py-3 rounded-studio accent-gradient font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Rocket className="w-4 h-4" />
          {status === 'rendering' ? 'Rendering...' : 'Render documentary'}
        </motion.button>
        <p className="text-[10px] text-center text-forge-muted mt-2">
          {videoOnly ? 'Video only' : `${voiceSettings.rate} WPM`} | {input.videoStyle || 'documentary'} |{' '}
          {exportOptions.preset}
        </p>
      </motion.div>
    </div>
  );

  if (overlay) {
    return (
      <AnimatePresence>
        {showPanel && (
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute right-0 top-0 bottom-0 z-40 w-[min(100%,300px)] py-3 pr-3 pl-1 flex flex-col"
          >
            {panel}
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      className="hidden xl:flex w-[272px] shrink-0 flex-col py-3 pr-3 min-h-0"
      initial={{ x: 12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      {panel}
    </motion.aside>
  );
}

export function RightSidebarCompact() {
  const bp = useBreakpoint();
  const { mobilePanel, setMobilePanel } = useUiStore();
  if (bp !== 'tablet') return null;

  return (
    <button
      type="button"
      onClick={() => setMobilePanel(mobilePanel === 'right' ? 'none' : 'right')}
      className="fixed right-4 bottom-28 z-20 p-3 rounded-full accent-gradient shadow-card"
      title="Inspector"
    >
      <Settings className="w-5 h-5 text-white" />
    </button>
  );
}
