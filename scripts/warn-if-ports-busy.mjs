#!/usr/bin/env node
/**
 * Exit 1 if dev ports are already in use (prevents a second `npm run dev` from
 * killing the first backend via kill:ports).
 */
import { listBusyDevPorts } from './port-utils.mjs';

const busy = await listBusyDevPorts();

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
