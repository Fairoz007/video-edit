#!/usr/bin/env node
/**
 * Exit 1 if dev ports are already in use (prevents a second `npm run dev` from
 * kill -9'ing the first backend via kill:ports).
 */
import { execSync } from 'child_process';

const PORTS = [
  { port: 3847, name: 'backend' },
  { port: 5173, name: 'vite' },
];

function pidsOnPort(port) {
  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN 2>/dev/null`, {
      encoding: 'utf8',
    }).trim();
    return out ? out.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

const busy = PORTS.flatMap(({ port, name }) =>
  pidsOnPort(port).map((pid) => ({ port, name, pid })),
);

if (busy.length === 0) {
  process.exit(0);
}

console.error('\n[DocuForge] Dev ports already in use:\n');
for (const { port, name, pid } of busy) {
  console.error(`  • ${name} (port ${port}) — PID ${pid}`);
}
console.error(`
Stop the other dev server first (Ctrl+C in that terminal),
or free the ports:

  npm run kill:ports

Then run \`npm run dev\` again.
`);
process.exit(1);
