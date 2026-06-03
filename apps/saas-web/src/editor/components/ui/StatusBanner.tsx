import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';

export function StatusBanner() {
  const { errorMessage, setError, status, message } = useProjectStore();
  const show = errorMessage || (status === 'failed' && message);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-2 sm:mx-3 mt-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 shrink-0"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-200 flex-1">{errorMessage || message}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400/80 hover:text-red-200 p-0.5"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
