'use client';

import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@docuforge/convex/_generated/api';
import { ImportLocalProjects } from '@/components/ImportLocalProjects';
import { useEffect } from 'react';

export default function DashboardPage() {
  const me = useQuery(api.userProfiles.me);
  const projects = useQuery(api.projects.list);
  const create = useMutation(api.projects.create);
  const remove = useMutation(api.projects.remove);
  const ensureProfile = useMutation(api.userProfiles.ensure);

  useEffect(() => {
    ensureProfile().catch(() => {});
  }, [ensureProfile]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-forge-cyan">Projects</h1>
          <p className="text-sm text-[#9A8B78]">Premium Longform · stored in Convex</p>
          {me?.profile && (
            <p className="text-[10px] text-forge-accent/80 mt-1">
              Plan: {me.profile.plan} · renders this month: {me.profile.usage.rendersThisMonth}
            </p>
          )}
        </div>
        <button
          type="button"
          className="rounded-lg bg-forge-accent/20 border border-forge-accent/50 px-3 py-1.5 text-sm"
          onClick={() => create({ title: 'New documentary' })}
        >
          New project
        </button>
      </header>

      <section className="mb-8">
        <ImportLocalProjects />
      </section>

      {projects === undefined && (
        <p className="text-sm text-[#9A8B78]">Loading projects…</p>
      )}

      {projects?.length === 0 && (
        <p className="text-sm text-[#9A8B78]">No projects yet. Create one or import a bundle.</p>
      )}

      <ul className="space-y-2">
        {projects?.map((p) => (
          <li
            key={p._id}
            className="rounded-lg border border-forge-border/60 hover:border-forge-accent/40"
          >
            <div className="flex items-center gap-2 p-4">
              <Link href={`/editor/${p._id}`} className="flex-1 min-w-0">
                <span className="font-medium block truncate">{p.title}</span>
                <span className="text-xs text-[#9A8B78]">
                  {p.status}
                  {p.legacyLocalId ? ` · ${p.legacyLocalId}` : ''}
                </span>
              </Link>
              <button
                type="button"
                className="text-xs text-red-400/80 hover:text-red-300 shrink-0"
                onClick={() => {
                  if (confirm(`Delete "${p.title}"?`)) remove({ projectId: p._id });
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
