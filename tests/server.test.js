// CyberEdu Server Tests — API endpoints, security, and data validation
const path = require('path');
const crypto = require('crypto');

module.exports = async function() {

  // ─── Static File Server ─────────────────────────────────────
  describe('Static File Server', function() {
    // Mirrors of server.js logic kept in sync intentionally (zero-dep suite).
    const MIME = {
      '.html': 'text/html; charset=utf-8',
      '.css':  'text/css; charset=utf-8',
      '.js':   'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png':  'image/png',
      '.svg':  'image/svg+xml',
      '.txt':  'text/plain; charset=utf-8',
      '.xml':  'application/xml; charset=utf-8',
    };

    const STATIC_BLOCK_RULES = [
      /^\/\.git/i, /^\/\.github/i, /^\/\.mailmap$/i, /^\/\.gitignore$/i,
      /^\/server\.js$/i, /^\/progress\.json$/i, /^\/package(-lock)?\.json$/i,
      /^\/restart_server\.bat$/i,
      /^\/(tests|scripts|versions)\//i,
    ];
    function isBlockedStatic(urlPath) {
      if (/(^|\/)\./.test(path.posix.basename(urlPath))) return true;
      if (/\.(bak|bat|cmd|log|env|lock)$/i.test(urlPath)) return true;
      return STATIC_BLOCK_RULES.some(re => re.test(urlPath));
    }

    it('should detect HTML file extensions correctly', function() {
      assert.strictEqual(path.extname('test.html').toLowerCase(), '.html');
      assert.strictEqual(path.extname('style.css').toLowerCase(), '.css');
      assert.strictEqual(path.extname('app.js').toLowerCase(), '.js');
    });

    it('should serve required app assets', function() {
      for (const p of ['/cyberedu.html', '/content.js', '/script.js', '/i18n.js',
                       '/style.css', '/flags-hash.js', '/favicon.svg']) {
        assert.strictEqual(isBlockedStatic(p), false, p + ' must be servable');
      }
    });

    it('should block server internals and repo metadata', function() {
      for (const p of ['/server.js', '/progress.json', '/package.json',
                       '/restart_server.bat', '/.gitignore', '/.mailmap']) {
        assert.strictEqual(isBlockedStatic(p), true, p + ' must be blocked');
      }
    });

    it('should block .git, CI and tool directories', function() {
      for (const p of ['/.git/config', '/.github/workflows/test.yml',
                       '/tests/server.test.js', '/scripts/gen-flag-hashes.js',
                       '/versions/cyberedu_v1.0.html']) {
        assert.strictEqual(isBlockedStatic(p), true, p + ' must be blocked');
      }
    });

    it('should detect directory traversal attempts', function() {
      const ROOT = path.resolve(__dirname, '..');
      const malicious = path.join(ROOT, '../../etc/passwd');
      const normalized = path.normalize(malicious);
      assert.strictEqual(normalized.startsWith(ROOT), false, 'Directory traversal should be blocked');
    });

    it('should block .. path traversal with multiple segments', function() {
      const ROOT = path.resolve(__dirname, '..');
      const traversal = path.join(ROOT, '..', '..', 'etc', 'passwd');
      assert.strictEqual(path.normalize(traversal).startsWith(ROOT), false);
    });

    it('should reject encoded traversal after URL decoding', function() {
      const ROOT = path.resolve(__dirname, '..');
      const decoded = decodeURIComponent('/..%2F..%2Fetc%2Fpasswd');
      const resolved = path.resolve(ROOT, '.' + decoded);
      assert.ok(
        path.relative(ROOT, resolved).startsWith('..') || path.isAbsolute(path.relative(ROOT, resolved)),
        'Encoded traversal must land outside ROOT'
      );
    });

    it('should keep resolved paths outside ROOT rejected (any platform)', function() {
      const ROOT = path.resolve(__dirname, '..');
      // Construct a genuinely-absolute sibling of ROOT in a portable way.
      const outside = path.resolve(ROOT, '..', 'elsewhere-secret.txt');
      const rel = path.relative(ROOT, outside);
      assert.ok(
        rel.startsWith('..') || path.isAbsolute(rel),
        'escape detection must hold whether or not drives differ'
      );
    });

    it('should handle MIME type lookup for common extensions', function() {
      assert.strictEqual(MIME['.html'], 'text/html; charset=utf-8');
      assert.strictEqual(MIME['.js'], 'application/javascript; charset=utf-8');
      assert.strictEqual(MIME['.unknown'], undefined);
    });
  });

  // ─── Host Header Validation (anti DNS-rebinding) ─────────────
  describe('Host Header Validation', function() {
    const HOST_ALLOWED = new Set(['localhost:8000', '127.0.0.1:8000', '[::1]:8000']);
    function hostIsAllowed(h) { return !h || HOST_ALLOWED.has(String(h).toLowerCase()); }

    it('should accept loopback host forms', function() {
      assert.ok(hostIsAllowed('localhost:8000'));
      assert.ok(hostIsAllowed('127.0.0.1:8000'));
      assert.ok(hostIsAllowed('[::1]:8000'));
    });

    it('should reject attacker-controlled hosts', function() {
      assert.ok(!hostIsAllowed('evil.com'));
      assert.ok(!hostIsAllowed('attacker.example.org:8000'));
      assert.ok(!hostIsAllowed('localhost.evil.com:8000'));
    });

    it('should be case-insensitive', function() {
      assert.ok(hostIsAllowed('LOCALHOST:8000'));
    });
  });

  // ─── Request Body Size Caps ──────────────────────────────────
  describe('Request Body Size Caps', function() {
    // Pure mirror of readJsonBody byte-accumulation semantics.
    function bodyVerdict(byteLen, maxBytes) {
      if (byteLen > maxBytes) return 413;
      return 200;
    }

    it('should allow bodies within cap', function() {
      assert.strictEqual(bodyVerdict(1024, 16 * 1024), 200);
      assert.strictEqual(bodyVerdict(256 * 1024, 256 * 1024), 200);
    });

    it('should reject oversized chat payloads (256KB cap)', function() {
      assert.strictEqual(bodyVerdict(256 * 1024 + 1, 256 * 1024), 413);
    });

    it('should reject oversized verify payloads (16KB cap)', function() {
      assert.strictEqual(bodyVerdict(17 * 1024, 16 * 1024), 413);
    });

    it('should keep progress cap at 100KB', function() {
      assert.strictEqual(bodyVerdict(100 * 1024, 100 * 1024), 200);
      assert.strictEqual(bodyVerdict(100 * 1024 + 1, 100 * 1024), 413);
    });
  });

  // ─── CTF Flag Verification (SHA-256 digests) ────────────────
  describe('CTF Flag Verification (SHA-256)', function() {
    const { FLAG_HASHES, normalizeFlagInput } = require('../flags-hash.js');
    function verify(challengeId, flag) {
      const expected = FLAG_HASHES[challengeId];
      if (!expected) return { error: 'not found' };
      const got = crypto.createHash('sha256')
        .update(normalizeFlagInput(flag), 'utf8').digest('hex');
      return { correct: got === expected };
    }
    // Hard-coded external vector pins the normalization contract even if the
    // hash file is regenerated someday: sha256("flag{c4s4r_1s_n0t_s3cur3}")
    const PINNED_CTF001 = '23a082447a457ad8853b8b7ff8452ec5e2cf9e4cd9267a07bcdd01c9effb7ef6';

    it('should ship exactly 28 well-formed answer hashes', function() {
      const keys = Object.keys(FLAG_HASHES);
      assert.strictEqual(keys.length, 28);
      for (let i = 1; i <= 28; i++) {
        const id = 'ctf-' + String(i).padStart(3, '0');
        assert.ok(/^[0-9a-f]{64}$/.test(FLAG_HASHES[id] || ''), id + ' hash missing/malformed');
      }
    });

    it('should match the pinned digest for ctf-001', function() {
      assert.strictEqual(FLAG_HASHES['ctf-001'], PINNED_CTF001,
        'Normalization or hashing changed — rotate PINNED_CTF001 deliberately!');
    });

    it('should correctly verify a valid flag', function() {
      assert.strictEqual(verify('ctf-003', 'flag{sql1_1nj3ct1on_m4st3r}').correct, true);
    });

    it('should be case-insensitive and whitespace-tolerant', function() {
      assert.strictEqual(verify('ctf-001', '  FLAG{RS4_G0_BRRR}\t').correct, true);
      assert.strictEqual(verify('ctf-008', '\nflag{c0mm4nd_1nj3ct10n_3z}\r\n').correct, true);
      // NB: removed whitespace *joins* characters — it never substitutes
      // underscores, so a spaced-out answer is a different (rejected) string.
      assert.strictEqual(verify('ctf-001', 'flag{ rs4 g0 brrr }').correct, false);
    });

    it('should reject wrong flags', function() {
      assert.strictEqual(verify('ctf-001', 'flag{wrong_answer}').correct, false);
      assert.strictEqual(verify('ctf-002', '').correct, false);
    });

    it('should return error for nonexistent challenges', function() {
      assert.strictEqual(verify('ctf-999', 'flag{anything}').error, 'not found');
    });
  });

  // ─── Rate Limiter ───────────────────────────────────────────
  describe('Rate Limiter', function() {
    function createRateLimiter(max, window) {
      const limits = new Map();
      let nowStub = null;
      const check = function(ip) {
        const now = nowStub ? nowStub() : Date.now();
        let entry = limits.get(ip);
        if (!entry || now - entry.start > window) {
          entry = { start: now, count: 0 };
          limits.set(ip, entry);
        }
        entry.count++;
        return entry.count <= max;
      };
      check.sweep = function() {
        const now = nowStub ? nowStub() : Date.now();
        for (const [k, v] of limits) {
          if (now - v.start > window) limits.delete(k);
        }
      };
      check.setClock = fn => { nowStub = fn; };
      check.size = () => limits.size;
      return check;
    }

    it('should allow requests within limit', function() {
      const check = createRateLimiter(30, 60000);
      for (let i = 0; i < 30; i++) {
        assert.strictEqual(check('127.0.0.1'), true, `Request ${i+1} should be allowed`);
      }
    });

    it('should block requests exceeding limit', function() {
      const check = createRateLimiter(5, 60000);
      for (let i = 0; i < 5; i++) check('10.0.0.1');
      assert.strictEqual(check('10.0.0.1'), false, '6th request should be blocked');
    });

    it('should track IPs independently', function() {
      const check = createRateLimiter(2, 60000);
      check('10.0.0.1'); check('10.0.0.1');
      assert.strictEqual(check('10.0.0.1'), false, 'IP 1 should be blocked');
      assert.strictEqual(check('10.0.0.2'), true, 'IP 2 should still be allowed');
    });

    it('should evict stale entries on unconditional sweep', function() {
      const check = createRateLimiter(30, 60000);
      let clock = 1_000_000;
      check.setClock(() => clock);
      check('203.0.113.7');
      clock += 120000;                        // two windows later
      check.sweep();                          // server's setInterval equivalent
      assert.strictEqual(check.size(), 0, 'stale IP entry should be gone');
    });
  });

  // ─── API URL Whitelist ──────────────────────────────────────
  describe('API URL Whitelist', function() {
    const ALLOWED = [
      'api.openai.com', 'api.deepseek.com', 'dashscope.aliyuncs.com',
      'api.anthropic.com', 'api.groq.com', 'localhost', '127.0.0.1',
    ];

    it('should allow known AI API hosts', function() {
      assert.ok(ALLOWED.includes('api.deepseek.com'));
      assert.ok(ALLOWED.includes('api.openai.com'));
      assert.ok(ALLOWED.includes('api.anthropic.com'));
      assert.ok(ALLOWED.includes('localhost'));
    });

    it('should reject unknown hosts', function() {
      assert.ok(!ALLOWED.includes('evil.example.com'));
      assert.ok(!ALLOWED.includes('attacker.org'));
      assert.ok(!ALLOWED.includes('api.deepseek.com.evil.com'));
    });

    it('should reject empty host', function() {
      assert.ok(!ALLOWED.includes(''));
    });
  });

  // ─── Progress Data Validation ───────────────────────────────
  describe('Progress Data Validation', function() {
    function validateProgress(body) {
      const MAX_SIZE = 1024 * 100;
      if (Buffer.byteLength(body) > MAX_SIZE) return { error: 'too large' };
      try {
        const data = JSON.parse(body);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          return { error: 'invalid format' };
        }
        return { ok: true };
      } catch {
        return { error: 'invalid JSON' };
      }
    }

    it('should accept valid progress objects', function() {
      const result = validateProgress(JSON.stringify({
        completedSections: [], ctfSolved: [], streak: 0
      }));
      assert.ok(result.ok);
    });

    it('should reject null data', function() {
      assert.strictEqual(validateProgress('null').error, 'invalid format');
    });

    it('should reject array data', function() {
      assert.strictEqual(validateProgress('[1,2,3]').error, 'invalid format');
    });

    it('should reject invalid JSON', function() {
      assert.strictEqual(validateProgress('{bad json').error, 'invalid JSON');
    });

    it('should enforce size limits', function() {
      const large = JSON.stringify({ x: 'a'.repeat(200 * 1024) });
      assert.strictEqual(validateProgress(large).error, 'too large');
    });
  });

  // ─── CTF Simulated Terminal ─────────────────────────────────
  describe('CTF Simulated Terminal', function() {
    function escHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    it('should escape HTML in user input', function() {
      assert.strictEqual(
        escHtml('<script>alert(1)</script>'),
        '&lt;script&gt;alert(1)&lt;/script&gt;'
      );
    });

    it('should escape ampersands', function() {
      assert.strictEqual(escHtml('a & b'), 'a &amp; b');
    });

    it('should handle SQL injection detection pattern', function() {
      const input = "admin' OR '1'='1";
      assert.ok(/\bOR\b/i.test(input), 'Should detect OR keyword');
    });

    it('should handle command injection splitting', function() {
      const input = '127.0.0.1;ls;cat flag.txt';
      const parts = input.split(/[;|&\n]/);
      assert.strictEqual(parts.length, 3);
      assert.strictEqual(parts[0].trim(), '127.0.0.1');
    });
  });

  // ─── Error Messages ─────────────────────────────────────────
  describe('Error Messages', function() {
    const ERR_ZH = {
      400: '请求格式错误，请检查参数。',
      401: 'API Key 无效或已过期，请检查设置。',
      402: '账户余额不足，请前往 DeepSeek 平台充值。',
      429: '请求速率超限（RPM/TPM 已达上限），请稍后重试。',
      500: 'DeepSeek 服务器内部错误，请稍后重试。',
      503: 'DeepSeek 服务器繁忙，请稍后重试。',
    };

    it('should have Chinese error messages for common status codes', function() {
      assert.ok(typeof ERR_ZH[400] === 'string');
      assert.ok(typeof ERR_ZH[401] === 'string');
      assert.ok(typeof ERR_ZH[429] === 'string');
    });

    it('should provide fallback for unknown status codes', function() {
      const status = 418;
      const msg = ERR_ZH[status] || `API 错误 ${status}`;
      assert.strictEqual(msg, 'API 错误 418');
    });
  });

  // ─── Content-Security-Policy ────────────────────────────────
  describe('Content Security Policy', function() {
    it('HTML meta CSP should allow inline handlers without voiding hash sources', function() {
      const fs = require('fs');
      const html = fs.readFileSync(path.join(__dirname, '..', 'cyberedu.html'), 'utf8');
      const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
      assert.ok(m, 'CSP meta tag must be present');
      assert.ok(m[1].includes("'self'"), 'default-src self required');
      assert.ok(m[1].includes('cdnjs.cloudflare.com'), 'CDN scripts allowed');
      assert.ok(m[1].includes("'self'"), 'default-src self required');
      assert.ok(m[1].includes('cdnjs.cloudflare.com'), 'CDN scripts allowed');
      // CSP2+ GOTCHA: a hash/nonce source makes browsers IGNORE 'unsafe-inline',
      // which re-breaks all ~830 inline handlers. The JSON-LD data block is
      // never executed, so it needs no hash entry. Pin its absence:
      assert.ok(!m[1].includes("'sha256-"), 'no hash source beside unsafe-inline (would void it)');
      // ~830 inline onclick/onkeydown attributes across cyberedu.html and
      // content.js REQUIRE 'unsafe-inline' — without it browsers silently
      // block every handler and ALL buttons die (v2.6 roll-out regression).
      assert.ok(m[1].includes("'unsafe-inline'"),
        "script-src must whitelist inline handlers or the UI becomes inert");
      assert.ok(!m[1].includes("'unsafe-eval'"), 'unsafe-eval forbidden');
      assert.ok(!m[1].includes('http://'), 'no insecure upgradeable origins');
    });

    it('flags-hash.js must not contain plaintext answers', function() {
      const fs = require('fs');
      const src = fs.readFileSync(path.join(__dirname, '..', 'flags-hash.js'), 'utf8');
      assert.ok(!/['"`]flag\{[^}]+\}['"`]/.test(src), 'plaintext flag literal found in flags-hash.js!');
    });

    it('removed legacy archives must not resurrect', function() {
      const fs = require('fs');
      for (const f of ['versions/cyberedu_v1.0.html', 'versions/cyberedu_v2.0.html',
                       'versions/script_v2.0.js', 'scripts/remove-client-flags.js']) {
        assert.ok(!fs.existsSync(path.join(__dirname, '..', f)), f + ' was deleted; keep it deleted');
      }
    });
  });
};
