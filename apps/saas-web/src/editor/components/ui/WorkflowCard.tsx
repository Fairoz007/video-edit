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
      className={`relative flex-1 min-w-[100px] p-3 rounded-studio-lg border overflow-hidden ${
        isActive
          ? 'border-forge-border-accent bg-forge-accent/5'
          : 'border-forge-border bg-forge-surface/60'
      }`}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <motion.div
        className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-cinematic origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress / 100 }}
      />
      <div className="relative flex items-start gap-2.5">
        <motion.div
          className={`w-8 h-8 rounded-studio flex items-center justify-center shrink-0 ${
            isActive ? 'accent-gradient' : 'bg-white/[0.05]'
          }`}
        >
          {status === 'processing' ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-forge-muted'}`} />
          )}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-forge-muted">{String(step).padStart(2, '0')}</span>
            <span className="text-xs font-semibold text-forge-text truncate">{title}</span>
          </div>
          <p className="text-[10px] text-forge-text-secondary mt-0.5 truncate">{subtitle}</p>
          <div className="mt-2 h-1 rounded-full bg-forge-surface overflow-hidden">
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
