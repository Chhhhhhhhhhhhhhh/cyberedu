#!/usr/bin/env node
// remove the duplicate (shadowing) SECTION_CONTENT["prog-01-02"] assignment;
// the object-literal entry already carries the rewritten chapter.
const fs = require('fs');
let c = fs.readFileSync('content.js', 'utf8');

const marker = 'SECTION_CONTENT["prog-01-02"] = "';
const p = c.indexOf(marker);
if (p < 0) throw new Error('shadow assignment not found');
// find statement end: escaped-aware scan for the closing quote, then ';'
let k = p + marker.length;
while (k < c.length) {
  if (c[k] === '\\') { k += 2; continue; }
  if (c[k] === '"') break;
  k++;
}
let end = c.indexOf('\n', k);
if (end < 0) throw new Error('statement end not found');
const removed = c.slice(p, end);
console.log('removing shadowing assignment of', removed.length, 'chars; starts:', JSON.stringify(removed.slice(0, 60)));
c = c.slice(0, p) + c.slice(end + 1);
fs.writeFileSync('content.js', c);
console.log('✓ duplicate assignment removed');
