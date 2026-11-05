const fs = require('fs');
const path = require('path');
const directory = path.join(__dirname, '..', 'lessons');

function savePack(moduleId, language, data) {
  const file = path.join(directory, moduleId + '.' + language + '.js');
  const records = Object.entries(data).map(([key, value]) => '  ' + JSON.stringify(key) + ': ' + JSON.stringify(value));
  const body = '({\n' + records.join(',\n') + '\n});\n';
  const receiver = `(typeof module !== 'undefined' && module.exports ? data => { module.exports = data; } : data => registerLessonPack('${language}', data))`;
  fs.writeFileSync(file, receiver + body);
}

function updateLesson(key, update) {
  const { MODULES } = require('../content.js');
  const mod = MODULES.find(m => m.chapters.some(c => c.sections.some(s => s.contentKey === key)));
  if (!mod) throw new Error('Unknown lesson: ' + key);
  const changes = [];
  for (const language of ['zh', 'en']) {
    const data = require(path.join(directory, mod.id + '.' + language + '.js'));
    const html = update(language, data[key].html);
    if (html !== undefined) {
      changes.push({ language, data: { ...data, [key]: { ...data[key], html } } });
    }
  }
  // Validate both languages before modifying either canonical file.
  for (const { language, data } of changes) savePack(mod.id, language, data);
}
module.exports = { savePack, updateLesson };
