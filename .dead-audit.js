#!/usr/bin/env node
// Quantify dead/shadowed content in content.js
const fs = require('fs');
const vm = require('vm');
const c = fs.readFileSync('content.js', 'utf8');

// 1) runtime-winning values (execute + read maps)
const sb = { globalThis: {} };
vm.createContext(sb);
vm.runInContext(c + '\nglobalThis.__CN=SECTION_CONTENT;globalThis.__EN=SECTION_CONTENT_EN;', sb);
const CN = sb.globalThis.__CN, EN = sb.globalThis.__EN;

// 2) all CN literal/assignment occurrences with their sizes
function scanValues(mapRe, results) {
  let m;
  const re = new RegExp(mapRe, 'g');
  while ((m = re.exec(c)) !== null) {
    const key = m[1];
    const vStart = m.index + m[0].length;
    // escape-aware scan for closing quote
    let k = vStart, end = -1;
    while (k < c.length) {
      if (c[k] === '\\') { k += 2; continue; }
      if (c[k] === '"') { end = k; break; }
      k++;
    }
    if (end < 0) continue;
    const raw = c.slice(vStart, end);
    results.push({ key, size: raw.length });
  }
}

const cnDead = [];
// object literal form
scanValues('"([a-z0-9-]+)":"', cnDead);
// assignment form
scanValues('SECTION_CONTENT\\["([a-z0-9-]+)"\\] = "', cnDead);

// winning sizes
const win = {};
for (const k of Object.keys(CN)) win[k] = CN[k].length;
for (const k of Object.keys(win)) {
  const copies = cnDead.filter(x => x.key === k);
  if (!copies.length) continue;
  copies.sort((a, b) => b.size - a.size);
  const winner = copies[0].size;
  const dead = copies.slice(1).reduce((s, x) => s + x.size, 0);
  if (dead > 0) cnDead.push({ key: k + ' [shadowed-in-file]', size: dead });
}

// aggregate
const byKey = {};
for (const x of cnDead) { byKey[x.key] = (byKey[x.key] || 0) + x.size; }

// CN winning total vs stored total
let storedCN = 0;
for (const k of Object.keys(byKey)) storedCN += byKey[k];
const winningCN = Object.keys(CN).reduce((s, k) => s + CN[k].length, 0);
console.log('CN 声明处总存储:', Math.round(storedCN / 1024) + 'K chars | 运行时胜出值合计:', Math.round(winningCN / 1024) + 'K chars');

// 3) EN assignments with sizes
const enRe = /SECTION_CONTENT_EN\["([a-z0-9-]+)"\] = (`|")/g;
let m2, enTotal = 0, enCount = 0;
const enDeadList = [];
while ((m2 = enRe.exec(c)) !== null) {
  const key = m2[1];
  const opener = m2[2];
  let k = m2.index + m2[0].length, end = -1, size = 0;
  while (k < c.length) {
    if (opener === '"' && c[k] === '\\') { k += 2; size += 2; continue; }
    if (c[k] === opener) { end = k; break; }
    k++; size++;
  }
  if (end < 0) continue;
  enTotal += size; enCount++;
}
console.log('EN 赋值总存储:', Math.round(enTotal / 1024) + 'K chars, 条数:', enCount);
console.log('EN 运行时值合计:', Math.round(Object.keys(EN).reduce((s, k) => s + (EN[k] || '').length, 0) / 1024) + 'K chars');
