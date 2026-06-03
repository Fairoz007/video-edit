/** Resolve API/static base for exports, cache, and R2 CDN URLs. */
export function getAssetBase(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') return '';
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
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  const cacheIdx = normalized.indexOf('/cache/');
  if (cacheIdx >= 0) return `${ASSET_BASE}${normalized.slice(cacheIdx)}`;
  const relIdx = normalized.indexOf('cache/');
  if (relIdx >= 0) return `${ASSET_BASE}/${normalized.slice(relIdx)}`;
  return undefined;
}

export function toExportUrl(outputPath: string): string {
  if (outputPath.startsWith('http://') || outputPath.startsWith('https://')) {
    return outputPath;
  }
  const name = encodeURIComponent(exportBasename(outputPath));
  return `${ASSET_BASE}/api/exports/play/${name}`;
}

export function toExportUrlDirect(outputPath: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:3847';
  const name = encodeURIComponent(exportBasename(outputPath));
  return `${base}/api/exports/play/${name}`;
}

export interface MediaAsset {
  localPath?: string;
  url?: string;
  thumb?: string;
  cdnUrl?: string;
  r2Key?: string;
  source?: string;
  type?: string;
  filename?: string;
}

export function mediaDisplayUrl(item: MediaAsset): string | undefined {
  if (item.url?.startsWith('http')) return item.url;
  if (item.cdnUrl?.startsWith('http')) return item.cdnUrl;
  if (item.thumb) return toCacheUrl(item.thumb) || item.thumb;
  const cached = toCacheUrl(item.localPath);
  if (cached) return cached;
  return undefined;
}

export function normalizeMediaList(items: unknown[]): MediaAsset[] {
  return (items as MediaAsset[]).map((m) => ({
    ...m,
    url: mediaDisplayUrl(m) || m.url,
    thumb: mediaDisplayUrl(m) || m.thumb,
  }));
}
