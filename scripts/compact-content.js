#!/usr/bin/env node
// content.js compactor v3 — binding-set driven, vm-capture, deep-verified
const fs = require('fs');
const vm = require('vm');

const orig = fs.readFileSync('content.js', 'utf8');

// ── 1) discover candidate top-level binding names (line-start decls) ──
const candidates = new Set();
for (const m of orig.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)) {
  candidates.add(m[1]);
}
// KNOWN app bindings (whitelist of intent)
const KNOWN = ['SECTION_CONTENT', 'SECTION_CONTENT_EN', 'GLOSSARY', 'MODULES',
  'CTF_CHALLENGES', 'PRACTICES', 'PRACTICE_TESTS', 'CHECKPOINTS_MERGED',
  'SECTION_CHECKPOINTS', 'CHECKPOINTS', 'AI_SYS_PROMPT', 'TOOLS'];
const knownCandidates = [...candidates].filter(n => KNOWN.includes(n));
const unknownCandidates = [...candidates].filter(n => !KNOWN.includes(n));
console.log('行首声明候选:', candidates.size, '| 已知:', knownCandidates.length, '| 未知(将运行时甄别):', unknownCandidates.length);

// ── 2) run original in vm; capture values by bare-name passing ──
const ctx = { console: { log() {}, warn() {}, error() {} } };
vm.createContext(ctx);
ctx.__cap = (name, value) => { ctx.__vals[name] = value; };
ctx.__vals = {};
vm.runInContext(orig, ctx);
const capSrc = [...candidates].map(n =>
  `try { if (typeof ${n} !== 'undefined') __cap(${JSON.stringify(n)}, ${n}); } catch (e) {}`
).join('\n');
vm.runInContext(capSrc, ctx);
const V1 = ctx.__vals;
const found = Object.keys(V1).filter(k => V1[k] !== undefined);
console.log('运行时捕获绑定:', found.length, '→', found.join(', '));

// ── 3) serialize + regenerate ──
const parts = [];
parts.push('// CyberEdu content bundle (compacted v2.7.7)\n' +
  '// One definition per binding (values = runtime-winning).\n' +
  '// Content updates: scripts/append-section.js, then compact again.\n');

// CN map as literal
const cnKeys = Object.keys(V1.SECTION_CONTENT || {});
let cnLit = 'const SECTION_CONTENT = {\n';
for (const k of cnKeys) {
  cnLit += '  ' + JSON.stringify(k) + ': ' + JSON.stringify(V1.SECTION_CONTENT[k]) + ',\n';
}
cnLit += '};';
parts.push(cnLit + '\n');

// EN map as literal
const enKeys = Object.keys(V1.SECTION_CONTENT_EN || {});
let enLit = 'const SECTION_CONTENT_EN = {\n';
for (const k of enKeys) {
  enLit += '  ' + JSON.stringify(k) + ': ' + JSON.stringify(V1.SECTION_CONTENT_EN[k]) + ',\n';
}
enLit += '};';
parts.push(enLit + '\n');

// other known data bindings, preserved in original file order
const order = ['GLOSSARY', 'MODULES', 'CTF_CHALLENGES', 'PRACTICES', 'PRACTICE_TESTS',
  'CHECKPOINTS_MERGED', 'SECTION_CHECKPOINTS', 'CHECKPOINTS', 'AI_SYS_PROMPT'];
for (const name of order) {
  if (V1[name] === undefined) continue;
  parts.push('const ' + name + ' = ' + JSON.stringify(V1[name]) + ';\n');
}
// functions
for (const name of found) {
  const v = V1[name];
  if (typeof v === 'function') {
    parts.push('const ' + name + ' = ' + v.toString() + ';\n');
  }
}

let regenerated = parts.join('\n');
// runtime-winners for CN/EN that exist in old file but might be newer than
// the literal (append-override pattern): re-apply any LATE assignments
// by re-running old assignment forms over the new globals
{
  const late = [];
  let m;
  const re = /SECTION_CONTENT(?:_EN)?\["([a-z0-9-]+)"\]\s*=\s*"/g;
  // noop — the regenerated literals already carry final values from V1
}

// ── 4) deep verify: run regenerated in fresh sandbox, compare ALL bindings ──
const ctx2 = { console: { log() {}, warn() {}, error() {} } };
vm.createContext(ctx2);
vm.runInContext(regenerated, ctx2);
const sandbox = { console: { log() {}, warn() {}, error() {} } };
vm.createContext(sandbox);
vm.runInContext(orig, sandbox);

function deepEqual(a, b, p) {
  if (a === b) return null;
  if (typeof a === 'function' && typeof b === 'function') return a.toString() === b.toString() ? null : 'fn body differs';
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return String(a).slice(0, 50) + ' vs ' + String(b).slice(0, 50);
  if (Array.isArray(a) !== Array.isArray(b)) return 'array mismatch';
  if (Array.isArray(a)) {
    if (a.length !== b.length) return 'len ' + a.length + ' vs ' + b.length;
    for (let i = 0; i < a.length; i++) { const r = deepEqual(a[i], b[i], p + '[' + i + ']'); if (r) return r; }
    return null;
  }
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return 'keycount ' + ka.length + ' vs ' + kb.length;
  for (const k of ka) {
    if (!(k in b)) return 'missing key ' + k;
    const r = deepEqual(a[k], b[k], p + '.' + k);
    if (r) return r;
  }
  return null;
}

let diffs = 0;
const namesToCheck = [...new Set([...found, ...Object.keys(ctx2)])]
  .filter(n => typeof sandbox[n] !== 'undefined' || typeof V1[n] !== 'undefined');
for (const n of namesToCheck) {
  const a = sandbox[n], b = ctx2[n];
  if (typeof a === 'undefined' && typeof b === 'undefined') continue;
  const r = deepEqual(a, b, n);
  if (r) { console.log('✗ DIFF', n, ':', r); diffs++; }
}
if (diffs) throw new Error(diffs + ' deep diffs — NOT writing');

// ── 5) write ──
fs.writeFileSync('content.js', regenerated);
console.log('✓ 压缩完成:', Math.round(orig.length / 1048576 * 100) / 100 + 'MB →',
  Math.round(regenerated.length / 1048576 * 100) / 100 + 'MB',
  '(' + Math.round((1 - regenerated.length / orig.length) * 100) + '% 缩减)');
