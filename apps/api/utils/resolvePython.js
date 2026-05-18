import { spawnSync } from 'child_process';
import '../loadEnv.js';

const cache = new Map();

function resolvePyLauncherVersion(version) {
  const key = `py-${version}`;
  if (cache.has(key)) return cache.get(key);

  const r = spawnSync('py', [`-${version}`, '-c', 'import sys; print(sys.executable)'], {
    encoding: 'utf8',
  });
  const exe = r.status === 0 ? (r.stdout || '').trim() : '';
  if (exe) cache.set(key, exe);
  return exe || null;
}

/** Python executable for Chatterbox / MoviePy. */
export function resolvePython() {
  const configured = (
    process.env.CHATTERBOX_PYTHON ||
    process.env.PYTHON_FOR_CHATTERBOX ||
    ''
  ).trim();

  if (/^3\.\d{1,2}$/.test(configured)) {
    const exe = resolvePyLauncherVersion(configured);
    if (exe) return exe;
  }

  if (configured && !/^3\.\d{1,2}$/.test(configured)) return configured;

  if (process.platform === 'win32') {
    for (const version of ['3.13', '3.12']) {
      const exe = resolvePyLauncherVersion(version);
      if (exe) return exe;
    }
    return 'python';
  }

  return 'python3';
}
