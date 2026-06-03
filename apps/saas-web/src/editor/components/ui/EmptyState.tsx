import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  hint?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, hint, action, compact }: EmptyStateProps) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-10 px-6'}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className={`rounded-studio-lg bg-white/[0.03] border border-forge-border flex items-center justify-center mb-4 ${
          compact ? 'w-10 h-10' : 'w-14 h-14'
        }`}
        whileHover={{ scale: 1.02 }}
      >
        <Icon className={`text-forge-muted ${compact ? 'w-5 h-5' : 'w-7 h-7'}`} />
      </motion.div>
      <h4 className={`font-semibold text-forge-text mb-1.5 ${compact ? 'text-sm' : 'text-base'}`}>{title}</h4>
      <p className={`text-forge-text-secondary max-w-sm leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
        {description}
      </p>
      {hint && (
        <p className="text-xs text-forge-muted mt-3 px-3 py-1.5 rounded-studio bg-forge-surface border border-forge-border">
          {hint}
        </p>
      )}
      {action && <motion.div className="mt-4">{action}</motion.div>}
    </motion.div>
  );
}
