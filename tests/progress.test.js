const { normalizeProgress } = require('../progress.js');
const { MODULES, CTF_CHALLENGES } = require('../content.js');
module.exports = function () {
  describe('Progress import schema', () => {
    const normalize = data => normalizeProgress(data, MODULES, CTF_CHALLENGES);
    it('restores legacy progress and discards unknown IDs and forged navigation', () => {
      const first = MODULES[0].chapters[0].sections[0].id;
      const data = normalize({completedSections:[first, 'missing', first], lastSection:{modId:'wrong',secId:first},
        moduleProgress:{forged:100}, ctfSolved:[CTF_CHALLENGES[0].id], timeline:[null, {}]});
      assert.deepStrictEqual(data.completedSections,[first]);
      assert.strictEqual(data.lastSection, undefined);
      assert.deepStrictEqual(data.moduleProgress,{});
      assert.strictEqual(data.ctfSolved.length,1);
      assert.deepStrictEqual(data.timeline,[]);
    });
    it('only copies the supported fields from a backup', () => {
      const data = normalize(JSON.parse('{"__proto__":{"admin":true},"agentName":{},"revision":"fake","pendingBase":"server"}'));
      assert.strictEqual(data.admin,undefined);
      assert.strictEqual(data.revision,undefined);
      assert.strictEqual(data.pendingBase,undefined);
      assert.strictEqual(data.agentName,'OPERATIVE #1337');
    });
  });
};
