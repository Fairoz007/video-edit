import { motion } from 'framer-motion';
import { EditorLayout } from './components/layout/EditorLayout';
import { TitleBar } from './components/layout/TitleBar';

export default function App() {
  return (
    <div className="h-full flex flex-col bg-forge-black">
      <TitleBar />
      <motion.main
        className="flex-1 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <EditorLayout />
      </motion.main>
    </div>
  );
}
