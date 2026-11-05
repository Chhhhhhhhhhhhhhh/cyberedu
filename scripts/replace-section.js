#!/usr/bin/env node
const fs = require('fs');
const {updateLesson} = require('./lesson-files.js');
const [key, zhFile, enFile] = process.argv.slice(2);
if (!key || !zhFile) throw new Error('usage: replace-section.js <key> <zhFile> [enFile]');
updateLesson(key, language => {
  const file = language === 'zh' ? zhFile : enFile;
  if (file) return fs.readFileSync(file, 'utf8').trim();
});
