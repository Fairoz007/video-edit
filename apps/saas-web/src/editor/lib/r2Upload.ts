'use client';

import { useAction, useMutation } from 'convex/react';
import { api } from '@docuforge/convex/_generated/api';
import type { Id } from '@docuforge/convex/_generated/dataModel';

export type UploadKind =
  | 'stock_video'
  | 'upload'
  | 'narration'
  | 'subtitle'
  | 'music'
  | 'export'
  | 'preview';

export async function putToPresignedUrl(
  file: File | Blob,
  uploadUrl: string,
  headers: Record<string, string>,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
  }
}

export function useProjectUpload(projectId: Id<'projects'> | undefined) {
  const generateUploadUrl = useAction(api.r2.generateUploadUrl);
  const completeUpload = useMutation(api.assets.completeUpload);

  const uploadFile = async (
    file: File,
    kind: UploadKind,
    options?: { appendToProjectMedia?: boolean; meta?: Record<string, unknown> },
  ) => {
    if (!projectId) throw new Error('No project selected');

    const intent = await generateUploadUrl({
      projectId,
      kind,
      mime: file.type || 'application/octet-stream',
      filename: file.name,
      sizeBytes: file.size,
    });

    await putToPresignedUrl(file, intent.uploadUrl, intent.headers);

    return completeUpload({
      projectId,
      kind,
      r2Key: intent.r2Key,
      mime: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      appendToProjectMedia: options?.appendToProjectMedia ?? true,
      meta: options?.meta,
    });
  };

  return { uploadFile };
}
