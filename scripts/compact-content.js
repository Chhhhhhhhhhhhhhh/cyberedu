#!/usr/bin/env node
// Re-serialize the canonical module packs without changing their runtime values.
const { MODULES } = require('../content.js');
const { savePack } = require('./lesson-files.js');
for (const mod of MODULES) for (const lang of ['zh', 'en']) {
  savePack(mod.id, lang, require('../lessons/' + mod.id + '.' + lang + '.js'));
}
