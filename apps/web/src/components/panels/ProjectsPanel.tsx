import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Monitor, Loader2, Trash2, Sparkles } from 'lucide-react';
import { cleanWorkspace, listProjects } from '../../utils/api';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline } from '../../hooks/useDocumentaryPipeline';

interface ApiProject {
  id: string;
  status?: string;
  progress?: number;
  stage?: string;
  input?: { topic?: string };
  script?: { topic?: string };
  timeline?: { totalDuration?: number };
  outputPath?: string;
  createdAt?: string;
}

function formatDuration(sec?: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ProjectsPanel() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { reset, projectId, setError } = useProjectStore();
  const [clearing, setClearing] = useState(false);
  const { loadProject } = useDocumentaryPipeline();

  const refresh = useCallback(() => {
    listProjects()
      .then(({ data }) => setProjects(data as ApiProject[]))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh, projectId]);

  const statusLabel = (p: ApiProject) => {
    if (p.status === 'completed') return { text: 'Ready', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25' };
    if (p.status === 'failed') return { text: 'Failed', color: 'text-red-400 bg-red-500/15 border-red-500/25' };
    if (p.progress && p.progress > 0 && p.progress < 100)
      return { text: `${p.progress}%`, color: 'text-forge-cyan bg-cyan-500/15 border-cyan-500/25' };
    return { text: 'Draft', color: 'text-forge-muted bg-white/5 border-forge-border' };
  };

  const handleOpen = async (p: ApiProject) => {
    setLoadingId(p.id);
    await loadProject(p.id);
    setLoadingId(null);
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete all projects, exports, and cached media? This cannot be undone.')) return;
    setClearing(true);
    setError(null);
    try {
      await cleanWorkspace();
      reset();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear workspace');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-forge-text tracking-tight">Projects</h3>
          <p className="text-[11px] text-forge-muted mt-0.5">Recent documentaries</p>
        </div>
        <div className="flex gap-1.5">
          <motion.button
            type="button"
            onClick={handleClearAll}
            disabled={clearing}
            className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Clear all projects and exports"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </motion.button>
          <motion.button
            type="button"
            onClick={reset}
            className="p-2 rounded-lg btn-primary-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="New project"
          >
            <Plus className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>

      {projects.length === 0 && (
        <p className="text-xs text-forge-muted text-center py-10">No projects yet — generate or render one</p>
      )}

      <ul className="space-y-2.5">
        {projects.map((p, i) => {
          const st = statusLabel(p);
          const title = p.script?.topic || p.input?.topic || p.id.slice(0, 8);
          const active = projectId === p.id;
          const progress = p.progress && p.progress > 0 && p.progress < 100 ? p.progress : null;

          return (
            <li key={p.id}>
              <motion.button
                type="button"
                onClick={() => handleOpen(p)}
                disabled={loadingId === p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`project-card ${active ? 'project-card-active' : ''}`}
              >
                <div className="relative h-[72px] bg-gradient-to-br from-indigo-950/90 via-violet-950/80 to-slate-950 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.25),transparent_60%)]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <Sparkles className="absolute top-2 right-2 w-3.5 h-3.5 text-forge-glow/50" />
                  <p className="absolute bottom-2.5 left-3 right-10 text-xs font-semibold text-forge-text truncate">
                    {title}
                  </p>
                  {loadingId === p.id && (
                    <Loader2 className="absolute right-3 bottom-2.5 w-4 h-4 text-forge-glow animate-spin" />
                  )}
                  {progress != null && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/50">
                      <div className="h-full accent-gradient" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="p-2.5 bg-black/35 flex items-center justify-between gap-2 border-t border-forge-border/40">
                  <div className="flex items-center gap-3 text-[10px] text-forge-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(p.timeline?.totalDuration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      1080p
                    </span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${st.color}`}>
                    {st.text}
                  </span>
                </div>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
