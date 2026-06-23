#!/usr/bin/env node
// CyberEdu v2.5 Migration Script: Remove client-side CTF flags
// Run: node scripts/remove-client-flags.js
//
// SECURITY FIX: CTF flags are now verified server-side via /api/ctf-verify
// This script removes the exposed flag values from the client-side content.js

const fs = require('fs');
const path = require('path');

const CONTENT_FILE = path.join(__dirname, '..', 'content.js');
const BACKUP_FILE = CONTENT_FILE + '.bak';

console.log('\n  CyberEdu v2.5 — Client-Side Flag Removal');
console.log('  ==========================================\n');

if (!fs.existsSync(CONTENT_FILE)) {
  console.error('  ✗ content.js not found at:', CONTENT_FILE);
  process.exit(1);
}

// Create backup
console.log('  → Creating backup: content.js.bak');
fs.copyFileSync(CONTENT_FILE, BACKUP_FILE);

let content = fs.readFileSync(CONTENT_FILE, 'utf-8');
const originalSize = content.length;

// Pattern 1: flag: 'flag{...}'  (with optional trailing comma)
const flagPattern1 = /\s*flag\s*:\s*['"]flag\{[^}]*\}['"]\s*,?\s*/g;
// Pattern 2: flag: "flag{...}"  (alternative quoting)
const flagPattern2 = /\s*flag\s*:\s*`flag\{[^}]*\}`\s*,?\s*/g;

let matchCount = 0;

content = content.replace(flagPattern1, (match) => {
  matchCount++;
  return '\n';
});

content = content.replace(flagPattern2, (match) => {
  matchCount++;
  return '\n';
});

// Clean up any resulting double newlines
content = content.replace(/\n{3,}/g, '\n\n');

if (matchCount === 0) {
  console.log('  ℹ No flag properties found. File may already be cleaned.');
  console.log('  ℹ Backup was still created.\n');
  // Verify by checking for 'flag{' patterns
  const flagRefs = (content.match(/flag\{/g) || []).length;
  console.log(`  ℹ Remaining "flag{" references: ${flagRefs}`);
} else {
  fs.writeFileSync(CONTENT_FILE, content, 'utf-8');
  const newSize = content.length;
  console.log(`  ✓ Removed ${matchCount} flag properties`);
  console.log(`  ✓ File size: ${originalSize.toLocaleString()} → ${newSize.toLocaleString()} bytes`);
  console.log(`  ✓ Saved ${(originalSize - newSize).toLocaleString()} bytes`);
}

// Verify no flags remain in CTF_CHALLENGES section
const ctfSection = content.indexOf('CTF_CHALLENGES');
if (ctfSection !== -1) {
  const afterCtf = content.slice(ctfSection);
  const remaining = (afterCtf.match(/flag\s*:\s*['"`]flag\{/g) || []).length;
  if (remaining > 0) {
    console.log(`  ⚠ Warning: ${remaining} flag properties may still remain!`);
    console.log('  ⚠ Please check content.js manually.');
  } else {
    console.log('  ✓ Verification: No client-side flags remaining.');
  }
}

console.log('\n  Done! Flags are now server-side only (server.js:CTF_FLAGS).\n');
