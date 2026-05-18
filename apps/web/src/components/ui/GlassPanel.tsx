import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassPanelProps extends HTMLMotionProps<'motion.div'> {
  children: ReactNode;
  float?: boolean;
  className?: string;
}

export function GlassPanel({ children, float, className = '', ...props }: GlassPanelProps) {
  return (
    <motion.div
      className={`${float ? 'glass-panel-float' : 'glass-panel'} ${className}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
