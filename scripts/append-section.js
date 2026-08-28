#!/usr/bin/env node
// Append-override section content: the LAST assignment wins, so appending
// overrides at EOF is bulletproof — no parsing of existing structures.
//
// Usage: node scripts/append-section.js <key> <cnFile> <enFile>
const fs = require('fs');

const [key, cnFile, enFile] = process.argv.slice(2);
if (!key || !cnFile || !enFile) {
  console.error('usage: node scripts/append-section.js <key> <cnFile> <enFile>');
  process.exit(1);
}
const cn = fs.readFileSync(cnFile, 'utf8').trim();
const en = fs.readFileSync(enFile, 'utf8').trim();

// EN goes into a template literal — escape anything that would break it
const enSafe = en
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

let c = fs.readFileSync('content.js', 'utf8');
c += '\n// ==== content override: ' + key + ' (appended; last assignment wins) ====\n';
c += 'SECTION_CONTENT[' + JSON.stringify(key) + '] = ' + JSON.stringify(cn) + ';\n';
c += 'SECTION_CONTENT_EN[' + JSON.stringify(key) + '] = `' + enSafe + '`;\n';
fs.writeFileSync('content.js', c);
console.log('✓ override appended for', key, '| CN', Math.round(cn.length / 1024 * 10) / 10 + 'K', '| EN', Math.round(en.length / 1024 * 10) / 10 + 'K');
