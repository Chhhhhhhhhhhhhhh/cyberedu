// ============================================================
// CyberEdu i18n — Internationalization System
// ============================================================
let currentLang = 'en';
try { currentLang = localStorage.getItem('cyberedu_lang_v2') || 'en'; } catch(e) { currentLang = 'en'; }

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('cyberedu_lang_v2', lang);
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  // Update toggle button
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中';
  // Re-render all i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  // Re-render dynamic content
  if (typeof buildSearchIndex === 'function') buildSearchIndex();
  updateStatusBar();
  updateSidebar();
  // Update document title
  document.title = t('head.title');
  // Re-render current view using the shared helper
  rerenderCurrentView();
}

// Main translation function
// Usage: t('key') or t('key', {n: 1, t: 10})
function t(key, vars) {
  var str = (LANG[currentLang] && LANG[currentLang][key]) || (LANG['zh'] && LANG['zh'][key]) || key;
  if (vars) {
    for (var k in vars) {
      if (vars.hasOwnProperty(k)) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      }
    }
  }
  return str;
}

// ============================================================
// Re-render the currently active view after language switch
function rerenderCurrentView() {
  if (typeof currentView === "undefined" || currentView === null) return;
  switch(currentView) {
    case "home": if (typeof renderHome === "function") renderHome(); break;
    case "hub":
      // Hub view — reload current section content if one is active
      if (typeof currentModuleId !== "undefined" && typeof currentSectionId !== "undefined" && typeof loadSection === "function") {
        loadSection(currentModuleId, currentSectionId);
      }
      break;
    case "practice":
      if (typeof currentPracticeIdx !== "undefined" && currentPracticeIdx !== null && typeof loadPractice === "function")
        loadPractice(currentPracticeIdx);
      break;
    case "ctf": if (typeof renderCTF === "function") renderCTF(); break;
    case "progress": if (typeof renderProgress === "function") renderProgress(); break;
    case "tools": if (typeof renderTools === "function") renderTools(); break;
  }
  if (typeof updateSidebar === "function") updateSidebar();
  if (typeof updateStatusBar === "function") updateStatusBar();
}

// Translation Dictionary
// ============================================================
const LANG = {
  zh: {
    // Head
    'head.title': 'CyberEdu — 网络空间安全综合学习站',

    // Nav
    'nav.home': '◈ 首页',
    'nav.hub': '▸ 学习中心',
    'nav.practice': '⌨ 练习题',
    'nav.ctf': '🚩 CTF挑战',
    'nav.progress': '◉ 进度',
    'nav.tools': '⚙ 工具箱',
    'nav.search': '搜索...',
    'nav.theme': '切换主题',

    // Search
    'search.placeholder': '搜索模块、章节、术语...',
    'search.empty': '输入关键词开始搜索…',
    'search.noResult': '没有找到相关内容',
    'search.type.module': '模块',
    'search.type.chapter': '章节',
    'search.type.tool': '工具',
    'search.type.term': '术语',

    // Home
    'home.viewProgress': '查看进度',
    'home.chapters': '知识章节',
    'home.exercises': '练习题目',
    'home.ctfChallenges': 'CTF挑战',
    'home.tools': '安全工具',
    'home.coreDirections': '七大核心方向',
    'home.learningPath': '推荐学习路径',

    // Learning path stages
    'path.stage1': 'STAGE 1 — 基础夯实',
    'path.stage2': 'STAGE 2 — 安全原理',
    'path.stage3': 'STAGE 3 — 实战进阶',
    'path.stage4': 'STAGE 4 — 综合对抗',

    // Hub
    'hub.breadcrumb': '学习中心',
    'hub.selectModule': '选择一个模块开始学习',
    'hub.selectChapter': '请从左侧边栏选择章节开始学习。',
    'hub.sidebarToggle': '收起侧边栏',
    'hub.sidebarExpand': '展开侧边栏',

    // Section nav
    'section.completed': '✓ 已完成',
    'section.markDone': '○ 标记完成',
    'section.prev': '← 上一节: ',
    'section.next': '下一节: ',

    // Practice
    'practice.breadcrumb': '互动练习',
    'practice.title': '练习题',
    'practice.counter': '第 {n}/{t} 题',
    'practice.prev': '← 上一题',
    'practice.next': '下一题 →',
    'practice.runCode': '▶ 运行代码',
    'practice.hint': '? 提示',
    'practice.codeLang': 'Python',
    'practice.codePlaceholder': '# 在此输入你的代码...',
    'practice.codeHint': '输入你的代码或答案',
    'practice.output': '输出',
    'practice.clickRun': '点击 RUN 查看结果...',
    'practice.difficulty': '难度',
    'practice.hintLabel': '提示：',
    'practice.noHint': '暂无提示',

    // Code execution
    'code.compiling': '// 编译运行中...',
    'code.noOutput': '（无输出）',
    'code.serverError': '// 服务器不可用，请确保本地服务器已启动',
    'code.runError': '// 运行错误',
    'code.expectedRef': '// 预期输出参考：',
    'code.matchOk': '✓ 输出与预期一致！',
    'code.selfTest': '// 自测验证模式',
    'code.selfTestDesc': '在本地 {lang} 环境中运行你的代码，<br>将输出与下方预期结果对比：',
    'code.expectedOutput': '// 预期输出：',
    'code.runCodeCompare': '运行代码后对比输出',
    'code.testCases': '// 测试用例：',
    'code.case': 'Case {n}:',
    'code.input': '输入',
    'code.ctfCompiling': '// 编译运行中...',

    // CTF
    'ctf.breadcrumb': 'CTF 在线挑战',
    'ctf.title': 'CTF 挑战题库',
    'ctf.solve': '提交 Flag',
    'ctf.flagPlaceholder': 'flag{...}',
    'ctf.descTab': '题目描述',
    'ctf.codeTab': '在线编码',
    'ctf.terminalTab': '模拟终端',
    'ctf.run': '▶ 运行',
    'ctf.reset': '↺ 重置',
    'ctf.terminalPlaceholder': '$ 输入 payload...',
    'ctf.showHint': '? 查看提示 ({n} 级)',
    'ctf.allHintsShown': '全部提示已显示',
    'ctf.nextHint': '? 下一个提示 ({n}/{t})',
    'ctf.writeupTitle': '📝 Writeup',
    'ctf.correct': '✓ CORRECT! 恭喜你解出了这道题！',
    'ctf.wrong': '✗ WRONG! 再想想...',
    'ctf.enterFlag': '> 请输入 flag',
    'ctf.simError': '服务器连接失败',
    'ctf.chapters': '章',

    // Progress
    'progress.breadcrumb': '个人中心',
    'progress.title': '学习进度仪表盘',
    'progress.export': '↓ 导出进度',
    'progress.import': '↑ 导入进度',
    'progress.exportConfirm': '暂无进度数据可导出',
    'progress.exportError': '导出失败: ',
    'progress.importError': '文件格式不正确，不是有效的进度数据',
    'progress.importConfirm': '导入将覆盖当前进度，确定继续？',
    'progress.importSuccess': '进度导入成功！',
    'progress.importFail': '导入失败: ',
    'progress.completed': '已完成章节',
    'progress.total': '共 {n} 节',
    'progress.overall': '整体进度',
    'progress.overallSub': '综合完成率',
    'progress.ctfSolved': 'CTF 已解题',
    'progress.ctfTotal': '共 {n} 题',
    'progress.streak': '连续学习',
    'progress.days': '天',
    'progress.proficiency': '掌握度',
    'progress.moduleProgress': '// 各模块掌握度',
    'progress.overview': '// 学习进度一览',
    'progress.timeline': '// 最近学习记录',
    'progress.emptyTimeline': '还没有学习记录。开始学习吧！',

    // Tools
    'tools.breadcrumb': '安全工具',
    'tools.title': '内置安全工具箱',

    // Sidebar practice
    'sidebar.practice': '📝 练习题目',

    // Timeline
    'timeline.completed': '完成: ',

    // AI Chat
    'ai.fab': 'AI 导师',
    'ai.title': 'AI 导师',
    'ai.history': '历史会话',
    'ai.newChat': '+ 新对话',
    'ai.settings': '设置',
    'ai.close': '关闭',
    'ai.placeholder': '输入你的问题…',
    'ai.welcome': '你好！我是你的 AI 网安导师。点击 ⚙ 配置 API 后即可开始提问。',
    'ai.noHistory': '暂无历史会话',
    'ai.newStarted': '新对话已开始。',
    'ai.saveSettings': '保存设置',
    'ai.loadSettings': '加载已保存',
    'ai.saved': '设置已保存 ✓',
    'ai.configError': '请填写完整的 API URL、Key 和模型名',
    'ai.thinking': '正在思考',
    'ai.thinkingDetail': '🧠 思考中...',
    'ai.thinkingProcess': '🧠 思考过程（点击展开',
    'ai.inputTokens': '输入 ',
    'ai.outputTokens': '输出 ',
    'ai.thinkingTokens': '（思考 ',
    'ai.tokens': '）',
    'ai.noApi': '请先配置 API 设置（点击 ⚙）',

    // Tool names & descs
    'tool.base64': 'Base64 编解码',
    'tool.base64.desc': 'Base64 编码与解码，支持 Unicode',
    'tool.hash': 'Hash 计算',
    'tool.hash.desc': 'SHA-256/SHA-1 哈希（浏览器 SubtleCrypto）',
    'tool.caesar': 'Caesar / ROT13',
    'tool.caesar.desc': '凯撒密码加解密，自定义位移（0-25）',
    'tool.caesar.subtitle': '凯撒密码加解密，ROT13 是移位 13 的特例',
    'tool.url': 'URL 编解码',
    'tool.url.desc': 'encodeURIComponent / decodeURIComponent',
    'tool.hex': 'Hex / ASCII',
    'tool.hex.desc': '十六进制与文本互转',
    'tool.morse': '摩尔斯电码',
    'tool.morse.desc': '摩尔斯电码编解码',

    // Tool placeholders
    'tool.inputPlaceholder': '输入...',
    'tool.caesarInputPlaceholder': '输入文本...',
    'tool.caesarOutputPlaceholder': '加密结果...',
    'tool.outputPlaceholder': '结果...',
    'tool.fail': '计算失败',
  },

  en: {
    // Head
    'head.title': 'CyberEdu — Cybersecurity Learning Platform',

    // Nav
    'nav.home': '◈ Home',
    'nav.hub': '▸ Learning Hub',
    'nav.practice': '⌨ Exercises',
    'nav.ctf': '🚩 CTF Challenges',
    'nav.progress': '◉ Progress',
    'nav.tools': '⚙ Toolbox',
    'nav.search': 'Search...',
    'nav.theme': 'Toggle Theme',

    // Search
    'search.placeholder': 'Search modules, chapters, terms...',
    'search.empty': 'Enter keywords to start searching...',
    'search.noResult': 'No results found',
    'search.type.module': 'Module',
    'search.type.chapter': 'Chapter',
    'search.type.tool': 'Tool',
    'search.type.term': 'Term',

    // Home
    'home.viewProgress': 'View Progress',
    'home.chapters': 'Chapters',
    'home.exercises': 'Exercises',
    'home.ctfChallenges': 'CTF Challenges',
    'home.tools': 'Security Tools',
    'home.coreDirections': 'Seven Core Domains',
    'home.learningPath': 'Recommended Learning Path',

    // Learning path stages
    'path.stage1': 'STAGE 1 — Foundation',
    'path.stage2': 'STAGE 2 — Security Principles',
    'path.stage3': 'STAGE 3 — Advanced Practice',
    'path.stage4': 'STAGE 4 — Comprehensive Skills',

    // Hub
    'hub.breadcrumb': 'Learning Hub',
    'hub.selectModule': 'Select a module to start learning',
    'hub.selectChapter': 'Select a chapter from the sidebar to begin.',
    'hub.sidebarToggle': 'Collapse sidebar',
    'hub.sidebarExpand': 'Expand sidebar',

    // Section nav
    'section.completed': '✓ COMPLETED',
    'section.markDone': '○ MARK AS COMPLETED',
    'section.prev': '← PREV: ',
    'section.next': 'NEXT: ',

    // Practice
    'practice.breadcrumb': 'Interactive Exercises',
    'practice.title': 'Exercises',
    'practice.counter': 'Q {n}/{t}',
    'practice.prev': '← Prev',
    'practice.next': 'Next →',
    'practice.runCode': '▶ Run Code',
    'practice.hint': '? Hint',
    'practice.codeLang': 'Python',
    'practice.codePlaceholder': '# Enter your code here...',
    'practice.codeHint': 'Enter your code or answer',
    'practice.output': 'Output',
    'practice.clickRun': 'Click RUN to see results...',
    'practice.difficulty': 'Difficulty',
    'practice.hintLabel': 'Hint: ',
    'practice.noHint': 'No hint available',

    // Code execution
    'code.compiling': '// Compiling & running...',
    'code.noOutput': '(No output)',
    'code.serverError': '// Server unavailable, please ensure local server is running',
    'code.runError': '// Runtime error',
    'code.expectedRef': '// Expected output reference:',
    'code.matchOk': '✓ Output matches expected!',
    'code.selfTest': '// Self-test mode',
    'code.selfTestDesc': 'Run your code in a local {lang} environment,<br>then compare with the expected output below:',
    'code.expectedOutput': '// Expected output:',
    'code.runCodeCompare': 'Run code then compare output',
    'code.testCases': '// Test cases:',
    'code.case': 'Case {n}:',
    'code.input': 'Input',
    'code.ctfCompiling': '// Compiling...',

    // CTF
    'ctf.breadcrumb': 'CTF Online Challenges',
    'ctf.title': 'CTF Challenge Library',
    'ctf.solve': 'Submit Flag',
    'ctf.flagPlaceholder': 'flag{...}',
    'ctf.descTab': 'Description',
    'ctf.codeTab': 'Code Editor',
    'ctf.terminalTab': 'Terminal',
    'ctf.run': '▶ Run',
    'ctf.reset': '↺ Reset',
    'ctf.terminalPlaceholder': '$ Enter payload...',
    'ctf.showHint': '? Show Hint ({n} levels)',
    'ctf.allHintsShown': 'All hints revealed',
    'ctf.nextHint': '? Next Hint ({n}/{t})',
    'ctf.writeupTitle': '📝 Writeup',
    'ctf.correct': '✓ CORRECT! Well done!',
    'ctf.wrong': '✗ WRONG! Try again...',
    'ctf.enterFlag': '> Please enter a flag',
    'ctf.simError': 'Connection failed',
    'ctf.chapters': 'ch',

    // Progress
    'progress.breadcrumb': 'Dashboard',
    'progress.title': 'Learning Progress Dashboard',
    'progress.export': '↓ Export',
    'progress.import': '↑ Import',
    'progress.exportConfirm': 'No progress data to export',
    'progress.exportError': 'Export failed: ',
    'progress.importError': 'Invalid file format, not valid progress data',
    'progress.importConfirm': 'Import will overwrite current progress. Continue?',
    'progress.importSuccess': 'Progress imported successfully!',
    'progress.importFail': 'Import failed: ',
    'progress.completed': 'Completed Sections',
    'progress.total': 'of {n} total',
    'progress.overall': 'Overall Progress',
    'progress.overallSub': 'Completion rate',
    'progress.ctfSolved': 'CTF Solved',
    'progress.ctfTotal': 'of {n} total',
    'progress.streak': 'Learning Streak',
    'progress.days': 'days',
    'progress.proficiency': 'Proficiency',
    'progress.moduleProgress': '// Module Proficiency',
    'progress.overview': '// Progress Overview',
    'progress.timeline': '// Recent Activity',
    'progress.emptyTimeline': 'No learning records yet. Start learning!',

    // Tools
    'tools.breadcrumb': 'Security Tools',
    'tools.title': 'Built-in Security Toolbox',

    // Sidebar practice
    'sidebar.practice': '📝 Exercises',

    // Timeline
    'timeline.completed': 'Completed: ',

    // AI Chat
    'ai.fab': 'AI Tutor',
    'ai.title': 'AI Tutor',
    'ai.history': 'History',
    'ai.newChat': '+ New Chat',
    'ai.settings': 'Settings',
    'ai.close': 'Close',
    'ai.placeholder': 'Ask a question...',
    'ai.welcome': 'Hello! I\'m your AI cybersecurity tutor. Click ⚙ to configure API settings to get started.',
    'ai.noHistory': 'No chat history',
    'ai.newStarted': 'New conversation started.',
    'ai.saveSettings': 'Save',
    'ai.loadSettings': 'Load',
    'ai.saved': 'Settings saved ✓',
    'ai.configError': 'Please fill in API URL, Key, and Model name',
    'ai.thinking': 'Thinking...',
    'ai.thinkingDetail': '🧠 Thinking...',
    'ai.thinkingProcess': '🧠 Thinking process (click to expand',
    'ai.inputTokens': 'Input ',
    'ai.outputTokens': 'Output ',
    'ai.thinkingTokens': '(thinking ',
    'ai.tokens': ')',
    'ai.noApi': 'Please configure API settings first (click ⚙)',

    // Tool names & descs
    'tool.base64': 'Base64 Encode/Decode',
    'tool.base64.desc': 'Base64 encoding and decoding with Unicode support',
    'tool.hash': 'Hash Calculator',
    'tool.hash.desc': 'SHA-256/SHA-1 hash (browser SubtleCrypto)',
    'tool.caesar': 'Caesar / ROT13',
    'tool.caesar.desc': 'Caesar cipher encrypt/decrypt, custom shift (0-25)',
    'tool.caesar.subtitle': 'Caesar cipher encrypt/decrypt. ROT13 is the shift-13 variant.',
    'tool.url': 'URL Encode/Decode',
    'tool.url.desc': 'encodeURIComponent / decodeURIComponent',
    'tool.hex': 'Hex / ASCII',
    'tool.hex.desc': 'Hexadecimal and text conversion',
    'tool.morse': 'Morse Code',
    'tool.morse.desc': 'Morse code encode and decode',

    // Tool placeholders
    'tool.inputPlaceholder': 'Input...',
    'tool.caesarInputPlaceholder': 'Enter text...',
    'tool.caesarOutputPlaceholder': 'Encrypted result...',
    'tool.outputPlaceholder': 'Result...',
    'tool.fail': 'Calculation failed',
  }
};

// Apply saved language on page load — setLang will be called by initApp in script.js
// Here we just need to update static HTML elements before script.js runs
if (currentLang !== 'zh') {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    var val = (LANG[currentLang] || LANG.zh)[el.dataset.i18n];
    if (val) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    var val = (LANG[currentLang] || LANG.zh)[el.dataset.i18nPlaceholder];
    if (val) el.placeholder = val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    var val = (LANG[currentLang] || LANG.zh)[el.dataset.i18nTitle];
    if (val) el.title = val;
  });
  var _btn = document.getElementById('lang-toggle');
  if (_btn) _btn.textContent = '中';
}
