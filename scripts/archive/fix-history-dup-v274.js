#!/usr/bin/env node
// fix: the virtual "Current chat" entry duplicated the already-saved
// current session. It must only appear when the in-memory chat is NOT
// yet represented in the saved list.
const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');
const hadCRLF = js.includes('\r\n');
js = js.replace(/\r\n/g, '\n');

const oldS = `  // virtual entry for the CURRENT chat (even if unsaved)
  const isCurrentSaved = aiCurrentSessionId && list.some(s => s.id === aiCurrentSessionId);
  if (aiMessages.length || aiCurrentSessionId === null) {`;
const newS = `  // virtual entry ONLY when the in-memory chat is not in the saved list
  // (otherwise it would duplicate the already-saved session above it)
  const currentInList = aiCurrentSessionId && list.some(s => s.id === aiCurrentSessionId);
  if (aiMessages.length && !currentInList) {`;

const n = js.split(oldS).length - 1;
if (n !== 1) throw new Error('anchor found ' + n + ' times');
js = js.replace(oldS, newS);
fs.writeFileSync('script.js', hadCRLF ? js.replace(/\n/g, '\r\n') : js);
console.log('✓ duplicate current-chat entry fixed');
