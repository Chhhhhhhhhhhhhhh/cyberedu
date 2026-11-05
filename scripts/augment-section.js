#!/usr/bin/env node
const fs = require('fs');
const {updateLesson} = require('./lesson-files.js');
const [key, file] = process.argv.slice(2);
if (!key || !file) throw new Error('usage: augment-section.js <key> <manifest.json>');
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
updateLesson(key, (language, body) => {
  const prefix = language === 'zh' ? 'cn' : 'en';
  const augmented = [manifest[prefix+'Pre'].trim(), body, manifest[prefix+'Post'].trim()].join('\n\n');
  if (manifest[prefix+'Verify'] && !augmented.includes(manifest[prefix+'Verify'])) throw new Error('Missing verification text: ' + language);
  return augmented;
});
