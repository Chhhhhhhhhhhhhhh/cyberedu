#!/usr/bin/env node
// v2.7.5 — AI history sidebar visual redesign
// Replaces the "cheap-looking" flat list with the app's terminal aesthetic:
// card items with left accent bars, two-line layout (title+time / count+actions),
// hover-revealed actions, pulsing dot for the current chat, refined clear-all.
const fs = require('fs');

// ── 1) CSS: append the redesign block (later rules win the cascade) ──
let css = fs.readFileSync('style.css', 'utf8');
const CR = css.includes('\r\n');
const N = CR ? '\r\n' : '\n';
if (!css.includes('AI history sidebar redesign')) {
  css += N + N + [
    '/* ── AI history sidebar redesign (v2.7.5) ── */',
    '.ai-history{width:224px;background:rgba(0,0,0,0.25)}',
    '.ai-history-header{padding:12px 14px 10px}',
    '.ai-history-header span:first-child{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted)}',
    '.ai-history-item{',
    '  display:block;margin:4px 6px;padding:8px 10px;',
    '  border:1px solid transparent;border-left:2px solid var(--border-subtle);',
    '  border-radius:6px;cursor:pointer;overflow:hidden;',
    '  transition:background var(--transition),border-color var(--transition);',
    '}',
    '.ai-history-item:hover{background:rgba(255,255,255,0.04);border-left-color:var(--text-muted)}',
    '.ai-history-item.active,.ai-history-item.cur{border-left-color:var(--color-green);background:rgba(0,255,136,0.055)}',
    '.ai-history-item.active:hover,.ai-history-item.cur:hover{background:rgba(0,255,136,0.09)}',
    '.aih-line1{display:flex;justify-content:space-between;align-items:center;gap:6px}',
    '.aih-title{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--text-secondary)}',
    '.aih-time{font-size:10px;color:var(--text-muted);flex-shrink:0}',
    '.aih-line2{display:flex;justify-content:space-between;align-items:center;margin-top:3px}',
    '.aih-count{font-size:10px;color:var(--text-muted)}',
    '.aih-actions{display:flex;gap:6px;opacity:0;transition:opacity .15s}',
    '.ai-history-item:hover .aih-actions,.ai-history-item .aih-act.confirm{opacity:1}',
    '.aih-act{font-size:10px;color:var(--text-muted);cursor:pointer;padding:1px 4px;border-radius:3px;transition:all .15s}',
    '.aih-act:hover{color:var(--color-green);background:rgba(0,255,136,0.08)}',
    '.aih-act.del:hover{color:#ff6b6b;background:rgba(255,77,107,0.08)}',
    '.aih-act.confirm{color:#fff;background:#ff4d6b}',
    '.ai-history-item.cur .aih-title{color:var(--color-green);font-weight:600}',
    '.ai-history-item.cur .aih-title::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-green);margin-right:6px;animation:blink 1.4s infinite;vertical-align:middle}',
    '.ai-history-clear{',
    '  margin:6px;padding:6px;text-align:center;font-size:11px;color:var(--text-muted);',
    '  border:1px solid transparent;border-radius:5px;cursor:pointer;',
    '  transition:all var(--transition);',
    '}',
    '.ai-history-clear:hover{color:#ff6b6b;background:rgba(255,77,107,0.06)}',
    '.ai-history-clear.confirm{color:#fff;background:rgba(255,77,107,0.15);border-color:#ff4d6b}',
    '[data-theme="light"] .ai-history{background:rgba(0,0,0,0.02)}',
    '[data-theme="light"] .ai-history-item:hover{background:rgba(0,0,0,0.03)}',
    '[data-theme="light"] .ai-history-item.active,[data-theme="light"] .ai-history-item.cur{background:rgba(22,163,74,0.06)}'
  ].join(N);
  fs.writeFileSync('style.css', css);
  console.log('✓ style.css: history redesign block appended');
} else {
  console.log('style.css already redesigned');
}

// ── 3) i18n keys for the new action buttons ──
let i18n = fs.readFileSync('i18n.js', 'utf8');
const ICRLF = i18n.includes('\r\n');
const inl = s => ICRLF ? s.replace(/\r?\n/g, '\r\n') : s;
if (!i18n.includes("'ai.rename'")) {
  i18n = i18n.replace(inl("    'ai.clearAll': '清空全部',"),
    inl("    'ai.clearAll': '清空全部',\n    'ai.rename': '重命名',\n    'ai.confirmDelShort': '再点一次确认删除',"));
  i18n = i18n.replace(inl("    'ai.clearAll': 'Clear all',"),
    inl("    'ai.clearAll': 'Clear all',\n    'ai.rename': 'Rename',\n    'ai.confirmDelShort': 'Click again to delete',"));
  fs.writeFileSync('i18n.js', i18n);
  console.log('✓ i18n keys added (ai.rename / ai.confirmDelShort)');
} else {
  console.log('i18n already present');
}

// ── 2) script.js: new item markup in _renderHistoryList ──
let js = fs.readFileSync('script.js', 'utf8');
const hadCRLF = js.includes('\r\n');
js = js.replace(/\r\n/g, '\n');

const startAnchor = "function _renderHistoryList() {";
const endAnchor = "\nfunction _fmtRel(ts) {";
const sIdx = js.indexOf(startAnchor);
const eIdx = js.indexOf(endAnchor);
if (sIdx < 0 || eIdx < 0 || eIdx < sIdx) throw new Error('render function bounds not found');

const newFn = `function _renderHistoryList() {
  const container = document.getElementById('ai-history-list');
  const list = _histLoad();
  let html = '';

  // virtual entry ONLY when the in-memory chat is not in the saved list
  const currentInList = aiCurrentSessionId && list.some(s => s.id === aiCurrentSessionId);
  if (aiMessages.length && !currentInList) {
    const meta = aiMessages.length + t('ai.msgsUnit') + ' · ' + t('ai.unsaved');
    html += '<div class="ai-history-item cur">'
      + '<div class="aih-line1"><span class="aih-title">' + t('ai.curSession') + '</span>'
      + '<span class="aih-time">' + t('ai.unsaved') + '</span></div>'
      + '<div class="aih-line2"><span class="aih-count">' + aiMessages.length + t('ai.msgsUnit') + '</span></div>'
      + '</div>';
  }

  for (const s of list) {
    const active = s.id === aiCurrentSessionId ? ' active' : '';
    const pending = _pendingDeleteId === s.id;
    const count = (s.messages || []).length;
    html += '<div class="ai-history-item' + active + '" data-sid="' + s.id + '" onclick="_loadSession(\\'' + s.id + '\\')">'
      + '<div class="aih-line1"><span class="aih-title">' + _escHtml(s.title) + '</span>'
      + '<span class="aih-time">' + _fmtRel(s.time) + '</span></div>'
      + '<div class="aih-line2"><span class="aih-count">' + count + t('ai.msgsUnit') + '</span>'
      + '<span class="aih-actions">'
      + '<span class="aih-act" title="' + t('ai.rename') + '" onclick="event.stopPropagation();_renameSession(\\'' + s.id + '\\')">✎</span>'
      + '<span class="aih-act del' + (pending ? ' confirm' : '') + '" title="' + t('ai.confirmDelShort') + '" onclick="event.stopPropagation();_deleteSession(\\'' + s.id + '\\')">' + (pending ? '✓ 确认' : '✕') + '</span>'
      + '</span></div>'
      + '</div>';
  }

  if (!html) {
    html = '<div class="ai-history-empty">' + t('ai.noHistory') + '</div>';
  } else {
    html += '<div class="ai-history-clear' + (_pendingDeleteId === '__all__' ? ' confirm' : '') + '" onclick="_clearAllHistory()">'
      + (_pendingDeleteId === '__all__' ? t('ai.confirmClear') : t('ai.clearAll')) + '</div>';
  }
  container.innerHTML = html;
}`;

js = js.slice(0, sIdx) + newFn + js.slice(eIdx);
fs.writeFileSync('script.js', hadCRLF ? js.replace(/\n/g, '\r\n') : js);
console.log('✓ script.js: _renderHistoryList redesigned');
