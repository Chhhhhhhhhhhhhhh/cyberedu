#!/usr/bin/env node
// Preserve the existing two-language authoring command with canonical lesson files.
if (!process.argv[4]) throw new Error('usage: append-section.js <key> <zhFile> <enFile>');
require('./replace-section.js');
