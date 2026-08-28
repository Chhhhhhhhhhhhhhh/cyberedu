## v2.7.0 — 2026-08-28

**文件**: `content.js`, `script.js`, `style.css`, `i18n.js`, `docs/content-roadmap.md`, `scripts/augment-section.js`(新), `scripts/verify-content-quality.js`(新), `.github/workflows/test.yml`, `package.json`

### 🎓 学习中心 52 章全部完成菜鸟教程式改造（本次大版本的核心）

在 v2.6.2 标杆章模板与 v2.6.3 双章试点的基础上，**其余 41 章全部按模板增强完毕**，7 个批次全部收官：

- **模板框架全覆盖**：每章标配"本章你将学会"目标框（开篇）+ 动手练习（3 道折叠答案）+ 章末小结表 + 下一章预告 + 相关练习/挑战跳转按钮
- **安全场景贯穿**：每章开头一段"开篇一句话"点明该知识在攻防中的位置；练习题与配套 CTF 挑战互相引用
- **中英双语同步**：增强框架 CN/EN 两版齐发
- **实现方式**：新增 `scripts/augment-section.js`——保留原有场景正文（避免丢弃既有优质内容），前后拼接模板框架，以"末次赋值覆盖"落位（规避 SECTION_CONTENT_EN 的重复赋值遮蔽问题）
- **已知待补**：4 章英文正文偏薄（malw-03/04、ctfg-05/06，原英文即短），框架已就位、正文扩充列入后续

### 🐛 顺带修复的隐藏 Bug
- **prog-01-02 中文版被旧内容遮蔽**：content.js 中存在两条 `SECTION_CONTENT["prog-01-02"]` 赋值（对象字面量新值 + 文件后部旧值赋值），运行时旧值胜出——v2.6.2 重写的中文版一直未真正上线（英文版正常）。已删除遮蔽赋值，中文新版生效

### 🧪 新增内容质量门禁（进 CI）
- `scripts/verify-content-quality.js`：执行 content.js 后校验**全部 52 章双语**（104 份内容）都携带模板标记——目标框、练习/小结，任何一章缺框架 CI 即红
- 当前门禁：**104/104 通过**

### 📊 全部验证
- `npm test` 95/95 ✅
- CTF 可解性 21/21 ✅
- 内容模板门禁 104/104 ✅
- `node --check` 三主文件 ✅
- 52 章 × 双语 = 104 份内容全部携带标准框架 ✅
# cyberedu 版本记录

## v2.6.1 — 2026-08-27

**文件**: `content.js`, `server.js`, `flags-hash.js`, `script.js`, `tests/*.js`, `scripts/migrate-ctf-v261.js`(新), `scripts/verify-ctf-solvable.js`(新), `README.md`, `README_zh.md`, `package.json`

### 🚩 CTF 内容大修：28 道题全部"真实可解"
修复 v2.3 内容改版遗留的答案表错位（当时题目按难度重排，但答案表仍是最早的类别分组版本，且约半数新题的答案从未录入）。此前约 20 道题即使真正解出、提交题面给出的 flag 也会被判错，另有 15+ 道题的答案数据根本不存在于任何地方（无文件、无密文、无模拟器），实际不可解。

- **真实密码学数据**：ctf-001/007/011 三道 RSA 题全部用真实生成的参数重建（此前密文为 TODO 0，无法解出）——001 使用含 24 位小因子的 144 位模数（sympy 瞬间分解）；007 使用仅相差 12364 的孪生素数（费马分解 1 次迭代命中）；011 提供三组真实 (nᵢ, cᵢ)，CRT + 立方根可完整恢复明文
- **真实可解码数据**：ctf-009 换掉著名的"套娃空串"Base64 链（原串解码到底不含 flag），改为真正的 6 层编码；ctf-017 原密文是伪维吉尼亚（实为凯撒移 5 的乱文本），重新以密钥 `cat` 加密含 flag 的完整明文；ctf-002 答案确认为题面 ROT13 解码所得 `flag{caesar_is_not_encryption}`
- **13 道取证/逆向/PWN 题补齐"题目文件"**：以 Code Editor 内嵌工具输出产物的形式提供真实感数据——strings 输出、objdump 反汇编、Wireshark Follow Stream、zsteg 结果、Volatility cmdline、auth.log、mactime 时间线、dnSpy 反编译 C#、jadx 反编译 Java、pwntools 会话记录等，flag 均可从产物中按题目教授的方法提取
- **2 个新服务端模拟终端**：ctf-019 文件上传绕过（扩展名黑名单试探：.php 被拒 → .pHp/.phtml/.phar 成功）、ctf-020 SSRF（file:// 协议走私、localhost/127.0.0.1/[::1]/0x7f000001 变体、内网 flag.txt 探测）——此前两题宣称有模拟终端但服务端从未实现
- **新答案表**：全部 28 题答案重新核定并重生成 `flags-hash.js`（`scripts/gen-flag-hashes.js` 流程）；五道服务端模拟题答案不变

### 🔗 修复课程内挑战跳转按钮（15 处全部失效）
课程章节中的 `openCTF(0)` 式调用传的是数字下标，而 API 期望字符串 id——所有"▶ 挑战：XXX"按钮从上线起就无法打开题目。现已全部改为主题化字符串 id（如 `openCTF('ctf-003')`），并根据按钮文案重新对准了语义正确的题目（流量分析→Pcap、内存取证→Memory Dump 等）。

### 📚 挑战列表按学习路径重排
28 道题从"随机穿插"改为**分类轨道 + 难度递增**排序：Crypto(6) → Web(7) → Misc(4) → Forensics(4) → Reverse(4) → PWN(3)，每条轨道内从 ★ 入门到 ★★★★ 进阶，符合循序渐进的学习曲线。

### 🧪 验证方式（全部自动化、全部通过）
- 新增 `scripts/verify-ctf-solvable.js`：像解题者一样从每道题自身内容**程序化解出全部 21 道非模拟题**（ROT13 解码、6 层 Base64、XOR-0xFF、维吉尼亚密钥破解、DNS 隧道标签重组、真实 RSA/费马/Håstad 解密、13 个产物 grep），逐一与哈希表对账 → 21/21
- 7 道模拟器题现场起服务实测：触发输入 → 模拟输出含 flag → `/api/ctf-verify` 通过 → 7/7
- 测试套件 95 项全绿（钉住向量更新为 ctf-001 新答案）

### 📝 诚实化
- README（中英）与仓库描述的双语宣传修正为实际情况：**UI 与题目双语、章节正文为中文**（此前宣称"全部章节完整英文翻译"与实现不符）
- 版本号升至 2.6.1

## v2.6.3 — 2026-08-28

**文件**: `content.js`, `script.js`, `style.css`, `i18n.js`, `docs/content-roadmap.md`(更新为详细执行计划), `scripts/replace-section.js`(新), `scripts/platform-meta-v263.js`(新), `package.json`

### 📚 批次 1 前两章重写（菜鸟教程式标杆模板铺开）
- **prog-01-01《变量与类型系统》**（中英双语重写）：变量=贴标签 → 字符串切片 → 整数与 "80"≠"80" 坑 → 布尔 → 列表 → 字典 → 综合实战"解析 IP:端口 目标地址"（split/切片/int 转换全用上）；13 个可运行片段 + 3 道折叠答案练习
- **prog-02《文件与网络编程》**（中英双语重写）：第 0 步先程序化生成练习日志 → 读文件 → 逐行分析 → with 自动关闭 → 写/追加报告 → try/except → 综合实战"SSH 爆破日志分析器"（字典计数 + 生成 report.txt，与第 25 题直接联动）；全部代码可独立运行（练习数据程序内自建）
- 两章均通过风格规范验收（≥12KB、例题 ≥6、练习 ≥3、callout ≥2、小结表、双语同步）

### 🧭 结构层改造（本批完成）
- **文章页元信息条**：阅读时长旁新增难度星级（★☆，取章节 difficulty 字段）与"建议先完成：上一章"提示（首章自动隐藏）；新增 i18n 键 `section.prereq`（中英）
- 新增 `scripts/replace-section.js` 通用章节替换工具（双语言 map、转义感知），后续所有批次复用
- `docs/content-roadmap.md` 升级为**详细执行计划**：三层框架（写法/结构/机制）、批次 1 逐章改造要点表、验收清单、进度勾选

### 📊 进度
- 批次 1（编程基础 11 章）：3/11 完成（含标杆章），其余 8 章按计划表推进

## v2.6.2 — 2026-08-28

**文件**: `content.js`, `script.js`, `docs/content-roadmap.md`(新), `scripts/hub-structure-v262.js`(新), `README.md`, `README_zh.md`, `package.json`

### 📚 学习中心改造启动（针对"太专业/不丰富/不够循序渐进"的反馈）
- **模块顺序修正**：网络提到密码学之前（编程 → 网络 → 密码学 → Web → 渗透 → 恶意软件 → CTF）——消除"密码学模块先讲 TLS、网络模块后讲 HTTP"的依赖倒置，并与首页推荐学习路径统一
- **侧边栏章节编号**：学习中心侧边栏每章显示 01. 02. … 序号，进度感可视化
- **标杆章重写**：`prog-01-02 控制流与函数` 按菜鸟教程式风格重写——"第 N 步"小步结构、每个概念最小可运行例子+运行结果+逐行拆解、安全场景串联（弱密码检测器贯穿全章）、常见坑速查表、3 道折叠答案练习、章末小结表
- **新增 `docs/content-roadmap.md`**：10 条章节风格规范 + 7 批改造计划与验收清单，后续按批推进
- README 模块顺序同步；版本号 2.6.2
- 标杆章提供中英双语两个版本（SECTION_CONTENT_EN 同步更新）

## v2.6.1 — 2026-08-28

**文件**: `content.js`, `server.js`, `flags-hash.js`, `script.js`, `tests/*.js`, `scripts/gen-flag-hashes.js`, `scripts/migrate-ctf-v261.js`(新), `scripts/verify-ctf-solvable.js`(新), `SECURITY.md`, `README.md`, `README_zh.md`, `package.json`

### 🚩 CTF 内容大修：28 道题全部"真实可解"
修复 v2.3 内容改版遗留的答案表错位——此前约 20 道题真正解出后提交也会被判错，且 15+ 道题的答案数据根本不存在。要点：
- 三道 RSA 题以真实参数重建（小因子 144 位模数 / 费马分解 1 次迭代 / Håstad 三模数 CRT）
- 009 换掉解码为空的套娃串、017 重新用密钥 `cat` 加密真明文、002 答案确认为 ROT13 推导值
- 13 道取证/逆向/PWN 题补齐 Code Editor 内嵌工具产物（strings/objdump/zsteg/Volatility/auth.log/mactime/dnSpy/jadx/pwntools 会话）
- 新增上传绕过与 SSRF 两个服务端模拟终端
- 全部 28 题答案重新核定并重生成 `flags-hash.js`
- 修复 15 处课程内 `openCTF(数字)` 死按钮（API 需要字符串 id），按语义重新对准题目
- 挑战列表按分类轨道 + 难度递增重排
- 新增 `scripts/verify-ctf-solvable.js` 程序化解出全部 21 道非模拟题并与哈希对账（已进 CI 门禁）

## v2.6 — 2026-08-27

**文件**: `server.js`, `script.js`, `cyberedu.html`, `flags-hash.js`(新), `tests/*.js`, `scripts/gen-flag-hashes.js`(新), `SECURITY.md`(新), `.mailmap`(新), `.github/workflows/test.yml`(新), `restart_server.bat`, `package.json`, `README.md`, `README_zh.md`

### 🔒 安全修复（高危）
- **回环监听**：server.listen 绑定 127.0.0.1（原为 0.0.0.0 全网卡）——/api/run 的无沙箱代码执行不再能被局域网访问；可用 CYBEREDU_HOST 显式覆盖
- **DNS 重绑定防护**：Host 头白名单（localhost / 127.0.0.1 / [::1]），陌生主机名直接 403
- **移除全部 CORS 授权**：删除 Access-Control-Allow-Origin:\*，恶意网页无法再以受害者浏览器身份跨站调用本服务任何接口
- **静态文件黑名单**：server.js、.git/\*、.github/\*、tests/、scripts/、versions/、progress.json、package.json、restart_server.bat 等不再通过 HTTP 提供（解码前后双重校验 + 目录穿越二次加固）
- **CTF 答案全量哈希化**：
  - 新增 flags-hash.js —— 仅存 28 道题答案的 SHA-256 摘要，仓库任何位置不再有明文答案主表
  - 服务端 /api/ctf-verify 与前端 submitFlag() 均改为摘要比对（规范化规则统一：去空白 + 小写）
  - 修复 v2.5 引入的前端致命 Bug：content.js 的 flag 字段已迁移删除但 submitFlag 仍读取 c.flag，导致提交必然抛 TypeError——**Flag 提交功能自 v2.5 起完全不可用**，现已恢复且支持离线校验
  - 版本历史归档（含明文答案的 v1.0/v2.0 快照）已从仓库移除；scripts/remove-client-flags.js 完成使命随之退役，由 scripts/gen-flag-hashes.js 取代（stdin 收集明文、只落盘摘要）
  - 五道模拟器挑战的通关奖励 flag 保持可在模拟中获取——其本质即完成该技术动作的奖励，属教学设计而非泄露；威胁模型详见 SECURITY.md
- **请求体积上限**：readJsonBody 统一实现——代理 256KB / 执行 256KB / 模拟终端 64KB / 校验 16KB / 进度 100KB，超限 413 并断开
- **进度数据再序列化存储**：POST /api/progress 解析校验后重新 JSON.stringify 落盘，不再原样写入未净化的请求体

### ⚡ 性能与健壮性
- gzip 结果缓存（FIFO 上限 24）：3.6MB content.js 不再每次请求重复压缩，命中后即取即发
- 静态服务改 async stat→read 两段式，消除读取回调中的 statSync TOCTOU 与额外系统调用
- 限流器清理逻辑从"恰好触发"改为 setInterval 无条件周期清扫（unref 不阻退出），过期 IP 条目不再滞留内存
- API 路由匹配基于去除查询串后的路径，带参调用不再落空
- MIME 补齐 .txt/.xml/.md；可压缩类型同步扩展；响应统一附加 Vary: Accept-Encoding

### 🧾 安全头与策略
- 下发 Content-Security-Policy（HTTP 头 + HTML meta 双通道，GitHub Pages 同享）：default-src 'self'，禁 unsafe-eval / 插件 / 跨源连接 / 嵌套 frame；script-src 因应用的零构建内联事件架构（全站约 830 个 onclick/onkeydown 属性）放行 unsafe-inline。发布首日曾出现"全部按钮无响应"事故，根因有二：① 首发策略漏配 unsafe-inline；② 修复时又与 JSON-LD 摘要哈希并存——按 CSP2+ 规范哈希源会令浏览器忽略 unsafe-inline。已移除该哈希（JSON-LD 为非执行数据块，无需脚本源白名单），并以回归测试钉住"禁止哈希源与 unsafe-inline 并存"
- 移除已废弃的 X-XSS-Protection；其余安全头经统一的 securityHeaders() 出口注入所有响应

### 🧪 测试与工程化
- 测试扩至 **95 项**并全部通过：新增静态黑名单覆盖（含 URL 编码绕过）、Host 白名单、body 上限边界、限流清扫、SHA-256 摘要契约钉住向量、flags-hash.js 无明文审计、CSP meta 断言、已删文件不复活检查
- 新增 GitHub Actions 工作流：push/PR 时在 Node 18/20/22 运行 npm test 与五个入口文件语法检查
- SECURITY.md 安全策略（威胁模型 + 私密漏洞报告通道）
- .mailmap 统一三种历史作者身份
- Issue 模板重命名为 feedback.yml（避免非 ASCII 文件名的工具链兼容问题）
- restart_server.bat 便携化：%~dp0 定位 + 系统 node，不再硬编码个人机器路径
- package.json 升至 2.6.0，声明 engines: node>=16

### ♻️ 清理
- 删除 versions/cyberedu_v1.0.html、cyberedu_v2.0.html、script_v2.0.js、style_v2.0.css（明文答案残留的死快照）
- 删除 scripts/remove-client-flags.js（一次性迁移已完成）

## v2.5 — 2026-06-23
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
