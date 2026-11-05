const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

module.exports = function () {
  describe('Async test reporting', () => {
    it('fails the process for a rejected test while still completing later tests', () => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberedu-runner-'));
      try {
        fs.copyFileSync(path.join(__dirname, 'test-runner.js'), path.join(directory, 'test-runner.js'));
        fs.writeFileSync(path.join(directory, 'fixture.test.js'), `module.exports = () => {
          it('rejects later', async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
            throw new Error('delayed assertion failure');
          });
          it('completes after failure', async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
          });
        };`);
        const result = spawnSync(process.execPath, ['test-runner.js'], {cwd: directory, encoding:'utf8', timeout:5000});
        assert.ifError(result.error);
        assert.strictEqual(result.status, 1);
        assert.ok(result.stderr.includes('delayed assertion failure'));
        assert.ok(result.stdout.includes('completes after failure'));
      } finally {
        if (path.dirname(fs.realpathSync(directory)) !== fs.realpathSync(os.tmpdir())) {
          throw new Error('Unexpected test directory location');
        }
        fs.rmSync(directory, {recursive:true, force:true});
      }
    });
  });
};
