/** Resolve API/static base for exports and cache. */
export function getAssetBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  // Vite dev server proxies /api and /exports to the backend
  if (import.meta.env.DEV) return '';
  return 'http://127.0.0.1:3847';
}

export const ASSET_BASE = getAssetBase();

export function exportBasename(outputPath: string): string {
  const parts = outputPath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || outputPath;
}

export function toCacheUrl(localPath?: string): string | undefined {
  if (!localPath) return undefined;
  const normalized = localPath.replace(/\\/g, '/');
  const cacheIdx = normalized.indexOf('/cache/');
  if (cacheIdx >= 0) return `${ASSET_BASE}${normalized.slice(cacheIdx)}`;
  const relIdx = normalized.indexOf('cache/');
  if (relIdx >= 0) return `${ASSET_BASE}/${normalized.slice(relIdx)}`;
  return undefined;
}

/** Preview URL with byte-range support via API (works in Vite + Electron). */
export function toExportUrl(outputPath: string): string {
  const name = encodeURIComponent(exportBasename(outputPath));
  return `${ASSET_BASE}/api/exports/play/${name}`;
}

export function toExportUrlDirect(outputPath: string): string {
  return `http://127.0.0.1:3847/api/exports/play/${encodeURIComponent(exportBasename(outputPath))}`;
}

export interface MediaAsset {
  localPath?: string;
  url?: string;
  thumb?: string;
  source?: string;
  type?: string;
  filename?: string;
}

export function mediaDisplayUrl(item: MediaAsset): string | undefined {
  if (item.thumb) return toCacheUrl(item.thumb) || item.thumb;
  const cached = toCacheUrl(item.localPath);
  if (cached) return cached;
  if (item.url?.startsWith('http')) return item.url;
  return undefined;
}

export function normalizeMediaList(items: unknown[]): MediaAsset[] {
  return (items as MediaAsset[]).map((m) => ({
    ...m,
    thumb: mediaDisplayUrl(m) || m.thumb,
  }));
}
