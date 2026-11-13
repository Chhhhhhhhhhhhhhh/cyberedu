const CyberEduProgress = (() => {
  // Shared backup and sync schema. Rebuild derived module percentages in the UI.
  function defaultProgress() {
    return { agentName: 'OPERATIVE #1337', completedSections: [], ctfSolved: [],
      moduleProgress: {}, timeline: [], streak: 0, lastVisit: '', unlockedBadges: [], commandCount: 0,
      quizProgress: {}, exercisePassed: [] };
  }

  function normalizeProgress(data, modules, challenges) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid progress object');
    const clean = defaultProgress();
    const sections = new Map();
    const definitions = new Map();
    for (const mod of modules) for (const chapter of mod.chapters) {
      for (const section of chapter.sections) {
        sections.set(section.id, mod.id);
        definitions.set(section.id, section);
      }
    }
    const list = (value, allowed) => [...new Set((Array.isArray(value) ? value : []).filter(id => allowed.has(id)))];
    const number = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
    const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    clean.completedSections = list(data.completedSections, sections);
    clean.ctfSolved = list(data.ctfSolved, new Set(challenges.map(c => c.id)));
    clean.exercisePassed = list(data.exercisePassed, new Set([...definitions.values()].filter(s => s.hasTask).map(s => s.id)));
    if (data.quizProgress && typeof data.quizProgress === 'object' && !Array.isArray(data.quizProgress)) {
      for (const [key, result] of Object.entries(data.quizProgress)) {
        const section = definitions.get(key);
        if (!section || !result || result.version !== (section.quizVersion || 1)) continue;
        const allowed = new Set([0, 1]);
        const review = list(result.review, allowed);
        clean.quizProgress[key] = { version: result.version,
          passed: list(result.passed, allowed).filter(i => !review.includes(i)), review };
      }
    }
    if (typeof data.agentName === 'string' && data.agentName.trim()) clean.agentName = data.agentName.trim().slice(0, 64);
    if (Array.isArray(data.unlockedBadges)) {
      clean.unlockedBadges = [...new Set(data.unlockedBadges.filter(id => typeof id === 'string' && /^[\w-]{1,64}$/.test(id)))].slice(0, 100);
    }
    if (Array.isArray(data.timeline)) clean.timeline = data.timeline
      .filter(item => item && date(item.date) && typeof item.text === 'string')
      .slice(0, 50).map(item => ({date: item.date, text: item.text.slice(0, 512)}));
    clean.commandCount = number(data.commandCount);
    clean.streak = number(data.streak);
    if (date(data.lastVisit)) clean.lastVisit = data.lastVisit;
    const last = data.lastSection;
    if (last && sections.has(last.secId) && sections.get(last.secId) === last.modId) {
      clean.lastSection = {modId: last.modId, secId: last.secId, time: number(last.time)};
    }
    return clean;
  }
  function recordQuizAnswer(progress, key, index, correct, version = 1) {
    if (![0, 1].includes(index)) return;
    const old = progress.quizProgress[key];
    const result = old?.version === version ? old : {version, passed: [], review: []};
    result.passed = result.passed.filter(i => i !== index);
    result.review = result.review.filter(i => i !== index);
    result[correct ? 'passed' : 'review'].push(index);
    progress.quizProgress[key] = result;
  }
  function quizPassed(progress, key) {
    const result = progress.quizProgress[key];
    return !!result && result.passed.includes(0) && result.passed.includes(1) && result.review.length === 0;
  }
  return { defaultProgress, normalizeProgress, recordQuizAnswer, quizPassed };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CyberEduProgress;
