#!/usr/bin/env node
// v2.7.6 — AI history: full-panel overlay drawer (replaces the cramped
// 200px side strip). Big-player pattern: full-height drawer with search,
// time-grouped sessions, inline rename, two-step delete, footer actions.
const fs = require('fs');

// ════════ 1) cyberedu.html: replace the history block with overlay markup ════════
let h = fs.readFileSync('cyberedu.html', 'utf8');
const hadCRLF_H = h.includes('\r\n');
if (hadCRLF_H) h = h.replace(/\r\n/g, '\n');

const oldBlock = `  <!-- History sidebar -->
  <div id="ai-history" class="ai-history hidden">
    <div class="ai-history-header">
      <span data-i18n="ai.history">历史会话</span>
      <button class="ai-history-new-btn" data-i18n="ai.newChat" onclick="newAIChat()">+ 新对话</button>
    </div>
    <div id="ai-history-list" class="ai-history-list"></div>
  </div>`;
const newBlock = `  <!-- History: full-panel overlay drawer -->
  <div id="ai-history" class="aih-overlay hidden" role="complementary" aria-label="历史会话">
    <div class="aih-head">
      <span class="aih-head-title" data-i18n="ai.history">历史会话</span>
      <button class="aih-close" onclick="toggleAIHistory()" aria-label="关闭历史会话">✕</button>
    </div>
    <input id="ai-history-search" class="aih-search" type="text" aria-label="搜索会话"
           placeholder="搜索会话…" oninput="_filterHistory(this.value)">
    <div id="ai-history-list" class="aih-list"></div>
    <div class="aih-foot">
      <button class="aih-foot-new" onclick="newAIChat()">＋ 新对话</button>
      <button class="aih-foot-clear" onclick="_clearAllHistory()">清空全部</button>
    </div>
  </div>`;
if (h.split(oldBlock).length - 1 !== 1) throw new Error('html history block not found once');
h = h.replace(oldBlock, newBlock);
if (hadCRLF_H) h = h.replace(/\n/g, '\r\n');
fs.writeFileSync('cyberedu.html', h);
console.log('✓ cyberedu.html: overlay drawer markup');

// ════════ 2) script.js: new render + toggle + rename selector + drawer close ════════
let js = fs.readFileSync('script.js', 'utf8');
const hadCRLF = js.includes('\r\n');
js = js.replace(/\r\n/g, '\n');
let applied = 0;
function rep(oldS, newS, label, expect = 1) {
  const n = js.split(oldS).length - 1;
  if (n !== expect) throw new Error(`[${label}] expected ${expect}, found ${n}`);
  js = js.split(oldS).join(newS);
  applied++;
}

// 2a) toggleAIHistory → drawer open/close with panel state
rep(`function toggleAIHistory() {
  const hist = document.getElementById('ai-history');
  hist.classList.toggle('hidden');
  if (!hist.classList.contains('hidden')) {
    _renderHistoryList();
    _pushHistoryTip = _pushHistoryTip || function() {};
  }
}`,
`function toggleAIHistory() {
  const panel = document.getElementById('ai-chat-panel');
  const hist = document.getElementById('ai-history');
  const opening = hist.classList.contains('hidden');
  hist.classList.toggle('hidden');
  // the drawer covers the whole panel while open
  panel.classList.toggle('history-open', opening);
  if (opening) {
    document.getElementById('ai-settings').classList.add('hidden');
    panel.classList.remove('settings-open');
    window._histQ = '';
    const se = document.getElementById('ai-history-search');
    if (se) se.value = '';
    _renderHistoryList();
    setTimeout(() => { try { se.focus(); } catch (e) {} }, 80);
  }
}`, 'toggle');

// 2b) _renderHistoryList: grouped + searchable + new markup
const renderStart = js.indexOf('function _renderHistoryList() {');
const renderEnd = js.indexOf('\nfunction _fmtRel(ts) {');
if (renderStart < 0 || renderEnd < 0 || renderEnd < renderStart) throw new Error('render bounds not found');
const newRender = `function _renderHistoryList() {
  const container = document.getElementById('ai-history-list');
  const q = (window._histQ || '').toLowerCase();
  const list = _histLoad().filter(s => !q || (s.title || '').toLowerCase().includes(q));
  const now = Date.now();
  const groups = [
    { key: 'ai.grpToday', items: [] },
    { key: 'ai.grp7d', items: [] },
    { key: 'ai.grpOlder', items: [] }
  ];
  // virtual entry for the current (unsaved) chat — newest first
  const currentInList = aiCurrentSessionId && list.some(s => s.id === aiCurrentSessionId);
  if (aiMessages.length && !currentInList) {
    groups[0].items.unshift({
      id: '__current__', title: t('ai.curSession'), time: Date.now(), messages: aiMessages
    });
  }
  for (const s of list) {
    const age = now - (s.time || 0);
    if (age < 86400000) groups[0].items.push(s);
    else if (age < 7 * 86400000) groups[1].items.push(s);
    else groups[2].items.push(s);
  }

  let html = '';
  for (const g of groups) {
    if (!g.items.length) continue;
    html += '<div class="aih-grp">' + t(g.key) + '</div>';
    for (const s of g.items) {
      const isCur = s.id === '__current__';
      const active = s.id === aiCurrentSessionId ? ' active' : '';
      const pending = _pendingDeleteId === s.id;
      const count = (s.messages || []).length;
      if (isCur) {
        html += '<div class="aih-item cur' + active + '">'
          + '<div class="aih-l1"><span class="aih-t">● ' + _escHtml(s.title) + '</span>'
          + '<span class="aih-act del confirm">' + t('ai.unsaved') + '</span></div>'
          + '<div class="aih-l2"><span class="aih-count">' + count + t('ai.msgsUnit') + '</span></div>'
          + '</div>';
        continue;
      }
      html += '<div class="aih-item' + active + '" data-sid="' + s.id + '" onclick="_loadSession(\\'' + s.id + '\\')">'
        + '<div class="aih-l1"><span class="aih-t">' + _escHtml(s.title) + '</span>'
        + '<span class="aih-time">' + _fmtRel(s.time) + '</span></div>'
        + '<div class="aih-l2"><span class="aih-count">' + count + t('ai.msgsUnit') + '</span>'
        + '<span class="aih-acts">'
        + '<span class="aih-act" title="' + t('ai.rename') + '" onclick="event.stopPropagation();_renameSession(\\'' + s.id + '\\')">✎</span>'
        + '<span class="aih-act del' + (pending ? ' confirm' : '') + '" onclick="event.stopPropagation();_deleteSession(\\'' + s.id + '\\')">' + (pending ? '✓' : '✕') + '</span>'
        + '</span></div>'
        + '</div>';
    }
  }
  if (!html) html = '<div class="aih-empty">' + t('ai.noHistory') + '</div>';
  container.innerHTML = html;
}`;
js = js.slice(0, renderStart) + newRender + js.slice(renderEnd);
applied++;

// 2c) _renameSession selector (title element class changed)
rep(`  const item = document.querySelector('[data-sid="' + id + '"] .ai-history-item-title');`,
    `  const item = document.querySelector('[data-sid="' + id + '"] .aih-t');`, 'rename-sel');

// 2d) _loadSession: close the drawer when a session is opened
rep(`  if (aiIsStreaming) { _pushHistoryTip(t('ai.stopFirst')); return; }
  const list = _histLoad();
  const session = list.find(s => s.id === id);
  if (!session) return;`,
`  if (aiIsStreaming) { _pushHistoryTip(t('ai.stopFirst')); return; }
  const panel2 = document.getElementById('ai-chat-panel');
  panel2.classList.remove('history-open');
  document.getElementById('ai-history').classList.add('hidden');
  const list = _histLoad();
  const session = list.find(s => s.id === id);
  if (!session) return;`, 'load-drawer-close');

fs.writeFileSync('script.js', hadCRLF ? js.replace(/\n/g, '\r\n') : js);
console.log('✓ script.js drawer logic —', applied, 'edits');

// ════════ 3) CSS: overlay drawer (id-scoped = beats all legacy rules) ════════
let css = fs.readFileSync('style.css', 'utf8');
if (!css.includes('aih-overlay')) {
  const CR = css.includes('\r\n');
  const block = (CR ? '\r\n' : '') + [
    '',
    '/* ── AI history: full-panel overlay drawer (v2.7.6) ── */',
    '#ai-history.aih-overlay{',
    '  position:absolute;inset:0;z-index:20;width:auto;',
    '  display:flex;flex-direction:column;gap:0;',
    '  background:var(--bg-panel);border-right:none;',
    '  animation:aihIn .18s ease-out;',
    '}',
    '@keyframes aihIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}',
    '.aih-head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 10px;flex-shrink:0}',
    '.aih-head-title{font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted)}',
    '.aih-close{width:26px;height:26px;border:1px solid var(--border-subtle);background:none;border-radius:6px;color:var(--text-muted);cursor:pointer;font-size:12px;transition:all var(--transition)}',
    '.aih-close:hover{color:var(--text-main);border-color:var(--border-mid)}',
    '.aih-search{',
    '  margin:0 16px 12px;padding:9px 12px;flex-shrink:0;',
    '  background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:8px;',
    '  color:var(--text-main);font-size:12px;outline:none;font-family:inherit;',
    '  transition:border-color var(--transition);',
    '}',
    '.aih-search:focus{border-color:var(--color-green)}',
    '.aih-search::placeholder{color:var(--text-muted)}',
    '.aih-list{flex:1;overflow-y:auto;padding:0 10px 10px;display:flex;flex-direction:column;gap:6px;min-height:0}',
    '.aih-grp{font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.2px;padding:10px 6px 4px}',
    '.aih-item{',
    '  position:relative;display:block;padding:9px 12px;',
    '  border:1px solid var(--border-subtle);border-left:2px solid var(--border-subtle);',
    '  border-radius:8px;cursor:pointer;',
    '  transition:background var(--transition),border-color var(--transition);',
    '}',
    '.aih-item:hover{background:rgba(255,255,255,0.04);border-color:var(--border-mid)}',
    '.aih-item.active,.aih-item.cur{border-left-color:var(--color-green);background:rgba(0,255,136,0.05)}',
    '.aih-item.cur .aih-t{color:var(--color-green)}',
    '.aih-l1{display:flex;justify-content:space-between;align-items:center;gap:8px}',
    '.aih-t{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;color:var(--text-secondary)}',
    '.aih-time{font-size:10px;color:var(--text-muted);flex-shrink:0}',
    '.aih-l2{display:flex;justify-content:space-between;align-items:center;margin-top:4px}',
    '.aih-count{font-size:10px;color:var(--text-muted)}',
    '.aih-acts{display:flex;gap:8px;opacity:0;transition:opacity .15s}',
    '.aih-item:hover .aih-acts{opacity:1}',
    '.aih-act{font-size:10px;color:var(--text-muted);cursor:pointer;padding:1px 5px;border-radius:3px;transition:all .15s}',
    '.aih-act:hover{color:var(--color-green);background:rgba(0,255,136,0.08)}',
    '.aih-act.del:hover{color:#ff6b6b;background:rgba(255,77,107,0.08)}',
    '.aih-act.confirm{color:#fff;background:#ff4d6b}',
    '.aih-empty{padding:26px 14px;text-align:center;font-size:11px;color:var(--text-muted)}',
    '.aih-foot{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--border-subtle);flex-shrink:0}',
    '.aih-foot-new{',
    '  flex:1;padding:8px 10px;border-radius:8px;font-size:12px;cursor:pointer;',
    '  background:var(--color-green);color:#04120a;border:1px solid var(--color-green);',
    '  font-weight:600;transition:filter var(--transition);',
    '}',
    '.aih-foot-new:hover{filter:brightness(1.12)}',
    '.aih-foot-clear{',
    '  padding:8px 12px;border-radius:8px;font-size:11px;cursor:pointer;',
    '  background:none;border:1px solid var(--border-subtle);color:var(--text-muted);',
    '  transition:all var(--transition);',
    '}',
    '.aih-foot-clear:hover{color:#ff6b6b;border-color:#ff6b6b}',
    '.aih-foot-spacer{flex:1}',
    '#ai-history-tip{z-index:30}',
    '.ai-chat-panel.history-open .ai-messages,',
    '.ai-chat-panel.history-open .ai-chat-input-area,',
    '.ai-chat-panel.history-open .ai-settings{display:none}',
    '[data-theme="light"] #ai-history.aih-overlay{background:#fafbfc}',
    '[data-theme="light"] .aih-item:hover{background:rgba(0,0,0,0.03)}',
    '[data-theme="light"] .aih-item.active,[data-theme="light"] .aih-item.cur{background:rgba(22,163,74,0.06)}'
  ].join(CR ? '\r\n' : '\n');
  css += block;
  fs.writeFileSync('style.css', css);
  console.log('✓ style.css: overlay drawer styles');
} else {
  console.log('overlay styles already present');
}
