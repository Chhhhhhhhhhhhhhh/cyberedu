#!/usr/bin/env node
// Generic section content replacer (reused by every content batch)
//
// Usage:
//   node scripts/replace-section.js <key> <cnFile> [enFile]
//
// CN: SECTION_CONTENT object literal entry  "key":"..."  (escaped-quote scan)
// EN: SECTION_CONTENT_EN["key"] = `...` or "..."  (template/quote aware)
const fs = require('fs');

const [key, cnFile, enFile] = process.argv.slice(2);
if (!key || !cnFile) {
  console.error('usage: node scripts/replace-section.js <key> <cnFile> [enFile]');
  process.exit(1);
}
let c = fs.readFileSync('content.js', 'utf8');

// ── CN (object literal "key":"value") ──
{
  const NEW = fs.readFileSync(cnFile, 'utf8').trim();
  const anchor = '"' + key + '":"';
  const start = c.indexOf(anchor);
  if (start < 0) throw new Error('CN literal not found: ' + key);
  const vStart = start + anchor.length;
  let i = vStart, end = -1;
  while (i < c.length) {
    if (c[i] === '\\') { i += 2; continue; }
    if (c[i] === '"') { end = i; break; }
    i++;
  }
  if (end < 0) throw new Error('CN closing quote not found');
  console.log('CN old size:', end - vStart);
  c = c.slice(0, vStart) + JSON.stringify(NEW).slice(1, -1) + c.slice(end);
  console.log('✓ CN', key, '→', Math.round(NEW.length / 1024) + 'KB');
}

// ── EN (SECTION_CONTENT_EN["key"] = `...` | "...") ──
if (enFile) {
  const NEW = fs.readFileSync(enFile, 'utf8').trim();
  const anchor = 'SECTION_CONTENT_EN["' + key + '"]';
  let start = -1, idx = 0;
  while (true) {
    idx = c.indexOf(anchor, idx);
    if (idx < 0) throw new Error('EN assignment not found: ' + key);
    let j = idx + anchor.length;
    while (j < c.length && (c[j] === '=' || c[j] === ' ')) j++;
    if (c[j] === '`' || c[j] === '"') { start = idx; idx = j; break; }
    idx = j;
  }
  let k = idx + anchor.length;
  while (k < c.length && (c[k] === '=' || c[k] === ' ')) k++;
  const backtick = c[k] === '`';
  const closer = backtick ? '`' : '"';
  k++;
  let end = -1;
  while (k < c.length) {
    if (!backtick && c[k] === '\\') { k += 2; continue; }
    if (c[k] === closer) { end = k; break; }
    k++;
  }
  if (end < 0) throw new Error('EN closing not found');
  console.log('EN old size:', end - k);
  c = c.slice(0, k) + (backtick ? NEW : JSON.stringify(NEW).slice(1, -1)) + c.slice(end);
  console.log('✓ EN', key, '→', Math.round(NEW.length / 1024) + 'KB');
}

fs.writeFileSync('content.js', c);
console.log('content.js written');
