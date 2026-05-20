import { motion } from 'framer-motion';
import { EditorLayout } from './components/layout/EditorLayout';
import { TopToolbar } from './components/layout/TopToolbar';

export default function App() {
  return (
    <motion.div
      className="h-full flex flex-col cinematic-bg relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <motion.div
          className="absolute -top-40 right-0 w-[420px] h-[420px] rounded-full bg-forge-accent/[0.04] blur-[120px]"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <TopToolbar />
      <motion.main
        className="flex-1 overflow-hidden relative z-10 min-h-0"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <EditorLayout />
      </motion.main>
    </motion.div>
  );
}
