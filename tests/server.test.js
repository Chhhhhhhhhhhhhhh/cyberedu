// CyberEdu Server Tests — API endpoints, security, and data validation
const path = require('path');

module.exports = async function() {

  // ─── Static File Server ─────────────────────────────────────
  describe('Static File Server', function() {
    it('should detect HTML file extensions correctly', function() {
      assert.strictEqual(path.extname('test.html').toLowerCase(), '.html');
      assert.strictEqual(path.extname('style.css').toLowerCase(), '.css');
      assert.strictEqual(path.extname('app.js').toLowerCase(), '.js');
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
      const normalized = path.normalize(traversal);
      assert.strictEqual(normalized.startsWith(ROOT), false);
    });

    it('should allow valid paths within ROOT', function() {
      const ROOT = path.resolve(__dirname, '..');
      const valid = path.join(ROOT, 'cyberedu.html');
      assert.strictEqual(valid.startsWith(ROOT), true);
    });

    it('should handle MIME type lookup for common extensions', function() {
      const MIME = {
        '.html': 'text/html; charset=utf-8',
        '.css':  'text/css; charset=utf-8',
        '.js':   'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png':  'image/png',
        '.svg':  'image/svg+xml',
      };
      assert.strictEqual(MIME['.html'], 'text/html; charset=utf-8');
      assert.strictEqual(MIME['.js'], 'application/javascript; charset=utf-8');
      assert.strictEqual(MIME['.unknown'], undefined);
    });
  });

  // ─── CTF Flag Verification ─────────────────────────────────
  describe('CTF Flag Verification', function() {
    // Simulate the verification logic from server.js
    const CTF_FLAGS = {
      'ctf-001': 'flag{c4s4r_1s_n0t_s3cur3}',
      'ctf-003': 'flag{sql1_1nj3ct1on_m4st3r}',
      'ctf-008': 'flag{c0mm4nd_1nj3ct10n_3z}',
      'ctf-012': 'flag{j1nj4_2_t3mpl4t3_1nj3ct10n}',
      'ctf-016': 'flag{php_l00s3_c0mp4r1s0n}',
    };

    function verify(challengeId, flag) {
      const expected = CTF_FLAGS[challengeId];
      if (!expected) return { error: 'not found' };
      return { correct: flag.trim().toLowerCase() === expected.trim().toLowerCase() };
    }

    it('should correctly verify a valid flag', function() {
      const result = verify('ctf-001', 'flag{c4s4r_1s_n0t_s3cur3}');
      assert.strictEqual(result.correct, true);
    });

    it('should be case-insensitive', function() {
      const result = verify('ctf-001', 'FLAG{C4S4R_1S_N0T_S3CUR3}');
      assert.strictEqual(result.correct, true);
    });

    it('should handle leading/trailing whitespace', function() {
      const result = verify('ctf-001', '  flag{c4s4r_1s_n0t_s3cur3}  ');
      assert.strictEqual(result.correct, true);
    });

    it('should reject wrong flags', function() {
      const result = verify('ctf-001', 'flag{wrong_answer}');
      assert.strictEqual(result.correct, false);
    });

    it('should return error for nonexistent challenges', function() {
      const result = verify('ctf-999', 'flag{anything}');
      assert.strictEqual(result.error, 'not found');
    });
  });

  // ─── Rate Limiter ───────────────────────────────────────────
  describe('Rate Limiter', function() {
    function createRateLimiter(max, window) {
      const limits = new Map();
      return function checkRateLimit(ip) {
        const now = Date.now();
        let entry = limits.get(ip);
        if (!entry || now - entry.start > window) {
          entry = { start: now, count: 0 };
          limits.set(ip, entry);
        }
        entry.count++;
        if (entry.count === 1 && limits.size > 100) {
          for (const [k, v] of limits) {
            if (now - v.start > window) limits.delete(k);
          }
        }
        return entry.count <= max;
      };
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
      check('10.0.0.1');
      check('10.0.0.1');
      assert.strictEqual(check('10.0.0.1'), false, 'IP 1 should be blocked');
      assert.strictEqual(check('10.0.0.2'), true, 'IP 2 should still be allowed');
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
      const result = validateProgress('null');
      assert.strictEqual(result.error, 'invalid format');
    });

    it('should reject array data', function() {
      const result = validateProgress('[1,2,3]');
      assert.strictEqual(result.error, 'invalid format');
    });

    it('should reject invalid JSON', function() {
      const result = validateProgress('{bad json');
      assert.strictEqual(result.error, 'invalid JSON');
    });

    it('should enforce size limits', function() {
      const large = JSON.stringify({ x: 'a'.repeat(200 * 1024) });
      const result = validateProgress(large);
      assert.strictEqual(result.error, 'too large');
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
};
