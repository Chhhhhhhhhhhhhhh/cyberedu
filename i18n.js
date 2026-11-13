// ============================================================
// CyberEdu i18n — Internationalization System
// ============================================================
let currentLang = 'en';
try { currentLang = localStorage.getItem('cyberedu_lang_v3') || 'en'; } catch(e) { currentLang = 'en'; }

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('cyberedu_lang_v3', lang);
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
      if (typeof currentModuleId !== "undefined" && typeof currentSectionId !== "undefined" && typeof renderSection === "function") {
        renderSection(currentModuleId, currentSectionId);
      }
      break;
    case "practice":
      if (typeof renderPractice === "function") renderPractice(currentPracticeIdx, true);
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
    "nav.menu": "菜单",
    "home.headline": "从一个小任务，开始学网安",
    "home.intro": "先用 5 节短课做出一个日志分析小工具，再按兴趣深入。每一步都有例子、练习和反馈。",
    "home.browse": "浏览全部方向",
    "home.startLabel": "新手路线 · PYTHON 3",
    "home.continueLabel": "继续你的学习",
    "home.firstProject": "做出第一个日志分析小工具",
    "home.firstProjectHint": "无需先搭靶场。先预测代码结果，再用本机 Python 验证。建议每次完成一节。",
    "home.continueHint": "接着上次的位置学习；已读章节的下一节也已为你准备好。",
    "home.startBtn": "从第一节开始",
    "home.step1": "变量",
    "home.step2": "循环",
    "home.step3": "函数",
    "home.step4": "日志",
    "home.step5": "小工具",
    "lesson.readTime": "约 {n} 分钟阅读",
    "lesson.settings": "阅读设置与环境",
    "lesson.beginnerStep": "入门路线 · 第 {n} / 5 步 · 建议另留 10–15 分钟练习",
    "learning.read": "✓ 已阅读",
    "learning.unread": "尚未标记已读",
    "learning.quizPassed": "测验通过",
    "learning.quizCount": "测验 {n}/2 题通过",
    "learning.quizHint": "同一章节的两题均答对",
    "learning.taskTitle": "动手检查",
    "learning.taskPassed": "✓ 课内练习通过",
    "learning.taskPending": "课内练习待完成",
    "learning.checkTask": "检查答案",
    "learning.taskSuccess": "答案正确。尝试更换输入，解释结果为什么会变化。",
    "learning.taskRetry": "还差一点，请检查标记的答案。",
    "learning.reviewTitle": "建议复习",
    "learning.progressNote": "已读由你手动标记；测验记录答题结果。已通过 {n} 个课内练习。这些记录用于自学，不代表职业能力认证。",
    "learning.noReview": "目前没有待复习的错题。完成测验后，答错的章节会显示在这里。",
    "learning.reviewCount": "{n} 道题待复习",
    "diag.resultNote": "每个方向只有一道入门题，结果仅帮助你找出可复习的概念，不是能力评分。",
    "diag.resultCount": "本次答对 {n} / 5 题",
    "diag.correct": "本题答对",
    "diag.review": "建议复习",
    "diag.reviewLesson": "打开相关课程",
    "diag.chooseTrack": "按你的兴趣选择路线",
    "lesson.example": "课程代码示例",
    "lesson.exampleHint": "修改并运行当前课程示例，对照输出理解变化。",
    "ctf.case": "案例阅读",
    "ctf.lab": "文件实训",
    "ctf.caseNote": "这是案例分析题：提供的是工具输出记录，完成它不等于实际操作过该工具。",
    "ctf.download": "下载练习样本",
    "ctf.labNote": "下载样本后，用题目中的工具完成分析，再提交找到的答案。样本不包含个人或生产数据。",

    'progress.useServer': '采用服务器记录',
    'progress.useServerConfirm': '确定用服务器进度替换本机待同步的记录？',
    'local.required': "AI 导师需要本地服务。请在项目目录运行 npm start，然后打开终端中显示的本地地址。",
    'code.enableRunner': "自测模式。要运行自己信任的代码，请在本机用 npm run start:runner 启动，打开终端中的本地地址。",
    'code.liveDns': "DNS 记录会变化。请将 A 和 MX 的结果与同一解析器的实时结果核对。",
    'code.exitStatus': "程序退出码",
    'hub.catalog': "目录",
    'ctf.material': "题目材料",
    'lesson.retry': "课程未能加载，点击重试",
    'path.nextLesson': "推荐下一节",
    'progress.pending': "已保存在此设备，等待同步。",
    'progress.conflict': "服务器有另一份进度。此设备的记录已保留，可先导出备份。",
    'progress.keepLocal': "用本机记录同步",
    'progress.keepConfirm': "确定用此设备的进度替换服务器上的记录？",
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
    'home.coreDirections': '九大核心方向',
    'home.learningPath': '推荐学习路径',
    'home.resumeLearning': '继续上次学习',
    'home.resumeSub': '回到上次停下的地方，保持学习心流',
    'home.continueBtn': '立即继续 ▸',
    'home.secProgress': '小节',

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
    'hub.onThisPage': '本节导航',
    'hub.tocProgress': '阅读进度',
    'diag.dismiss': '收起此横幅',
    'zen.enable': '专注模式',
    'zen.exit': '退出专注模式 (Esc)',
    'zen.exitText': '退出专注 (Esc)',
    'zen.tooltip': '一键开启沉浸式无干扰阅读 (快捷键: Z)',
    'reading.fontSize': '字号调节',
    'code.runInPractice': '在练习场运行',
    'code.expandCode': '展开剩余代码 ({n} 行)',
    'code.collapseCode': '收起代码',
    'ai.askSelection': '问 AI 讲透',
    'ai.copy': '复制',

    'section.prereq': '建议先完成',
    'section.completed': "✓ 已阅读",
    'section.markDone': "○ 标记已阅读",
    'section.prev': '← 上一节: ',
    'section.next': '下一节: ',
    'section.ctfLab': '🎯 实战靶场演练',
    'section.ctfSolved': '✓ 已攻克',
    'section.ctfUnsolved': '待攻克',
    'section.ctfSolveBtn': '立即实战攻防 ▸',
    'section.ctfReplayBtn': '再次挑战 ▸',

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
    'ctf.prereqTheory': '先导理论速查：',
    'ctf.quickPayloads': '⚡ 快捷注入 Payload：',
    'ctf.enterFlag': '> 请输入 flag',
    'ctf.simError': '服务器连接失败',
    'ctf.verifyError': 'Flag 验证失败，请稍后重试',
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
    'progress.completed': "已阅读章节",
    'progress.total': '共 {n} 节',
    'progress.overall': '整体进度',
    'progress.overallSub': "按已阅读章节统计",
    'progress.ctfSolved': "挑战 / 案例完成",
    'progress.ctfTotal': '共 {n} 题',
    'progress.streak': '连续学习',
    'progress.days': '天',
    'progress.proficiency': "阅读覆盖率",
    'progress.moduleProgress': "// 各模块阅读覆盖",
    'progress.overview': '// 学习进度一览',
    'progress.timeline': '// 最近学习记录',
    'progress.emptyTimeline': '还没有学习记录。开始学习吧！',
    'progress.resetBtn': '↺ 重置进度',
    'progress.manageTitle': '// 数据管理与进度重置',
    'progress.manageDesc': '导出进度备份、从文件恢复学习记录，或自定义配置重置当前学习数据。',
    'resetModal.title': '学习进度重置设置',
    'resetModal.badge': 'DANGER ZONE',
    'resetModal.warning': '重置操作将永久清除所勾选的本地及云端学习数据。为防止误操作，建议在重置前先下载备份文件。',
    'resetModal.backupBtn': '📥 立即导出当前进度备份 (JSON)',
    'resetModal.scopeTitle': '选择需要重置的数据范围：',
    'resetModal.scopeSections': '知识章节学习进度',
    'resetModal.scopeSectionsDesc': "清除章节已读、测验、课内练习与继续学习记录",
    'resetModal.scopeCtf': 'CTF 靶场实战通关',
    'resetModal.scopeCtfDesc': '清空 28 道靶机挑战解题标记与提交的 Flag 记录',
    'resetModal.scopeBadges': '特工档案与荣誉勋章',
    'resetModal.scopeBadgesDesc': '重置特工代号、军衔段位 (重回 Novice) 与 8 枚成就勋章',
    'resetModal.scopeTimeline': '学习足迹与连续打卡',
    'resetModal.scopeTimelineDesc': '重置学习时间轴活动记录与连续打卡天数 (重回 1 天)',
    'resetModal.scopeAi': 'AI 导师本地对话历史',
    'resetModal.scopeAiDesc': '清空与 AI 导师的历史提问与答疑对话记录 (可选)',
    'resetModal.presetLabel': '快捷预设：',
    'resetModal.presetAll': '⚡ 全量出厂重置',
    'resetModal.presetSections': '📖 仅重置章节',
    'resetModal.presetCtf': '🚩 仅重置靶场',
    'resetModal.confirmCheckbox': '我已知晓重置操作不可撤销，确认清空所选数据',
    'resetModal.confirmBtn': '⚠ 确认执行重置',
    'resetModal.cancelBtn': '取消',
    'resetModal.successToast': '✓ 学习进度已成功重置！',
    'resetModal.noSelection': '请至少勾选一项需要重置的数据范围',

    // Tools
    'tools.breadcrumb': '安全工具',
    'tools.title': '内置安全工具箱',

    // Sidebar practice
    'sidebar.practice': '📝 练习题目',

    // Timeline
    'timeline.completed': "已阅读：",

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
    'ai.apiType': 'API 类型',
    'ai.apiUrl': 'API 地址',
    'ai.apiKey': 'API 密钥',
    'ai.model': '模型',
    'ai.temperature': '温度',
    'ai.maxTokens': '最大 Token 数',
    'ai.thinking': '正在思考',
    'ai.stop': '■ 停止',
    'ai.copy': '复制',
    'ai.copied': '已复制 ✓',
    'ai.retry': '↻ 重新生成',
    'ai.stopped': '⏹ 已停止生成（已生成内容保留）',
    'ai.curSession': '当前对话',
    'ai.grpToday': '今天',
    'ai.grp7d': '7 天内',
    'ai.grpOlder': '更早',
    'ai.unsaved': '未保存',
    'ai.msgsUnit': ' 条',
    'ai.stopFirst': '请先停止生成',
    'ai.clearAll': '清空全部',
    'ai.rename': '重命名',
    'ai.confirmClear': '再点一次确认清空',
    'ai.thinkingLabel': '启用思考模式 (Thinking)',
    'ai.dock': '停靠侧边栏',
    'ai.undock': '浮窗模式',
    'code.fontSize': '字号',
    'code.fullscreen': '全屏代码',
    'code.exitFullscreen': '退出全屏',
    'shortcuts.title': '键盘快捷键指南',
    'shortcuts.nav': '全局导航',
    'shortcuts.search': '唤起全局搜索',
    'shortcuts.prevSec': '跳转上一小节',
    'shortcuts.nextSec': '跳转下一小节',
    'shortcuts.close': '关闭弹窗 / 浮层',
    'shortcuts.coding': '实训与答题',
    'shortcuts.run': '运行代码 / 提交 Payload',
    'shortcuts.prevPrac': '上一道练习题',
    'shortcuts.nextPrac': '下一道练习题',
    'shortcuts.ai': '智能助手',
    'shortcuts.toggleAI': '唤起 / 折叠 AI 导师',
    'shortcuts.help': '打开快捷键速查面板',

    // Gamification: Hacker Ranks & Identity
    'rank.title': '特工档案与军衔',
    'rank.agentName': '特工代号',
    'rank.editName': '修改代号',
    'rank.enterName': '请输入新的特工代号（最多16字符）:',
    'rank.threatIndex': '综合战力指数',
    'rank.clearance': '安全保密等级',
    'rank.exp': '特工经验值',
    'rank.nextLevel': '距离下一段位',
    'rank.maxRank': '已达巅峰段位',
    'rank.level': '段位',
    'rank.badgesUnlocked': '已解锁勋章',
    'rank.script_kiddie': '脚本小子',
    'rank.script_kiddie.sub': '初探黑客门径 // Initial Access',
    'rank.script_kiddie.clearance': '等级 1 · 公开访问',
    'rank.security_enthusiast': '安全狂热者',
    'rank.security_enthusiast.sub': '网络巡检与基础协议 // Recon Operator',
    'rank.security_enthusiast.clearance': '等级 2 · 受限访问',
    'rank.junior_pentester': '渗透先锋',
    'rank.junior_pentester.sub': '漏洞攻坚与靶机突破 // Exploit Specialist',
    'rank.junior_pentester.clearance': '等级 3 · 保密许可',
    'rank.cyber_specialist': '资深安全专家',
    'rank.cyber_specialist.sub': '红蓝对抗与全栈防御 // Red Team Specialist',
    'rank.cyber_specialist.clearance': '等级 4 · 机密权限',
    'rank.elite_operative': '传奇领航特工',
    'rank.elite_operative.sub': '全域渗透与赛博宗师 // Ghost in the Shell',
    'rank.elite_operative.clearance': '等级 5 · 绝密领航',

    // Gamification: Achievements
    'badges.title': '// 特工荣誉与成就勋章',
    'badges.unlocked': '已解锁',
    'badges.locked': '未解锁',
    'badges.toastHeader': '🏆 解锁新成就',
    'ach.first_blood.title': '首破之刃',
    'ach.first_blood.desc': '成功提交并通过第 1 道 CTF 挑战 Flag',
    'ach.scholar.title': '理论先锋',
    'ach.scholar.desc': '完成 5 个知识章节的学习与打卡',
    'ach.web_hacker.title': 'Web 破壁者',
    'ach.web_hacker.desc': '完成 Web 安全模块至少 3 个小节',
    'ach.crypto_breaker.title': '破译专家',
    'ach.crypto_breaker.desc': '完成密码学模块 3 个小节或破译密码学 CTF',
    'ach.terminal_guru.title': '终端发烧友',
    'ach.terminal_guru.desc': '在实训沙箱、代码编辑器或 CTF 中执行 10 次指令',
    'ach.flag_hunter.title': '夺旗老兵',
    'ach.flag_hunter.desc': '在 CTF 靶场中成功夺取 5 面不同题目的 Flag',
    'ach.unstoppable.title': '心流特工',
    'ach.unstoppable.desc': '持续专注学习，保持连续 3 天签到打卡',
    'ach.cyber_polymath.title': '全域特工',
    'ach.cyber_polymath.desc': '在 7 大核心模块中均完成至少 1 个小节',

    // Celebration & Motion
    'celebration.compromised': '[ 靶标已被攻陷 // FLAG 验证通过 ]',
    'celebration.secComplete': '[ 章节目标已达成 // 经验值 +100 ]',
    'motion.toggle': '动效模式',
    'motion.normal': '极客流光动效',
    'motion.reduced': '减弱动效模式',
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
    'tool.binary': '进制转换',
    'tool.binary.desc': '二进制/十进制/十六进制互转，支持负数补码',
    'tool.morse': '摩尔斯电码',
    'tool.morse.desc': '摩尔斯电码编解码',

    // Tool placeholders
    'tool.inputPlaceholder': '输入...',
    'tool.caesarInputPlaceholder': '输入文本...',
    'tool.caesarOutputPlaceholder': '加密结果...',
    'tool.outputPlaceholder': '结果...',
    'tool.fail': '计算失败',

    // Accessibility
    'a11y.skipToContent': '跳至正文',

    // Sidebar
    'sidebar.collapse': '收起侧边栏',
    'sidebar.expand': '展开侧边栏',

    // Checkpoint quiz
    'checkpoint.correct': '✓ 正确！',
    'checkpoint.wrong': '✗ 不对哦，再想想',
    'checkpoint.explanation': '解析：',
    'checkpoint.retry': '↺ 重试',

    // Interactive Platform & Diagnostics
    'diag.bannerTitle': "入门自测与路线选择",
    'diag.bannerDesc': "五道入门题，帮你找出想继续学习的概念。",
    'diag.startBtn': "做一次入门自测",
    'diag.modalTitle': "入门自测结果",
    'diag.trackWhitehat': '白帽 Web 安全工程师路线',
    'diag.trackWhitehatDesc': '主攻 OWASP Top 10 漏洞攻防、业务逻辑安全与企业渗透实战。',
    'diag.trackCtfer': 'CTF 夺旗突击手路线',
    'diag.trackCtferDesc': '主攻现代密码破译、逆向反汇编分析与底层漏洞挖掘。',
    'diag.trackBeginner': '零基础网安小白破局路线',
    'diag.trackBeginnerDesc': '从编程语言基础与网络数据流出发，梯度式夯实核心攻防基本功。',
    'diag.setTrack': '设为学习目标',
    'ai.askSelection': '🤖 问 AI 导师',
    'ai.askCheckpoint': '🤖 向 AI 助教请教本题',
    'ai.auditCode': '🔍 AI 剖析',
    'lab.drawerTitle': '配套实训环境与 Docker 命令',

    // AI system prompt
    'ai.systemPrompt': '你是 CyberEdu 的 AI 网络安全导师。你的任务是帮助用户理解网络安全概念、解答疑问、引导学习方向。规则：1) 不要直接给出 CTF flag 答案 2) 用引导性问题帮助用户自己思考 3) 回答要简洁准确 4) 使用中文回答',

    // Typewriter lines
    'typewriter.line1': '> 在数字世界的每个角落，漏洞都在等待被发现...',
    'typewriter.line2': '> 从基础编程到高级渗透，4阶系统化学习路径...',
    'typewriter.line3': '> 173个知识章节 · 28个CTF挑战 · 6大安全工具 · AI智能辅导...',
    'typewriter.line4': '> 打破表象，寻找真相。每一次攻击都有故事...',

    // CTF
    'ctf.solved': '✓ 已解出',
    'ctf.starterCode.python': '# 在这里写你的 Python 代码\nprint("Hello CTF")\n',
    'ctf.starterCode.javascript': '// 在这里写你的 JavaScript 代码\nconsole.log("Hello CTF");\n',

    // Misc
    'app.loading': '正在加载...',
    'app.offlineCdn': '部分 CDN 资源加载失败，某些功能可能受限。',
  },

  en: {
    "nav.menu": "Menu",
    "home.headline": "Build your first security tool, one step at a time.",
    "home.intro": "Build a log analysis tool in five short lessons, then explore a subject. Each step includes an example, practice and feedback.",
    "home.browse": "Browse all subjects",
    "home.startLabel": "START HERE · PYTHON 3",
    "home.continueLabel": "YOUR NEXT STEP",
    "home.firstProject": "Your first log analysis tool",
    "home.firstProjectHint": "No lab setup needed to begin. Predict the output, then verify it with Python on your computer. Start with one lesson.",
    "home.continueHint": "Resume your current lesson, or move to the next one after marking it as read.",
    "home.startBtn": "Start the first lesson",
    "home.step1": "Variables",
    "home.step2": "Loops",
    "home.step3": "Functions",
    "home.step4": "Logs",
    "home.step5": "Your tool",
    "lesson.readTime": "About {n} min to read",
    "lesson.settings": "Reading options & setup",
    "lesson.beginnerStep": "Starter path · Step {n} of 5 · Allow another 10–15 minutes for practice",
    "learning.read": "✓ Read",
    "learning.unread": "Not marked as read",
    "learning.quizPassed": "Quiz passed",
    "learning.quizCount": "Quiz: {n}/2 questions passed",
    "learning.quizHint": "Both questions answered correctly",
    "learning.taskTitle": "Check your work",
    "learning.taskPassed": "✓ Lesson exercise passed",
    "learning.taskPending": "Lesson exercise pending",
    "learning.checkTask": "Check answers",
    "learning.taskSuccess": "Correct. Try different input and explain why the output changes.",
    "learning.taskRetry": "Check the highlighted answer and try again.",
    "learning.reviewTitle": "Your review queue",
    "learning.progressNote": "Read status is self-reported; quizzes track answers. You have passed {n} lesson exercises. This tracks study activity, not professional certification.",
    "learning.noReview": "No missed questions to review yet. Lessons with incorrect answers appear here.",
    "learning.reviewCount": "{n} question(s) to revisit",
    "diag.resultNote": "One entry question per subject helps identify concepts to revisit. This is not a skill assessment.",
    "diag.resultCount": "You answered {n} of 5 questions correctly",
    "diag.correct": "Correct on this question",
    "diag.review": "Revisit this concept",
    "diag.reviewLesson": "Open the related lesson",
    "diag.chooseTrack": "Choose a path for your interests",
    "lesson.example": "Lesson code example",
    "lesson.exampleHint": "Edit and run this lesson example, then compare the output.",
    "ctf.case": "Case study",
    "ctf.lab": "File lab",
    "ctf.caseNote": "This case study provides recorded tool output. Completing it does not demonstrate hands-on use of the tool.",
    "ctf.download": "Download training file",
    "ctf.labNote": "Download the synthetic sample, analyze it with the suggested tool, then submit your answer. It contains no personal or production data.",

    'progress.useServer': 'Use server copy',
    'progress.useServerConfirm': 'Replace this device’s pending changes with the server copy?',
    'local.required': "AI Tutor requires the local server. Run npm start in the project and open the local URL printed in the terminal.",
    'code.enableRunner': "Self-test mode. To run trusted code on your computer, use npm run start:runner and open the local URL in the terminal.",
    'code.liveDns': "DNS records vary. Compare the A and MX results with the same live resolver.",
    'code.exitStatus': "Process exit code",
    'hub.catalog': "Catalog",
    'ctf.material': "Challenge material",
    'lesson.retry': "Could not load this lesson. Retry",
    'path.nextLesson': "Next recommended lesson",
    'progress.pending': "Saved on this device. Sync pending.",
    'progress.conflict': "The server has another revision. Your local progress is retained and can be exported.",
    'progress.keepLocal': "Sync this device’s copy",
    'progress.keepConfirm': "Replace the server’s progress with the copy on this device?",
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
    'home.coreDirections': 'Nine Core Domains',
    'home.learningPath': 'Recommended Learning Path',
    'home.resumeLearning': 'Active Learning Session',
    'home.resumeSub': 'Pick up right where you left off',
    'home.continueBtn': 'CONTINUE ▸',
    'home.secProgress': 'Sections',

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
    'hub.onThisPage': 'On This Page',
    'hub.tocProgress': 'Read Progress',
    'diag.dismiss': 'Dismiss this banner',
    'zen.enable': 'Zen Mode',
    'zen.exit': 'Exit Zen Mode (Esc)',
    'zen.exitText': 'Exit Zen (Esc)',
    'zen.tooltip': 'Toggle distraction-free Zen focus reading (Hotkey: Z)',
    'reading.fontSize': 'Adjust Font Size',
    'code.runInPractice': 'Run in Practice Lab',
    'code.expandCode': 'Expand remaining code ({n} lines)',
    'code.collapseCode': 'Collapse Code',
    'ai.askSelection': 'Explain with AI',
    'ai.copy': 'Copy',

    // Section nav
    'section.prereq': 'Finish first:',
    'section.completed': "✓ READ",
    'section.markDone': "○ MARK AS READ",
    'section.prev': '← PREV: ',
    'section.next': 'NEXT: ',
    'section.ctfLab': '🎯 Hands-On CTF Lab',
    'section.ctfSolved': '✓ Solved',
    'section.ctfUnsolved': 'Unsolved',
    'section.ctfSolveBtn': 'Solve Challenge ▸',
    'section.ctfReplayBtn': 'Replay Challenge ▸',

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
    'ctf.prereqTheory': 'Prerequisite Theory:',
    'ctf.quickPayloads': '⚡ Quick Payloads:',
    'ctf.enterFlag': '> Please enter a flag',
    'ctf.simError': 'Connection failed',
    'ctf.verifyError': 'Flag verification failed, please try again',
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
    'progress.completed': "Sections read",
    'progress.total': 'of {n} total',
    'progress.overall': 'Overall Progress',
    'progress.overallSub': "Based on sections marked as read",
    'progress.ctfSolved': "Challenges / cases completed",
    'progress.ctfTotal': 'of {n} total',
    'progress.streak': 'Learning Streak',
    'progress.days': 'days',
    'progress.proficiency': "Reading coverage",
    'progress.moduleProgress': "// READING COVERAGE BY SUBJECT",
    'progress.overview': '// Progress Overview',
    'progress.timeline': '// Recent Activity',
    'progress.emptyTimeline': 'No learning records yet. Start learning!',
    'progress.resetBtn': '↺ Reset Progress',
    'progress.manageTitle': '// Data Management & Progress Reset',
    'progress.manageDesc': 'Export progress backups, restore from file, or configure learning progress reset.',
    'resetModal.title': 'Progress Reset Settings',
    'resetModal.badge': 'DANGER ZONE',
    'resetModal.warning': 'Resetting will permanently erase the selected local and server progress data. We strongly recommend exporting a backup before proceeding.',
    'resetModal.backupBtn': '📥 Export Current Backup (JSON)',
    'resetModal.scopeTitle': 'Select data scope to reset:',
    'resetModal.scopeSections': 'Knowledge Chapters & Sections',
    'resetModal.scopeSectionsDesc': "Clear read status, quizzes, lesson exercises and resume position",
    'resetModal.scopeCtf': 'CTF Challenge Solved Records',
    'resetModal.scopeCtfDesc': 'Clear solved marks and flag history for all 28 challenges',
    'resetModal.scopeBadges': 'Agent Profile & Badges',
    'resetModal.scopeBadgesDesc': 'Reset agent callsign, military rank back to Novice, and clear 8 badges',
    'resetModal.scopeTimeline': 'Activity Timeline & Streak',
    'resetModal.scopeTimelineDesc': 'Clear activity timeline records and reset streak back to 1 day',
    'resetModal.scopeAi': 'AI Tutor Local Chat History',
    'resetModal.scopeAiDesc': 'Clear local conversation history with AI Tutor (Optional)',
    'resetModal.presetLabel': 'Quick Presets:',
    'resetModal.presetAll': '⚡ Full Factory Reset',
    'resetModal.presetSections': '📖 Sections Only',
    'resetModal.presetCtf': '🚩 CTF Only',
    'resetModal.confirmCheckbox': 'I understand that this action is irreversible and confirm data wipe',
    'resetModal.confirmBtn': '⚠ Confirm Reset',
    'resetModal.cancelBtn': 'Cancel',
    'resetModal.successToast': '✓ Learning progress reset successfully!',
    'resetModal.noSelection': 'Please select at least one item to reset',

    // Tools
    'tools.breadcrumb': 'Security Tools',
    'tools.title': 'Built-in Security Toolbox',

    // Sidebar practice
    'sidebar.practice': '📝 Exercises',

    // Timeline
    'timeline.completed': "Read: ",

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
    'ai.apiType': 'API Type',
    'ai.apiUrl': 'API Base URL',
    'ai.apiKey': 'API Key',
    'ai.model': 'Model',
    'ai.temperature': 'Temperature',
    'ai.maxTokens': 'Max Tokens',
    'ai.thinking': 'Thinking...',
    'ai.stop': '■ Stop',
    'ai.copy': 'Copy',
    'ai.copied': 'Copied ✓',
    'ai.retry': '↻ Regenerate',
    'ai.stopped': '⏹ Generation stopped (partial kept)',
    'ai.curSession': 'Current chat',
    'ai.grpToday': 'Today',
    'ai.grp7d': 'Last 7 days',
    'ai.grpOlder': 'Earlier',
    'ai.unsaved': 'unsaved',
    'ai.msgsUnit': ' msgs',
    'ai.stopFirst': 'Stop generation first',
    'ai.clearAll': 'Clear all',
    'ai.rename': 'Rename',
    'ai.confirmClear': 'Click again to confirm',
    'ai.thinkingLabel': 'Thinking Mode',
    'ai.dock': 'Dock to Side',
    'ai.undock': 'Float Window',
    'code.fontSize': 'Font Size',
    'code.fullscreen': 'Maximize Code',
    'code.exitFullscreen': 'Exit Maximize',
    'shortcuts.title': 'Keyboard Shortcuts Guide',
    'shortcuts.nav': 'Navigation',
    'shortcuts.search': 'Global Quick Search',
    'shortcuts.prevSec': 'Previous Section',
    'shortcuts.nextSec': 'Next Section',
    'shortcuts.close': 'Close Any Dialog / Modal',
    'shortcuts.coding': 'Coding & Labs',
    'shortcuts.run': 'Run Code / Send Payload',
    'shortcuts.prevPrac': 'Previous Exercise',
    'shortcuts.nextPrac': 'Next Exercise',
    'shortcuts.ai': 'AI Assistant',
    'shortcuts.toggleAI': 'Toggle AI Tutor',
    'shortcuts.help': 'Show Hotkeys Cheat Sheet',

    // Gamification: Hacker Ranks & Identity
    'rank.title': 'Agent Dossier & Rank',
    'rank.agentName': 'Agent Codename',
    'rank.editName': 'Edit Codename',
    'rank.enterName': 'Enter new agent codename (max 16 chars):',
    'rank.threatIndex': 'Combat Threat Index',
    'rank.clearance': 'Security Clearance',
    'rank.exp': 'Agent EXP',
    'rank.nextLevel': 'To Next Rank',
    'rank.maxRank': 'MAX RANK ACHIEVED',
    'rank.level': 'Rank',
    'rank.badgesUnlocked': 'Badges Unlocked',
    'rank.script_kiddie': 'Script Kiddie',
    'rank.script_kiddie.sub': 'Initial Access // Recon Learner',
    'rank.script_kiddie.clearance': 'Level 1 · Public Clearance',
    'rank.security_enthusiast': 'Security Enthusiast',
    'rank.security_enthusiast.sub': 'Recon Operator // Protocol Auditor',
    'rank.security_enthusiast.clearance': 'Level 2 · Restricted Clearance',
    'rank.junior_pentester': 'Junior Pentester',
    'rank.junior_pentester.sub': 'Exploit Specialist // Vulnerability Hunter',
    'rank.junior_pentester.clearance': 'Level 3 · Confidential Access',
    'rank.cyber_specialist': 'Cyber Specialist',
    'rank.cyber_specialist.sub': 'Red Team Specialist // Full-Stack Defense',
    'rank.cyber_specialist.clearance': 'Level 4 · Secret Clearance',
    'rank.elite_operative': 'Elite Operative',
    'rank.elite_operative.sub': 'Ghost in the Shell // Apex Predator',
    'rank.elite_operative.clearance': 'Level 5 · Top Secret / SCI',

    // Gamification: Achievements
    'badges.title': '// Agent Badges & Achievements',
    'badges.unlocked': 'UNLOCKED',
    'badges.locked': 'LOCKED',
    'badges.toastHeader': '🏆 ACHIEVEMENT UNLOCKED',
    'ach.first_blood.title': 'First Blood',
    'ach.first_blood.desc': 'Successfully solve your first CTF challenge',
    'ach.scholar.title': 'Knowledge Pioneer',
    'ach.scholar.desc': 'Complete 5 knowledge sections',
    'ach.web_hacker.title': 'Web Vanguard',
    'ach.web_hacker.desc': 'Complete at least 3 sections in Web Security',
    'ach.crypto_breaker.title': 'Cryptanalyst',
    'ach.crypto_breaker.desc': 'Complete 3 Cryptography sections or solve Crypto CTF',
    'ach.terminal_guru.title': 'Terminal Guru',
    'ach.terminal_guru.desc': 'Execute 10 commands in terminal sandbox or practice',
    'ach.flag_hunter.title': 'Flag Hunter',
    'ach.flag_hunter.desc': 'Solve 5 different CTF challenges',
    'ach.unstoppable.title': 'Flow State Operative',
    'ach.unstoppable.desc': 'Maintain a 3-day learning streak',
    'ach.cyber_polymath.title': 'Full-Spectrum Operator',
    'ach.cyber_polymath.desc': 'Complete at least 1 section in all 7 modules',

    // Celebration & Motion
    'celebration.compromised': '[ TARGET COMPROMISED // FLAG ACCEPTED ]',
    'celebration.secComplete': '[ OBJECTIVE ACCOMPLISHED // EXP +100 ]',
    'motion.toggle': 'Motion Mode',
    'motion.normal': 'Cyber Motion',
    'motion.reduced': 'Reduced Motion',
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
    'tool.binary': 'Radix Conversion',
    'tool.binary.desc': 'Binary/decimal/hex conversion with two\'s complement',
    'tool.morse': 'Morse Code',
    'tool.morse.desc': 'Morse code encode and decode',

    // Tool placeholders
    'tool.inputPlaceholder': 'Input...',
    'tool.caesarInputPlaceholder': 'Enter text...',
    'tool.caesarOutputPlaceholder': 'Encrypted result...',
    'tool.outputPlaceholder': 'Result...',
    'tool.fail': 'Calculation failed',

    // Accessibility
    'a11y.skipToContent': 'Skip to content',

    // Sidebar
    'sidebar.collapse': 'Collapse sidebar',
    'sidebar.expand': 'Expand sidebar',

    // Checkpoint quiz
    'checkpoint.correct': '✓ Correct!',
    'checkpoint.wrong': '✗ Incorrect, try again',
    'checkpoint.explanation': 'Explanation: ',
    'checkpoint.retry': '↺ Retry',

    // Interactive Platform & Diagnostics
    'diag.bannerTitle': "Entry self-check & learning paths",
    'diag.bannerDesc': "Five entry questions to help you choose what to study next.",
    'diag.startBtn': "Take the entry self-check",
    'diag.modalTitle': "Entry self-check results",
    'diag.trackWhitehat': 'White-Hat Web Security Track',
    'diag.trackWhitehatDesc': 'Focus on OWASP Top 10 vulnerabilities, business logic, and practical pentesting.',
    'diag.trackCtfer': 'CTF Competitor Track',
    'diag.trackCtferDesc': 'Deep dive into cryptography, reverse engineering, and exploit development.',
    'diag.trackBeginner': 'Zero-to-Hero Foundation Track',
    'diag.trackBeginnerDesc': 'Step-by-step mastery starting from programming basics and network packet flows.',
    'diag.setTrack': 'Set as Target Track',
    'ai.askSelection': '🤖 Ask AI Tutor',
    'ai.askCheckpoint': '🤖 Ask AI to Explain This',
    'ai.auditCode': '🔍 AI Audit',
    'lab.drawerTitle': 'Lab Environment & Docker Recipes',

    // AI system prompt
    'ai.systemPrompt': 'You are CyberEdu\'s AI cybersecurity tutor. Your role is to help users understand cybersecurity concepts, answer questions, and guide learning. Rules: 1) Never give CTF flag answers directly 2) Use guiding questions to help users think 3) Keep answers concise and accurate 4) Respond in English',

    // Typewriter lines
    'typewriter.line1': '> In every corner of the digital world, vulnerabilities await discovery...',
    'typewriter.line2': '> From basic programming to advanced penetration, 4-stage learning path...',
    'typewriter.line3': '> 173 chapters · 28 CTF challenges · 6 security tools · AI tutoring...',
    'typewriter.line4': '> Break the surface, find the truth. Every attack has a story...',

    // CTF
    'ctf.solved': '✓ Solved',
    'ctf.starterCode.python': '# Write your Python code here\nprint("Hello CTF")\n',
    'ctf.starterCode.javascript': '// Write your JavaScript code here\nconsole.log("Hello CTF");\n',

    // Misc
    'app.loading': 'Loading...',
    'app.offlineCdn': 'Some CDN resources failed to load. Some features may be limited.',
  }
};

// Always update static elements and title on page load
document.title = (LANG[currentLang] || LANG.zh)['head.title'] || document.title;
{
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
  if (_btn) _btn.textContent = currentLang === 'zh' ? 'EN' : '中';
  document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-CN';
}
