import { motion } from 'framer-motion';
import { Sparkles, Wand2, Scan, ImageUp, Film } from 'lucide-react';
import { useState } from 'react';

const TOOLS = [
  { id: 'upscale', label: 'AI Upscale 4K', icon: ImageUp, desc: 'Enhance export resolution' },
  { id: 'stabilize', label: 'Stabilize Footage', icon: Film, desc: 'Smooth camera motion' },
  { id: 'scene', label: 'Scene Detection', icon: Scan, desc: 'Auto-split timeline' },
  { id: 'color', label: 'Smart Color Grade', icon: Wand2, desc: 'Cinematic LUT match' },
];

export function AIEnhancementTools() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    upscale: false,
    stabilize: true,
    scene: true,
    color: false,
  });

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
        <Sparkles className="w-3.5 h-3.5 text-forge-purple" />
        AI Enhancement
      </h3>
      {TOOLS.map((t) => (
        <motion.div
          key={t.id}
          className="p-3 rounded-xl bg-black/30 border border-forge-border/40 flex items-center justify-between gap-2"
          whileHover={{ borderColor: 'rgba(168, 85, 247, 0.35)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-forge-accent/15 flex items-center justify-center shrink-0">
              <t.icon className="w-4 h-4 text-forge-glow" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-200">{t.label}</p>
              <p className="text-[9px] text-gray-500">{t.desc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToggles((s) => ({ ...s, [t.id]: !s[t.id] }))}
            className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${
              toggles[t.id] ? 'accent-gradient shadow-glow-sm' : 'bg-gray-800'
            }`}
          >
            <motion.span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
              animate={{ left: toggles[t.id] ? '18px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </motion.div>
      ))}
    </section>
  );
}
