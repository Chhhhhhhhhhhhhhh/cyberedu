#!/usr/bin/env node
// CTF content derivability verifier — solves all 28 challenges the way a
// learner would (decode / decrypt / grep the artifact / hit the simulator)
// and asserts every derived answer matches flags-hash.js.
const fs = require('fs');
const crypto = require('crypto');
const { FLAG_HASHES, normalizeFlagInput } = require('../flags-hash.js');

const c = fs.readFileSync('content.js', 'utf8');
const record = {};
for (const m of c.matchAll(/\{ id: "(ctf-\d{3})"/g)) {
  const start = m.index;
  const next = c.indexOf('{ id: "ctf-', start + 10);
  record[m[1]] = c.slice(start, next === -1 ? start + 14000 : next);
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

// ── text-embedded artifact challenges ──
for (const id of ['ctf-005','ctf-006','ctf-010','ctf-013','ctf-015','ctf-018',
                  'ctf-021','ctf-023','ctf-024','ctf-025','ctf-026','ctf-027','ctf-028']) {
  const m = record[id].match(/flag\{[a-z0-9_]+\}/i);
  report(id, 'artifact-grep', m && m[0], !!m && okHash(id, m[0]));
}

// ── 002: ROT13 the desc ciphertext (answer phrased as "The flag is X") ──
{
  const ct = record['ctf-002'].match(/desc: "([^"]+)"/)[1];
  const dec = rot13(ct);
  const m = dec.match(/flag is ([a-z0-9_]+)/i);
  const ans = m ? 'flag{' + m[1] + '}' : null;
  report('ctf-002', 'rot13', ans, !!m && okHash('ctf-002', ans));
}

// ── 009: decode the 6-layer base64 chain from desc ──
{
  const ct = record['ctf-009'].match(/desc: "([A-Za-z0-9+/=]{40,})"/)[1];
  let s = ct;
  for (let i = 0; i < 8; i++) { s = Buffer.from(s, 'base64').toString('utf8'); if (s.includes('flag{')) break; }
  const m = s.match(/flag\{[a-z0-9_]+\}/i);
  report('ctf-009', 'base64×6', m && m[0], !!m && okHash('ctf-009', m[0]));
}

// ── 014: XOR-0xFF the embedded hex (whitespace/newline tolerant) ──
{
  // content.js stores line breaks as literal \n escapes — decode before parsing
  const blob = record['ctf-014'].replace(/\\r\\n/g, ' ').replace(/\\n/g, ' ').replace(/#\s?/g, '');
  const hexRun = blob.match(/(?:[0-9a-f]{2}[\s]+){10,}[0-9a-f]{2}/);
  const bytes = Buffer.from(hexRun[0].replace(/\s+/g, ''), 'hex').map(b => b ^ 0xff).toString('utf8');
  const m = bytes.match(/flag\{[a-z0-9_]+\}/i);
  report('ctf-014', 'xor-0xff', m && m[0], !!m && okHash('ctf-014', m[0]));
}

// ── 017: Vigenère decrypt with the derived key 'cat' ──
{
  const ct = record['ctf-017'].match(/Nogi azq[^"\\]+(?:\\n[^"\\]+)*/);
  const cipherText = ct[0].replace(/\\n/g, ' ');
  const key = 'cat';
  let out = '', ki = 0;
  for (const ch of cipherText) {
    if (/[a-z]/i.test(ch)) {
      const base = ch === ch.toLowerCase() ? 97 : 65;
      const k = key[ki % 3].toLowerCase().charCodeAt(0) - 97;
      out += String.fromCharCode((ch.charCodeAt(0) - base - k + 52) % 26 + base);
      ki++;
    } else out += ch;
  }
  const m = out.match(/flag\{[a-z0-9_]+\}/i);
  report('ctf-017', 'vigenere(cat)', m && m[0], !!m && okHash('ctf-017', m[0]));
}

// ── 022: DNS tunnel labels → concat → base64 ──
{
  const labels = [...record['ctf-022'].matchAll(/([A-Za-z0-9+/=]{8,28})\.c2\.exfil\.com/g)].map(m => m[1]);
  const note = Buffer.from(labels.join(''), 'base64').toString('utf8');
  const m = note.match(/flag\{[a-z0-9_]+\}/i);
  report('ctf-022', 'dns-tunnel', m && m[0], !!m && okHash('ctf-022', m[0]));
}

// ── 001 / 007 / 011: real crypto from the embedded numbers ──
const B = { pow: (b, e, m) => { let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; },
  inv: (a, m) => { let [g, x] = B.egcd(a % m, m); if (g !== 1n) throw 0; return ((x % m) + m) % m; },
  egcd: (a, b) => { if (b === 0n) return [a, 1n, 0n]; const [g, x, y] = B.egcd(b, a % b); return [g, y, x - (a / b) * y]; },
  isqrt: n => { if (n < 2n) return n; let x = n, y = (x + 1n) / 2n; while (y < x) { x = y; y = (x + n / x) / 2n; } return x; },
  iroot: (n, k) => { if (n < 2n) return n; let x = 1n << (BigInt(n.toString(2).length) / BigInt(k) + 2n);
    while (true) { const nx = ((BigInt(k) - 1n) * x + n / x ** (BigInt(k) - 1n)) / BigInt(k); if (nx >= x) break; x = nx; } return x; } };
const bnBytes = bn => Buffer.from(bn.toString(16).padStart(Math.ceil(bn.toString(16).length / 2) * 2, '0'), 'hex');
{
  // 001: small factor named in writeup
  const rec = record['ctf-001'];
  const n = BigInt(rec.match(/n = (\d{15,})/)[1]);
  const ctn = BigInt(rec.match(/c = (\d{15,})/)[1]);
  const p = BigInt(rec.match(/p = (\d{6,})/)[1]);
  const q = n / p;
  const d = B.inv(65537n, (p - 1n) * (q - 1n));
  const ans = bnBytes(B.pow(ctn, d, n)).toString('utf8');
  report('ctf-001', 'rsa(small-p)', ans, okHash('ctf-001', ans));
}
{
  // 007: Fermat factorization on embedded n
  const rec = record['ctf-007'];
  const n = BigInt(rec.match(/n = (\d{15,})/)[1]);
  const ctn = BigInt(rec.match(/c = (\d{15,})/)[1]);
  let a = B.isqrt(n), b, it = 0;
  while (true) { const b2 = a * a - n, r = B.isqrt(b2); if (r * r === b2) { b = r; break; } a++; if (++it > 1e6) throw new Error('fermat'); }
  const p = a + b, q = a - b;
  const d = B.inv(65537n, (p - 1n) * (q - 1n));
  const ans = bnBytes(B.pow(ctn, d, n)).toString('utf8');
  report('ctf-007', `fermat(${it} iters)`, ans, okHash('ctf-007', ans));
}
{
  // 011: Håstad — CRT three congruences, cube root
  const rec = record['ctf-011'];
  const ns = [1, 2, 3].map(i => BigInt(rec.match(new RegExp(`n${i} = (\\d{15,})`))[1]));
  const cs = [1, 2, 3].map(i => BigInt(rec.match(new RegExp(`c${i} = (\\d{15,})`))[1]));
  let [a1, m1] = [cs[0], ns[0]];
  for (let i = 1; i < 3; i++) {
    const [a2, m2] = [cs[i], ns[i]];
    const t = ((a2 - a1) % m2 + m2) * B.inv(m1 % m2, m2) % m2;
    a1 = a1 + m1 * t; m1 = m1 * m2;
  }
  const m = B.iroot(a1, 3);
  const ans = bnBytes(m).toString('utf8');
  report('ctf-011', 'hastad-crt', ans, okHash('ctf-011', ans));
}

// ── summary of offline section ──
const fails = results.filter(r => !r.ok);
console.log(`\noffline derivability: ${results.length - fails.length}/${results.length} OK`);
if (fails.length) { console.log('FAILURES:', JSON.stringify(fails, null, 1)); process.exit(2); }
