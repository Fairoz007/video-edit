import { useEffect, useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { listProjects } from '../../utils/api';
import { useProjectStore } from '../../hooks/useProjectStore';

export function ProjectsPanel() {
  const [projects, setProjects] = useState<{ id: string; status: string; input?: { topic?: string } }[]>([]);
  const { reset, setInput } = useProjectStore();

  useEffect(() => {
    listProjects()
      .then(({ data }) => setProjects(data))
      .catch(() => setProjects([]));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Projects</h3>
        <button
          type="button"
          onClick={reset}
          className="p-1 rounded hover:bg-white/10 text-forge-accent"
          title="New project"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <ul className="space-y-1">
        {projects.length === 0 && (
          <p className="text-xs text-gray-600">No saved projects yet</p>
        )}
        {projects.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setInput({ topic: p.input?.topic })}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-white/5 text-gray-300"
            >
              <FolderOpen className="w-3.5 h-3.5 text-forge-accent shrink-0" />
              <span className="truncate">{p.input?.topic || p.id}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
