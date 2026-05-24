import { motion } from 'framer-motion';
import { Circle, Cpu, HardDrive, Wifi } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';

export function StatusFooter() {
  const { projectId, status, timeline, script } = useProjectStore();
  const duration = timeline?.totalDuration;
  const title = script?.topic?.slice(0, 48) || 'No project loaded';

  const statusColor =
    status === 'completed'
      ? 'text-emerald-400'
      : status === 'rendering'
        ? 'text-forge-glow'
        : status === 'failed'
          ? 'text-red-400'
          : 'text-forge-muted';

  return (
    <motion.footer
      className="h-7 shrink-0 flex items-center justify-between px-4 border-t border-forge-border/50 bg-forge-surface/40 backdrop-blur-md text-[10px] text-forge-muted"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex items-center gap-1.5 shrink-0">
          <Circle className={`w-1.5 h-1.5 fill-current ${statusColor}`} />
          <span className={`capitalize ${statusColor}`}>{status}</span>
        </span>
        <span className="hidden sm:inline truncate text-forge-text-secondary">{title}</span>
        {projectId && (
          <span className="hidden md:inline font-mono opacity-60 truncate max-w-[140px]">
            {projectId.slice(0, 8)}…
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {duration != null && (
          <span className="hidden sm:inline font-mono tabular-nums">
            Timeline {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
          </span>
        )}
        <span className="hidden lg:flex items-center gap-1">
          <Wifi className="w-3 h-3" />
          API
        </span>
        <span className="hidden lg:flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          Render ready
        </span>
        <span className="flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          Local
        </span>
      </div>
    </motion.footer>
  );
}
