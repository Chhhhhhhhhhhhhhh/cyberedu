#!/usr/bin/env node
// v2.7.2 — AI tutor UX upgrade
//   1) stop/abort generation (send button becomes ■ while streaming)
//   2) retry + copy actions on AI messages; retry on errors
//   3) per-code-block copy buttons + Prism highlighting for AI code
//   4) smart auto-scroll (only follows when already near the bottom)
//   5) i18n for the thinking hint + new action strings (EN+ZH)
const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');
// normalize CRLF→LF for matching; restore CRLF on write
const hadCRLF = js.includes('\r\n');
js = js.replace(/\r\n/g, '\n');
let applied = 0;

function rep(oldS, newS, label, expect = 1) {
  const n = js.split(oldS).length - 1;
  if (n !== expect) throw new Error(`[${label}] expected ${expect}, found ${n}`);
  js = js.split(oldS).join(newS);
  applied++;
}

// ── sendAIMessage head: forced text + abort-as-stop ──
rep(`async function sendAIMessage() {
  if (aiIsStreaming) return;
  const input = document.getElementById('ai-input');
  const text  = input.value.trim();
  if (!text) return;`,
`async function sendAIMessage(forcedText) {
  if (aiIsStreaming) {
    // clicking send while streaming acts as STOP
    if (aiAbortController) aiAbortController.abort();
    return;
  }
  const input = document.getElementById('ai-input');
  const text  = (forcedText !== undefined) ? forcedText : input.value.trim();
  if (!text) return;`, 'head');

// ── clear input only for fresh submissions ──
rep(`  aiMessages.push({ role: 'user', content: text });
  input.value = '';
  input.style.height = 'auto';`,
`  aiMessages.push({ role: 'user', content: text });
  lastUserText = text;
  if (forcedText === undefined) {
    input.value = '';
    input.style.height = 'auto';
  }`, 'input-clear');

// ── thinking hint i18n ──
rep(`aiDiv.innerHTML = '<span class="ai-thinking-hint">正在思考</span>';`,
`aiDiv.innerHTML = '<span class="ai-thinking-hint">' + t('ai.thinking') + '</span>';`, 'thinking-hint');

// ── streaming state + abort controller ──
rep(`  aiIsStreaming = true;
  document.getElementById('ai-send-btn').disabled = true;`,
`  aiIsStreaming = true;
  aiAbortController = new AbortController();
  const sendBtn = document.getElementById('ai-send-btn');
  sendBtn.disabled = false;                 // stays clickable — now acts as STOP
  sendBtn.classList.add('ai-streaming');
  sendBtn.textContent = '■';
  sendBtn.title = t('ai.stop');`, 'streaming-state');

// ── fetch signal ──
rep(`        thinking:    config.thinking ? { type: 'enabled' } : { type: 'disabled' },
      }),
    });`,
`        thinking:    config.thinking ? { type: 'enabled' } : { type: 'disabled' },
        signal:      aiAbortController.signal,
      }),
    });`, 'fetch-signal');

// ── smart scroll in streaming loop (2 occurrences) ──
rep(`            box.scrollTop = box.scrollHeight;`,
`            aiAutoScroll(box);`, 'smart-scroll', 2);

// ── finalize: attach tools ──
rep(`    // ── Finalize response ──
    aiDiv.innerHTML = formatAIContent(aiText);`,
`    // ── Finalize response ──
    aiDiv.innerHTML = formatAIContent(aiText);
    attachAIMessageTools(aiDiv, aiText);`, 'finalize-tools');

// ── error/abort handling ──
rep(`  } catch (e) {
    aiDiv.className = 'ai-msg ai-msg-error';
    aiDiv.innerHTML = '⚠ ' + e.message;
    if (thinkDiv) thinkDiv.remove();
  }`,
`  } catch (e) {
    if (e.name === 'AbortError') {
      // user pressed stop — keep whatever was generated
      aiDiv.innerHTML = formatAIContent(aiText);
      const stopTag = document.createElement('span');
      stopTag.className = 'ai-usage-tag';
      stopTag.textContent = t('ai.stopped');
      aiDiv.appendChild(stopTag);
      if (aiText) {
        attachAIMessageTools(aiDiv, aiText);
        aiMessages.push({ role: 'assistant', content: aiText });
      }
    } else {
      aiDiv.className = 'ai-msg ai-msg-error';
      aiDiv.innerHTML = '⚠ ' + e.message;
      if (thinkDiv) thinkDiv.remove();
      const bar = document.createElement('div');
      bar.className = 'ai-msg-actions';
      const retry = document.createElement('button');
      retry.className = 'ai-action-btn';
      retry.textContent = t('ai.retry');
      retry.onclick = () => { if (!aiIsStreaming && lastUserText) { bar.remove(); aiDiv.remove(); sendAIMessage(lastUserText); } };
      bar.appendChild(retry);
      aiDiv.appendChild(bar);
    }
  }`, 'error-handling');

// ── restore button state ──
rep(`  aiIsStreaming = false;
  document.getElementById('ai-send-btn').disabled = false;
  document.getElementById('ai-input').focus();`,
`  aiIsStreaming = false;
  aiAbortController = null;
  const btn = document.getElementById('ai-send-btn');
  btn.classList.remove('ai-streaming');
  btn.textContent = '→';
  btn.title = '';
  document.getElementById('ai-input').focus();`, 'restore-btn');

// ── helpers after formatAIContent ──
rep(`    .replace(/\\n/g, '<br>');
  return h;
}`,
`    .replace(/\\n/g, '<br>');
  return h;
}

// Smart scroll: follow the stream only when the user is already near the bottom
function aiAutoScroll(box) {
  if (box.scrollHeight - box.scrollTop - box.clientHeight < 140) box.scrollTop = box.scrollHeight;
}

// Code-block copy buttons + Prism highlighting + per-message action bar
function attachAIMessageTools(div, rawText) {
  div.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.ai-code-copy')) return;
    pre.style.position = 'relative';
    const btn = document.createElement('button');
    btn.className = 'ai-code-copy';
    btn.textContent = t('ai.copy');
    btn.onclick = () => {
      navigator.clipboard.writeText(pre.innerText).then(() => {
        btn.textContent = t('ai.copied');
        setTimeout(() => btn.textContent = t('ai.copy'), 1200);
      });
    };
    pre.appendChild(btn);
  });
  if (window.Prism) { try { Prism.highlightAllUnder(div); } catch (e) {} }
  if (div.querySelector('.ai-msg-actions')) return;
  const bar = document.createElement('div');
  bar.className = 'ai-msg-actions';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'ai-action-btn';
  copyBtn.textContent = t('ai.copy');
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(rawText || div.innerText).then(() => {
      copyBtn.textContent = t('ai.copied');
      setTimeout(() => copyBtn.textContent = t('ai.copy'), 1200);
    });
  };
  const retryBtn = document.createElement('button');
  retryBtn.className = 'ai-action-btn';
  retryBtn.textContent = t('ai.retry');
  retryBtn.onclick = () => {
    if (aiIsStreaming || !lastUserText) return;
    const wrappers = document.querySelectorAll('#ai-messages .ai-response-wrapper');
    if (wrappers.length) wrappers[wrappers.length - 1].remove();
    sendAIMessage(lastUserText);
  };
  bar.appendChild(copyBtn);
  bar.appendChild(retryBtn);
  div.appendChild(bar);
}

// Regenerate helper used by the retry button above
function regenerateLastAIMessage() {
  if (aiIsStreaming || !lastUserText) return;
  sendAIMessage(lastUserText);
}`, 'helpers');

fs.writeFileSync('script.js', hadCRLF ? js.replace(/\n/g, '\r\n') : js);
console.log('✓ script.js upgraded —', applied, 'edits');

// ── i18n keys (zh block ~241, en block ~470) ──
let i18n = fs.readFileSync('i18n.js', 'utf8');
const ICRLF = i18n.includes('\r\n');
const inl = s => ICRLF ? s.replace(/\r?\n/g, '\r\n') : s;
if (!i18n.includes("'ai.stop'")) {
  i18n = i18n.replace(inl("    'ai.thinking': '正在思考',"),
    inl("    'ai.thinking': '正在思考',\n    'ai.stop': '■ 停止',\n    'ai.copy': '复制',\n    'ai.copied': '已复制 ✓',\n    'ai.retry': '↻ 重新生成',\n    'ai.stopped': '⏹ 已停止生成（已生成内容保留）',"));
  i18n = i18n.replace(inl("    'ai.thinking': 'Thinking...',"),
    inl("    'ai.thinking': 'Thinking...',\n    'ai.stop': '■ Stop',\n    'ai.copy': 'Copy',\n    'ai.copied': 'Copied ✓',\n    'ai.retry': '↻ Regenerate',\n    'ai.stopped': '⏹ Generation stopped (partial kept)',"));
  fs.writeFileSync('i18n.js', i18n);
  console.log('✓ i18n keys added (5 × 2 languages)');
} else {
  console.log('i18n keys already present');
}

// ── CSS additions ──
let css = fs.readFileSync('style.css', 'utf8');
if (!css.includes('.ai-msg-actions')) {
  const CR = css.includes('\r\n');
  const block = (CR ? '\r\n' : '') + [
    '',
    '/* ── AI tutor UX upgrade (v2.7.2) ── */',
    '.ai-send-btn.ai-streaming{background:#ff4d6b;border-color:#ff4d6b;color:#fff}',
    '.ai-msg-actions{display:flex;gap:8px;margin-top:10px;opacity:.8}',
    '.ai-action-btn{background:none;border:1px solid var(--border-subtle);color:var(--text-muted);font-size:11px;padding:3px 10px;border-radius:5px;cursor:pointer;transition:all var(--transition)}',
    '.ai-action-btn:hover{color:var(--color-green);border-color:var(--color-green)}',
    '.ai-msg-ai pre{position:relative}',
    '.ai-code-copy{position:absolute;top:6px;right:6px;font-size:10px;padding:2px 8px;border-radius:4px;background:rgba(0,0,0,0.45);color:var(--text-muted);border:1px solid var(--border-subtle);cursor:pointer;opacity:0;transition:opacity .15s,color var(--transition)}',
    '.ai-msg-ai pre:hover .ai-code-copy{opacity:1}',
    '.ai-code-copy:hover{color:var(--color-green);border-color:var(--color-green)}',
    '[data-theme="light"] .ai-code-copy{background:rgba(255,255,255,0.7)}'
  ].join(CR ? '\r\n' : '\n');
  css += block;
  fs.writeFileSync('style.css', css);
  console.log('✓ style.css additions');
} else {
  console.log('style.css already patched');
}
