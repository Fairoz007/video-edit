import type React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Undo2,
  Redo2,
  Save,
  Upload,
  Sparkles,
  Share2,
  Cloud,
  Minus,
  Square,
  X,
  Film,
  Pencil,
  PanelLeft,
  PanelRight,
} from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline } from '../../hooks/useDocumentaryPipeline';
import { useUiStore } from '../../hooks/useUiStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';
export function TopToolbar() {
  const { script, status, progress, input, outputPath } = useProjectStore();
  const { startRenderFlow, saveProject } = useDocumentaryPipeline();
  const { toggleLeftPanel, toggleRightPanel, setMobilePanel } = useUiStore();
  const bp = useBreakpoint();
  const title = script?.topic || input.topic || 'Untitled Documentary';
  const isRendering = status === 'rendering';
  const saved = status !== 'generating' && status !== 'rendering';

  const openExport = () => {
    if (outputPath) window.docuforge?.showItemInFolder(outputPath);
    else startRenderFlow();
  };

  return (
    <header
      className="h-11 sm:h-12 shrink-0 flex items-center gap-2 sm:gap-3 px-2 sm:px-4 border-b border-forge-border/60 bg-black/50 backdrop-blur-xl"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-2 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {bp !== 'desktop' && (
          <button type="button" onClick={toggleLeftPanel} className="btn-icon" aria-label="Projects panel">
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        <motion.div
          className="w-8 h-8 rounded-xl accent-gradient flex items-center justify-center shadow-glow-sm"
          animate={{ boxShadow: ['0 0 16px rgba(99,102,241,0.3)', '0 0 24px rgba(168,85,247,0.4)', '0 0 16px rgba(99,102,241,0.3)'] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Film className="w-4 h-4 text-white" />
        </motion.div>
        <div className="hidden md:block">
          <span className="text-sm font-bold tracking-tight">
            <span className="text-gradient">Docu</span>
            <span className="text-white">Forge</span>
          </span>
          <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] -mt-0.5 hidden lg:block">
            Documentary Studio
          </p>
        </div>
      </div>

      <div
        className="flex-1 flex justify-center min-w-0 px-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          className="flex items-center gap-2 px-2 sm:px-4 py-1.5 rounded-xl glass-nav max-w-full hover:border-forge-border-bright transition-all group min-w-0"
        >
          <span className="text-xs sm:text-sm font-medium text-white truncate">{title}</span>
          <Pencil className="w-3 h-3 text-gray-600 group-hover:text-forge-glow shrink-0 hidden sm:block" />
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0 hidden sm:block" />
        </button>
      </div>

      <motion.div
        className="flex items-center gap-0.5 sm:gap-1 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <motion.div className="hidden md:flex items-center gap-0.5 mr-1 pr-2 border-r border-forge-border/50">
          <button type="button" className="btn-icon" aria-label="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button type="button" className="btn-icon" aria-label="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
        </motion.div>

        <div className="hidden lg:flex items-center gap-1.5 mr-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Cloud className={`w-3 h-3 ${saved ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
          <span className="text-[10px] font-medium text-emerald-400/90">{saved ? 'Saved' : 'Saving…'}</span>
        </div>

        {isRendering && (
          <div className="hidden sm:flex items-center gap-2 mr-1 px-2 py-1 rounded-lg bg-forge-accent/10 border border-forge-accent/30">
            <div className="w-12 h-1 rounded-full bg-black/40 overflow-hidden">
              <motion.div className="h-full accent-gradient" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-mono text-forge-glow">{progress}%</span>
          </div>
        )}

        <button type="button" className="btn-ghost hidden sm:flex items-center gap-1.5 text-xs" onClick={() => saveProject()}>
          <Save className="w-3.5 h-3.5" />
          Save
        </button>

        <button
          type="button"
          className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-2 sm:px-3"
          onClick={openExport}
          disabled={isRendering}
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{outputPath ? 'Open Export' : 'Export'}</span>
        </button>

        {bp !== 'desktop' && (
          <button
            type="button"
            onClick={() => {
              if (bp === 'tablet') toggleRightPanel();
              else setMobilePanel('right');
            }}
            className="btn-icon xl:hidden"
            aria-label="Inspector"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}

        <button type="button" className="btn-icon hidden md:flex" aria-label="Share">
          <Share2 className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex gap-0.5 ml-1 pl-2 border-l border-forge-border/40 text-gray-500">
          <button type="button" className="p-1.5 hover:text-white rounded-lg hover:bg-white/5">
            <Minus className="w-3 h-3" />
          </button>
          <button type="button" className="p-1.5 hover:text-white rounded-lg hover:bg-white/5">
            <Square className="w-3 h-3" />
          </button>
          <button type="button" className="p-1.5 hover:text-red-400 rounded-lg hover:bg-red-500/10">
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </header>
  );
}
