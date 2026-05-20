import fs from 'fs';
import path from 'path';

const MUSIC_EXT = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']);

/** Repo-relative or absolute music library directory. */
export function getMusicLibraryDir(root) {
  const configured = process.env.MUSIC_LIBRARY_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(root, configured);
  }
  return path.join(root, 'music');
}

/** All supported audio files in the music library folder. */
export function listMusicTracks(root) {
  const dir = getMusicLibraryDir(root);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && MUSIC_EXT.has(path.extname(e.name).toLowerCase()))
    .map((e) => path.join(dir, e.name))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

function hashSeed(seed) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Pick one track deterministically from seed (e.g. projectId) or at random. */
export function pickBackgroundMusic(root, seed = '') {
  const tracks = listMusicTracks(root);
  if (!tracks.length) return null;
  if (tracks.length === 1) return tracks[0];
  const idx = seed ? hashSeed(seed) % tracks.length : Math.floor(Math.random() * tracks.length);
  return tracks[idx];
}

/** Default background music level under narration (0–1). */
export function defaultMusicVolume() {
  const fromEnv = parseFloat(process.env.MUSIC_BG_VOLUME ?? '');
  if (Number.isFinite(fromEnv) && fromEnv >= 0 && fromEnv <= 1) return fromEnv;
  return 0.12;
}

/**
 * Resolve background music: explicit path wins, else auto-pick from music/.
 * Set MUSIC_BG_DISABLED=1 to skip.
 */
export function resolveBackgroundMusicPath(root, { explicitPath, projectId } = {}) {
  if (process.env.MUSIC_BG_DISABLED === '1') return null;
  if (explicitPath && fs.existsSync(explicitPath)) return explicitPath;
  return pickBackgroundMusic(root, projectId || '');
}
