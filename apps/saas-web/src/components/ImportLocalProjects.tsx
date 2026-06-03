'use client';

import { useMutation } from 'convex/react';
import { api } from '@docuforge/convex/_generated/api';
import { useRef, useState } from 'react';

type BundleFile = {
  projects?: unknown[];
  count?: number;
};

export function ImportLocalProjects() {
  const importBatch = useMutation(api.projects.importFromLegacyBatch);
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File) => {
    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BundleFile | unknown[];
      const projects = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.projects)
          ? parsed.projects
          : parsed && typeof parsed === 'object' && 'id' in (parsed as object)
            ? [parsed]
            : null;

      if (!projects?.length) {
        setStatus('No projects found in file. Use migration-bundle.json from export script.');
        return;
      }

      const result = await importBatch({ projects, upsert: true });
      setStatus(`Imported ${result.imported} project(s).`);
      inputRef.current?.form?.reset();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-forge-border/50 p-4">
      <p className="text-xs text-[#9A8B78] mb-2">
        Import local <code className="text-forge-cyan">project.json</code> files (run{' '}
        <code className="text-forge-cyan">node scripts/export-local-projects.mjs</code> first).
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const file = inputRef.current?.files?.[0];
          if (file) onFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="text-xs text-[#9A8B78] w-full mb-2"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-forge-border px-3 py-1.5 text-xs hover:border-forge-accent/50 disabled:opacity-50"
        >
          {busy ? 'Importing…' : 'Import bundle'}
        </button>
      </form>
      {status && <p className="text-xs mt-2 text-forge-cyan/90">{status}</p>}
    </div>
  );
}
