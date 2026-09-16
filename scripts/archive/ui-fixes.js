#!/usr/bin/env node
// UI fixes: (1) proper content-table styling, (2) AI settings panel occupies
// the full chat window while open (fixes cut-off/overlap at the bottom)
const fs = require('fs');

// ── 1) style.css ──
let css = fs.readFileSync('style.css', 'utf8');
const CRLF = css.includes('\r\n');
const nl = s => CRLF ? s.replace(/\r?\n/g, '\r\n') : s;

if (!css.includes('.article-content table{width:100%')) {
  css += nl(`

/* ── content tables (chapter summary / comparison tables) ── */
.article-content table{
  width:100%;border-collapse:collapse;margin:18px 0 24px;
  font-size:13px;line-height:1.6;
  border:1px solid var(--border-subtle);
}
.article-content table th{
  background:rgba(0,255,136,0.07);color:var(--text-main);
  font-weight:600;text-align:left;
}
.article-content table th,.article-content table td{
  padding:10px 14px;border-bottom:1px solid var(--border-subtle);
}
.article-content table tr:last-child td{border-bottom:none}
.article-content table tbody tr:nth-child(odd){background:rgba(255,255,255,0.025)}
.article-content table tbody tr:hover{background:rgba(0,255,136,0.045)}
[data-theme="light"] .article-content table th{background:rgba(22,163,74,0.08)}
[data-theme="light"] .article-content table tbody tr:nth-child(odd){background:rgba(0,0,0,0.02)}
[data-theme="light"] .article-content table tbody tr:hover{background:rgba(22,163,74,0.05)}

/* ── AI settings fills the whole panel while open ── */
.ai-chat-panel.settings-open .ai-messages,
.ai-chat-panel.settings-open .ai-chat-input-area{display:none}
.ai-chat-panel.settings-open .ai-settings{flex:1;max-height:none;min-height:0}
.ai-chat-panel.settings-open .ai-settings .ai-save-btn:last-of-type{margin-left:0;margin-top:8px}`);
  fs.writeFileSync('style.css', css);
  console.log('✓ style.css: table theme + settings-open layout');
} else {
  console.log('style.css already patched');
}

// ── 2) script.js toggleAISettings ──
let js = fs.readFileSync('script.js', 'utf8');
const JCR = js.includes('\r\n');
const jnl = s => JCR ? s.replace(/\r?\n/g, '\r\n') : s;
const oldFn = jnl(`function toggleAISettings() {
  document.getElementById('ai-settings').classList.toggle('hidden');
}`);
const newFn = jnl(`function toggleAISettings() {
  const panel = document.getElementById('ai-chat-panel');
  const settings = document.getElementById('ai-settings');
  const opening = settings.classList.contains('hidden');
  settings.classList.toggle('hidden');
  // while settings are open, give them the whole window (messages/input hidden via CSS)
  panel.classList.toggle('settings-open', opening);
  if (opening) document.getElementById('ai-history').classList.add('hidden');
}`);
if (js.split(oldFn).length - 1 !== 1) throw new Error('toggleAISettings anchor not found once');
js = js.replace(oldFn, newFn);
fs.writeFileSync('script.js', js);
console.log('✓ script.js: toggleAISettings manages settings-open state');
