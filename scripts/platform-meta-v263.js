#!/usr/bin/env node
// v2.6.3 platform upgrade: article meta bar (difficulty stars + prerequisite hint)
const fs = require('fs');

// ── i18n keys (zh @ ~line124, en @ ~line352) ──
let i18n = fs.readFileSync('i18n.js', 'utf8');
const iCRLF = i18n.includes('\r\n');
const inl = s => iCRLF ? s.replace(/\r?\n/g, '\r\n') : s;
if (!i18n.includes("'section.prereq'")) {
  i18n = i18n.replace(inl("    'section.completed': '✓ 已完成',"),
    inl("    'section.prereq': '建议先完成',\n    'section.completed': '✓ 已完成',"));
  i18n = i18n.replace(inl("    'section.completed': '✓ COMPLETED',"),
    inl("    'section.prereq': 'Finish first:',\n    'section.completed': '✓ COMPLETED',"));
  fs.writeFileSync('i18n.js', i18n);
  console.log('✓ i18n keys added (section.prereq ×2)');
} else {
  console.log('i18n keys already present');
}

// ── script.js loadSection meta bar ──
let js = fs.readFileSync('script.js', 'utf8');
const CRLF = js.includes('\r\n');
const nl = s => CRLF ? s.replace(/\r?\n/g, '\r\n') : s;

if (js.includes('sec-stars')) {
  console.log('meta bar already present — skip');
} else {
  // insert chapter/stars/prereq computation after prevMod/nextMod block
  const calcAnchor = nl(`  if (nextSec) nextMod = MODULES.find(mod => mod.chapters.some(c => c.sections.some(s => s.id === nextSec.id)));`);
  const calcInsert = nl(`  if (nextSec) nextMod = MODULES.find(mod => mod.chapters.some(c => c.sections.some(s => s.id === nextSec.id)));
  const curChap = m.chapters.find(c => c.sections.some(s => s.id === sectionId));
  const starsHtml = curChap && curChap.difficulty
    ? '· <span class="sec-stars">' + '★'.repeat(curChap.difficulty) + '☆'.repeat(5 - curChap.difficulty) + '</span>'
    : '';
  const prereqHtml = (idx > 0 && prevSec)
    ? '· <span class="sec-prereq">' + t('section.prereq') + ' ' + getSectionField(prevSec, 'title') + '</span>'
    : '';`);
  if (js.split(calcAnchor).length - 1 !== 1) throw new Error('calc anchor not found once');
  js = js.replace(calcAnchor, calcInsert);

  // extend reading-time bar
  const barAnchor = nl(`      \${readMin} min read
    </div>`);
  if (js.split(barAnchor).length - 1 !== 1) throw new Error('bar anchor not found once');
  js = js.replace(barAnchor, nl(`      \${readMin} min read \${starsHtml} \${prereqHtml}
    </div>`));
  fs.writeFileSync('script.js', js);
  console.log('✓ meta bar wired into loadSection');
}
