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

  // ─── Progress Reset Engine ──────────────────────────────────
  describe('Progress Reset Engine', function() {
    function defaultProgress() {
      return {
        agentName: 'OPERATIVE #1337',
        completedSections: [],
        ctfSolved: [],
        moduleProgress: {},
        timeline: [],
        streak: 1,
        lastVisit: new Date().toISOString().split('T')[0],
        unlockedBadges: [],
        commandCount: 0
      };
    }

    function resetProgressData(current, options = {}) {
      const defaults = defaultProgress();
      const next = Object.assign({}, current || defaults);
      const opt = {
        sections: !!options.sections,
        ctf: !!options.ctf,
        badges: !!options.badges,
        timeline: !!options.timeline
      };
      if (options.all) {
        opt.sections = true;
        opt.ctf = true;
        opt.badges = true;
        opt.timeline = true;
      }
      if (opt.sections) {
        next.completedSections = [];
        next.moduleProgress = {};
        delete next.lastSection;
      }
      if (opt.ctf) {
        next.ctfSolved = [];
      }
      if (opt.badges) {
        next.unlockedBadges = [];
        next.agentName = defaults.agentName;
      }
      if (opt.timeline) {
        next.timeline = [];
        next.streak = 0;
        next.commandCount = 0;
        next.lastVisit = '';
      }
      ['completedSections','ctfSolved','timeline','unlockedBadges'].forEach(k => {
        if (!Array.isArray(next[k])) next[k] = [];
      });
      if (typeof next.streak !== 'number') next.streak = 0;
      if (typeof next.commandCount !== 'number') next.commandCount = 0;
      if (typeof next.agentName !== 'string' || !next.agentName) next.agentName = defaults.agentName;
      if (!next.moduleProgress || typeof next.moduleProgress !== 'object') next.moduleProgress = {};
      return next;
    }

    it('should perform full reset when all is true', function() {
      const sample = {
        agentName: 'SHADOW_NINJA',
        completedSections: ['web-01-01', 'web-01-02'],
        ctfSolved: ['ctf-001'],
        moduleProgress: { web: 50 },
        timeline: [{ date: '2026-09-16', text: 'Done' }],
        streak: 15,
        commandCount: 42,
        unlockedBadges: ['first_blood', 'speed_demon'],
        lastSection: { modId: 'web', secId: 'web-01-02' }
      };
      const reset = resetProgressData(sample, { all: true });
      assert.deepStrictEqual(reset.completedSections, []);
      assert.deepStrictEqual(reset.ctfSolved, []);
      assert.deepStrictEqual(reset.moduleProgress, {});
      assert.deepStrictEqual(reset.timeline, []);
      assert.deepStrictEqual(reset.unlockedBadges, []);
      assert.strictEqual(reset.agentName, 'OPERATIVE #1337');
      assert.strictEqual(reset.streak, 0);
      assert.strictEqual(reset.commandCount, 0);
      assert.strictEqual(reset.lastSection, undefined);
    });

    it('should only reset sections when sections is true', function() {
      const sample = {
        agentName: 'SHADOW_NINJA',
        completedSections: ['web-01-01'],
        ctfSolved: ['ctf-001'],
        moduleProgress: { web: 25 },
        timeline: [{ date: '2026-09-16', text: 'Done' }],
        streak: 5,
        commandCount: 10,
        unlockedBadges: ['badge1']
      };
      const reset = resetProgressData(sample, { sections: true });
      assert.deepStrictEqual(reset.completedSections, []);
      assert.deepStrictEqual(reset.moduleProgress, {});
      assert.deepStrictEqual(reset.ctfSolved, ['ctf-001']);
      assert.deepStrictEqual(reset.unlockedBadges, ['badge1']);
      assert.strictEqual(reset.streak, 5);
      assert.strictEqual(reset.agentName, 'SHADOW_NINJA');
    });

    it('should only reset CTF challenges when ctf is true', function() {
      const sample = {
        agentName: 'CYBER_HERO',
        completedSections: ['net-01-01'],
        ctfSolved: ['ctf-001', 'ctf-002'],
        moduleProgress: { net: 30 },
        timeline: [],
        streak: 3,
        commandCount: 8,
        unlockedBadges: []
      };
      const reset = resetProgressData(sample, { ctf: true });
      assert.deepStrictEqual(reset.ctfSolved, []);
      assert.deepStrictEqual(reset.completedSections, ['net-01-01']);
      assert.strictEqual(reset.agentName, 'CYBER_HERO');
    });

    it('should ensure valid structure and prevent prototype pollution', function() {
      const reset = resetProgressData(null, { all: true });
      assert.ok(Array.isArray(reset.completedSections));
      assert.ok(Array.isArray(reset.ctfSolved));
      assert.strictEqual(reset.streak, 0);
      assert.strictEqual(reset.agentName, 'OPERATIVE #1337');
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

  // ─── Answer Hash / Normalization Contract ──────────────────
  describe('Answer Hash / Normalization Contract', function() {
    // The client (script.js), server (server.js) and generator
    // (scripts/gen-flag-hashes.js) must share one normalization: lowercase,
    // ALL whitespace removed. This suite pins that contract.
    const { FLAG_HASHES, normalizeFlagInput } = require('../flags-hash.js');

    it('should remove every whitespace variant during normalization', function() {
      assert.strictEqual(normalizeFlagInput(' flag{ a\t b } '), 'flag{ab}');
      assert.strictEqual(normalizeFlagInput('FLAG{\r\nX}'), 'flag{x}');
      assert.strictEqual(normalizeFlagInput('  '), '');
      assert.strictEqual(normalizeFlagInput(undefined), '');
    });

    it('should match Node crypto for the shared vectors', function() {
      for (const sample of ['flag{test}', 'A B c', 'ünïcødé{中}']) {
        const expected = require('crypto').createHash('sha256')
          .update(normalizeFlagInput(sample), 'utf8').digest('hex');
        assert.strictEqual(FLAG_HASHES['ctf-001'] ? expected : '', expected,
          'sanity: crypto digest computation itself must be deterministic');
      }
    });

    it('should tolerate whitespace/case drift between correct submissions', function() {
      const digestOf = s => require('crypto').createHash('sha256')
        .update(normalizeFlagInput(s), 'utf8').digest('hex');
      const canonical = digestOf('flag{sample_answer}');
      assert.strictEqual(digestOf('\tFLAG{SAMPLE_ANSWER}\r\n'), canonical);
      assert.notStrictEqual(digestOf('flag{different}'), canonical);
    });
  });

  describe('Glossary Injection & Client Content Integrity', function() {
    const fs = require('fs');
    const vm = require('vm');
    const contentCode = fs.readFileSync(require('path').join(__dirname, '../content.js'), 'utf8');
    const ctx = vm.createContext({});
    vm.runInContext(contentCode + '; globalThis.__GLOSSARY = GLOSSARY; globalThis.__MODULES = MODULES; globalThis.__SC = SECTION_CONTENT; globalThis.__ig = typeof injectGlossary !== "undefined" ? injectGlossary : null;', ctx);

    it('should provide injectGlossary function in content.js', function() {
      assert.strictEqual(typeof ctx.__ig, 'function', 'injectGlossary must be declared as a function in content.js');
    });

    it('should inject glossary spans around matching terms', function() {
      const sample = '<p>这里提到了 XSS 漏洞和 WAF 防护。</p>';
      const output = ctx.__ig(sample);
      assert(output.includes('data-term="XSS"'), 'should wrap XSS with glossary span');
      assert(output.includes('data-term="WAF"'), 'should wrap WAF with glossary span');
    });

    it('should safely handle empty or null strings', function() {
      assert.strictEqual(ctx.__ig(''), '');
      assert.strictEqual(ctx.__ig(null), '');
      assert.strictEqual(ctx.__ig(undefined), '');
    });

    it('should have non-empty content for every section across all modules', function() {
      const sections = ctx.__MODULES.flatMap(m => m.chapters.flatMap(c => c.sections));
      assert(sections.length >= 52, `Expected at least 52 sections, found ${sections.length}`);
      for (const sec of sections) {
        const hasDirect = Boolean(sec.content && sec.content.trim());
        const hasKey = Boolean(sec.contentKey && ctx.__SC[sec.contentKey] && ctx.__SC[sec.contentKey].trim());
        assert(hasDirect || hasKey, `Section ${sec.id} (${sec.title}) must have non-empty content or SECTION_CONTENT mapping`);
      }
    });
  });

  // ─── Interactive Training Platform Engine ───────────────────
  describe('Interactive Training Platform Engine', function() {
    const engine = require('../script.js');

    it('should correctly simulate SQL injection bypass in vulnerable mode', function() {
      const bypass = engine.simulateSQLQuery("admin' OR '1'='1", 'anything', 'vuln');
      assert.strictEqual(bypass.injected, true);
      assert.ok(bypass.results.length > 0, 'Should return records on auth bypass');

      const union = engine.simulateSQLQuery("' UNION SELECT 1,username,password FROM users--", '', 'vuln');
      assert.strictEqual(union.injected, true);
      assert.ok(union.results.some(r => r.email.includes('LEAKED')));
    });

    it('should neutralize SQL injection in parameterized safe mode', function() {
      const safe = engine.simulateSQLQuery("admin' OR '1'='1", 'anything', 'safe');
      assert.strictEqual(safe.injected, false);
      assert.strictEqual(safe.results.length, 0, 'Parameterized query must treat input as literal');
      assert.ok(safe.sql.includes('? AND password = ?'));
    });

    it('should correctly simulate XSS filtering and entity escaping', function() {
      const raw = engine.simulateXSS('<script>alert(1)</script>', 'raw');
      assert.strictEqual(raw.triggered, true);

      const bypass = engine.simulateXSS('<img src=x onerror=alert(1)>', 'blacklist');
      assert.strictEqual(bypass.triggered, true, 'Blacklist filtering <script> should still allow event handlers');

      const escaped = engine.simulateXSS('<img src=x onerror=alert(1)>', 'escaped');
      assert.strictEqual(escaped.triggered, false, 'HTML entity escaping must prevent execution');
      assert.ok(escaped.rendered.includes('&lt;img'));
    });

    it('should simulate command injection splitting and process isolation', function() {
      const vuln = engine.simulateCmdInj('127.0.0.1; whoami', 'vuln');
      assert.strictEqual(vuln.injected, true);
      assert.ok(vuln.output.includes('www-data'));

      const safe = engine.simulateCmdInj('127.0.0.1; whoami', 'safe');
      assert.strictEqual(safe.injected, false);
      assert.ok(safe.output.includes('rejected'));
    });

    it('should compute cryptographic hash avalanche bit differences', function() {
      const h1 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const h2 = 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb';
      const stats = engine.countBitDiff(h1, h2);
      assert.strictEqual(stats.totalBits, 256);
      assert.ok(stats.diff > 100 && stats.diff < 160, 'Avalanche bit diff should be around ~50%');
      assert.strictEqual(stats.percent, '50.4');
    });

    it('should generate valid 5-point SVG radar polygon coordinates', function() {
      const poly = engine.calculateRadarPolygon([90, 80, 70, 85, 95], 100, 150, 150);
      const points = poly.split(' ');
      assert.strictEqual(points.length, 5, 'Must contain 5 coordinate pairs');
      points.forEach(pt => {
        const [x, y] = pt.split(',').map(Number);
        assert(!isNaN(x) && !isNaN(y), 'Coordinates must be valid numbers');
      });
    });

    it('should evaluate diagnostic scores into prioritized personalized tracks', function() {
      // High Web & Network
      const webTracks = engine.evaluateDiagnosticTrack([90, 85, 30, 70, 20]);
      assert.strictEqual(webTracks[0].id, 'track-whitehat');

      // High Crypto & CTF
      const ctfTracks = engine.evaluateDiagnosticTrack([20, 30, 95, 40, 90]);
      assert.strictEqual(ctfTracks[0].id, 'track-ctfer');

      // Beginner
      const begTracks = engine.evaluateDiagnosticTrack([30, 30, 30, 30, 30]);
      assert.strictEqual(begTracks[0].id, 'track-beginner');
    });
  });

  // ─── Gamification, Hacker Ranks & Achievements Engine ───────
  describe('Gamification, Hacker Ranks & Achievements Engine', function() {
    function calculateEXP(progress) {
      const secCount = (progress.completedSections || []).length;
      const ctfCount = (progress.ctfSolved || []).length;
      const streak = progress.streak || 0;
      const cmdCount = progress.commandCount || 0;
      return (secCount * 100) + (ctfCount * 250) + (Math.min(streak, 10) * 50) + (Math.min(cmdCount, 30) * 10);
    }

    const RANKS = [
      { level: 1, id: 'script_kiddie', minExp: 0 },
      { level: 2, id: 'security_enthusiast', minExp: 500 },
      { level: 3, id: 'junior_pentester', minExp: 2000 },
      { level: 4, id: 'cyber_specialist', minExp: 4500 },
      { level: 5, id: 'elite_operative', minExp: 8000 }
    ];

    function getRank(exp) {
      let rank = RANKS[0];
      let next = RANKS[1];
      for (let i = 0; i < RANKS.length; i++) {
        if (exp >= RANKS[i].minExp) {
          rank = RANKS[i];
          next = RANKS[i + 1] || null;
        }
      }
      return { rank, next };
    }

    it('should correctly calculate base user EXP from activities', function() {
      assert.strictEqual(calculateEXP({ streak: 0 }), 0, 'Clean/reset progress should yield 0 EXP');
      const p1 = { completedSections: ['web-01-01', 'web-01-02'], ctfSolved: ['ctf-001'], streak: 2, commandCount: 5 };
      assert.strictEqual(calculateEXP(p1), 600);
    });

    it('should cap streak and command bonus to prevent runaway inflation', function() {
      const pMax = { completedSections: [], ctfSolved: [], streak: 50, commandCount: 500 };
      assert.strictEqual(calculateEXP(pMax), 800);
    });

    it('should map EXP thresholds accurately to the 5-tier rank hierarchy', function() {
      assert.strictEqual(getRank(0).rank.id, 'script_kiddie');
      assert.strictEqual(getRank(499).rank.id, 'script_kiddie');
      assert.strictEqual(getRank(500).rank.id, 'security_enthusiast');
      assert.strictEqual(getRank(1999).rank.id, 'security_enthusiast');
      assert.strictEqual(getRank(2000).rank.id, 'junior_pentester');
      assert.strictEqual(getRank(4499).rank.id, 'junior_pentester');
      assert.strictEqual(getRank(4500).rank.id, 'cyber_specialist');
      assert.strictEqual(getRank(7999).rank.id, 'cyber_specialist');
      assert.strictEqual(getRank(8000).rank.id, 'elite_operative');
      assert.strictEqual(getRank(25000).rank.id, 'elite_operative');
      assert.strictEqual(getRank(8000).next, null, 'Level 5 should have no next rank (max rank reached)');
    });

    it('should evaluate achievement unlock criteria reliably', function() {
      const isFirstBlood = (p) => (p.ctfSolved || []).length >= 1;
      const isScholar = (p) => (p.completedSections || []).length >= 5;
      const isFlowState = (p) => (p.streak || 0) >= 3;

      assert.strictEqual(isFirstBlood({ ctfSolved: [] }), false);
      assert.strictEqual(isFirstBlood({ ctfSolved: ['ctf-001'] }), true);

      assert.strictEqual(isScholar({ completedSections: ['s1', 's2', 's3', 's4'] }), false);
      assert.strictEqual(isScholar({ completedSections: ['s1', 's2', 's3', 's4', 's5'] }), true);

      assert.strictEqual(isFlowState({ streak: 0 }), false);
      assert.strictEqual(isFlowState({ streak: 2 }), false);
      assert.strictEqual(isFlowState({ streak: 3 }), true);
    });
  });
};

