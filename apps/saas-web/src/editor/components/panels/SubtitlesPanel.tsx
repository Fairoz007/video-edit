import { Captions, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProjectStore } from '../../hooks/useProjectStore';

export function SubtitlesPanel() {
  const { script } = useProjectStore();
  const sections = script?.sections ?? [];

  return (
    <motion.div>
      <h3 className="text-sm font-bold text-white mb-0.5">Subtitles</h3>
      <p className="text-[10px] text-gray-500 mb-3">AI captions & animated text</p>
      <button
        type="button"
        className="w-full mb-3 py-2 rounded-xl accent-gradient text-xs font-semibold flex items-center justify-center gap-2"
      >
        <Wand2 className="w-3.5 h-3.5" />
        Auto-generate captions
      </button>
      <ul className="space-y-1.5 max-h-[280px] overflow-y-auto">
        {sections.length === 0 && (
          <p className="text-xs text-gray-600 py-4 text-center">Generate a script first</p>
        )}
        {sections.map((sec, i) => (
          <motion.li
            key={sec.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="p-2 rounded-xl bg-black/30 border border-forge-border/30 hover:border-forge-cyan/30"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Captions className="w-3 h-3 text-forge-cyan" />
              <span className="text-[10px] font-mono text-gray-500">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 line-clamp-2">{sec.narration}</p>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
