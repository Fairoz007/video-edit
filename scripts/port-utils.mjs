/**
 * Cross-platform port helpers (Windows + macOS/Linux).
 */
import net from 'net';
import { execSync } from 'child_process';
import os from 'os';

export const DEV_PORTS = [
  { port: 3847, name: 'backend' },
  { port: 5173, name: 'vite' },
];

export function isPortBusy(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, host);
  });
}

/** @returns {{ port: number, name: string, pid: string }[]} */
export async function listBusyDevPorts() {
  const busy = [];
  for (const { port, name } of DEV_PORTS) {
    if (await isPortBusy(port)) {
      const pids = getPidsOnPort(port);
      if (pids.length === 0) {
        busy.push({ port, name, pid: '?' });
      } else {
        for (const pid of pids) busy.push({ port, name, pid });
      }
    }
  }
  return busy;
}

function getPidsOnPort(port) {
  if (process.platform === 'win32') {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const pids = new Set();
      for (const line of out.split('\n')) {
        if (!/LISTENING/i.test(line)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
      }
      return [...pids];
    } catch {
      return [];
    }
  }
  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN 2>/dev/null`, {
      encoding: 'utf8',
      shell: '/bin/sh',
    }).trim();
    return out ? out.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function killPids(pids) {
  const unique = [...new Set(pids.filter((p) => p && p !== '?'))];
  for (const pid of unique) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      }
    } catch {
      // process may already be gone
    }
  }
}

export async function killDevPorts() {
  const busy = await listBusyDevPorts();
  killPids(busy.map((b) => b.pid));
  return busy;
}
