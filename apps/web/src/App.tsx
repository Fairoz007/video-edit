import { motion } from 'framer-motion';
import { EditorLayout } from './components/layout/EditorLayout';
import { StatusFooter } from './components/layout/StatusFooter';
import { TopToolbar } from './components/layout/TopToolbar';
import { ChatterboxSetupDialog } from './components/setup/ChatterboxSetupDialog';

export default function App() {
  return (
    <motion.div
      className="h-full flex flex-col cinematic-bg relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="ambient-orb-purple" aria-hidden />
      <div className="ambient-orb-blue" aria-hidden />

      <TopToolbar />
      <motion.main
        className="flex-1 overflow-hidden relative z-10 min-h-0"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <EditorLayout />
      </motion.main>
      <StatusFooter />
      <ChatterboxSetupDialog />
    </motion.div>
  );
}
