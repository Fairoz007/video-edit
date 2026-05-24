import type React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Undo2,
  Redo2,
  Save,
  Upload,
  Share2,
  Cloud,
  Minus,
  Square,
  X,
  Film,
  Pencil,
  PanelLeft,
  PanelRight,
  PanelLeftClose,
  PanelRightClose,
} from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline } from '../../hooks/useDocumentaryPipeline';
import { useUiStore } from '../../hooks/useUiStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export function TopToolbar() {
  const { script, status, progress, input, outputPath } = useProjectStore();
  const { startRenderFlow, saveProject } = useDocumentaryPipeline();
  const { toggleLeftPanel, toggleRightPanel, setMobilePanel, leftPanelOpen, rightPanelOpen } =
    useUiStore();
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
      className="h-[52px] shrink-0 flex items-center gap-3 px-3 sm:px-4 border-b border-forge-border/80 bg-forge-surface/60 backdrop-blur-xl relative z-20"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-forge-border-accent/40 to-transparent pointer-events-none"
        aria-hidden
      />

      <motion.div
        className="flex items-center gap-2.5 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {bp !== 'desktop' && (
          <button
            type="button"
            onClick={() => {
              if (bp === 'mobile') setMobilePanel('left');
              else toggleLeftPanel();
            }}
            className="btn-icon"
            aria-label="Projects panel"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        {bp === 'desktop' && (
          <button
            type="button"
            onClick={toggleLeftPanel}
            className="btn-icon hidden lg:flex"
            aria-label={leftPanelOpen ? 'Collapse library' : 'Expand library'}
          >
            {leftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
        )}
        <motion.div
          className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shadow-glow-sm"
          whileHover={{ scale: 1.04 }}
        >
          <Film className="w-4 h-4 text-white" />
        </motion.div>
        <motion.div className="hidden md:block">
          <span className="text-sm font-bold tracking-tight">
            <span className="text-gradient">Docu</span>
            <span className="text-forge-text">Forge</span>
          </span>
          <p className="text-[10px] text-forge-muted uppercase tracking-[0.16em] -mt-0.5 hidden lg:block font-semibold">
            Production Studio
          </p>
        </motion.div>
      </motion.div>

      <div
        className="flex-1 flex justify-center min-w-0 px-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-studio-lg glass-toolbar max-w-lg hover:border-forge-border-accent/40 transition-all group min-w-0 w-full sm:w-auto shadow-glow-sm"
        >
          <span className="text-sm font-semibold text-forge-text truncate">{title}</span>
          <Pencil className="w-3 h-3 text-forge-muted group-hover:text-forge-glow shrink-0 hidden sm:block transition-colors" />
          <ChevronDown className="w-3.5 h-3.5 text-forge-muted shrink-0 hidden sm:block" />
        </button>
      </div>

      <motion.div
        className="flex items-center gap-1 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="hidden md:flex items-center gap-0.5 mr-1 pr-2 border-r border-forge-border/60">
          <button type="button" className="btn-icon" aria-label="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button type="button" className="btn-icon" aria-label="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <motion.div
          className="hidden lg:flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/8"
          animate={saved ? {} : { opacity: [1, 0.7, 1] }}
          transition={{ repeat: saved ? 0 : Infinity, duration: 1.2 }}
        >
          <Cloud className={`w-3.5 h-3.5 ${saved ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-xs font-medium text-emerald-400/90">
            {saved ? 'Autosaved' : 'Saving…'}
          </span>
        </motion.div>

        {isRendering && (
          <div className="hidden sm:flex items-center gap-2 mr-2 px-2.5 py-1 rounded-lg bg-forge-accent/10 border border-forge-border-accent ai-pulse-badge">
            <div className="w-16 h-1 rounded-full bg-black/40 overflow-hidden">
              <motion.div className="h-full accent-gradient" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-mono text-forge-glow tabular-nums">{progress}%</span>
          </div>
        )}

        <button
          type="button"
          className="btn-ghost hidden sm:flex items-center gap-1.5 text-xs"
          onClick={() => saveProject()}
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>

        <button type="button" className="btn-secondary hidden md:flex items-center gap-1.5 text-xs py-2">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        <motion.button
          type="button"
          className="btn-primary-glow flex items-center gap-1.5 text-xs py-2 px-3.5"
          onClick={openExport}
          disabled={isRendering}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{outputPath ? 'Open export' : 'Export'}</span>
        </motion.button>

        {bp === 'desktop' && (
          <button
            type="button"
            onClick={toggleRightPanel}
            className="btn-icon hidden xl:flex"
            aria-label={rightPanelOpen ? 'Collapse inspector' : 'Expand inspector'}
          >
            {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </button>
        )}

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

        <div className="hidden sm:flex gap-0.5 ml-1 pl-2 border-l border-forge-border/60 text-forge-muted">
          <button type="button" className="p-1.5 hover:text-forge-text rounded-lg hover:bg-white/5 transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <button type="button" className="p-1.5 hover:text-forge-text rounded-lg hover:bg-white/5 transition-colors">
            <Square className="w-3 h-3" />
          </button>
          <button type="button" className="p-1.5 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </header>
  );
}
