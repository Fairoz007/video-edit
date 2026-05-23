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
