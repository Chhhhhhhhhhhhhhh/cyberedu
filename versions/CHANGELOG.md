# cyberedu 版本记录

## v2.2 — 2026-06-03

**文件**:
- `content.js` (2.4MB) — 中英文双语教学内容（SECTION_CONTENT + SECTION_CONTENT_EN）
- `i18n.js` — 中英文切换系统（~140 翻译键值对）
- `script.js` / `style.css` — 排版优化 + 语言切换逻辑

### 🌐 英文全文翻译
- **52 个章节完整英文翻译**，覆盖全部 7 个模块（SECTION_CONTENT_EN）
- UI 界面中英文双语：导航、搜索、按钮、提示全部支持切换
- 章节导航按钮（上一节/下一节/标记完成）中英文自动切换
- 练习题代码注释同步翻译（starterEn 字段）
- 侧边栏模块标题、章节标题中英文切换
- 语言偏好通过 localStorage 持久保存

### 📝 教学内容质量审查
- 4 位审查 agent 并行审查全部 52 个章节
- **修复 22 处事实性错误**：
  - 🔴 严重：RSA 专利年份（1997→2000）、Yahoo 泄露（2012→2013-14）、Knuth 引用归属（→David Wheeler）、虚构工具名（prepivot→Impacket, jurukit→CrackMapExec, lazwat→laZagne）、Volatility 版本混淆
  - 🟡 中等：Python 2→3 语法导入、YARA 属性名、HTTP/0.9 状态码描述
  - 🟢 轻微：Wireshark 拼写、SageMath 名称等

### 🐛 Bug 修复
- 修复切换语言后章节正文不刷新（`rerenderCurrentView` 对 hub 视图补充 `loadSection` 调用）
- 修复 sectionId 与 SECTION_CONTENT_EN key 不匹配导致英文内容不显示（新增 `contentKey` 属性，52处精确映射）
- 修复 Windows 路径反斜杠（`C:\temp\...`）在 JS 模板字面量中引发 `SyntaxError`

### 🎨 排版优化
- 学习中心文章区间距增大：边距/行高/标题间距 增大约 15-30%
- 文章区最大宽度：940px（侧边栏展开）→ 1140px（收起）→ 1180px（无侧边栏），自动填充右侧空间
- Callout 提示框内边距增大、完成按钮居中加宽

---

## v2.1 — 2026-06-02

**文件**:
- `versions/cyberedu_v2.0.html` (11KB) — 纯 HTML 结构
- `versions/style_v2.0.css` (42KB) — 全部 CSS 样式
- `versions/script_v2.0.js` (257KB) — 全部 JS 逻辑 + 内容数据

### 架构变更
- 从单文件拆分为三文件架构（HTML + CSS + JS），便于维护
- 7 个知识模块，71 个章节（较 v1.0 新增 23 章）

| 模块 | 章节数 | 覆盖主题 |
|------|--------|---------|
| 编程基础 | 11 | C/指针/缓冲区/Python/正则/Bash/SQL/Linux |
| 密码学 | 10 | 古典密码/对称加密/RSA/哈希/PKI/量子密码 |
| 网络 | 6 | OSI/DNS/HTTP/TLS/WiFi/防火墙 |
| Web安全 | 9 | SQL注入/XSS/CSRF/文件上传/反序列化/SSTI/JWT/CORS |
| 渗透测试 | 5 | 信息收集/提权/Metasploit/AD攻击/后渗透 |
| 恶意软件 | 4 | 分类/静态动态分析/YARA规则/**Stuxnet案例**/**沙箱与自动化** |
| CTF实战 | 6 | CTF入门/PWN/逆向/题型速通/**数字取证**/**CTF工具链** |

### 新增功能
- **学习路线系统**：首页 4 阶段学习路径（基础夯实→安全原理→实战进阶→综合对抗）
- **自测系统**：练习题支持期望输出对比 + 测试用例验证
- **搜索高亮**：搜索结果关键词绿色高亮显示
- **赛博朋克字母交互**：首页标题/章节标题/学习路线标签 hover 数据腐蚀闪烁 + 霓虹光效
- **术语悬浮优化**：修复短词误匹配（如 DIV 中的 IV）
- **无障碍改进**：ARIA 标签、对比度增强

### Bug 修复
- 修复新增内容字符串使用单引号跨行导致页面卡在 0% 加载（改用模板字面量）
- 修复赛博字母效果未应用到动态渲染的 STAGE 标签（调整渲染顺序 + 事件委托）

---

## v1.0 — 2026-06-01

**文件**: `versions/cyberedu_v1.0.html` (257KB)

### 内容架构
- 7 个知识模块，48 个章节，全部采用"建房子"式渐进教学法
- 每章包含：背景故事 → 核心概念 → 代码示例 → 防御方法 → 要点总结

| 模块 | 章节数 | 覆盖主题 |
|------|--------|---------|
| 编程基础 | 11 | C/指针/缓冲区/Python/正则/Bash/SQL/Linux |
| 密码学 | 10 | 古典密码/对称加密/RSA/哈希/PKI/量子密码 |
| 网络 | 6 | OSI/DNS/HTTP/TLS/WiFi/防火墙 |
| Web安全 | 9 | SQL注入/XSS/CSRF/文件上传/反序列化/SSTI/JWT/CORS |
| 渗透测试 | 5 | 信息收集/提权/Metasploit/AD攻击/后渗透 |
| 恶意软件 | 3 | 分类/静态动态分析/YARA规则 |
| CTF实战 | 4 | CTF入门/PWN/逆向/题型速通 |

### 功能特性
- Prism.js 代码高亮 (cdnjs v1.29.0)
- 学习进度追踪 (localStorage)
- 全局搜索 (CTRL+K)
- 练习题系统 (10道题，在线代码编辑+运行)
- 练习题侧边栏 (显示全部题目，点击切换)
- 模块侧边栏折叠按钮 (状态持久化到 localStorage)
- 768px 以下侧边栏保持可见 (220px宽)
- CTF 挑战题库 / 学习进度看板 / 工具箱
