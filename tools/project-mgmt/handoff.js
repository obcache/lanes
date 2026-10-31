#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
function capture(args) {
  try { return cp.execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch (error) { return '(unavailable: ' + error.message + ')'; }
}
function read(file) {
  const target = path.join(root, file);
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '(not present)';
}
const summary = process.argv.slice(2).join(' ') || 'Review current planning and ledger before continuing.';
const content = '# Project Handoff\n\nGenerated: ' + new Date().toISOString() + '\n\n' +
  '## Summary\n\n' + summary + '\n\n' +
  '## Current Branch\n\n' + capture(['branch', '--show-current']) + '\n\n' +
  '## Working Tree\n\n' + capture(['status', '--short']) + '\n\n' +
  '## Recent Commits\n\n' + capture(['log', '--oneline', '-10']) + '\n\n' +
  '## Foundation\n\n' + read('docs/PROJECT_FOUNDATION.md') + '\n\n' +
  '## Planning Snapshot\n\n' + read('docs/planning/To-do.md') + '\n\n' +
  '## Dev Ledger Tail\n\n' + read('docs/dev-ledger.md').slice(-8000) + '\n\n' +
  '## Next Session\n\nRead AGENTS.md and its startup documents. Validate current state before editing.\n';
const dir = path.join(root, 'docs/handoffs');
fs.mkdirSync(dir, { recursive: true });
const snapshot = path.join(dir, 'handoff-' + new Date().toISOString().replace(/[:.]/g, '-') + '.md');
fs.writeFileSync(snapshot, content);
fs.writeFileSync(path.join(dir, 'HANDOFF.md'), content);
console.log('[handoff] Updated docs/handoffs/HANDOFF.md');
