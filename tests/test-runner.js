// CyberEdu Test Runner — Zero dependencies, pure Node.js
const { readdirSync } = require('fs');
const { join } = require('path');
const assert = require('assert');

let totalTests = 0;
let passed = 0;
let failed = 0;
const failures = [];

function describe(name, fn) {
  console.log(`\n  ${name}`);
  fn();
}

function it(name, fn) {
  totalTests++;
  try {
    fn();
    passed++;
    console.log(`    \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`    \x1b[31m✗\x1b[0m ${name}`);
    console.log(`      \x1b[31m${err.message}\x1b[0m`);
  }
}

async function itAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    passed++;
    console.log(`    \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`    \x1b[31m✗\x1b[0m ${name}`);
    console.log(`      \x1b[31m${err.message}\x1b[0m`);
  }
}

// Make globals available
global.describe = describe;
global.it = it;
global.itAsync = itAsync;
global.assert = assert;

async function runTests() {
  console.log('\n  \x1b[1mCyberEdu Test Suite v2.5\x1b[0m');
  console.log('  =========================');
  const startTime = Date.now();

  const testDir = __dirname;
  const testFiles = readdirSync(testDir)
    .filter(f => f.endsWith('.test.js'))
    .sort();

  for (const file of testFiles) {
    const testModule = require(join(testDir, file));
    if (typeof testModule === 'function') {
      await testModule();
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`\n  ─────────────────────────────────`);
  if (failed === 0) {
    console.log(`  \x1b[32m✓ All ${totalTests} tests passed\x1b[0m (${elapsed}ms)`);
  } else {
    console.log(`  Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m, ${totalTests} total`);
    console.log(`  Time:    ${elapsed}ms`);
    console.log(`\n  \x1b[31mFailures:\x1b[0m`);
    failures.forEach((f, i) => {
      console.log(`    ${i + 1}) ${f.name}: ${f.error}`);
    });
  }
  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
