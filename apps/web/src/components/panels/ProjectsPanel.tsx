import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Monitor, Loader2, Trash2 } from 'lucide-react';
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
    if (p.status === 'completed') return { text: 'Ready', color: 'text-emerald-400 bg-emerald-500/15' };
    if (p.status === 'failed') return { text: 'Failed', color: 'text-red-400 bg-red-500/15' };
    if (p.progress && p.progress > 0 && p.progress < 100)
      return { text: `${p.progress}%`, color: 'text-forge-cyan bg-cyan-500/15' };
    return { text: 'Draft', color: 'text-gray-400 bg-white/5' };
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Projects</h3>
          <p className="text-[10px] text-gray-500">Recent documentaries</p>
        </div>
        <motion.div className="flex gap-1">
          <motion.button
            type="button"
            onClick={handleClearAll}
            disabled={clearing}
            className="p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Clear all projects and exports"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </motion.button>
          <motion.button
            type="button"
            onClick={reset}
            className="p-2 rounded-xl accent-gradient shadow-glow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="New project"
          >
            <Plus className="w-4 h-4 text-white" />
          </motion.button>
        </motion.div>
      </div>

      {projects.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-6">No projects yet — generate or render one</p>
      )}

      <ul className="space-y-2">
        {projects.map((p, i) => {
          const st = statusLabel(p);
          const title = p.script?.topic || p.input?.topic || p.id.slice(0, 8);
          const active = projectId === p.id;
          return (
            <li key={p.id}>
              <motion.button
                type="button"
                onClick={() => handleOpen(p)}
                disabled={loadingId === p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.01 }}
                className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
                  active
                    ? 'border-forge-border-bright shadow-glow-sm'
                    : 'border-forge-border/40 hover:border-forge-purple/40'
                }`}
              >
                <div className="relative h-16 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
                  <motion.div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <p className="absolute bottom-2 left-2 right-8 text-xs font-semibold text-white truncate">
                    {title}
                  </p>
                  {loadingId === p.id && (
                    <Loader2 className="absolute right-2 bottom-2 w-4 h-4 text-white animate-spin" />
                  )}
                </div>
                <div className="p-2 bg-black/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[9px] text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDuration(p.timeline?.totalDuration)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Monitor className="w-2.5 h-2.5" />
                      1080p
                    </span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${st.color}`}>
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
