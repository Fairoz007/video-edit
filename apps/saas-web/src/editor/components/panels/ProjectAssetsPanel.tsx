'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@docuforge/convex/_generated/api';
import { useProjectUpload, type UploadKind } from '../../lib/r2Upload';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useRef, useState } from 'react';

const UPLOAD_KINDS: { kind: UploadKind; label: string; accept: string }[] = [
  { kind: 'upload', label: 'Video / image', accept: 'video/*,image/*' },
  { kind: 'narration', label: 'Narration audio', accept: 'audio/*' },
  { kind: 'subtitle', label: 'Subtitles', accept: '.srt,.vtt,text/plain' },
];

function formatBytes(n?: number) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectAssetsPanel() {
  const convexProjectId = useProjectStore((s) => s.convexProjectId);
  const assets = useQuery(
    api.assets.listByProject,
    convexProjectId ? { projectId: convexProjectId } : 'skip',
  );
  const removeAsset = useMutation(api.assets.remove);
  const { uploadFile } = useProjectUpload(convexProjectId ?? undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<UploadKind>('upload');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!convexProjectId) return null;

  const onFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await uploadFile(file, kind);
      setStatus(result.duplicate ? 'Already registered.' : 'Uploaded to R2.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="rounded-lg border border-forge-border/40 p-3 space-y-3 mt-3">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
        Cloud assets (R2)
      </h3>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="input-field text-xs py-1.5"
          value={kind}
          onChange={(e) => setKind(e.target.value as UploadKind)}
          disabled={busy}
        >
          {UPLOAD_KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>
              {k.label}
            </option>
          ))}
        </select>
        <button type="button" disabled={busy} className="btn-secondary text-xs py-1.5" onClick={() => inputRef.current?.click()}>
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={UPLOAD_KINDS.find((k) => k.kind === kind)?.accept}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {status && <p className="text-[10px] text-forge-cyan/90">{status}</p>}
      <ul className="space-y-1 max-h-32 overflow-y-auto text-[10px]">
        {assets?.map((a: { _id: string; kind: string; cdnUrl: string; sizeBytes?: number }) => (
          <li key={a._id} className="flex justify-between gap-1 border border-forge-border/20 rounded p-1.5">
            <a href={a.cdnUrl} target="_blank" rel="noreferrer" className="truncate text-gray-400 hover:text-forge-cyan">
              {a.kind} · {formatBytes(a.sizeBytes)}
            </a>
            <button type="button" className="text-red-400 shrink-0" onClick={() => removeAsset({ assetId: a._id })}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
