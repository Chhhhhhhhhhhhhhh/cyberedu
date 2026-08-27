#!/usr/bin/env node
// CyberEdu CTF answer hash generator
// Usage: node scripts/gen-flag-hashes.js
//
// Reads plaintext answers from a local source you provide on stdin
// (one line per challenge: "ctf-001 flag{...}"), computes SHA-256 of each
// normalized answer, and rewrites flags-hash.js in the repo root.
//
// Plaintext answers are intentionally NOT stored anywhere in the repo.
// The only durable artifact is the SHA-256 digest file.
//
// Normalization contract (shared by client + server + tests):
//   normalize(s) = s.toLowerCase() with ALL whitespace removed

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const OUT_FILE = path.join(__dirname, '..', 'flags-hash.js');

function sha256Hex(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin });
  const entries = new Map();

  for await (const line of rl) {
    const m = line.match(/^\s*(ctf-\d+)\s+(.+?)\s*$/);
    if (!m) continue;
    const [, id, raw] = m;
    entries.set(id, sha256Hex(raw.replace(/\s+/g, '').toLowerCase()));
  }

  if (entries.size === 0) {
    console.error('  ✗ No entries parsed from stdin.');
    console.error('    Expected lines like:  ctf-001 flag{s0me_4nsw3r}');
    process.exit(1);
  }

  let out = '';
  out += '// CyberEdu CTF answer integrity hashes (SHA-256)\n';
  out += '// Plaintext answers are intentionally NOT shipped — verification compares\n';
  out += '// SHA-256(normalized(input)) against these digests.\n';
  out += '// Normalization shared by client (script.js), server (server.js) and tests:\n';
  out += '//   lowercase, all whitespace removed.\n';
  out += '// Regenerate after changing an answer:  node scripts/gen-flag-hashes.js\n';
  out += 'const FLAG_HASHES = {\n';
  for (const id of [...entries.keys()].sort()) {
    out += `  ${JSON.stringify(id)}: ${JSON.stringify(entries.get(id))},\n`;
  }
  out += '};\n\n';
  out += 'function normalizeFlagInput(s) {\n';
  out += "  return String(s || '').replace(/\\s+/g, '').toLowerCase();\n";
  out += '}\n\n';
  out += "if (typeof module !== 'undefined') { // allow require() in Node (server/tests)\n";
  out += '  module.exports = { FLAG_HASHES, normalizeFlagInput };\n';
  out += '}\n';

  fs.writeFileSync(OUT_FILE, out);
  console.log(`  ✓ Wrote ${OUT_FILE} with ${entries.size} answer hashes.`);
}

main().catch(e => { console.error(e); process.exit(1); });
