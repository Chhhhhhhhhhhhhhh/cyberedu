#!/usr/bin/env node
// Content quality gate: executes content.js and verifies ALL 52 chapters
// carry the standard template frame in BOTH languages (intro goals box +
// exercises/summary markers). Runs in CI.
const fs = require('fs');
const vm = require('vm');
const c = fs.readFileSync('content.js', 'utf8');
const sandbox = { globalThis: {} };
vm.createContext(sandbox);
vm.runInContext(c + '\nglobalThis.__CN=SECTION_CONTENT;globalThis.__EN=SECTION_CONTENT_EN;', sandbox);
const CN = sandbox.globalThis.__CN, EN = sandbox.globalThis.__EN;

const cnKeys = Object.keys(CN), enKeys = Object.keys(EN);
let pass = 0, fail = [];
for (const k of cnKeys) {
  const v = CN[k];
  const ok = v.includes('本章你将学会') && (v.includes('动手练习') || v.includes('本章小结'));
  ok ? pass++ : fail.push('CN ' + k);
}
for (const k of enKeys) {
  const v = EN[k];
  if (!v || v.length < 500) { fail.push('EN ' + k + ' (empty/thin)'); continue; }
  const ok = v.includes('What You Will Learn') && (v.includes('Exercises') || v.includes('Chapter Summary'));
  ok ? pass++ : fail.push('EN ' + k);
}
console.log(`content template gate: ${pass}/${cnKeys.length + enKeys.length} OK`);
if (fail.length) { console.log('MISSING FRAME:', fail.join(' | ')); process.exit(1); }
