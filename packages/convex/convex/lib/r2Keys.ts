import type { Id } from '../_generated/dataModel';

const KIND_FOLDER: Record<string, string> = {
  stock_video: 'media',
  upload: 'media',
  narration: 'audio',
  subtitle: 'subtitles',
  music: 'audio',
  export: 'exports',
  preview: 'renders',
};

export function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return base || 'file';
}

export function extensionFromMime(mime: string, filename?: string): string {
  const fromName = filename?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'text/plain': 'txt',
    'application/x-subrip': 'srt',
  };
  return map[mime] ?? 'bin';
}

export function buildR2Key(
  userId: Id<'users'>,
  projectId: Id<'projects'>,
  kind: string,
  mime: string,
  filename?: string,
): string {
  const folder = KIND_FOLDER[kind] ?? 'media';
  const ext = extensionFromMime(mime, filename);
  const safe = sanitizeFilename(filename ?? `asset.${ext}`);
  const id = crypto.randomUUID();
  return `u/${userId}/p/${projectId}/${folder}/${id}-${safe}`;
}

export function buildCdnUrl(r2Key: string, publicBase: string): string {
  const base = publicBase.replace(/\/$/, '');
  const encoded = r2Key.split('/').map(encodeURIComponent).join('/');
  return `${base}/${encoded}`;
}

export function assertKeyOwnedByUser(r2Key: string, userId: Id<'users'>, projectId: Id<'projects'>) {
  const expectedPrefix = `u/${userId}/p/${projectId}/`;
  if (!r2Key.startsWith(expectedPrefix)) {
    throw new Error('Invalid storage key for this project');
  }
}
