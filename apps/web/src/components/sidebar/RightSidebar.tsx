import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Layers, Scan, Sparkles, Rocket, X } from 'lucide-react';
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
import { useUiStore } from '../../hooks/useUiStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const TABS = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'scenes', label: 'Scenes', icon: Layers },
  { id: 'inspector', label: 'Inspector', icon: Scan },
  { id: 'ai', label: 'AI Tools', icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface Props {
  overlay?: boolean;
}

export function RightSidebar({ overlay }: Props) {
  const [tab, setTab] = useState<TabId>('settings');
  const { status, exportOptions, voiceSettings, input } = useProjectStore();
  const { startRenderFlow } = useDocumentaryPipeline();
  const videoOnly = isVideoOnlyEditMode(input.editMode);
  const { rightPanelOpen, mobilePanel, closeMobilePanels, setMobilePanel } = useUiStore();
  const bp = useBreakpoint();

  const showPanel = overlay ? mobilePanel === 'right' : rightPanelOpen;

  if (!showPanel && !overlay) {
    return null;
  }

  if (!showPanel && overlay) {
    return null;
  }

  const panel = (
    <div className="glass-panel-float flex flex-col flex-1 min-h-0 overflow-hidden h-full">
      <div className="flex border-b border-forge-border/40 p-1 gap-0.5 shrink-0">
        {overlay && (
          <button type="button" onClick={closeMobilePanels} className="btn-icon p-2 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all ${
              tab === id
                ? 'bg-forge-accent/20 text-forge-glow border border-forge-border-bright/40'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="text-[8px] font-bold uppercase tracking-wide hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        <AnimatePresence mode="wait">
          {tab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="space-y-3"
            >
              <DocumentarySettings />
              {!videoOnly && <VoiceSettings />}
              <MusicControls />
              <ExportSettings />
            </motion.div>
          )}
          {tab === 'scenes' && (
            <motion.div key="scenes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScenesPanel />
            </motion.div>
          )}
          {tab === 'inspector' && (
            <motion.div key="inspector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InspectorPanel />
            </motion.div>
          )}
          {tab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AIEnhancementTools />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div className="p-3 border-t border-forge-border/40 shrink-0">
        <motion.button
          type="button"
          onClick={() => startRenderFlow()}
          disabled={status === 'rendering'}
          className="w-full py-3.5 rounded-xl accent-gradient font-bold text-sm flex items-center justify-center gap-2 shadow-glow relative overflow-hidden disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Rocket className="w-4 h-4 relative z-10" />
          <span className="relative z-10">
            {status === 'rendering' ? 'Rendering…' : 'Render Documentary'}
          </span>
        </motion.button>
        <p className="text-[9px] text-center text-gray-600 mt-2">
          {videoOnly ? 'video only' : `${voiceSettings.rate} WPM`} · {input.videoStyle || 'documentary'}{' '}
          · {exportOptions.preset}
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
            className="absolute right-0 top-0 bottom-0 z-40 w-[min(100%,320px)] py-2 pr-2 pl-1 flex flex-col"
          >
            {panel}
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      className="hidden xl:flex w-[min(300px,28vw)] shrink-0 flex-col py-2 pr-2 min-h-0"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      {panel}
    </motion.aside>
  );
}

/** Compact settings strip for tablet (md–xl) */
export function RightSidebarCompact() {
  const bp = useBreakpoint();
  const { mobilePanel, setMobilePanel } = useUiStore();
  if (bp !== 'tablet') return null;

  return (
    <button
      type="button"
      onClick={() => setMobilePanel(mobilePanel === 'right' ? 'none' : 'right')}
      className="fixed right-3 bottom-24 z-20 p-3 rounded-full accent-gradient shadow-glow"
      title="Inspector"
    >
      <Settings className="w-5 h-5 text-white" />
    </button>
  );
}
