#!/usr/bin/env node
// Privacy scanner — scans the working tree for common personal-identifier
// and machine-specific leaks before they reach a public repository.
//
// Usage: node scripts/privacy-scan.js
// Exit 1 if anything suspicious is found (safe to use as a CI gate).
//
// Extend coverage locally (without committing) by creating
// privacy-local-patterns.txt in the repo root: one regex per line.
// That file is gitignored — keep your private watch-lists there.
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const BIN_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.mp4', '.webm', '.zip', '.gz']);

const files = [];
(function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p); }
    else if (e.isFile() && !BIN_EXT.has(path.extname(e.name).toLowerCase())) files.push(p);
  }
})(ROOT);

// Generic patterns only — no project/user-specific terms in this list.
const PATTERNS = [
  ['drive-letter path', /\b[A-Za-z]:[\\/](?:Users|home|Documents|workspace)/],
  ['Windows user profile', /[A-Za-z]:[\\/]+Users[\\/]+[^\\/"':*?<>|]{1,40}/],
  ['unix home dir', /\/home\/[a-z0-9_-]{2,}\//i],
  ['API key (sk-)', /sk-[A-Za-z0-9_-]{16,}/],
  ['AWS access key', /AKIA[0-9A-Z]{16}/],
  ['private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['generic email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
  ['github token', /gh[pousr]_[A-Za-z0-9]{20,}/],
];

// Extra LOCAL patterns (never committed)
const localFile = path.join(ROOT, 'privacy-local-patterns.txt');
const localPatterns = [];
if (fs.existsSync(localFile)) {
  for (const line of fs.readFileSync(localFile, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    try { localPatterns.push([t, new RegExp(t, 'gi')]); } catch {}
  }
}

let hits = 0;
const ALLOW_SUBSTR = ['example.com', 'example.org', 'evil.com', 'attacker', 'ns1.google', 'noreply', 'team.io', '/home/ctf', 'sqlsvc', 'svc', 'demo', 'your-', 'your_', '<', 'localhost', 'user', 'test', '/home/alice', 'begin rsa private key', '@app.', 'corp.local', 'cyberedu.com', 'targetcorp.com', 'company.com', 'cybershop.com', 'corp.com'];

for (const f of files) {
  let text;
  try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  for (const [name, re] of PATTERNS) {
    const ms = text.match(new RegExp(re.source, 'gi')) || [];
    const AL = ALLOW_SUBSTR.map(a => a.toLowerCase());
    const uniq = [...new Set(ms)].filter(v => !AL.some(a => v.toLowerCase().includes(a)));
    if (uniq.length) {
      hits++;
      console.log(`[${name}] ${path.relative(ROOT, f)} → ${uniq.slice(0, 4).join(' ')}`);
    }
  }
  for (const [name, re] of localPatterns) {
    const ms = text.match(re) || [];
    if (ms.length) {
      hits++;
      console.log(`[local rule] ${path.relative(ROOT, f)} → ${ms.slice(0, 3).join(' ')}`);
    }
  }
}

console.log(hits === 0
  ? '✓ privacy scan clean'
  : `\n✗ ${hits} finding(s) — review each before pushing`);
process.exit(hits === 0 ? 0 : 1);
