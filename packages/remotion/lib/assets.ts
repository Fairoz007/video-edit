import { staticFile } from 'remotion';

export function resolveMediaSrc(src: string): string {
  if (
    !src ||
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('/') ||
    /^[A-Za-z]:\\/.test(src)
  ) {
    return src;
  }
  return staticFile(src);
}
