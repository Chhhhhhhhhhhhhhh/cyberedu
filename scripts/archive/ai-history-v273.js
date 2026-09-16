#!/usr/bin/env node
// v2.7.3 — AI history sidebar overhaul
//   • current (unsaved) session shown & protected when switching
//   • rename (inline edit), two-step delete, clear-all with confirm
//   • message count + relative time per session
//   • streaming guard: no switching/new-chat while generating
//   • rebuilt sessions get AI message tools (copy/regen/code-copy)
const fs = require('fs');

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

// ── 1) replace the whole history function group ──
rep(`function _histSave(list) {
  try { localStorage.setItem(AI_HIST_KEY, JSON.stringify(list)); }
  catch(e) {}
}
function _genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }`,
`function _histSave(list) {
  try { localStorage.setItem(AI_HIST_KEY, JSON.stringify(list)); }
  catch(e) {}
}
function _genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Two-step delete: remember which session is pending confirmation
let _pendingDeleteId = null;
let _pendingDeleteTimer = null;`, 'hist-save');

// ── 2) _saveCurrentSession: keep custom titles ──
rep(`function _saveCurrentSession() {
  if (!aiMessages.length) return;
  const id = aiCurrentSessionId || _genId();
  const title = aiMessages[0]?.content?.slice(0, 30) || '新对话';
  const list = _histLoad();
  const idx = list.findIndex(s => s.id === id);
  const entry = { id, title, messages: aiMessages, time: Date.now() };
  if (idx >= 0) list[idx] = entry; else list.unshift(entry);
  // Keep max 50 sessions
  while (list.length > 50) list.pop();
  _histSave(list);
  aiCurrentSessionId = id;
}`,
`function _saveCurrentSession() {
  if (!aiMessages.length) return;
  const id = aiCurrentSessionId || _genId();
  const list = _histLoad();
  const prev = list.find(s => s.id === id);
  const autoTitle = (aiMessages[0]?.content || '').replace(/\\s+/g, ' ').trim().slice(0, 30) || t('ai.curSession');
  const entry = {
    id,
    title: (prev && prev.customTitle) ? prev.title : autoTitle,   // keep renamed titles
    customTitle: prev ? !!prev.customTitle : false,
    messages: aiMessages, time: Date.now()
  };
  const idx = list.findIndex(s => s.id === id);
  if (idx >= 0) list[idx] = entry; else list.unshift(entry);
  while (list.length > 50) list.pop();
  _histSave(list);
  aiCurrentSessionId = id;
}`, 'save-current');

// ── 3) _loadSession: guard streaming + save unsaved current + attach tools ──
rep(`function _loadSession(id) {
  const list = _histLoad();
  const session = list.find(s => s.id === id);
  if (!session) return;
  aiCurrentSessionId = id;
  aiMessages = session.messages.slice(); // deep copy references
  // Rebuild UI messages
  const box = document.getElementById('ai-messages');
  box.innerHTML = '';
  for (const m of aiMessages) {
    if (m.role === 'system') continue; // skip system messages in display
    addAIMsg(m.role, m.content);
  }
  _renderHistoryList();
}`,
`function _loadSession(id) {
  if (aiIsStreaming) { _pushHistoryTip(t('ai.stopFirst')); return; }
  const list = _histLoad();
  const session = list.find(s => s.id === id);
  if (!session) return;
  // never lose an unsaved current chat
  if (aiCurrentSessionId === null && aiMessages.length) _saveCurrentSession();
  aiCurrentSessionId = id;
  aiMessages = session.messages.slice();
  // Rebuild UI messages
  const box = document.getElementById('ai-messages');
  box.innerHTML = '';
  let lastUser = '';
  for (const m of aiMessages) {
    if (m.role === 'system') continue;
    if (m.role === 'user') lastUser = m.content;
    const div = addAIMsg(m.role, m.content);
    if (m.role === 'assistant') attachAIMessageTools(div, m.content);
  }
  if (lastUser) lastUserText = lastUser;
  _renderHistoryList();
}`, 'load-session');

// ── 4) _deleteSession: two-step confirm ──
rep(`function _deleteSession(id) {
  const list = _histLoad().filter(s => s.id !== id);
  _histSave(list);
  if (aiCurrentSessionId === id) {
    newAIChat();
  }
  _renderHistoryList();
}`,
`function _deleteSession(id) {
  if (_pendingDeleteId !== id) {
    _pendingDeleteId = id;
    clearTimeout(_pendingDeleteTimer);
    _pendingDeleteTimer = setTimeout(() => { _pendingDeleteId = null; _renderHistoryList(); }, 2500);
    _renderHistoryList();
    return;
  }
  _pendingDeleteId = null;
  clearTimeout(_pendingDeleteTimer);
  const list = _histLoad().filter(s => s.id !== id);
  _histSave(list);
  if (aiCurrentSessionId === id) newAIChat();
  _renderHistoryList();
}

function _renameSession(id) {
  const item = document.querySelector('[data-sid="' + id + '"] .ai-history-item-title');
  if (!item) return;
  const old = item.textContent;
  const input = document.createElement('input');
  input.className = 'ai-rename-input';
  input.value = old;
  item.replaceWith(input);
  input.focus(); input.select();
  const commit = () => {
    const name = input.value.trim() || old;
    const list = _histLoad();
    const s = list.find(x => x.id === id);
    if (s) { s.title = name; s.customTitle = true; _histSave(list); }
    _renderHistoryList();
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') { input.value = old; commit(); }
  });
  input.addEventListener('blur', commit);
}

function _clearAllHistory() {
  if (_pendingDeleteId !== '__all__') {
    _pendingDeleteId = '__all__';
    _renderHistoryList();
    return;
  }
  _pendingDeleteId = null;
  _histSave([]);
  newAIChat();
}

function _pushHistoryTip(msg) {
  let el = document.getElementById('ai-history-tip');
  if (!el) {
    const hist = document.getElementById('ai-history');
    if (!hist) return;
    el = document.createElement('div');
    el.id = 'ai-history-tip';
    el.className = 'ai-history-tip';
    hist.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2000);
}`, 'delete-session');

// ── 5) _renderHistoryList: current + meta + rename + confirm + footer ──
rep(`function _renderHistoryList() {
  const container = document.getElementById('ai-history-list');
  const list = _histLoad();
  if (!list.length) {
    container.innerHTML = '<div class="ai-history-empty">' + t('ai.noHistory') + '</div>';
    return;
  }
  let html = '';
  for (const s of list) {
    const active = s.id === aiCurrentSessionId ? ' active' : '';
    const date = _fmtDate(s.time);
    html += '<div class="ai-history-item' + active + '" onclick="_loadSession(\\'' + s.id + '\\')">'
      + '<span class="ai-history-item-title">' + _escHtml(s.title) + '</span>'
      + '<span class="ai-history-item-date">' + date + '</span>'
      + '<span class="ai-history-item-del" onclick="event.stopPropagation();_deleteSession(\\'' + s.id + '\\')">✕</span>'
      + '</div>';
  }
  container.innerHTML = html;
}`,
`function _renderHistoryList() {
  const container = document.getElementById('ai-history-list');
  const list = _histLoad();
  let html = '';

  // virtual entry for the CURRENT chat (even if unsaved)
  const isCurrentSaved = aiCurrentSessionId && list.some(s => s.id === aiCurrentSessionId);
  if (aiMessages.length || aiCurrentSessionId === null) {
    const curId = aiCurrentSessionId || '__current__';
    const active = ' cur';
    const meta = aiMessages.length ? aiMessages.length + t('ai.msgsUnit') + ' · ' + t('ai.unsaved') : t('ai.unsaved');
    html += '<div class="ai-history-item cur" onclick="_renderHistoryList()">'
      + '<span class="ai-history-item-title">● ' + t('ai.curSession') + '</span>'
      + '<span class="ai-history-item-del cur-tag">' + t('ai.unsaved') + '</span>'
      + '<span class="ai-history-item-meta">' + _escHtml(meta) + '</span>'
      + '</div>';
  }

  for (const s of list) {
    const active = s.id === aiCurrentSessionId ? ' active' : '';
    const date = _fmtRel(s.time);
    const pending = _pendingDeleteId === s.id;
    const count = (s.messages || []).length;
    html += '<div class="ai-history-item' + active + '" data-sid="' + s.id + '" onclick="_loadSession(\\'' + s.id + '\\')">'
      + '<span class="ai-history-item-title">' + _escHtml(s.title) + '</span>'
      + '<span class="ai-history-item-ren" onclick="event.stopPropagation();_renameSession(\\'' + s.id + '\\')">✎</span>'
      + '<span class="ai-history-item-del' + (pending ? ' confirm' : '') + '" onclick="event.stopPropagation();_deleteSession(\\'' + s.id + '\\')">'
      + (pending ? '✓' : '✕') + '</span>'
      + '<span class="ai-history-item-meta">' + date + ' · ' + count + t('ai.msgsUnit') + '</span>'
      + '</div>';
  }

  if (!html) {
    html = '<div class="ai-history-empty">' + t('ai.noHistory') + '</div>';
  } else {
    html += '<div class="ai-history-clear' + (_pendingDeleteId === '__all__' ? ' confirm' : '') + '" onclick="_clearAllHistory()">'
      + (_pendingDeleteId === '__all__' ? t('ai.confirmClear') : t('ai.clearAll')) + '</div>';
  }
  container.innerHTML = html;
}`, 'render-list');

// ── 6) relative time ──
rep(`function _fmtDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  return (d.getMonth()+1) + '/' + d.getDate();
}`,
`function _fmtRel(ts) {
  const d = new Date(ts), diff = Date.now() - ts;
  const zh = (typeof currentLang !== 'undefined' && currentLang === 'zh');
  if (diff < 60000) return zh ? '刚刚' : 'now';
  if (diff < 3600000) return Math.floor(diff / 60000) + (zh ? ' 分钟前' : 'm ago');
  if (d.toDateString() === new Date().toDateString())
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  return (d.getMonth() + 1) + '/' + d.getDate();
}`, 'fmt-rel');

// ── 7) newAIChat + toggleAIHistory: streaming guard ──
rep(`function newAIChat() {
  // Auto-save current if there are messages
  if (aiMessages.length) _saveCurrentSession();`,
`function newAIChat() {
  if (aiIsStreaming) { _pushHistoryTip(t('ai.stopFirst')); return; }
  // Auto-save current if there are messages
  if (aiMessages.length) _saveCurrentSession();`, 'new-chat');

rep(`function toggleAIHistory() {
  const hist = document.getElementById('ai-history');
  hist.classList.toggle('hidden');
  if (!hist.classList.contains('hidden')) _renderHistoryList();
}`,
`function toggleAIHistory() {
  const hist = document.getElementById('ai-history');
  hist.classList.toggle('hidden');
  if (!hist.classList.contains('hidden')) {
    _renderHistoryList();
    _pushHistoryTip = _pushHistoryTip || function() {};
  }
}`, 'toggle-hist');

fs.writeFileSync('script.js', hadCRLF ? js.replace(/\n/g, '\r\n') : js);
console.log('✓ script.js history overhaul —', applied, 'edits');

// ── i18n keys ──
let i18n = fs.readFileSync('i18n.js', 'utf8');
const ICRLF = i18n.includes('\r\n');
const inl = s => ICRLF ? s.replace(/\r?\n/g, '\r\n') : s;
if (!i18n.includes("'ai.curSession'")) {
  i18n = i18n.replace(inl("    'ai.stopped': '⏹ 已停止生成（已生成内容保留）',"),
    inl("    'ai.stopped': '⏹ 已停止生成（已生成内容保留）',\n    'ai.curSession': '当前对话',\n    'ai.unsaved': '未保存',\n    'ai.msgsUnit': ' 条',\n    'ai.stopFirst': '请先停止生成',\n    'ai.clearAll': '清空全部',\n    'ai.confirmClear': '再点一次确认清空',"));
  i18n = i18n.replace(inl("    'ai.stopped': '⏹ Generation stopped (partial kept)',"),
    inl("    'ai.stopped': '⏹ Generation stopped (partial kept)',\n    'ai.curSession': 'Current chat',\n    'ai.unsaved': 'unsaved',\n    'ai.msgsUnit': ' msgs',\n    'ai.stopFirst': 'Stop generation first',\n    'ai.clearAll': 'Clear all',\n    'ai.confirmClear': 'Click again to confirm',"));
  fs.writeFileSync('i18n.js', i18n);
  console.log('✓ i18n keys added (7 × 2 languages)');
} else {
  console.log('i18n already present');
}

// ── CSS ──
let css = fs.readFileSync('style.css', 'utf8');
if (!css.includes('.ai-history-item.cur')) {
  const CR = css.includes('\r\n');
  const block = (CR ? '\r\n' : '') + [
    '',
    '/* ── AI history sidebar upgrade (v2.7.3) ── */',
    '.ai-history-item{flex-wrap:wrap;row-gap:2px}',
    '.ai-history{position:relative}',
    '.ai-history-item.cur{border:1px solid var(--color-green);background:rgba(0,255,136,0.06)}',
    '.ai-history-item.cur .ai-history-item-title{color:var(--color-green);font-weight:600}',
    '.ai-history-item-meta{width:100%;font-size:10px;color:var(--text-muted);padding-left:2px}',
    '.ai-history-item-ren{font-size:10px;color:var(--text-muted);cursor:pointer;padding:0 3px;opacity:0;transition:opacity .15s}',
    '.ai-history-item:hover .ai-history-item-ren{opacity:1}',
    '.ai-history-item-ren:hover{color:var(--color-green)}',
    '.ai-history-item-del.confirm{color:#fff;background:#ff4d6b;border-radius:4px;opacity:1}',
    '.ai-rename-input{width:100%;background:var(--bg-input);border:1px solid var(--color-green);border-radius:4px;color:var(--text-main);font-size:12px;padding:3px 6px;outline:none;font-family:inherit}',
    '.ai-history-tip{position:absolute;top:44px;left:0;right:0;background:#ff4d6b;color:#fff;font-size:11px;text-align:center;padding:6px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:5}',
    '.ai-history-tip.show{opacity:1}',
    '.ai-history-clear{margin-top:6px;text-align:center;font-size:11px;color:var(--text-muted);border:1px dashed var(--border-subtle);border-radius:5px;padding:5px;cursor:pointer;transition:all var(--transition)}',
    '.ai-history-clear:hover{color:#ff6b6b;border-color:#ff6b6b}',
    '.ai-history-clear.confirm{color:#fff;background:#ff4d6b;border-color:#ff4d6b}'
  ].join(CR ? '\r\n' : '\n');
  css += block;
  fs.writeFileSync('style.css', css);
  console.log('✓ style.css history upgrades');
} else {
  console.log('style.css already patched');
}
