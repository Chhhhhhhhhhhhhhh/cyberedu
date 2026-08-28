#!/usr/bin/env node
const fs = require('fs');
const c = fs.readFileSync('content.js', 'utf8');
const keys = [...new Set([...c.matchAll(/SECTION_CONTENT_EN\["([a-z0-9-]+)"\]/g)].map(m => m[1]))];
const empty = [], filled = [];
for (const k of keys) {
  const anchor = 'SECTION_CONTENT_EN["' + k + '"]';
  const i = c.indexOf(anchor);
  let j = i + anchor.length;
  while (j < c.length && (c[j] === '=' || c[j] === ' ')) j++;
  const opener = c[j];
  let kk = j + 1, size = 0;
  while (kk < c.length) {
    if (opener === '"' && c[kk] === '\\') { kk += 2; size += 2; continue; }
    if (c[kk] === opener) break;
    kk++; size++;
  }
  (size < 10 ? empty : filled).push(k + '(' + Math.round(size / 1024) + 'KB)');
}
console.log('总键:', keys.length, '| 有内容:', filled.length, '| 空/极小:', empty.length);
if (empty.length) console.log('空键:', empty.join(' '));
