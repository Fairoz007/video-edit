import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface WorkflowCardProps {
  step: number;
  title: string;
  subtitle: string;
  progress: number;
  status: 'idle' | 'active' | 'complete' | 'processing';
  icon: LucideIcon;
}

export function WorkflowCard({
  step,
  title,
  subtitle,
  progress,
  status,
  icon: Icon,
}: WorkflowCardProps) {
  const isActive = status === 'active' || status === 'processing';

  return (
    <motion.div
      className={`relative flex-1 min-w-[100px] p-2.5 rounded-xl border overflow-hidden ${
        isActive
          ? 'border-forge-border-bright bg-gradient-to-br from-indigo-950/60 to-purple-950/40 shadow-glow-sm'
          : 'border-forge-border/50 bg-black/30'
      }`}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-glow opacity-50 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      )}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-cinematic origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress / 100 }}
      />
      <div className="relative flex items-start gap-2">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isActive ? 'accent-gradient shadow-glow-sm' : 'bg-white/5'
          }`}
        >
          {status === 'processing' ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          ) : (
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-forge-cyan/80">{step}</span>
            <span className="text-[10px] font-semibold text-white truncate">{title}</span>
          </div>
          <p className="text-[9px] text-gray-500 mt-0.5 truncate">{subtitle}</p>
          <div className="mt-1.5 h-1 rounded-full bg-black/50 overflow-hidden">
            <motion.div
              className="h-full accent-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
