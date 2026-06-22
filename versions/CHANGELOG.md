# cyberedu 版本记录

## v2.4 — 2026-06-22

**文件**: `content.js`, `script.js`, `style.css`, `i18n.js`, `server.js`, `README.md`, `README_zh.md`

### 📚 全量内容重写
- **52 个章节全部重写**，采用场景驱动教学风格（案例引入 → 原理剖析 → 实操验证 → 防御总结）
- 新增章节间过渡引导，学习路径更连贯
- 嵌入 **203 道交互式自测题**（Quiz Checkpoints），边学边练
- 每章新增阅读时间指示器（estimated reading time）
- 每章末尾新增关联练习链接，快速跳转实操

### 🐛 Bug 修复
- **侧边栏折叠动画卡死**：`drawGlitchShift` 中 `getImageData` 在 `gy` 接近 canvas 高度时抛出 `IndexSizeError`，导致 rAF 循环中断；改用 `Math.max(1, ...)` 钳制切片高度 + try-catch 安全网
- **侧边栏底部被状态栏遮挡**：`bottom: 0` → `bottom: 32px`，确保最后几项可完整滚动显示
- **工具箱计算错误**：
  - URL 解码正确处理 `+` 为空格
  - Hex→Text 自动去除 `0x` 前缀，支持冒号/逗号分隔格式
  - Binary 工具支持负数（32 位二进制补码）

### 🌐 国际化
- 新增 Binary 工具的 i18n 翻译键（`tool.binary` / `tool.binary.desc`）

### 📝 文档与资源
- README.md 全面改版：新增 badge 徽章、功能展示图、SEO 增强 meta 标签
- README_zh.md 同步更新中文版
- 文档截图（features-showcase.png / og-image.png）清理 AI 生成水印

### ⚙️ 工程
- server.js 版本号同步 v2.4
- HTML 状态栏版本号同步 v2.4

---

## v2.3 — 2026-06-05

**文件**: `server.js`, `script.js`, `style.css`, `i18n.js`, `cyberedu.html`
**仓库**: 公开 / GitHub Pages / Issue 模板 / CONTRIBUTING.md

### 🤖 多模型 AI 代理
- 新增 Anthropic (Claude) API 支持，设置面板增加 API Type 下拉选择器
- Anthropic SSE 事件格式自动转换为 OpenAI 兼容格式
- 支持 system prompt、thinking/reasoning 内容和 token 用量统计
- 配置文件新增 `cyberedu_ai_type` 存储，支持 OpenAI Compatible / Anthropic 切换
- 扩展支持：Groq、Ollama (已支持)，Claude 系列 (新增)

### 📱 移动端响应式优化
- 侧边栏：小屏改为覆盖层模式 (z-index:200)，导航后自动关闭
- 导航栏：紧凑布局，横向滚动，搜索框隐藏
- 文章区：字号/间距/表格/代码块全面适配小屏
- 首页/CTF/练习/工具/模态框：网格单列布局，间距优化
- 移动端禁用 scroll-reveal 动画

### 🔍 搜索增强
- 支持分词模糊匹配（"RSA crypto" → 同时匹配含 RSA 和 cryptography 的条目）
- 高亮改为每个 token 分别标记
- 匹配要求：每个词都必须在标题或描述中出现

### 🌐 国际化与默认语言
- AI 设置面板所有标签改为 i18n 支持（EN/ZH 自动切换）
- 网站默认语言改为英文
- 浏览器标签标题跟随语言切换
- localStorage 键名升级为 v3，避免旧缓存干扰

### ⚡ 性能优化
- content.js / i18n.js / script.js 添加 defer 属性，不阻塞页面渲染
- 加载中显示 CyberEdu 启动动画遮罩

### 📝 开源配套
- 新增 CONTRIBUTING.md 贡献指南（英语）
- 添加 SEO meta 标签（description / Open Graph / Twitter Card）
- 项目目录清理：构建脚本移入 build/，中间产物加入 .gitignore
- 仓库版本号统一 v2.3 (server.js + 启动日志)

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
