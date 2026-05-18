import { motion } from 'framer-motion';
import { useProjectStore } from '../../hooks/useProjectStore';

export function ScenesPanel() {
  const { script, timeline } = useProjectStore();
  const sections = script?.sections ?? [];
  const scenes = timeline?.scenes ?? [];

  if (sections.length === 0 && scenes.length === 0) {
    return (
      <p className="text-xs text-gray-600 text-center py-8">
        Scenes appear after script and timeline generation
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Scene List</h3>
      {(sections.length ? sections : scenes).map((item, i) => {
        const title = 'title' in item ? item.title : `Scene ${i + 1}`;
        const dur = 'durationEstimate' in item ? item.durationEstimate : 'duration' in item ? item.duration : 0;
        return (
          <motion.button
            key={'id' in item ? item.id : i}
            type="button"
            whileHover={{ x: 4, borderColor: 'rgba(139, 92, 246, 0.4)' }}
            className="w-full text-left p-2.5 rounded-xl bg-black/30 border border-forge-border/40 hover:bg-forge-accent/5 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg accent-gradient flex items-center justify-center text-[10px] font-bold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-200 truncate">{title}</p>
                <p className="text-[9px] text-gray-500">{dur}s · Ken Burns</p>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
