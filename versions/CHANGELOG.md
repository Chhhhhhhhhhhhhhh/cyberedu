# cyberedu 版本记录

## v2.5 — 2026-06-23

**文件**: `script.js`, `cyberedu.html`, `style.css`, `server.js`, `content.js`, `i18n.js`, `tests/*.js`, `scripts/*.js`, `README.md`, `package.json`, `robots.txt`, `sitemap.xml`

### 🔒 安全加固
- **CTF Flag 服务端验证**：所有 28 个 CTF flag 从客户端 `content.js` 迁移至 `server.js`，新增 `/api/ctf-verify` 端点，大小写不敏感 + 空白字符修剪比对
- **速率限制**：POST 请求 30 次/分钟/IP，超出返回 429，内存 Map 自动清理过期条目
- **API URL 白名单**：代理请求仅允许 7 个已知 AI API 主机（OpenAI/DeepSeek/Anthropic/Qwen/Groq/localhost），阻止 SSRF
- **进度数据验证**：`/api/progress` POST 校验 JSON 格式、非数组、100KB 大小上限
- **安全响应头**：新增 `X-Content-Type-Options`、`X-Frame-Options: DENY`、`Referrer-Policy`、`X-XSS-Protection`、`Permissions-Policy`
- **CDN 完整性校验**：所有外部脚本/样式添加 `integrity="sha384-..."` SRI 哈希 + `crossorigin="anonymous"` + `referrerpolicy="no-referrer"`
- **客户端 flag 迁移脚本**：`scripts/remove-client-flags.js` 自动从 content.js 移除 flag 属性并创建备份

### ⚡ 性能优化
- **gzip 压缩**：HTML/CSS/JS/JSON/SVG/XML/TXT 等可压缩文件自动 gzip，减少传输体积
- **ETag 缓存**：基于文件大小 + mtime 生成 ETag，支持 304 Not Modified 响应
- **Cache-Control 策略**：HTML/CSS/JS 设为 `no-cache`（始终验证），其他静态资源 `max-age=3600`
- **全局错误捕获**：`uncaughtException` / `unhandledRejection` 防止服务器崩溃

### ♿ 无障碍 (Accessibility)
- **WCAG AA 对比度**：修复 `--text-muted` 颜色（#5a6070 → #8890a0），确保暗色主题下 ≥ 4.5:1
- **Skip-to-content**：键盘用户可直接跳过导航直达主内容
- **ARIA 标签**：所有交互元素添加适当的 `role`、`aria-label`、`aria-pressed`、`aria-expanded`
- **prefers-reduced-motion**：尊重系统动画偏好设置，禁用所有动画和 canvas 效果
- **prefers-color-scheme**：自动跟随系统亮/暗色主题
- **语义化 HTML**：`<header>`、`<main>`、`<nav>`、`<aside>` 正确嵌套，导航改为 `<ul>/<li>` 列表结构

### 📊 SEO 优化
- **Open Graph** 完整 meta 标签（title/description/type/url/image/locale）
- **Twitter Cards**：`summary_large_image` 卡片类型
- **结构化数据**：JSON-LD `Course` schema（名称/描述/提供方/教育级别/语言）
- **Canonical + hreflang**：多语言页面正确指示
- **robots meta**：`index, follow` + `robots.txt` + `sitemap.xml`

### 🧪 自动化测试
- **零依赖测试框架**：`tests/test-runner.js` 使用 Node.js 原生 `assert` + ANSI 彩色输出
- **2 个测试文件、50+ 测试用例**：
  - `tests/server.test.js` — 静态文件服务、目录遍历防护、CTF flag 验证、速率限制、API 白名单、进度数据验证
  - `tests/utils.test.js` — HTML 转义、URL 验证、JSON 安全解析、字符串工具、进度数据合并、WCAG 对比度验证
- **运行方式**：`npm test` 或 `node tests/test-runner.js`

### 🛡️ 代码健壮性
- **进度数据防御**：`initProgress()` 使用 `Object.assign(defaultProgress(), server/local)` 合并，确保新增字段不丢失
- **数组类型检查**：`completedSections`/`ctfSolved`/`timeline` 强制 `Array.isArray()` 校验
- **Chart.js 防御**：`typeof Chart !== 'undefined'` 检查避免 CDN 加载失败时崩溃
- **CSS 浏览器兼容**：所有 `clip-path` 添加 `-webkit-clip-path` 前缀（12 处），`backdrop-filter` 添加 `-webkit-backdrop-filter`（3 处）

### 🌐 国际化
- 新增翻译键：`ctf.verifyError`、`a11y.skipToContent`、`sidebar.collapse/expand`、`checkpoint.*`、`ai.systemPrompt`、`typewriter.*` 等（中/英双语）

### 🎨 UI 改进
- **Hero 统计数据动态更新**：首页章节数/练习数/CTF 数/工具数从数据源自动计算
- **CTF 题目扩充**：新增 12 道挑战（ctf-017 ~ ctf-028），总数从 16 增至 28

---

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
