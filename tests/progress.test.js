const { normalizeProgress, defaultProgress, recordQuizAnswer, quizPassed } = require('../progress.js');
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
      assert.deepStrictEqual(data.quizProgress,{});
      assert.deepStrictEqual(data.exercisePassed,[]);
    });
    it('persists latest quiz outcomes separately from reading and clears a corrected review item', () => {
      const data = defaultProgress(), key = 'prog-01-01';
      recordQuizAnswer(data,key,0,false,2);
      assert.deepStrictEqual(data.quizProgress[key].review,[0]);
      recordQuizAnswer(data,key,0,true,2);
      assert.deepStrictEqual(data.quizProgress[key].review,[]);
      assert.strictEqual(quizPassed(data,key),false);
      recordQuizAnswer(data,key,1,true,2);
      assert.strictEqual(quizPassed(data,key),true);
      assert.deepStrictEqual(data.completedSections,[]);
      assert.deepStrictEqual(normalize(JSON.parse(JSON.stringify(data))).quizProgress,data.quizProgress);
      recordQuizAnswer(data,key,1,false,2);
      assert.strictEqual(quizPassed(data,key),false);
      recordQuizAnswer(data,key,1,true,3);
      assert.deepStrictEqual(data.quizProgress[key].passed,[1]);
    });
    it('rejects stale quizzes, invalid indices and unsupported tasks from imported progress', () => {
      const data = normalize({exercisePassed:['prog-01-01','web-01-01','missing','prog-01-01'],quizProgress:{
        'prog-01-01':{version:1,passed:[0,1],review:[]},
        'prog-01-02':{version:2,passed:[0,0,1,2,'0'],review:[1,9]},
        'missing':{version:1,passed:[0,1],review:[]}}});
      assert.deepStrictEqual(data.exercisePassed,['prog-01-01']);
      assert.deepStrictEqual(data.quizProgress,{'prog-01-02':{version:2,passed:[0],review:[1]}});
      assert.strictEqual(quizPassed(data,'prog-01-02'),false);
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
