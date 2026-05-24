import { motion } from 'framer-motion';
import {
  Clapperboard,
  Clock,
  Film,
  Globe,
  Layers,
  Monitor,
  Music2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline } from '../../hooks/useDocumentaryPipeline';

function formatDuration(sec?: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const META_ROWS = [
  { key: 'duration', label: 'Duration', icon: Clock },
  { key: 'resolution', label: 'Resolution', icon: Monitor },
  { key: 'fps', label: 'Frame rate', icon: Film },
  { key: 'audio', label: 'Audio', icon: Volume2 },
  { key: 'language', label: 'Language', icon: Globe },
  { key: 'style', label: 'Style', icon: Layers },
] as const;

export function ProjectOverview({ className = '' }: { className?: string }) {
  const { script, timeline, input, status, exportOptions } = useProjectStore();
  const { startRenderFlow } = useDocumentaryPipeline();

  const duration = timeline?.totalDuration;
  const sceneCount = timeline?.scenes.length ?? 0;
  const isRendering = status === 'rendering';

  const values: Record<string, string> = {
    duration: formatDuration(duration),
    resolution: exportOptions.preset === '4k' ? '3840 × 2160' : '1920 × 1080',
    fps: '25 fps',
    audio: '48 kHz stereo',
    language: 'English',
    style: input.videoStyle === 'walkthrough' ? 'Walkthrough' : 'Documentary',
  };

  return (
    <motion.aside
      className={`glass-panel-elevated flex flex-col min-h-0 overflow-hidden ${className}`}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="panel-header shrink-0">
        <div>
          <p className="panel-eyebrow">Project</p>
          <h2 className="panel-title">Overview</h2>
        </div>
        <span className="ai-pulse-badge">
          <Sparkles className="w-3 h-3" />
          AI
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <div className="overview-stat-grid">
          {META_ROWS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="overview-stat">
              <Icon className="w-3.5 h-3.5 text-forge-glow shrink-0" />
              <div className="min-w-0">
                <p className="overview-stat-label">{label}</p>
                <p className="overview-stat-value">{values[key]}</p>
              </div>
            </div>
          ))}
        </div>

        {script && (
          <div className="overview-script-card">
            <p className="text-xs font-semibold text-forge-text line-clamp-2">
              {script.topic || input.topic || 'Untitled'}
            </p>
            <p className="text-[11px] text-forge-muted mt-1">
              {script.sections.length} sections · {sceneCount} scenes on timeline
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-forge-muted">
          <Music2 className="w-3.5 h-3.5 text-forge-cyan/80" />
          <span>Background score · {exportOptions.format?.toUpperCase() || 'MP4'}</span>
        </div>
      </div>

      <div className="p-4 border-t border-forge-border/60 shrink-0 bg-forge-surface/30">
        <motion.button
          type="button"
          onClick={() => startRenderFlow()}
          disabled={isRendering}
          className="w-full btn-primary-glow py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Clapperboard className="w-4 h-4" />
          {isRendering ? 'Rendering…' : 'Render'}
        </motion.button>
        <p className="text-[10px] text-center text-forge-muted mt-2.5">
          Est. ~{Math.max(1, Math.ceil((duration || 120) / 60))} min · H.264 · {exportOptions.preset}
        </p>
      </div>
    </motion.aside>
  );
}
