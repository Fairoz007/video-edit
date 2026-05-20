import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../hooks/useProjectStore';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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
  'done',
];

export function RenderProgress() {
  const { progress, stage, message, status, outputPath } = useProjectStore();
  const stageIndex = STAGES.indexOf(stage);

  if (status === 'idle' && progress === 0) return null;

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
          ) : (
            <Loader2 className="w-4 h-4 text-forge-accent animate-spin" />
          )}
          <span className="text-sm font-medium text-forge-text">{message || 'Processing…'}</span>
          <span className="text-xs text-forge-glow ml-auto font-mono font-semibold tabular-nums">
            {progress}%
          </span>
        </div>

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
          <button
            type="button"
            className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            onClick={() => window.docuforge?.showItemInFolder(outputPath)}
          >
            Open export folder →
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
