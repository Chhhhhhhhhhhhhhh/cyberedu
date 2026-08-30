<p align="center">
  <img src="docs/og-image.png" alt="CyberEdu Banner" width="100%">
</p>

<h1 align="center">CyberEdu — 网络安全学习平台</h1>

<p align="center">
  一个交互式网络安全学习网站，从零基础到高级渗透，全面覆盖。<br>
  <strong>52 个章节 · 28 道 CTF 挑战 · 中英双语 · AI 导师</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-v2.7.6-00ff41?style=flat-square" alt="版本">
  <img src="https://img.shields.io/badge/许可证-MIT-00e5ff?style=flat-square" alt="许可证">
  <img src="https://img.shields.io/github/last-commit/Chhhhhhhhhhhhhhh/cyberedu?style=flat-square&color=00ff41&label=最近更新" alt="最近更新">
  <img src="https://img.shields.io/github/repo-size/Chhhhhhhhhhhhhhh/cyberedu?style=flat-square&color=00e5ff&label=仓库大小" alt="仓库大小">
  <img src="https://img.shields.io/github/languages/top/Chhhhhhhhhhhhhhh/cyberedu?style=flat-square&color=00ff41" alt="主要语言">
  <img src="https://img.shields.io/github/stars/Chhhhhhhhhhhhhhh/cyberedu?style=social" alt="Stars">
</p>

<p align="center">
  <a href="https://chhhhhhhhhhhhhhh.github.io/cyberedu/">🚀 在线体验</a>
  &nbsp;·&nbsp;
  <a href="README.md">English</a>
  &nbsp;·&nbsp;
  <a href="versions/CHANGELOG.md">更新日志</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Chhhhhhhhhhhhhhh/cyberedu/issues/new/choose">反馈问题</a>
</p>

---

## ✨ 功能特色

<p align="center">
  <img src="docs/features-showcase.png" alt="功能展示" width="100%">
</p>

| 分类 | 详情 |
|------|------|
| 📚 **内容体系** | 7 大模块 · 52 个章节 · 4 级难度（零基础 → 高级） |
| 🌐 **中英双语** | 全部章节完整英文翻译 · UI 一键切换 |
| 🤖 **AI 导师** | 内置聊天助手 · SSE 流式输出 · 支持 DeepSeek/OpenAI/通义/Claude/Ollama |
| 💻 **代码编辑器** | CodeMirror 5 · Python / JS / C / Bash 语法高亮 |
| 🚩 **CTF 竞技场** | 28 道挑战 · 密码学、Web、Misc、逆向、取证、PWN |
| ⌨️ **编程练习** | 10 道编程题 · 期望输出自动验证 |
| 🔍 **全局搜索** | Ctrl+K 快速搜索 · 分词模糊匹配 |
| 📱 **响应式设计** | 完整移动端支持 · 侧边栏覆盖 · 紧凑导航 |
| 🌙 **主题切换** | 深色/浅色模式 · 状态持久保存 |
| 📊 **进度追踪** | 自动记录学习进度 · JSON 导出/导入备份 |

### 📚 7 大核心模块

```
编程基础 · 网络 · 密码学 · Web 安全 · 渗透测试 · 恶意软件分析 · CTF 实战
```

## 🏗️ 项目结构

```
cyberedu/
├── cyberedu.html          # 主页面（入口）
├── content.js             # 内容数据（中英双语：模块/章节/练习/CTF）
├── script.js              # 交互逻辑
├── style.css              # 样式表（新粗野主义终端风格）
├── i18n.js                # 中英文切换系统（~140 翻译键值对）
├── server.js              # 本地 Node.js 服务器（仅绑定 127.0.0.1：AI 代理 / CTF 校验 / 限流）
├── flags-hash.js          # CTF 答案 SHA-256 摘要 —— 仓库中不含明文答案
├── favicon.svg            # 站点图标
├── tests/                 # 零依赖测试套件（95 项检查）
├── scripts/               # 维护工具（gen-flag-hashes.js 轮转答案摘要）
├── docs/                  # 文档资源（截图、OG 图片）
├── versions/              # CHANGELOG
├── .github/               # Issue 模板 + CI 工作流
├── SECURITY.md            # 安全策略与漏洞报告通道
└── CONTRIBUTING.md        # 贡献指南
```

## 🚀 使用方式

### 方式一：纯静态浏览（无需服务器）

直接在浏览器中打开 `cyberedu.html` 即可。代码高亮、主题切换、进度管理、搜索等功能正常使用。

### 方式二：本地服务器（启用 AI 导师 + 代码执行）

需要 [Node.js](https://nodejs.org/) v16+：

```bash
node server.js
# 然后浏览器访问 http://localhost:8000
```

服务器默认**只绑定 `127.0.0.1`**（绝不暴露局域网），并对 `Host` 头做白名单校验以防 DNS 重绑定；全站不发放任何 CORS 授权——你浏览器里打开的其他网页无法驱动本服务的任何接口。可用环境变量覆盖：`CYBEREDU_PORT` / `CYBEREDU_HOST` / `CYBEREDU_NO_OPEN=1`。

点击右下角绿色悬浮按钮打开 AI 聊天面板，点击 ⚙ 配置：

| 字段 | 示例 |
|------|------|
| API 类型 | `OpenAI 兼容` 或 `Anthropic` |
| API Base URL | `https://api.deepseek.com` |
| API Key | `sk-...` |
| 模型 | `deepseek-chat`、`deepseek-reasoner`、`claude-sonnet-4-20250514` |

可选：调整温度、最大 Token 数、是否启用思考/推理模式。

> 💡 Windows 用户可双击 `restart_server.bat` 快速重启服务器。

## 🤖 支持的 AI 模型

| 提供商 | API Base URL | 模型示例 |
|--------|-------------|---------|
| **OpenAI 兼容** |||
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat`, `deepseek-reasoner` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus`, `qwen-max` |
| Ollama（本地） | `http://localhost:11434` | `llama3`, `qwen2` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b` |
| **Anthropic** |||
| Claude | `https://api.anthropic.com` | `claude-sonnet-4-20250514`, `claude-haiku-3-5` |

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 / CSS3 / 原生 JavaScript（客户端零依赖） |
| 代码高亮 | [Prism.js](https://prismjs.com/) v1.29.0 |
| 代码编辑器 | [CodeMirror 5](https://codemirror.net/)（Python/JS/C/Bash） |
| 本地服务器 | Node.js 内置 `http` 模块（零依赖） |
| 答案校验 | 仅存 SHA-256 摘要（`flags-hash.js`）——仓库不含明文答案 |
| AI 流式输出 | SSE（Server-Sent Events） |
| 字体 | JetBrains Mono + Noto Sans SC + Space Mono |

## 📋 更新日志

### v2.7.6（2026-08-30）

- 📚 **52 章全部完成渐进式入门模板改造** — 每章标配"本章你将学会"目标框 + 分步例子 + 3 道折叠答案练习 + 章末小结表（中英双语）
- 🗂 **模块顺序修正** — 编程 → 网络 → 密码学 → Web → 渗透 → 恶意软件 → CTF（消除 TLS 先于 HTTP 的依赖倒置）
- 🔢 **侧边栏章节编号** — 每章显示 01. 02. 03. … 进度感可视化
- 🚩 **28 道 CTF 全部真实可解** — 真实 RSA 参数、可解码密文、内嵌取证产物、2 个新服务端模拟器；每道答案均可从题目本身推导
- 🗂 **CTF 竞技场分类轨道** — 按类别分轨 + 难度递增排列
- 🔗 **修复 15 个死跳转按钮** — 课程内挑战跳转传数字下标而 API 要字符串 id
- 🗂 **AI 历史改为全面板抽屉** — 搜索、时间分组、重命名、两段式删除、清空全部
- 🤖 **AI 导师体验升级** — ■ 停止生成、消息操作条（复制/重新生成）、代码块复制 + Prism 高亮、智能滚动
- 📊 **文章元信息条** — 每章显示难度星级 + 前置章节提示
- 🔒 **安全加固** — 回环监听、DNS 重绑定防护、CORS 移除、静态文件黑名单、CSP、答案 SHA-256 哈希化、隐私扫描 CI 门禁
- 🐛 修复：submitFlag 崩溃（v2.5 回归）、28 题答案错位、CSP void 内联、content.js 死赋值（5.96MB → 2.83MB 压实）

<details><summary>v2.6（2026-08-27）</summary>

- 🔒 **服务器仅回环监听** · 🛡️ **DNS 重绑定防护** · 🚫 **移除 CORS** · 🔑 **答案哈希化** · 📦 **静态文件黑名单** · ⚡ **gzip 缓存 / 异步 stat / 限流器清扫** · 🧾 **CSP 双通道** · ♻️ 便携 bat、CI 工作流

</details>

> 📋 [查看完整版本历史 →](versions/CHANGELOG.md)

## 🤝 参与贡献

欢迎贡献代码！提交 PR 前请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 💬 反馈建议

发现 Bug 或有改进建议？[提交 Issue →](https://github.com/Chhhhhhhhhhhhhhh/cyberedu/issues/new/choose)

## 📄 许可证

[MIT](LICENSE) — 个人和商业使用免费。

---

<p align="center">
  <strong>如果 CyberEdu 对你有帮助，请给个 ⭐ 支持一下！</strong>
</p>
