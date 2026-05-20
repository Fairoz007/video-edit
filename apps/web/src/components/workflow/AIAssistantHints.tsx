import { motion } from 'framer-motion';
import { Sparkles, Lightbulb } from 'lucide-react';

const SUGGESTIONS = [
  'Upload script: download the demo .txt, change TOPIC and narration, then use Upload script.',
  'Paste a Wikipedia article URL for rich factual narration.',
  'Use “Generate Scenes” after the script to pull stock footage automatically.',
  'Try documentary style with a slower voice rate for gravitas.',
  'Render in 1080p first, then upscale once you approve the cut.',
];

export function AIAssistantHints() {
  return (
    <motion.aside
      className="rounded-studio-lg border border-forge-border bg-forge-surface/60 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-forge-purple" />
        <span className="text-label-sm text-forge-text-secondary">AI Assistant</span>
      </motion.div>
      <ul className="space-y-2">
        {SUGGESTIONS.map((tip, i) => (
          <motion.li
            key={tip}
            className="flex gap-2 text-xs text-forge-text-secondary leading-relaxed"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Lightbulb className="w-3.5 h-3.5 text-forge-muted shrink-0 mt-0.5" />
            {tip}
          </motion.li>
        ))}
      </ul>
    </motion.aside>
  );
}
