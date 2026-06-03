'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@docuforge/convex/_generated/api';
import { FolderOpen, Plus } from 'lucide-react';

export function SaasProjectsPanel() {
  const projects = useQuery(api.projects.list);

  return (
    <div className="space-y-3 p-1">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-xs text-forge-cyan hover:underline"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        All projects on dashboard
      </Link>
      <Link
        href="/dashboard"
        className="btn-secondary w-full flex items-center justify-center gap-2 text-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        New project
      </Link>
      <ul className="space-y-1.5 max-h-48 overflow-y-auto">
        {projects?.map((p: { _id: string; title: string }) => (
          <li key={p._id}>
            <Link
              href={`/editor/${p._id}`}
              className="block text-xs p-2 rounded-lg border border-forge-border/40 hover:border-forge-accent/40 truncate"
            >
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
