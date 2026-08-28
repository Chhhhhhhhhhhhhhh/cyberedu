#!/usr/bin/env node
// Structural augment: wrap an existing chapter body with the standard
// template frame (intro goals box before, exercises/summary after),
// then persist as a last-assignment-wins override for BOTH maps.
//
// Usage: node scripts/augment-section.js <key> <manifest.json>
// manifest: { "cnPre": "...", "cnPost": "...", "enPre": "...", "enPost": "..." }
const fs = require('fs');
const vm = require('vm');

const [key, manifestFile] = process.argv.slice(2);
if (!key || !manifestFile) {
  console.error('usage: node scripts/augment-section.js <key> <manifest.json>');
  process.exit(1);
}
const man = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
let c = fs.readFileSync('content.js', 'utf8');

// ── extract current values by executing the file in a sandbox ──
const sandbox = { globalThis: {} };
vm.createContext(sandbox);
vm.runInContext(c + '\nglobalThis.__CN=SECTION_CONTENT;globalThis.__EN=SECTION_CONTENT_EN;', sandbox);
const CN = sandbox.globalThis.__CN, EN = sandbox.globalThis.__EN;
if (!CN[key] || !EN[key]) throw new Error(key + ' missing from maps');
const cnBody = CN[key], enBody = EN[key];
console.log(key, 'body sizes: CN', Math.round(cnBody.length / 1024 * 10) / 10 + 'K | EN', Math.round(enBody.length / 1024 * 10) / 10 + 'K');

const cnNew = man.cnPre.trim() + '\n\n' + cnBody + '\n\n' + man.cnPost.trim();
const enNew = man.enPre.trim() + '\n\n' + enBody + '\n\n' + man.enPost.trim();

// append last-wins overrides
const enSafe = enNew.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
c += '\n// ==== content override (augment): ' + key + ' ====\n';
c += 'SECTION_CONTENT[' + JSON.stringify(key) + '] = ' + JSON.stringify(cnNew) + ';\n';
c += 'SECTION_CONTENT_EN[' + JSON.stringify(key) + '] = `' + enSafe + '`;\n';
fs.writeFileSync('content.js', c);

// ── self-verify: re-execute and confirm the override is live ──
const sb2 = { globalThis: {} };
vm.createContext(sb2);
vm.runInContext(fs.readFileSync('content.js', 'utf8') + '\nglobalThis.__CN=SECTION_CONTENT;globalThis.__EN=SECTION_CONTENT_EN;', sb2);
const okCn = sb2.globalThis.__CN[key].includes(man.cnVerify);
const okEn = sb2.globalThis.__EN[key].includes(man.enVerify);
console.log(okCn && okEn ? '✓' : '✗', key, 'augmented & live |', 'CN new:', Math.round(cnNew.length / 1024 * 10) / 10 + 'K | EN new:', Math.round(enNew.length / 1024 * 10) / 10 + 'K');
if (!okCn || !okEn) process.exit(1);
