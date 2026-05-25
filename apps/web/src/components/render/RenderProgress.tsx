import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline } from '../../hooks/useDocumentaryPipeline';
import { CheckCircle, AlertCircle, Loader2, RotateCcw, Square } from 'lucide-react';

const STAGES = [
  'script',
  'keywords',
  'media',
  'narration',
  'subtitles',
  'timeline',
  'moviepy',
  'remotion',
  'ffmpeg',
  'shorts',
  'done',
];

export function RenderProgress() {
  const { progress, stage, message, status, outputPath, outputPaths, projectId, canResume } =
    useProjectStore();
  const { cancelRenderFlow, restartRenderFlow, resumeRenderFlow } = useDocumentaryPipeline();
  const showResume =
    Boolean(projectId) &&
    canResume &&
    status !== 'completed' &&
    (status === 'idle' || status === 'failed' || stage === 'remotion' || stage === 'cancelled');
  const stageIndex = STAGES.indexOf(stage);
  const isRendering = status === 'rendering';
  const wasStopped = stage === 'cancelled' && status === 'idle';

  if (status === 'idle' && progress === 0 && !wasStopped) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="studio-panel p-4 shrink-0"
      >
        <div className="flex items-center gap-2.5 mb-3">
          {status === 'completed' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : status === 'failed' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : wasStopped ? (
            <Square className="w-4 h-4 text-amber-400" />
          ) : (
            <Loader2 className="w-4 h-4 text-forge-accent animate-spin" />
          )}
          <span className="text-sm font-medium text-forge-text">{message || 'Processing…'}</span>
          {!wasStopped && (
            <span className="text-xs text-forge-glow ml-auto font-mono font-semibold tabular-nums">
              {progress}%
            </span>
          )}
        </div>

        {(isRendering || wasStopped || status === 'failed') && (
          <div className="flex gap-2 mb-3">
            {isRendering && (
              <button
                type="button"
                onClick={() => cancelRenderFlow()}
                className="flex-1 py-2 px-3 rounded-studio text-xs font-semibold border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                Stop render
              </button>
            )}
            {showResume && (
              <button
                type="button"
                onClick={() => resumeRenderFlow()}
                className="flex-1 py-2 px-3 rounded-studio text-xs font-semibold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resume
              </button>
            )}
            <button
              type="button"
              onClick={() => restartRenderFlow()}
              className="flex-1 py-2 px-3 rounded-studio text-xs font-semibold border border-forge-border-accent text-forge-glow hover:bg-forge-accent/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isRendering ? 'Restart' : 'Render again'}
            </button>
          </div>
        )}

        <div className="h-1.5 bg-forge-surface rounded-full overflow-hidden border border-forge-border">
          <motion.div
            className="h-full accent-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex gap-1 mt-3 flex-wrap">
          {STAGES.map((s, i) => (
            <span
              key={s}
              className={`text-[9px] px-2 py-0.5 rounded-md font-medium uppercase tracking-wide ${
                i <= stageIndex
                  ? 'bg-forge-accent/15 text-forge-glow border border-forge-border-accent'
                  : 'bg-forge-surface text-forge-muted border border-forge-border'
              }`}
            >
              {s}
            </span>
          ))}
        </div>

        {outputPath && status === 'completed' && (
          <div className="mt-3 space-y-1">
            {outputPaths && outputPaths.length > 1 && (
              <p className="text-[10px] text-emerald-400/90">
                {outputPaths.some((p) => /-full\./i.test(p))
                  ? `Full video + ${outputPaths.filter((p) => /-short-/i.test(p)).length || outputPaths.length - 1} Short part(s)`
                  : `${outputPaths.length} export file(s) ready`}
              </p>
            )}
            <button
              type="button"
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
              onClick={() => window.docuforge?.showItemInFolder(outputPath)}
            >
              Open export folder →
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
