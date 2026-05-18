import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        {status === 'completed' ? (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        ) : status === 'failed' ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : (
          <Loader2 className="w-4 h-4 text-forge-accent animate-spin" />
        )}
        <span className="text-sm font-medium">{message || 'Processing...'}</span>
        <span className="text-xs text-gray-500 ml-auto font-mono">{progress}%</span>
      </div>

      <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full accent-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex gap-1 mt-2 flex-wrap">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={`text-[9px] px-1.5 py-0.5 rounded ${
              i <= stageIndex
                ? 'bg-forge-accent/30 text-forge-glow'
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
          className="mt-2 text-xs text-forge-glow hover:underline"
          onClick={() => window.docuforge?.showItemInFolder(outputPath)}
        >
          Open export folder →
        </button>
      )}
    </motion.div>
  );
}
