import { Music, Upload, Waves } from 'lucide-react';
import { motion } from 'framer-motion';

const TRACKS = [
  { id: 'cinematic', name: 'Cinematic Drone', bpm: 72, mood: 'Epic' },
  { id: 'ambient', name: 'Ambient Documentary', bpm: 60, mood: 'Calm' },
  { id: 'corporate', name: 'Corporate Pulse', bpm: 110, mood: 'Modern' },
];

export function MusicPanel() {
  return (
    <div>
      <h3 className="text-sm font-bold text-white mb-0.5">Music Library</h3>
      <p className="text-[10px] text-gray-500 mb-3">Cinematic beds & licensed tracks</p>
      <ul className="space-y-2 mb-3">
        {TRACKS.map((t) => (
          <motion.li
            key={t.id}
            whileHover={{ x: 4 }}
            className="p-2.5 rounded-xl border border-forge-border/40 bg-black/30 hover:border-forge-purple/40 cursor-pointer transition-colors"
          >
            <motion.div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center">
                <Music className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-200">{t.name}</p>
                <p className="text-[9px] text-gray-500">
                  {t.bpm} BPM · {t.mood}
                </p>
              </div>
            </motion.div>
          </motion.li>
        ))}
      </ul>
      <button
        type="button"
        className="w-full py-3 rounded-xl border border-dashed border-forge-border-bright/50 text-xs text-gray-400 hover:text-white hover:border-forge-accent/50 flex items-center justify-center gap-2 transition-all"
      >
        <Upload className="w-4 h-4" />
        Import Audio
      </button>
      <div className="mt-3 p-2 rounded-xl bg-black/40 border border-forge-border/30">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">
          <Waves className="w-3 h-3" />
          Waveform preview
        </div>
        <motion.div className="flex items-end gap-0.5 h-8">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-forge-blue/60 to-forge-purple/80"
              initial={{ height: 4 }}
              animate={{ height: `${20 + Math.sin(i * 0.5) * 60}%` }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: i * 0.04 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
