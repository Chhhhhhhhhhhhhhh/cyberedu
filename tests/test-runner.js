// Dependency-free runner. Suites register cases first; each case completes before the next starts.
const {readdirSync} = require('fs');
const {join} = require('path');
global.assert = require('assert');
const cases = [];
let suite;
global.describe = (name, register) => {
  const previous = suite;
  suite = name;
  try { register(); } finally { suite = previous; }
};
global.it = global.itAsync = (name, run) => cases.push({suite, name, run});

async function main() {
  for (const file of readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort()) {
    await require(join(__dirname, file))();
  }
  let failed = 0;
  for (const test of cases) {
    try {
      if (test.run.length) throw new Error('Return a promise from async tests');
      await test.run();
      console.log('✓', test.suite, '—', test.name);
    } catch (err) {
      failed++;
      console.error('✗', test.suite, '—', test.name, '\n', err.stack || err);
    }
  }
  console.log(failed ? failed + ' failed of ' + cases.length : 'All ' + cases.length + ' tests passed');
  if (failed) process.exitCode = 1;
}
main().catch(err => { console.error(err); process.exitCode = 1; });
