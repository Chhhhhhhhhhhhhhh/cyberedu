#!/usr/bin/env node
// add missing group i18n keys (zh + en)
const fs = require('fs');
let i18n = fs.readFileSync('i18n.js', 'utf8');
const ICRLF = i18n.includes('\r\n');
const inl = s => ICRLF ? s.replace(/\r?\n/g, '\r\n') : s;
if (!i18n.includes("'ai.grpToday'")) {
  i18n = i18n.replace(inl("    'ai.curSession': '当前对话',"),
    inl("    'ai.curSession': '当前对话',\n    'ai.grpToday': '今天',\n    'ai.grp7d': '7 天内',\n    'ai.grpOlder': '更早',"));
  i18n = i18n.replace(inl("    'ai.curSession': 'Current chat',"),
    inl("    'ai.curSession': 'Current chat',\n    'ai.grpToday': 'Today',\n    'ai.grp7d': 'Last 7 days',\n    'ai.grpOlder': 'Earlier',"));
  fs.writeFileSync('i18n.js', i18n);
  console.log('✓ group keys added');
} else {
  console.log('already present');
}
