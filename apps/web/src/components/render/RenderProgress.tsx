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
        className="glass-panel p-3 shrink-0 mx-0 border-forge-border-bright/30"
      >
        <div className="flex items-center gap-2 mb-2">
          {status === 'completed' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : status === 'failed' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Loader2 className="w-4 h-4 text-forge-accent animate-spin" />
          )}
          <span className="text-sm font-medium text-white">{message || 'Processing…'}</span>
          <span className="text-xs text-forge-glow ml-auto font-mono font-bold">{progress}%</span>
        </div>

        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-forge-border/30">
          <motion.div
            className="h-full accent-gradient relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </div>

        <div className="flex gap-1 mt-2 flex-wrap">
          {STAGES.map((s, i) => (
            <span
              key={s}
              className={`text-[8px] px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wide ${
                i <= stageIndex
                  ? 'bg-forge-accent/25 text-forge-glow border border-forge-accent/30'
                  : 'bg-white/5 text-gray-600'
              }`}
            >
              {s}
            </span>
          ))}
        </div>

        {outputPath && status === 'completed' && (
          <button
            type="button"
            className="mt-2 text-xs text-forge-cyan hover:underline"
            onClick={() => window.docuforge?.showItemInFolder(outputPath)}
          >
            Open export folder →
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
