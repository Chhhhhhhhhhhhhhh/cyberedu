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

    'section.prereq': '建议先完成',
    'section.completed': '✓ 已完成',
    'section.markDone': '○ 标记完成',
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
    'progress.resetBtn': '↺ 重置进度',
    'progress.manageTitle': '// 数据管理与进度重置',
    'progress.manageDesc': '导出进度备份、从文件恢复学习记录，或自定义配置重置当前学习数据。',
    'resetModal.title': '学习进度重置设置',
    'resetModal.badge': 'DANGER ZONE',
    'resetModal.warning': '重置操作将永久清除所勾选的本地及云端学习数据。为防止误操作，建议在重置前先下载备份文件。',
    'resetModal.backupBtn': '📥 立即导出当前进度备份 (JSON)',
    'resetModal.scopeTitle': '选择需要重置的数据范围：',
    'resetModal.scopeSections': '知识章节学习进度',
    'resetModal.scopeSectionsDesc': '清空 171 个小节已学标记、模块完成率与断点续学记录',
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
    'diag.bannerTitle': '智能能力摸底与学习路线定制',
    'diag.bannerDesc': '只需 5 道题，测出你的网安五维能力雷达图，并推荐专属突破路径！',
    'diag.startBtn': '🎯 开始 5 分钟能力摸底',
    'diag.modalTitle': '网络安全综合能力诊断与雷达评估',
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
    'typewriter.line3': '> 171个知识章节 · 28个CTF挑战 · 6大安全工具 · AI智能辅导...',
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

    // Section nav
    'section.prereq': 'Finish first:',
    'section.completed': '✓ COMPLETED',
    'section.markDone': '○ MARK AS COMPLETED',
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
    'progress.resetBtn': '↺ Reset Progress',
    'progress.manageTitle': '// Data Management & Progress Reset',
    'progress.manageDesc': 'Export progress backups, restore from file, or configure learning progress reset.',
    'resetModal.title': 'Progress Reset Settings',
    'resetModal.badge': 'DANGER ZONE',
    'resetModal.warning': 'Resetting will permanently erase the selected local and server progress data. We strongly recommend exporting a backup before proceeding.',
    'resetModal.backupBtn': '📥 Export Current Backup (JSON)',
    'resetModal.scopeTitle': 'Select data scope to reset:',
    'resetModal.scopeSections': 'Knowledge Chapters & Sections',
    'resetModal.scopeSectionsDesc': 'Clear all 171 section completed states, module progress and resume state',
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
    'diag.bannerTitle': 'Skill Diagnostic & Adaptive Learning Path',
    'diag.bannerDesc': 'Take 5 quick questions to generate your 5-axis skill radar and unlock tailored tracks!',
    'diag.startBtn': '🎯 Start 5-Min Diagnostic',
    'diag.modalTitle': 'Cybersecurity Skill Diagnostic & Radar Assessment',
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
    'typewriter.line3': '> 171 chapters · 28 CTF challenges · 6 security tools · AI tutoring...',
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
  if (_btn) _btn.textContent = '中';
}
