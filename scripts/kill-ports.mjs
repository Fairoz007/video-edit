#!/usr/bin/env node
import { killDevPorts } from './port-utils.mjs';

const killed = await killDevPorts();
if (killed.length === 0) {
  console.log('[DocuForge] No dev ports in use (3847, 5173).');
} else {
  console.log('[DocuForge] Freed dev ports:');
  for (const { port, name, pid } of killed) {
    console.log(`  • ${name} (${port}) — PID ${pid}`);
  }
}
