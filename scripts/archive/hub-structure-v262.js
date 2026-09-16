#!/usr/bin/env node
// v2.6.2 learning-hub structure fixes:
//   1) module order: move network before cryptography (fixes TLS-before-HTTP
//      dependency inversion and the home-page-vs-hub ordering contradiction)
//   2) sidebar: numbered sections (01. 02. …) for visible progression
const fs = require('fs');
let c = fs.readFileSync('content.js', 'utf8');
let applied = 0;

// ── 1) reorder modules ──
const ms = c.indexOf('const MODULES');
const me = c.indexOf('\n];', ms);
const seg = c.slice(ms, me);
const bounds = {};
const ids = ['programming', 'cryptography', 'network', 'websec', 'pentest', 'malware', 'ctf-guide'];
for (const id of ids) {
  const re = new RegExp('\\{\\s*id: "' + id + '"');
  const probe = seg.match(re);
  if (!probe) throw new Error('module opener not found: ' + id);
  bounds[id] = probe.index;
}
// skip if already in target order (idempotent)
const sorted = ids.slice().sort((a, b) => bounds[a] - bounds[b]);
const newOrder = ['programming', 'network', 'cryptography', 'websec', 'pentest', 'malware', 'ctf-guide'];
if (sorted.join('|') === newOrder.join('|')) {
  console.log('module order already correct — skip reorder');
} else {
  // each block starts at its opener `{ id: ...` and ends where the next opener
  // begins — openers travel WITH their module, so reordering is rotation-free
  const blocks = {};
  sorted.forEach((id, i) => {
    const end = i + 1 < sorted.length ? bounds[sorted[i + 1]] : seg.length;
    blocks[id] = seg.slice(bounds[id], end);
  });
  const header = seg.slice(0, bounds[sorted[0]]);
  c = c.slice(0, ms) + header + newOrder.map(id => blocks[id]).join('') + c.slice(me);
  applied++;
  console.log('✓ module order →', newOrder.join(' → '));
  fs.writeFileSync('content.js', c);   // persist reorder immediately (idempotent)
}

// ── 2) numbered sections in sidebar (lives in script.js) ──
let js = fs.readFileSync('script.js', 'utf8');
const oldLoop = `    for (const c of m.chapters) {
      for (const s of c.sections) {
        const done = getSectionDone(s.id);
        const sTitle = getSectionField(s,'title');
        html += \`<button class="sidebar-chapter-btn \${s.id===currentSectionId?'active':''} \${done?'done':''}"
          onclick="loadSection('\${m.id}','\${s.id}')">\${sTitle}\${done?'<span class="sidebar-chap-done">✓</span>':''}</button>\`;
      }
    }`;
const newLoop = `    let secNum = 0;
    for (const c of m.chapters) {
      for (const s of c.sections) {
        secNum++;
        const done = getSectionDone(s.id);
        const sTitle = getSectionField(s,'title');
        html += \`<button class="sidebar-chapter-btn \${s.id===currentSectionId?'active':''} \${done?'done':''}"
          onclick="loadSection('\${m.id}','\${s.id}')"><span class="sidebar-prac-num">\${String(secNum).padStart(2,'0')}.</span> \${sTitle}\${done?'<span class="sidebar-chap-done">✓</span>':''}</button>\`;
      }
    }`;
const CRLF = js.includes('\r\n');
const nl = s => CRLF ? s.replace(/\r?\n/g, '\r\n') : s;
const oldLoopC = nl(oldLoop);
const newLoopC = nl(newLoop);
if (js.split(oldLoopC).length - 1 !== 1) throw new Error('sidebar loop anchor not found exactly once');
js = js.replace(oldLoopC, newLoopC);
fs.writeFileSync('script.js', js);
applied++;
console.log('✓ sidebar sections numbered (01. 02. …)');

fs.writeFileSync('content.js', c);
console.log('applied:', applied);
