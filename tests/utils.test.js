// CyberEdu Utility Tests — Pure logic functions (no DOM, no network)
const path = require('path');

module.exports = async function() {

  // ─── HTML Escaping ─────────────────────────────────────────
  describe('HTML Escaping', function() {
    function escHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    it('should escape < and > characters', function() {
      assert.strictEqual(escHtml('<div>'), '&lt;div&gt;');
    });

    it('should escape ampersands', function() {
      assert.strictEqual(escHtml('a & b'), 'a &amp; b');
    });

    it('should escape double quotes', function() {
      assert.strictEqual(escHtml('say "hello"'), 'say &quot;hello&quot;');
    });

    it('should escape single quotes', function() {
      assert.strictEqual(escHtml("it's"), 'it&#39;s');
    });

    it('should handle empty strings', function() {
      assert.strictEqual(escHtml(''), '');
    });

    it('should handle strings with no special characters', function() {
      assert.strictEqual(escHtml('hello world'), 'hello world');
    });

    it('should prevent XSS script injection', function() {
      const input = '<script>alert("xss")</script>';
      const output = escHtml(input);
      assert.ok(!output.includes('<script>'), 'Should not contain raw script tag');
      assert.ok(output.includes('&lt;script&gt;'));
    });

    it('should prevent event handler injection', function() {
      const input = '<img onerror=alert(1) src=x>';
      const output = escHtml(input);
      assert.ok(!output.includes('<img'));
    });

    it('should handle multiple consecutive special characters', function() {
      assert.strictEqual(escHtml('<<>>'), '&lt;&lt;&gt;&gt;');
    });
  });

  // ─── URL Validation ────────────────────────────────────────
  describe('URL Validation', function() {
    function isValidUrl(str) {
      try { new URL(str); return true; } catch { return false; }
    }

    function extractHost(url) {
      try { return new URL(url).hostname; } catch { return null; }
    }

    it('should accept valid HTTP URLs', function() {
      assert.ok(isValidUrl('https://api.deepseek.com/v1/chat/completions'));
      assert.ok(isValidUrl('http://localhost:8000/api/chat'));
    });

    it('should reject invalid URLs', function() {
      assert.ok(!isValidUrl('not-a-url'));
      assert.ok(!isValidUrl(''));
      assert.ok(!isValidUrl('://missing-protocol'));
    });

    it('should extract hostname correctly', function() {
      assert.strictEqual(extractHost('https://api.openai.com/v1/chat'), 'api.openai.com');
      assert.strictEqual(extractHost('http://localhost:8000/path'), 'localhost');
    });

    it('should return null for invalid URL host extraction', function() {
      assert.strictEqual(extractHost('not-a-url'), null);
    });
  });

  // ─── JSON Safe Parsing ─────────────────────────────────────
  describe('JSON Safe Parsing', function() {
    function safeParse(str) {
      try { return { ok: true, data: JSON.parse(str) }; }
      catch { return { ok: false, data: null }; }
    }

    it('should parse valid JSON objects', function() {
      const result = safeParse('{"key":"value"}');
      assert.ok(result.ok);
      assert.deepStrictEqual(result.data, { key: 'value' });
    });

    it('should parse valid JSON arrays', function() {
      const result = safeParse('[1,2,3]');
      assert.ok(result.ok);
      assert.deepStrictEqual(result.data, [1, 2, 3]);
    });

    it('should handle invalid JSON gracefully', function() {
      const result = safeParse('{broken json}');
      assert.ok(!result.ok);
      assert.strictEqual(result.data, null);
    });

    it('should handle empty strings', function() {
      const result = safeParse('');
      assert.ok(!result.ok);
    });

    it('should handle null literal', function() {
      const result = safeParse('null');
      assert.ok(result.ok);
      assert.strictEqual(result.data, null);
    });
  });

  // ─── String Utilities ──────────────────────────────────────
  describe('String Utilities', function() {
    function truncate(str, max, suffix) {
      suffix = suffix || '...';
      if (str.length <= max) return str;
      return str.slice(0, max - suffix.length) + suffix;
    }

    function slugify(str) {
      return str.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
    }

    function countWords(str) {
      // Count consecutive Chinese character groups as one word each
      const cnGroups = (str.match(/[\u4e00-\u9fff]+/g) || []).length;
      // Count English words (after replacing Chinese with spaces)
      const en = str.replace(/[\u4e00-\u9fff]+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
      return cnGroups + en;
    }

    it('should truncate long strings', function() {
      assert.strictEqual(truncate('hello world', 8), 'hello...');
    });

    it('should not truncate short strings', function() {
      assert.strictEqual(truncate('short', 10), 'short');
    });

    it('should slugify English text', function() {
      assert.strictEqual(slugify('Hello World'), 'hello-world');
    });

    it('should slugify mixed text', function() {
      assert.strictEqual(slugify('CTF Challenge #1'), 'ctf-challenge-1');
    });

    it('should handle Chinese characters in slugify', function() {
      const result = slugify('网络安全 Crypto');
      assert.ok(result.includes('网络安全'));
    });

    it('should count English words', function() {
      assert.strictEqual(countWords('hello world foo'), 3);
    });

    it('should count Chinese characters as words', function() {
      assert.strictEqual(countWords('你好世界'), 1); // consecutive Chinese = 1 word group
    });

    it('should count mixed text correctly', function() {
      const count = countWords('hello 你好 world');
      assert.strictEqual(count, 3); // "hello", "你好", "world"
    });
  });

  // ─── Debounce / Throttle Logic ─────────────────────────────
  describe('Debounce / Throttle Logic', function() {
    it('should debounce: only last call within window fires', function(done) {
      let callCount = 0;
      function debounce(fn, ms) {
        let timer;
        return function() {
          clearTimeout(timer);
          timer = setTimeout(() => { fn.apply(this, arguments); }, ms);
        };
      }
      const inc = debounce(() => { callCount++; }, 10);
      inc(); inc(); inc(); inc(); inc();
      // After 50ms, only 1 call should have fired
      setTimeout(() => {
        assert.strictEqual(callCount, 1);
        done();
      }, 50);
    });
  });

  // ─── Progress Data Merge ───────────────────────────────────
  describe('Progress Data Merge', function() {
    function mergeProgress(existing, update) {
      const merged = Object.assign({}, existing);
      for (const [key, val] of Object.entries(update)) {
        if (Array.isArray(val) && Array.isArray(merged[key])) {
          // Merge arrays without duplicates
          merged[key] = [...new Set([...merged[key], ...val])];
        } else if (typeof val === 'number' && typeof merged[key] === 'number') {
          merged[key] = Math.max(merged[key], val); // keep highest
        } else {
          merged[key] = val;
        }
      }
      return merged;
    }

    it('should merge arrays without duplicates', function() {
      const result = mergeProgress(
        { completedSections: ['s1', 's2'] },
        { completedSections: ['s2', 's3'] }
      );
      assert.deepStrictEqual(result.completedSections.sort(), ['s1', 's2', 's3']);
    });

    it('should keep highest numeric values', function() {
      const result = mergeProgress({ streak: 5 }, { streak: 3 });
      assert.strictEqual(result.streak, 5);
    });

    it('should add new keys from update', function() {
      const result = mergeProgress({ a: 1 }, { b: 2 });
      assert.strictEqual(result.a, 1);
      assert.strictEqual(result.b, 2);
    });

    it('should handle empty objects', function() {
      const result = mergeProgress({}, { a: 1 });
      assert.deepStrictEqual(result, { a: 1 });
    });

    it('should not mutate original objects', function() {
      const orig = { x: [1, 2] };
      const upd = { x: [3] };
      mergeProgress(orig, upd);
      assert.deepStrictEqual(orig.x, [1, 2]);
      assert.deepStrictEqual(upd.x, [3]);
    });
  });

  // ─── CTF Flag Utilities ────────────────────────────────────
  describe('CTF Flag Utilities', function() {
    function normalizeFlag(flag) {
      return flag.trim().toLowerCase();
    }

    function isValidFlagFormat(flag) {
      return /^flag\{[^}]+\}$/i.test(flag.trim());
    }

    it('should normalize flags to lowercase', function() {
      assert.strictEqual(normalizeFlag('FLAG{ABC}'), 'flag{abc}');
    });

    it('should trim whitespace', function() {
      assert.strictEqual(normalizeFlag('  flag{test}  '), 'flag{test}');
    });

    it('should validate flag format', function() {
      assert.ok(isValidFlagFormat('flag{test_123}'));
      assert.ok(isValidFlagFormat('FLAG{UPPER}'));
    });

    it('should reject invalid flag formats', function() {
      assert.ok(!isValidFlagFormat('not_a_flag'));
      assert.ok(!isValidFlagFormat('flag{}'));
      assert.ok(!isValidFlagFormat('flag{unclosed'));
    });
  });

  // ─── Color / Theme Utilities ───────────────────────────────
  describe('Color / Theme Utilities', function() {
    function hexToRgb(hex) {
      const m = hex.replace('#', '').match(/.{2}/g);
      if (!m) return null;
      return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
    }

    function luminance(r, g, b) {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function contrastRatio(hex1, hex2) {
      const c1 = hexToRgb(hex1);
      const c2 = hexToRgb(hex2);
      const l1 = luminance(c1.r, c1.g, c1.b);
      const l2 = luminance(c2.r, c2.g, c2.b);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    it('should parse hex colors correctly', function() {
      assert.deepStrictEqual(hexToRgb('#ff0000'), { r: 255, g: 0, b: 0 });
      assert.deepStrictEqual(hexToRgb('#00ff41'), { r: 0, g: 255, b: 65 });
    });

    it('should calculate luminance', function() {
      const white = luminance(255, 255, 255);
      const black = luminance(0, 0, 0);
      assert.ok(white > 0.9, 'White should have high luminance');
      assert.ok(black < 0.01, 'Black should have near-zero luminance');
    });

    it('should verify WCAG AA contrast for muted text fix', function() {
      // --text-muted was changed from #5a6070 to #8890a0 on dark bg (#0a0a0f)
      const ratio = contrastRatio('#8890a0', '#0a0a0f');
      assert.ok(ratio >= 4.5, `WCAG AA requires ≥4.5:1, got ${ratio.toFixed(2)}:1`);
    });

    it('should verify green accent on dark background', function() {
      const ratio = contrastRatio('#00ff41', '#0a0a0f');
      assert.ok(ratio >= 4.5, `Green on dark should be ≥4.5:1, got ${ratio.toFixed(2)}:1`);
    });
  });

  // ─── Search / Filter Logic ─────────────────────────────────
  describe('Search / Filter Logic', function() {
    function fuzzyMatch(query, text) {
      query = query.toLowerCase();
      text = text.toLowerCase();
      if (text.includes(query)) return true;
      let qi = 0;
      for (let i = 0; i < text.length && qi < query.length; i++) {
        if (text[i] === query[qi]) qi++;
      }
      return qi === query.length;
    }

    function rankResults(query, items, fields) {
      return items
        .map(item => {
          let score = 0;
          const q = query.toLowerCase();
          for (const f of fields) {
            const val = (item[f] || '').toLowerCase();
            let fieldScore = 0;
            if (val === q) fieldScore = 100;
            else if (val.startsWith(q)) fieldScore = 50;
            else if (val.includes(q)) fieldScore = 25;
            else if (fuzzyMatch(q, val)) fieldScore = 10;
            score = Math.max(score, fieldScore);
          }
          // Tiebreaker: exact title match gets priority
          if ((item.title || '').toLowerCase() === q) score += 0.5;
          return { item, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.item);
    }

    it('should fuzzy match substrings', function() {
      assert.ok(fuzzyMatch('cry', 'cryptography'));
      assert.ok(fuzzyMatch('xss', 'Cross-Site Scripting (XSS)'));
    });

    it('should reject non-matches', function() {
      assert.ok(!fuzzyMatch('xyz', 'cryptography'));
    });

    it('should rank exact matches highest', function() {
      const items = [
        { title: 'Crypto Basics', tag: 'crypto' },
        { title: 'crypto', tag: 'advanced' },
        { title: 'Web Security', tag: 'crypto-related' },
      ];
      const ranked = rankResults('crypto', items, ['title', 'tag']);
      assert.strictEqual(ranked[0].title, 'crypto', 'Exact match should be first');
    });

    it('should filter out non-matching items', function() {
      const items = [
        { title: 'Python Basics' },
        { title: 'Network Scanning' },
      ];
      const ranked = rankResults('crypto', items, ['title']);
      assert.strictEqual(ranked.length, 0);
    });
  });

  // ─── Sanitization Helpers ──────────────────────────────────
  describe('Sanitization Helpers', function() {
    function sanitizeFilename(name) {
      return name
        .replace(/\.{2,}/g, '_')  // collapse path traversal dots first
        .replace(/[^a-zA-Z0-9._()-]/g, '_')  // allow parens
        .replace(/_+/g, '_')
        .slice(0, 255);
    }

    function stripTags(html) {
      return html.replace(/<[^>]*>/g, '');
    }

    it('should sanitize filenames', function() {
      assert.strictEqual(sanitizeFilename('my file (1).txt'), 'my_file_(1).txt');
    });

    it('should prevent path traversal in filenames', function() {
      assert.strictEqual(sanitizeFilename('../../../etc/passwd'), '_etc_passwd');
    });

    it('should limit filename length', function() {
      const long = 'a'.repeat(300);
      assert.ok(sanitizeFilename(long).length <= 255);
    });

    it('should strip HTML tags', function() {
      assert.strictEqual(stripTags('<b>bold</b> text'), 'bold text');
    });

    it('should strip nested tags', function() {
      assert.strictEqual(stripTags('<div><p>hello</p></div>'), 'hello');
    });
  });
};
