// CyberEdu Local Server v2.1 - AI Chat Enhanced
// Usage: node server.js   (serves F:\workspace on port 8000)
// Browser opens at http://localhost:8000

const http = require('http');
const fs   = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const PORT = 8000;
const ROOT = __dirname;

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
};

function getMime(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
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
  let body = '';
  req.on('data',  chunk => { body += chunk; });
  req.on('end', () => {
    let parsed;
    try { parsed = JSON.parse(body); } catch {
      res.writeHead(400, jsonHdrs());
      return res.end(JSON.stringify({ error: '请求体 JSON 格式错误。' }));
    }

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
      res.writeHead(200, {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no',   // disable nginx proxy buffering
      });

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

function jsonHdrs() {
  return { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' };
}

// ── Main HTTP server ─────────────────────────────────────────
const server = http.createServer((req, res) => {

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${req.method} ${req.url}`);

  // ── API proxy ─────────────────────────────────────────────
  if (req.method === 'POST' && req.url.startsWith('/api/chat')) {
    return proxyChat(req, res);
  }

  // ── Static files ───────────────────────────────────────────
  let filePath = req.url === '/' ? '/cyberedu.html' : req.url.split('?')[0];
  filePath = path.join(ROOT, filePath);

  // Directory traversal guard
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') { res.writeHead(404); return res.end('Not Found'); }
      res.writeHead(500); return res.end('Internal Server Error');
    }
    res.writeHead(200, { 'Content-Type': getMime(filePath) });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   CyberEdu Server  v2.1  (AI Chat Enhanced)  ║');
  console.log('  ║   http://localhost:' + PORT + '                     ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');

  // Auto-open browser
  try {
    const url = 'http://localhost:' + PORT;
    const cp  = require('child_process');
    const cmd = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    cp.exec(cmd + ' "' + url + '"');
  } catch {}
});
