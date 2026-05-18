import path from 'path';
import fs from 'fs';

export function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function projectDir(root, projectId) {
  const dir = path.join(root, 'projects', projectId);
  ensureDir(dir);
  ensureDir(path.join(dir, 'media'));
  ensureDir(path.join(dir, 'audio'));
  ensureDir(path.join(dir, 'subtitles'));
  ensureDir(path.join(dir, 'timeline'));
  ensureDir(path.join(dir, 'renders'));
  return dir;
}

export function cacheDir(root, topic) {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 64);
  return ensureDir(path.join(root, 'cache', slug));
}
