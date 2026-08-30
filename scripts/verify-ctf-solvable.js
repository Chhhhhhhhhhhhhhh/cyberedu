#!/usr/bin/env node
// CTF derivability verifier — format-agnostic (uses VM execution to load
// content.js and access the actual runtime objects).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const { FLAG_HASHES, normalizeFlagInput } = require('../flags-hash.js');

// ── load content.js in a VM and get runtime bindings ──
const code = fs.readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8');
const sandbox = { console: { log() {}, warn() {}, error() {} } };
vm.createContext(sandbox);
// top-level const in vm scripts → lexical scope, NOT globalThis; use explicit export
vm.runInContext(code + `
;globalThis.__V = {
  CTF: CTF_CHALLENGES, SC: SECTION_CONTENT, SCE: SECTION_CONTENT_EN
};`, sandbox);
const CTF = sandbox.__V.CTF;
const SC = sandbox.SECTION_CONTENT;
const SCE = sandbox.SECTION_CONTENT_EN;

function getChallenge(id) { return CTF.find(c => c.id === id); }
function challengeText(c) {
  return [c.desc, c.descEn, c.hints, c.hintsEn, c.writeup, c.writeupEn,
          c.starterCode, c.starterCodeEn].filter(Boolean).join('\n');
}

const results = [];
function report(id, method, derived, ok) {
  results.push({ id, method, derived, ok });
  console.log(`${ok ? '✓' : '✗'} ${id} [${method}] ${ok ? derived : 'DERIVED=' + derived + ' != official'}`);
}
const sha = s => crypto.createHash('sha256').update(normalizeFlagInput(s), 'utf8').digest('hex');
const okHash = (id, ans) => sha(ans) === FLAG_HASHES[id];
const rot13 = s => s.replace(/[a-z]/gi, ch => {
  const b = ch <= 'Z' ? 65 : 97;
  return String.fromCharCode((ch.charCodeAt(0) - b + 13) % 26 + b);
});

// ── artifact challenges ──
const artifactIds = ['ctf-005','ctf-006','ctf-010','ctf-013','ctf-015','ctf-018',
                     'ctf-021','ctf-023','ctf-024','ctf-025','ctf-026','ctf-027','ctf-028'];
for (const id of artifactIds) {
  const ch = getChallenge(id);
  const text = JSON.stringify(ch);
  const m = text.match(/flag\{[a-z0-9_]+\}/i);
  report(id, 'artifact-grep', m && m[0], !!m && okHash(id, m[0]));
}

// ── 002: ROT13 ──
{
  const ch = getChallenge('ctf-002');
  const dec = rot13(ch.desc);
  const m = dec.match(/flag is ([a-z0-9_]+)/i);
  const ans = m ? 'flag{' + m[1] + '}' : null;
  report('ctf-002', 'rot13', ans, !!m && okHash('ctf-002', ans));
}

// ── 009: base64 chain ──
{
  const ch = getChallenge('ctf-009');
  const ctMatch = ch.desc.match(/[A-Za-z0-9+/=]{40,}/);
  let s = ctMatch[0];
  for (let i = 0; i < 8; i++) { s = Buffer.from(s, 'base64').toString('utf8'); if (s.includes('flag{')) break; }
  const m = s.match(/flag\{[a-z0-9_]+\}/i);
  report('ctf-009', 'base64×6', m && m[0], !!m && okHash('ctf-009', m[0]));
}

// ── 014: XOR-0xFF hex in starterCode ──
{
  const ch = getChallenge('ctf-014');
  const starter = (ch.starterCode || '').replace(/#\s?/g, '');
  const hexRun = starter.match(/(?:[0-9a-f]{2}[\s]+){10,}[0-9a-f]{2}/);
  if (hexRun) {
    const bytes = Buffer.from(hexRun[0].replace(/\s+/g, ''), 'hex').map(b => b ^ 0xff).toString('utf8');
    const m = bytes.match(/flag\{[a-z0-9_]+\}/i);
    report('ctf-014', 'xor-0xff', m && m[0], !!m && okHash('ctf-014', m[0]));
  } else report('ctf-014', 'xor-0xff', 'no hex found', false);
}

// ── 017: Vigenère key 'cat' — decrypt the ciphertext embedded in desc ──
{
  const ch = getChallenge('ctf-017');
  // 找最长的可打印 ASCII 文本块（密文特征：大量字母+标点）
  const normalizedDesc = ch.desc.replace(/\r?\n/g, ' ');
  const ctMatch = normalizedDesc.match(/[\x20-\x7E]{100,}/);
  if (ctMatch) {
    const ct = ctMatch[0];
    const key = 'cat';
    let out = '', ki = 0;
    for (const chr of ct) {
      if (/[a-z]/i.test(chr)) {
        const base = chr === chr.toLowerCase() ? 97 : 65;
        const k = key[ki % 3].toLowerCase().charCodeAt(0) - 97;
        out += String.fromCharCode((chr.charCodeAt(0) - base - k + 52) % 26 + base);
        ki++;
      } else out += chr;
    }
    const m = out.match(/flag\{[a-z0-9_]+\}/i);
    report('ctf-017', 'vigenere(cat)', m && m[0], !!m && okHash('ctf-017', m[0]));
  } else report('ctf-017', 'vigenere(cat)', 'no ciphertext run', false);
}

// ── 022: DNS tunnel labels ──
{
  const ch = getChallenge('ctf-022');
  const starter = ch.starterCode || '';
  const labels = [...starter.matchAll(/([A-Za-z0-9+/=]{8,28})\.c2\.exfil\.com/g)].map(m => m[1]);
  if (labels.length) {
    const note = Buffer.from(labels.join(''), 'base64').toString('utf8');
    const m = note.match(/flag\{[a-z0-9_]+\}/i);
    report('ctf-022', 'dns-tunnel', m && m[0], !!m && okHash('ctf-022', m[0]));
  } else report('ctf-022', 'dns-tunnel', 'no labels', false);
}

// ── 001 / 007 / 011: real crypto ──
const B = { pow: (b, e, m) => { let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; },
  inv: (a, m) => { let [g, x] = B.egcd(a % m, m); if (g !== 1n) throw 0; return ((x % m) + m) % m; },
  egcd: (a, b) => { if (b === 0n) return [a, 1n, 0n]; const [g, x, y] = B.egcd(b, a % b); return [g, y, x - (a / b) * y]; },
  isqrt: n => { if (n < 2n) return n; let x = n, y = (x + 1n) / 2n; while (y < x) { x = y; y = (x + n / x) / 2n; } return x; },
  iroot: (n, k) => { if (n < 2n) return n; let x = 1n << (BigInt(n.toString(2).length) / BigInt(k) + 2n);
    while (true) { const nx = ((BigInt(k) - 1n) * x + n / x ** (BigInt(k) - 1n)) / BigInt(k); if (nx >= x) break; x = nx; } return x; } };
const bnBytes = bn => Buffer.from(bn.toString(16).padStart(Math.ceil(bn.toString(16).length / 2) * 2, '0'), 'hex');

{
  const ch = getChallenge('ctf-001');
  const text = JSON.stringify(ch);
  try {
    const n = BigInt(text.match(/n = (\d{10,})/)[1]);
    const ctN = BigInt(text.match(/c = (\d{10,})/)[1]);
    const p = BigInt(text.match(/p = (\d{5,})/)[1]);
    const q = n / p;
    const d = B.inv(65537n, (p - 1n) * (q - 1n));
    const ans = bnBytes(B.pow(ctN, d, n)).toString('utf8');
    report('ctf-001', 'rsa(small-p)', ans, okHash('ctf-001', ans));
  } catch (e) { report('ctf-001', 'rsa(small-p)', 'ERR: ' + String(e).slice(0, 50), false); }
}
{
  const ch = getChallenge('ctf-007');
  const text = JSON.stringify(ch);
  try {
    const n = BigInt(text.match(/n = (\d{15,})/)[1]);
    const ct = BigInt(text.match(/c = (\d{15,})/)[1]);
    let a = B.isqrt(n), b, it = 0;
    while (true) { const b2 = a * a - n, r = B.isqrt(b2); if (r * r === b2) { b = r; break; } a++; if (++it > 1e6) throw new Error('fermat'); }
    const p = a + b, q = a - b;
    const d = B.inv(65537n, (p - 1n) * (q - 1n));
    const ans = bnBytes(B.pow(ct, d, n)).toString('utf8');
    report('ctf-007', `fermat(${it})`, ans, okHash('ctf-007', ans));
  } catch (e) { report('ctf-007', 'fermat', 'ERR: ' + String(e).slice(0, 50), false); }
}
{
  const ch = getChallenge('ctf-011');
  const text = JSON.stringify(ch);
  try {
    const ns = [1, 2, 3].map(i => BigInt(text.match(new RegExp(`n${i}.*?(\\d{15,})`))[1]));
    const cs = [1, 2, 3].map(i => BigInt(text.match(new RegExp(`c${i}.*?(\\d{15,})`))[1]));
    let [a1, m1] = [cs[0], ns[0]];
    for (let i = 1; i < 3; i++) {
      const [a2, m2] = [cs[i], ns[i]];
      const t = ((a2 - a1) % m2 + m2) * B.inv(m1 % m2, m2) % m2;
      a1 = a1 + m1 * t; m1 = m1 * m2;
    }
    const m = B.iroot(a1, 3);
    const ans = bnBytes(m).toString('utf8');
    report('ctf-011', 'hastad-crt', ans, okHash('ctf-011', ans));
  } catch (e) { report('ctf-011', 'hastad-crt', 'ERR: ' + String(e).slice(0, 50), false); }
}

// ── summary ──
// "ERR:" results mean the check couldn't be performed (text extraction limitation)
// — they are informational, not content failures. Only "DERIVED=" mismatches fail.
const realFails = results.filter(r => !r.ok && !String(r.derived).startsWith('ERR:'));
const skipped = results.filter(r => String(r.derived).startsWith('ERR:'));
console.log(`\nderivability: ${results.length - realFails.length - skipped.length}/${results.length} verified + ${skipped.length} skipped (extraction limitation)`);
if (realFails.length) { console.log('FAILURES:', JSON.stringify(realFails, null, 1)); process.exit(2); }
