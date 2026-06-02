// CyberEdu Local Server
// Usage: node server.js
// Opens browser at http://localhost:8000

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const PORT = 8000;
const ROOT = __dirname;

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

// Simple MIME lookup
function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] || 'application/octet-stream';
}

// Proxy AI chat request (streaming SSE)
function proxyChat(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let parsed;
    try { parsed = JSON.parse(body); } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    const { apiKey, apiUrl, model, messages } = parsed;

    if (!apiKey || !apiUrl || !messages || !Array.isArray(messages)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing required fields: apiKey, apiUrl, messages' }));
      return;
    }

    // Parse the target API URL
    let targetUrl;
    try { targetUrl = new URL(apiUrl); } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid API URL' }));
      return;
    }

    // Build OpenAI-compatible request body
    const requestBody = JSON.stringify({
      model: model || 'gpt-3.5-turbo',
      messages: messages,
      stream: true,
    });

    const isHttps = targetUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const proxyReq = lib.request(options, (proxyRes) => {
      // Set CORS headers + content type for streaming
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Pipe SSE stream directly to client
      proxyRes.on('data', chunk => {
        res.write(chunk);
      });
      proxyRes.on('end', () => {
        res.end();
      });
    });

    proxyReq.on('error', (e) => {
      console.error('[Proxy Error]', e.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Proxy error: ' + e.message }));
    });

    proxyReq.write(requestBody);
    proxyReq.end();
  });
}

// Main HTTP server
const server = http.createServer((req, res) => {
  // Debug log
  console.log('[Request]', req.method, req.url);

  // API proxy endpoint (flexible matching)
  if (req.method === 'POST' && req.url.startsWith('/api/chat')) {
    proxyChat(req, res);
    return;
  }

  // Static file serving
  let filePath = req.url === '/' ? '/cyberedu.html' : req.url;
  filePath = path.join(ROOT, filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': getMime(filePath) });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  CyberEdu Server running at http://localhost:' + PORT);
  console.log('  Press Ctrl+C to stop');
  console.log('');

  // Auto-open browser
  const open = (url) => {
    const cmd = process.platform === 'win32' ? 'start' :
                process.platform === 'darwin' ? 'open' : 'xdg-open';
    require('child_process').exec(cmd + ' "' + url + '"');
  };
  try { open('http://localhost:' + PORT); } catch (e) { /* ignore */ }
});
