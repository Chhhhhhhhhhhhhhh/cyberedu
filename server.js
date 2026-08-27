// CyberEdu Local Server v2.6 - Multi-Model AI Proxy
// Usage: node server.js   (serves on http://127.0.0.1:8000)
//
// Security model (v2.6):
//   • Binds to 127.0.0.1 by default — never exposes code execution to the LAN.
//     Override deliberately with CYBEREDU_HOST=0.0.0.0 if you know what you need.
//   • Host header allow-list blocks DNS-rebinding from hostile websites.
//   • No CORS headers: the page is always served same-origin, so browsers are
//     no longer able to drive these APIs from third-party sites.
//   • Static file serving uses a block-list (repo internals, tests, git data).
//   • CTF answers verified as SHA-256 digests only (see flags-hash.js).

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const os = require('os');
const https = require('https');
const { URL } = require('url');
const zlib = require('zlib');
const crypto = require('crypto');

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' is in use. Run: netstat -ano | findstr :' + PORT);
  }
});
process.on('unhandledRejection', (reason) => {
  console.error('[WARN] Unhandled rejection:', reason);
});

const PORT      = parseInt(process.env.CYBEREDU_PORT, 10) || 8000;
const BIND_HOST = process.env.CYBEREDU_HOST || '127.0.0.1';
const ROOT      = __dirname;
const PROGRESS_FILE = path.join(ROOT, 'progress.json');
const AUTO_OPEN = process.env.CYBEREDU_NO_OPEN !== '1';

// ── Content-Security-Policy ──────────────────────────────────
// Sent as a header here and mirrored as a <meta> tag in cyberedu.html so the
// policy also applies to GitHub Pages / offline usage where this server is not
// involved.
// script-src carries 'unsafe-inline' BY NECESSITY: the app is a zero-build
// architecture with ~830 inline onclick/onkeydown handler attributes across
// cyberedu.html and content.js.
// GOTCHA (cost us a day-one outage): per CSP2+, if ANY hash-/nonce-source
// appears alongside 'unsafe-inline', browsers IGNORE 'unsafe-inline' and fall
// back to hash-only allowlisting — every handler dies again. That's why the
// inline JSON-LD block deliberately has NO hash entry here: it is never
// executed (data block for crawlers only), so script-src doesn't need to
// allow it. Do not re-add a hash/nonce to this policy.
// Everything else stays strict: no eval, no objects, same-origin connects,
// no framing.
const CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; " +
  "style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; " +
  "font-src 'self' cdnjs.cloudflare.com fonts.gstatic.com; " +
  "img-src 'self' data: https:; " +
  "connect-src 'self'; " +
  "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

function securityHeaders(extra) {
  return Object.assign({
    'Content-Security-Policy':   CSP,
    'X-Content-Type-Options':    'nosniff',
    'X-Frame-Options':           'DENY',
    'Referrer-Policy':           'strict-origin-when-cross-origin',
    'Permissions-Policy':        'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  }, extra || {});
}

function jsonHdrs() {
  return securityHeaders({ 'Content-Type': 'application/json; charset=utf-8' });
}

// ── Host header validation (anti DNS-rebinding) ─────────────
// Only meaningful while bound to loopback; when an operator rebinds to another
// interface we assume intentional LAN exposure and stop enforcing.
const HOST_ALLOWED = new Set(['localhost:' + PORT, '127.0.0.1:' + PORT, '[::1]:' + PORT]);
function hostIsAllowed(hostHeader) {
  return !hostHeader || HOST_ALLOWED.has(String(hostHeader).toLowerCase());
}

// ── Request body reader with hard size cap ───────────────────
function readJsonBody(req, res, maxBytes, cb) {
  let body = '';
  let size = 0;
  req.on('data', chunk => {
    size += chunk.length;
    if (size > maxBytes) {
      res.writeHead(413, jsonHdrs());
      res.end(JSON.stringify({ error: '请求体过大' }));
      req.destroy();
      return;
    }
    body += chunk;
  });
  req.on('end', () => {
    if (res.writableEnded) return;
    let parsed;
    try { parsed = JSON.parse(body); }
    catch {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: 'JSON 格式错误' }));
    }
    cb(parsed);
  });
}

// ── Simple Rate Limiter ──────────────────────────────
const rateLimits = new Map();
const RATE_WINDOW = 60000; // 1 minute
const RATE_MAX = 30; // max requests per window

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimits.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    entry = { start: now, count: 0 };
    rateLimits.set(ip, entry);
  }
  entry.count++;
  return entry.count <= RATE_MAX;
}
// Unconditional periodic sweep instead of piggy-backing cleanup on request
// flow — stale entries can no longer accumulate under skewed traffic.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimits) {
    if (now - v.start > RATE_WINDOW) rateLimits.delete(k);
  }
}, RATE_WINDOW).unref();

// ── API URL Whitelist ─────────────────────────────────
const ALLOWED_API_HOSTS = [
  'api.openai.com',
  'api.deepseek.com',
  'dashscope.aliyuncs.com',
  'api.anthropic.com',
  'api.groq.com',
  'localhost',
  '127.0.0.1',
];

// ── MIME types ───────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
};

function getMime(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

// ── Runtime detection ──────────────────────────────────────
function checkRuntime(name, args) {
  return new Promise((resolve) => {
    execFile(name, args, { timeout: 3000, stdio: 'ignore' }, () => resolve(true));
  });
}

// ── DeepSeek / OpenAI error status → Chinese message ──────────
const ERR_ZH = {
  400: '请求格式错误，请检查参数。',
  401: 'API Key 无效或已过期，请检查设置。',
  402: '账户余额不足，请前往 DeepSeek 平台充值。',
  422: '请求参数不合法，请检查模型名称或参数。',
  429: '请求速率超限（RPM/TPM 已达上限），请稍后重试。',
  500: 'DeepSeek 服务器内部错误，请稍后重试。',
  503: 'DeepSeek 服务器繁忙，请稍后重试。',
};

// ── Proxy /api/chat  →  upstream AI API (SSE streaming) ─────
function proxyChat(req, res) {
  readJsonBody(req, res, 256 * 1024, (parsed) => {
    const { apiKey, apiUrl, model, messages,
            temperature, max_tokens, top_p, stop,
            thinking, stream_options } = parsed;

    if (!apiKey || !apiUrl || !messages || !Array.isArray(messages)) {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: '缺少必要参数：apiKey / apiUrl / messages' }));
    }

    // ── Build upstream URL ──────────────────────────────────
    let targetUrl;
    try { targetUrl = new URL(apiUrl); } catch {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: 'API URL 格式无效。' }));
    }
    // Auto-append /chat/completions (DeepSeek / OpenAI / Qwen / Ollama)
    if (!targetUrl.pathname.endsWith('/chat/completions')) {
      targetUrl.pathname = targetUrl.pathname.replace(/\/+$/, '') + '/chat/completions';
    }
    // Validate upstream URL against allowed hosts
    if (!ALLOWED_API_HOSTS.includes(targetUrl.hostname)) {
      res.writeHead(403, jsonHdrs());
      return res.end(JSON.stringify({ error: '不允许的 API 地址。仅支持已知的 AI 服务提供商。' }));
    }
    console.log(`  [Proxy] → ${targetUrl.href}`);

    // ── Build request body (pass through all OpenAI-compatible params) ──
    const upstreamBody = JSON.stringify({
      model:  model || 'deepseek-chat',
      messages,
      stream: true,
      ...(temperature != null && { temperature }),
      ...(max_tokens != null && { max_tokens }),
      ...(top_p      != null && { top_p }),
      ...(stop       != null && { stop }),
      ...(thinking   != null && { thinking }),
      stream_options: stream_options || { include_usage: true },
    });

    const isHttps  = targetUrl.protocol === 'https:';
    const lib      = isHttps ? https : http;
    const options  = {
      hostname: targetUrl.hostname,
      port:     targetUrl.port || (isHttps ? 443 : 80),
      path:     targetUrl.pathname + targetUrl.search,
      method:    'POST',
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(upstreamBody),
      },
      timeout: 60000,   // 60 s upstream timeout
    };

    const proxyReq = lib.request(options, (upRes) => {
      // ── Non-200: read error body, forward as JSON ─────────
      if (upRes.statusCode !== 200) {
        let errBuf = '';
        upRes.on('data', c => { errBuf += c; });
        upRes.on('end', () => {
          let errMsg = ERR_ZH[upRes.statusCode] || `API 错误 ${upRes.statusCode}`;
          try {
            const j = JSON.parse(errBuf);
            if (j.error?.message) errMsg = j.error.message;
          } catch {}
          res.writeHead(upRes.statusCode, jsonHdrs());
          res.end(JSON.stringify({ error: errMsg, status: upRes.statusCode }));
        });
        return;
      }

      // ── 200: pipe SSE stream to client ────────────────────
      res.writeHead(200, securityHeaders({
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
        'X-Accel-Buffering': 'no',   // disable nginx proxy buffering
      }));

      upRes.on('data', chunk => res.write(chunk));
      upRes.on('end', ()   => res.end());
    });

    proxyReq.on('error', (e) => {
      console.error('[Proxy] request error:', e.message);
      if (!res.headersSent) {
        res.writeHead(502, jsonHdrs());
      }
      res.end(JSON.stringify({ error: '代理请求失败：' + e.message }));
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      console.error('[Proxy] upstream timeout');
      if (!res.headersSent) {
        res.writeHead(504, jsonHdrs());
      }
      res.end(JSON.stringify({ error: '请求超时，上游服务无响应。' }));
    });

    proxyReq.write(upstreamBody);
    proxyReq.end();
  });
}

// ── Anthropic Messages API proxy ──────────────────────────────
let ANTHROPIC_SEQ = 0;
function proxyAnthropic(req, res) {
  readJsonBody(req, res, 256 * 1024, (parsed) => {
    const { apiKey, apiUrl, model, messages,
            temperature, max_tokens, system } = parsed;

    if (!apiKey || !apiUrl || !messages || !Array.isArray(messages)) {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: 'Missing required fields: apiKey / apiUrl / messages' }));
    }

    // Build upstream URL (auto-append /messages)
    let targetUrl;
    try { targetUrl = new URL(apiUrl); } catch {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: 'Invalid API URL' }));
    }
    if (!targetUrl.pathname.endsWith('/messages')) {
      targetUrl.pathname = targetUrl.pathname.replace(/\/+$/, '') + '/messages';
    }
    // Validate upstream URL against allowed hosts
    if (!ALLOWED_API_HOSTS.includes(targetUrl.hostname)) {
      res.writeHead(403, jsonHdrs());
      return res.end(JSON.stringify({ error: 'API host not allowed. Only known AI service providers are supported.' }));
    }
    console.log(`  [Anthropic] → ${targetUrl.href}`);

    // Find system message and separate from conversation
    let systemPrompt = '';
    const convMessages = [];
    for (const m of messages) {
      if (m.role === 'system') {
        systemPrompt = m.content;
      } else if (m.role === 'user' || m.role === 'assistant') {
        convMessages.push({ role: m.role, content: m.content });
      }
    }
    if (system) systemPrompt = system;

    const upstreamBody = JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      messages: convMessages,
      stream: true,
      max_tokens: max_tokens || 4096,
      ...(temperature != null && { temperature }),
      ...(systemPrompt && { system: systemPrompt }),
    });

    const isHttps = targetUrl.protocol === 'https:';
    const lib = isHttps ? https : http;
    const options = {
      hostname: targetUrl.hostname,
      port:     targetUrl.port || (isHttps ? 443 : 80),
      path:     targetUrl.pathname + targetUrl.search,
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(upstreamBody),
      },
      timeout: 60000,
    };

    ANTHROPIC_SEQ++;
    const proxyReq = lib.request(options, (upRes) => {
      if (upRes.statusCode !== 200) {
        let errBuf = '';
        upRes.on('data', c => { errBuf += c; });
        upRes.on('end', () => {
          let errMsg = `Anthropic error ${upRes.statusCode}`;
          try {
            const j = JSON.parse(errBuf);
            if (j.error?.message) errMsg = j.error.message;
          } catch {}
          res.writeHead(upRes.statusCode, jsonHdrs());
          res.end(JSON.stringify({ error: errMsg }));
        });
        return;
      }

      // Pipe SSE stream, transform Anthropic format to OpenAI-compatible
      res.writeHead(200, securityHeaders({
        'Content-Type':       'text/event-stream',
        'Cache-Control':      'no-cache',
        'Connection':         'keep-alive',
      }));

      let buf = '';
      upRes.on('data', chunk => {
        buf += chunk.toString();
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          try {
            const event = JSON.parse(payload);
            // Convert Anthropic SSE event to OpenAI-compatible format
            const openaiChunk = anthropicToOpenAI(event, model);
            if (openaiChunk) {
              res.write(`data: ${JSON.stringify(openaiChunk)}\n\n`);
            }
          } catch {}
        }
      });
      upRes.on('end', () => {
        res.write('data: [DONE]\n\n');
        res.end();
      });
    });

    proxyReq.on('error', (e) => {
      console.error('[Anthropic] request error:', e.message);
      if (!res.headersSent) {
        res.writeHead(502, jsonHdrs());
      }
      res.end(JSON.stringify({ error: 'Proxy error: ' + e.message }));
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      console.error('[Anthropic] upstream timeout');
      if (!res.headersSent) {
        res.writeHead(504, jsonHdrs());
      }
      res.end(JSON.stringify({ error: 'Upstream timeout' }));
    });

    proxyReq.write(upstreamBody);
    proxyReq.end();
  });
}

// Convert Anthropic streaming event to OpenAI-compatible chunk
function anthropicToOpenAI(event, model) {
  const t = event.type;
  if (t === 'message_start') {
    return { id: 'ant-' + ANTHROPIC_SEQ, object: 'chat.completion.chunk', created: Date.now(), model: model, choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }] };
  }
  if (t === 'content_block_delta' && event.delta?.type === 'text_delta') {
    return { id: 'ant-' + ANTHROPIC_SEQ, object: 'chat.completion.chunk', created: Date.now(), model: model, choices: [{ index: 0, delta: { content: event.delta.text }, finish_reason: null }] };
  }
  if (t === 'content_block_delta' && event.delta?.type === 'thinking_delta') {
    return { id: 'ant-' + ANTHROPIC_SEQ, object: 'chat.completion.chunk', created: Date.now(), model: model, choices: [{ index: 0, delta: { reasoning_content: event.delta.thinking }, finish_reason: null }] };
  }
  if (t === 'message_delta' && event.delta?.stop_reason) {
    const reason = event.delta.stop_reason === 'end_turn' ? 'stop' : 'length';
    return { id: 'ant-' + ANTHROPIC_SEQ, object: 'chat.completion.chunk', created: Date.now(), model: model, choices: [{ index: 0, delta: {}, finish_reason: reason }] };
  }
  if (t === 'message_stop') {
    // Extract usage from message_stop if available
    return event.usage ? { id: 'ant-' + ANTHROPIC_SEQ, object: 'chat.completion.chunk', created: Date.now(), model: model, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: event.usage.input_tokens, completion_tokens: event.usage.output_tokens, total_tokens: (event.usage.input_tokens || 0) + (event.usage.output_tokens || 0) } } : null;
  }
  return null;
}

// ── Code execution handler ────────────────────────────────────
// NOTE: runs submitted code unsandboxed **on purpose** (offline teaching tool).
// This is exactly why the server must stay on 127.0.0.1 (see top of file).
const RUN_TIMEOUT = 8000;

function handleRunCode(req, res) {
  readJsonBody(req, res, 256 * 1024, (parsed) => {
    const { code, lang } = parsed;
    if (!code || !lang) {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: '缺少 code 或 lang 参数' }));
    }

    const langMap = { Python: '.py', JavaScript: '.js', C: '.c', Bash: '.sh' };
    const ext = langMap[lang];
    if (!ext) {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: '不支持的语言: ' + lang + '。支持: Python, JavaScript, C, Bash' }));
    }

    const tmpFile = path.join(os.tmpdir(), 'cyberedu_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext);
    fs.writeFileSync(tmpFile, code, 'utf-8');

    function respond(payload) {
      res.writeHead(200, jsonHdrs());
      res.end(JSON.stringify(payload));
    }

    if (lang === 'C') {
      const outFile = tmpFile.replace(/\.c$/, '.exe');
      execFile('gcc', [tmpFile, '-o', outFile, '-lm'], { timeout: RUN_TIMEOUT }, (err, stdout, stderr) => {
        if (err) {
          cleanup([tmpFile, outFile]);
          if (err.code === 'ENOENT') {
            return respond({ error: 'GCC (C compiler) is not installed on this server.\n\nInstall it to run C exercises:\n  • Windows: https://winlibs.com/ or MinGW-w64\n  • macOS: xcode-select --install\n  • Linux: sudo apt install gcc\n\nIn the meantime, use the Self-Test mode to compare your output with the expected result.' });
          }
          return respond({ error: '编译失败:\n' + stderr });
        }
        execFile(outFile, [], { timeout: RUN_TIMEOUT }, (err2, stdout2, stderr2) => {
          cleanup([tmpFile, outFile]);
          respond({ stdout: stdout2, stderr: stderr2, exitCode: err2 ? 1 : 0 });
        });
      });
    } else if (lang === 'Bash') {
      execFile('bash', [tmpFile], { timeout: RUN_TIMEOUT, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        cleanup([tmpFile]);
        if (err && err.code === 'ENOENT') {
          return respond({ error: 'Bash is not installed on this server.\n\nInstall it to run shell exercises:\n  • Windows: Git Bash (https://git-scm.com) or WSL\n  • macOS/Linux: already installed\n\nIn the meantime, use the Self-Test mode.' });
        }
        respond({ stdout, stderr, exitCode: err ? 1 : 0 });
      });
    } else {
      const cmd = lang === 'Python' ? 'python' : process.execPath;
      execFile(cmd, [tmpFile], { timeout: RUN_TIMEOUT, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        cleanup([tmpFile]);
        if (err && err.code === 'ENOENT') {
          return respond({ error: 'Python is not installed on this server.\n\nInstall Python 3 to run exercises:\n  • https://python.org/downloads/\n\nIn the meantime, use the Self-Test mode to compare your output with the expected result.' });
        }
        respond({ stdout, stderr, exitCode: err ? 1 : 0 });
      });
    }

    function cleanup(files) {
      files.forEach(f => { try { fs.unlinkSync(f); } catch {} });
    }
  });
}

// ── CTF simulated terminal handler ───────────────────────────
// The five challenges below award their answer INSIDE the simulation itself —
// i.e. obtaining the flag requires performing the demonstrated technique.
// That is by design: their answers are inherently derivable through play.
const CTF_SIM = {
  'ctf-003': { // Login Bypass (SQL Injection)
    welcome: 'SQL Injection Login Bypass - 模拟环境\n目标：绕过登录验证，以 admin 身份登录。\n后端 SQL: SELECT * FROM users WHERE user=\'[INPUT]\' AND pass=\'[PASS]\'\n\n示例输入: admin\' OR \'1\'=\'1\n',
    respond(input) {
      const user = input.replace(/'/g, "''");
      const fakePass = 's3cur3_p@ss';
      const query = `SELECT * FROM users WHERE user='${user}' AND pass='${fakePass}'`;
      if (/\bOR\b/i.test(query) && (/'1'\s*=\s*'1/i.test(query) || /1\s*=\s*1/i.test(query)) || (/'\s*OR\s*'/i.test(query))) {
        return { output: '<span style="color:#0f0">[SQL] ' + query + '</span>\n<span style="color:#0f0">Query returned 1 row(s)</span>\n<span style="color:#ff0">✓ Login successful! Welcome admin.</span>\n<span style="color:#0f0">flag{sql1_1nj3ct1on_m4st3r}</span>' };
      }
      return { output: '<span style="color:#888">[SQL] ' + query + '</span>\n<span style="color:#888">Query returned 0 row(s)</span>\n<span style="color:#f44">✗ Login failed. Invalid credentials.</span>' };
    }
  },
  'ctf-008': { // Command Injection
    welcome: 'Command Injection 101 - 模拟环境\n目标：通过 ping 工具执行任意命令。\n后端代码: os.system("ping -c 3 " + user_input)\n\n示例输入: 127.0.0.1;ls\n',
    respond(input) {
      const parts = input.split(/[;|&\n]/);
      const ip = parts[0].trim();
      let result = '';
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) || ip === 'localhost') {
        result += `<span style="color:#888">PING ${ip}: 3 packets transmitted, 3 received, 0% loss</span>\n`;
      } else if (ip) {
        result += `<span style="color:#f44">ping: ${escHtml(ip)}: not a valid address</span>\n`;
      }
      for (let i = 1; i < parts.length; i++) {
        const cmd = parts[i].trim();
        if (!cmd) continue;
        if (/ls/i.test(cmd) && !/\/etc/i.test(cmd)) result += '<span style="color:#0ff">flag.txt  index.html  README.md</span>\n';
        else if (/cat\s+flag/i.test(cmd)) result += '<span style="color:#0f0">flag{c0mm4nd_1nj3ct10n_3z}</span>\n';
        else if (/whoami/i.test(cmd)) result += '<span style="color:#0ff">www-data</span>\n';
        else if (/id/i.test(cmd)) result += '<span style="color:#0ff">uid=33(www-data) gid=33(www-data)</span>\n';
        else if (/pwd/i.test(cmd)) result += '<span style="color:#0ff">/var/www/html</span>\n';
        else if (/uname/i.test(cmd)) result += '<span style="color:#0ff">Linux target 5.4.0 x86_64</span>\n';
        else result += `<span style="color:#888">${escHtml(cmd)}: simulated output</span>\n`;
      }
      return { output: result || '<span style="color:#888">No output.</span>' };
    }
  },
  'ctf-016': { // PHP Type Juggling
    welcome: 'PHP Type Juggling - 模拟环境\n目标：绕过 md5() 弱类型比较。\n后端代码: if (md5($input) == "0e123456789...") grant_access();\n\nPHP 的 == 在比较时会将 "0e123..." 视为科学计数法 0×10^n = 0\n所以任何 md5 值也是 "0e..." 开头的输入都能通过。\n\n示例输入: QNKCDZO (md5 = 0e830400451993494058024219903391)\n',
    respond(input) {
      const md5s = { 'QNKCDZO': '0e830400451993494058024219903391', '240610708': '0e462097431906509019562988736854', 'aabg7XSs': '0e087386482136013740957780965295' };
      const hash = md5s[input] || 'a1b2c3d4e5f6';
      if (hash.startsWith('0e') && /^[0-9]+$/.test(hash.slice(2))) {
        return { output: `<span style="color:#888">md5("${escHtml(input)}") = "${hash}"</span>\n<span style="color:#888">Comparing: "${hash}" == "0e123456789012345678901234567890"</span>\n<span style="color:#ff0">PHP == comparison: 0 == 0 → TRUE</span>\n<span style="color:#0f0">✓ Access granted! Authentication bypassed.</span>\n<span style="color:#0f0">flag{php_l00s3_c0mp4r1s0n}</span>` };
      }
      return { output: `<span style="color:#888">md5("${escHtml(input)}") = "${hash}"</span>\n<span style="color:#888">Comparing: "${hash}" == "0e123456789..."</span>\n<span style="color:#f44">PHP == comparison: string ≠ scientific → FALSE</span>\n<span style="color:#f44">✗ Access denied.</span>` };
    }
  },
  'ctf-004': { // XSS Hunter
    welcome: 'XSS Hunter - 模拟环境\n目标：构造反射型 XSS Payload 弹出 alert(1)。\n后端代码: document.getElementById("result").textContent = location.search.split("q=")[1]\n\n注意：使用 textContent 回显，不是 innerHTML。需要换一种思路。\n提示：试试 onchange/oninput 事件配合 URL hash。\n\n示例输入: " autofocus onfocus=alert(1) x="\n',
    respond(input) {
      if (/on(?:focus|blur|click|mouseover|load|error)\s*=/i.test(input) || /javascript:/i.test(input) || /<svg/i.test(input) || /<img/i.test(input) || /<iframe/i.test(input)) {
        return { output: `<span style="color:#888">[Rendered HTML]:</span>\n<span style="color:#888">&lt;div id="result"&gt;${escHtml(input)}&lt;/div&gt;</span>\n\n<span style="color:#0f0">✓ XSS triggered! alert(1) fired.</span>\n<span style="color:#0f0">flag{xss_r3fl3ct3d_g0t_m3}</span>` };
      }
      return { output: `<span style="color:#888">[Rendered HTML]:</span>\n<span style="color:#888">&lt;div id="result"&gt;${escHtml(input)}&lt;/div&gt;</span>\n\n<span style="color:#f44">No XSS triggered. The input was safely rendered.</span>` };
    }
  },
  'ctf-012': { // SSTI Detective
    welcome: 'SSTI Detective - 模拟环境\n目标：利用 Flask/Jinja2 模板注入读取系统信息。\n后端代码: render_template_string("Hello {{ " + name + " }}")\n\n示例输入: {{7*7}}\n',
    respond(input) {
      if (/{{.*?7\s*\*\s*7.*?}}/.test(input) || /{{.*?config.*?}}/.test(input)) {
        return { output: `<span style="color:#888">[Template]: Hello ${escHtml(input)}</span>\n<span style="color:#0ff">[Rendered]: Hello 49</span>\n\n<span style="color:#ff0">⚠ Template injection confirmed! Expression evaluated.</span>\n<span style="color:#888">Try chaining: {{ config.items() }} or {{ "".__class__.__mro__ }}</span>` };
      }
      if (/__class__/i.test(input) || /__mro__/i.test(input) || /__subclasses__/i.test(input) || /__builtins__/i.test(input) || /popen/i.test(input)) {
        return { output: `<span style="color:#888">[Template]: Hello ${escHtml(input)}</span>\n<span style="color:#0f0">[Rendered]: Hello &lt;class 'object'&gt;...</span>\n\n<span style="color:#0f0">✓ SSTI chain executed! You got access to __builtins__.</span>\n<span style="color:#0f0">flag{j1nj4_2_t3mpl4t3_1nj3ct10n}</span>` };
      }
      if (/{{/.test(input) && /}}/.test(input)) {
        return { output: `<span style="color:#888">[Template]: Hello ${escHtml(input)}</span>\n<span style="color:#888">[Rendered]: Hello ${escHtml(input)}</span>\n\n<span style="color:#ff0">Template syntax detected but no evaluation. Keep exploring...</span>` };
      }
      return { output: `<span style="color:#888">[Template]: Hello ${escHtml(input)}</span>\n<span style="color:#888">[Rendered]: Hello ${escHtml(input)}</span>\n\n<span style="color:#888">Normal text output. No template injection detected.</span>` };
    }
  }
};

function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function handleCTFSim(req, res) {
  readJsonBody(req, res, 64 * 1024, (parsed) => {
    const { challengeId, input: userInput } = parsed;
    if (!challengeId || !userInput) {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: '缺少 challengeId 或 input' }));
    }
    const sim = CTF_SIM[challengeId];
    if (!sim) {
      res.writeHead(200, jsonHdrs());
      return res.end(JSON.stringify({ error: '该题目暂不支持模拟环境。请根据题目描述在本地或远程环境中操作。' }));
    }
    const result = sim.respond(userInput);
    res.writeHead(200, jsonHdrs());
    res.end(JSON.stringify(result));
  });
}

// ── CTF Flag Verification (SHA-256 digests only) ─────────────
// Plaintext answers never live on the server. See flags-hash.js +
// scripts/gen-flag-hashes.js for how digests are produced/rotated.
const { FLAG_HASHES, normalizeFlagInput } = require('./flags-hash.js');

function verifyFlag(challengeId, flag) {
  const expectedHash = FLAG_HASHES[challengeId];
  if (!expectedHash) return null;               // unknown challenge
  const got = crypto.createHash('sha256')
    .update(normalizeFlagInput(flag), 'utf8').digest('hex');
  return got === expectedHash;
}

function handleCTFVerify(req, res) {
  readJsonBody(req, res, 16 * 1024, (parsed) => {
    const { challengeId, flag } = parsed;
    if (!challengeId || !flag) {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: '缺少 challengeId 或 flag' }));
    }
    const result = verifyFlag(challengeId, flag);
    if (result === null) {
      res.writeHead(404, jsonHdrs());
      return res.end(JSON.stringify({ error: '题目不存在' }));
    }
    res.writeHead(200, jsonHdrs());
    res.end(JSON.stringify({ correct: result }));
  });
}

// ── Static files ─────────────────────────────────────────────
// Block-list of paths that must never be served over HTTP. The app itself
// needs none of these; they exist for developers, CI and git.
const STATIC_BLOCK_RULES = [
  /^\/\.git/i, /^\/\.github/i, /^\/\.mailmap$/i, /^\/\.gitignore$/i,
  /^\/server\.js$/i, /^\/progress\.json$/i, /^\/package(-lock)?\.json$/i,
  /^\/restart_server\.bat$/i,
  /^\/(tests|scripts|versions)\//i,
];
function isBlockedStatic(urlPath) {
  if (/(^|\/)\./.test(path.posix.basename(urlPath))) return true;       // dotfiles
  if (/\.(bak|bat|cmd|log|env|lock)$/i.test(urlPath)) return true;      // junk/env
  return STATIC_BLOCK_RULES.some(re => re.test(urlPath));
}

// Small FIFO cache of gzipped payloads keyed by path+size+mtime, so repeat
// requests don't recompress multi-MB assets (content.js is ~3.6 MB).
const GZIP_CACHE_MAX = 24;
const gzipCache = new Map();

function serveStatic(req, res, urlPath) {
  // Block-list enforced twice: on the raw URL and on its decoded form, so
  // neither direct paths nor percent-encoding tricks can reach repo internals.
  if (isBlockedStatic(urlPath)) {
    res.writeHead(403, securityHeaders()); return res.end('Forbidden');
  }
  // Decode once; malformed encodings are rejected outright.
  let decoded;
  try { decoded = decodeURIComponent(urlPath); }
  catch {
    res.writeHead(400, securityHeaders()); return res.end('Bad Request');
  }
  if (decoded.includes('\0') || /(^|[\\/])\.\.($|[\\/])/.test(decoded)) {
    res.writeHead(403, securityHeaders()); return res.end('Forbidden');
  }
  if (isBlockedStatic(decoded)) {
    res.writeHead(403, securityHeaders()); return res.end('Forbidden');
  }

  const resolved = path.resolve(ROOT, '.' + decoded.replace(/\//g, path.sep));
  if (path.relative(ROOT, resolved).startsWith('..') || path.isAbsolute(path.relative(ROOT, resolved))) {
    res.writeHead(403, securityHeaders()); return res.end('Forbidden');
  }

  fs.stat(resolved, (statErr, st) => {
    if (statErr || !st.isFile()) {
      res.writeHead(404, securityHeaders()); return res.end('Not Found');
    }

    fs.readFile(resolved, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, securityHeaders()); return res.end('Internal Server Error');
      }

      const etag = '"' + st.size + '-' + st.mtimeMs + '"';
      const headers = securityHeaders({
        'Content-Type': getMime(resolved),
        'ETag': etag,
        'Cache-Control': /\.(html|css|js)$/i.test(resolved) ? 'no-cache' : 'public, max-age=3600',
        'Vary': 'Accept-Encoding',
      });

      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, headers);
        return res.end();
      }

      const compressible = /\.(html|css|js|json|svg|xml|txt|md)$/i.test(resolved);
      const wantsGzip = (req.headers['accept-encoding'] || '').includes('gzip');

      if (compressible && wantsGzip) {
        const cacheKey = resolved + '|' + st.size + '|' + st.mtimeMs;
        let packed = gzipCache.get(cacheKey);
        if (!packed) {
          packed = zlib.gzipSync(data);
          gzipCache.set(cacheKey, packed);
          if (gzipCache.size > GZIP_CACHE_MAX) {
            gzipCache.delete(gzipCache.keys().next().value);
          }
        }
        headers['Content-Encoding'] = 'gzip';
        res.writeHead(200, headers);
        return res.end(packed);
      }

      res.writeHead(200, headers);
      res.end(data);
    });
  });
}

// ── Main HTTP server ─────────────────────────────────────────
const server = http.createServer((req, res) => {

  // Host header gate (DNS rebinding): applied before anything else.
  if (!(BIND_HOST === '127.0.0.1' ? hostIsAllowed(req.headers.host) : true)) {
    res.writeHead(403, jsonHdrs());
    return res.end(JSON.stringify({ error: 'Forbidden host' }));
  }

  // CORS preflight — kept for local dev convenience; deliberately grants NO
  // cross-origin privileges (no Access-Control-Allow-Origin anywhere).
  if (req.method === 'OPTIONS') {
    res.writeHead(204, securityHeaders({ Allow: 'GET, POST, OPTIONS' }));
    return res.end();
  }

  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${req.method} ${req.url}`);

  // Rate limit check for POST requests
  const clientIp = req.socket.remoteAddress;
  if (req.method === 'POST' && !checkRateLimit(clientIp)) {
    res.writeHead(429, jsonHdrs());
    return res.end(JSON.stringify({ error: '请求过于频繁，请稍后重试。' }));
  }

  const urlOnly = (req.url.split('?')[0]) || '/';

  // ── API: progress persistence ───────────────────────────────
  if (urlOnly === '/api/progress') {
    if (req.method === 'GET') {
      if (!fs.existsSync(PROGRESS_FILE)) {
        res.writeHead(200, jsonHdrs());
        return res.end('{}');
      }
      return fs.readFile(PROGRESS_FILE, (err, data) => {
        res.writeHead(200, jsonHdrs());
        res.end(err ? '{}' : data);
      });
    }
    if (req.method === 'POST') {
      return readJsonBody(req, res, 1024 * 100, (data) => {
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          res.writeHead(400, jsonHdrs());
          return res.end(JSON.stringify({ error: '无效的进度数据格式' }));
        }
        // Re-serialize the validated object rather than storing raw input.
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data), 'utf-8');
        res.writeHead(200, jsonHdrs());
        res.end(JSON.stringify({ ok: true }));
      });
    }
  }

  // ── API: run code ──────────────────────────────────────────
  if (req.method === 'POST' && urlOnly === '/api/run') {
    return handleRunCode(req, res);
  }

  // ── API: CTF simulated terminal ─────────────────────────────
  if (req.method === 'POST' && urlOnly === '/api/ctf-sim') {
    return handleCTFSim(req, res);
  }

  // ── API: CTF flag verification ──────────────────────────────
  if (req.method === 'POST' && urlOnly === '/api/ctf-verify') {
    return handleCTFVerify(req, res);
  }

  // ── API proxy ─────────────────────────────────────────────
  if (req.method === 'POST' && urlOnly === '/api/chat/anthropic') {
    return proxyAnthropic(req, res);
  }
  if (req.method === 'POST' && urlOnly.startsWith('/api/chat')) {
    return proxyChat(req, res);
  }

  // ── Static files ───────────────────────────────────────────
  serveStatic(req, res, urlOnly === '/' ? '/cyberedu.html' : urlOnly);
});

server.listen(PORT, BIND_HOST, async () => {
  const hasPython = await checkRuntime('python', ['--version']);
  const hasGCC    = await checkRuntime('gcc', ['--version']);
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   CyberEdu Server  v2.6  (Multi-Model AI)  ║');
  console.log('  ║   http://' + BIND_HOST + ':' + PORT + '                    ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  Runtime detection for practice exercises:');
  console.log('    Python  ' + (hasPython ? '✓ found' : '✗ NOT FOUND — Python exercises will show errors'));
  console.log('    GCC     ' + (hasGCC ? '✓ found' : '✗ NOT FOUND — C exercises will show errors'));
  console.log('');
  if (!hasPython || !hasGCC) {
    console.log('  To enable code execution, install:');
    if (!hasPython) console.log('    Python 3:  https://python.org/downloads/');
    if (!hasGCC) console.log('    GCC:       https://winlibs.com/  or  MinGW-w64');
    console.log('');
  }

  // Auto-open browser (opt out with CYBEREDU_NO_OPEN=1)
  if (AUTO_OPEN) {
    try {
      const url = 'http://localhost:' + PORT;
      const cmd = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open';
      require('child_process').exec(cmd + ' "' + url + '"').unref();
    } catch {}
  }
});
