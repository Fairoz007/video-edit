import { motion } from 'framer-motion';
import { EditorLayout } from './components/layout/EditorLayout';
import { TopToolbar } from './components/layout/TopToolbar';

export default function App() {
  return (
    <motion.div
      className="h-full flex flex-col cinematic-bg relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-forge-purple/10 blur-[100px]" />
        <motion.div
          className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-forge-blue/10 blur-[90px]"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-48 bg-forge-accent/5 blur-[80px]" />
      </div>

      <TopToolbar />
      <motion.main
        className="flex-1 overflow-hidden relative z-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <EditorLayout />
      </motion.main>
    </motion.div>
  );
}
