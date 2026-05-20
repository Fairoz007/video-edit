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
      className="h-12 shrink-0 flex items-center gap-3 px-3 sm:px-4 border-b border-forge-border bg-forge-surface/90 backdrop-blur-xl"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <motion.div
        className="flex items-center gap-2.5 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {bp !== 'desktop' && (
          <button type="button" onClick={toggleLeftPanel} className="btn-icon" aria-label="Projects panel">
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
        <motion.div className="w-8 h-8 rounded-studio accent-gradient flex items-center justify-center">
          <Film className="w-4 h-4 text-white" />
        </motion.div>
        <motion.div className="hidden md:block">
          <span className="text-sm font-bold tracking-tight">
            <span className="text-gradient">Docu</span>
            <span className="text-forge-text">Forge</span>
          </span>
          <p className="text-[10px] text-forge-muted uppercase tracking-[0.18em] -mt-0.5 hidden lg:block">
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
          className="flex items-center gap-2 px-4 py-2 rounded-studio bg-forge-panel border border-forge-border max-w-md hover:border-forge-border-strong transition-colors group min-w-0 w-full sm:w-auto"
        >
          <span className="text-sm font-medium text-forge-text truncate">{title}</span>
          <Pencil className="w-3 h-3 text-forge-muted group-hover:text-forge-text-secondary shrink-0 hidden sm:block" />
          <ChevronDown className="w-3.5 h-3.5 text-forge-muted shrink-0 hidden sm:block" />
        </button>
      </div>

      <motion.div
        className="flex items-center gap-1 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="hidden md:flex items-center gap-0.5 mr-1 pr-2 border-r border-forge-border">
          <button type="button" className="btn-icon" aria-label="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button type="button" className="btn-icon" aria-label="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <motion.div className="hidden lg:flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded-studio bg-emerald-500/10 border border-emerald-500/15">
          <Cloud className={`w-3.5 h-3.5 ${saved ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
          <span className="text-xs font-medium text-emerald-400/90">{saved ? 'Saved' : 'Saving…'}</span>
        </motion.div>

        {isRendering && (
          <div className="hidden sm:flex items-center gap-2 mr-2 px-2.5 py-1 rounded-studio bg-forge-accent/10 border border-forge-border-accent">
            <motion.div className="w-14 h-1 rounded-full bg-black/40 overflow-hidden">
              <motion.div className="h-full accent-gradient" style={{ width: `${progress}%` }} />
            </motion.div>
            <span className="text-xs font-mono text-forge-glow tabular-nums">{progress}%</span>
          </div>
        )}

        <button type="button" className="btn-ghost hidden sm:flex items-center gap-1.5 text-xs" onClick={() => saveProject()}>
          <Save className="w-3.5 h-3.5" />
          Save
        </button>

        <button
          type="button"
          className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3"
          onClick={openExport}
          disabled={isRendering}
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{outputPath ? 'Open Export' : 'Export'}</span>
        </button>

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

        {(bp !== 'desktop') && (
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

        <div className="hidden sm:flex gap-0.5 ml-1 pl-2 border-l border-forge-border text-forge-muted">
          <button type="button" className="p-1.5 hover:text-forge-text rounded-studio hover:bg-white/5">
            <Minus className="w-3 h-3" />
          </button>
          <button type="button" className="p-1.5 hover:text-forge-text rounded-studio hover:bg-white/5">
            <Square className="w-3 h-3" />
          </button>
          <button type="button" className="p-1.5 hover:text-red-400 rounded-studio hover:bg-red-500/10">
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </header>
  );
}
