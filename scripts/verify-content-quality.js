#!/usr/bin/env node
// Verify the curriculum index against both languages and their answer choices.
const {MODULES, SECTION_CONTENT: CN, SECTION_CONTENT_EN: EN, SECTION_CHECKPOINTS: zhQuiz, SECTION_CHECKPOINTS_EN: enQuiz} = require('../content.js');
const keys = MODULES.flatMap(m => m.chapters.flatMap(c => c.sections.map(s => s.contentKey)));
const cnKeys = keys, enKeys = keys;
let pass = 0, fail = [];
for (const k of cnKeys) {
  const v = CN[k];
  const ok = v && v.includes('本章你将学会') && (v.includes('动手练习') || v.includes('本章小结'));
  ok ? pass++ : fail.push('CN ' + k);
}
for (const k of enKeys) {
  const v = EN[k];
  if (!v || v.length < 500) { fail.push('EN ' + k + ' (empty/thin)'); continue; }
  const ok = v.includes('What You Will Learn') && (v.includes('Exercises') || v.includes('Chapter Summary'));
  ok ? pass++ : fail.push('EN ' + k);
}
for (const key of keys) {
  for (const quiz of [zhQuiz[key], enQuiz[key]]) {
    if (!Array.isArray(quiz) || quiz.length !== 2 || quiz.some(q => !q.question || !q.explanation ||
        !Array.isArray(q.options) || !Number.isInteger(q.answer) || !q.options[q.answer])) fail.push('Quiz ' + key);
  }
}
console.log(`content template gate: ${pass}/${cnKeys.length + enKeys.length} OK`);
if (fail.length) { console.log('MISSING FRAME:', fail.join(' | ')); process.exit(1); }
