<p align="center">
  <img src="docs/og-image.png" alt="CyberEdu Banner" width="100%">
</p>

<h1 align="center">CyberEdu — 网络安全原子微课与交互速查手册体系</h1>

<p align="center">
  全栈交互式网络安全学习平台 · 从零基础到高阶攻防实战 · 纯客户端运行/轻量服务器代理 · 工业级质量门禁<br>
  <strong>9 大核心体系 · 50 个专业章节 · 171 个原子微课 · 342 篇双语教材 · 342 组交互自测 · 28 道 CTF 靶场 · 6 大实战工具 · AI 智能导师</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-v2.8.0-00ff41?style=flat-square" alt="版本">
  <img src="https://img.shields.io/badge/核心方向-9大体系-00e5ff?style=flat-square" alt="核心方向">
  <img src="https://img.shields.io/badge/原子微课-171讲-00ff41?style=flat-square" alt="原子微课">
  <img src="https://img.shields.io/badge/双语对齐-100%25_中英-00e5ff?style=flat-square" alt="双语对齐">
  <img src="https://img.shields.io/badge/单元测试-114项通过-00ff41?style=flat-square" alt="单元测试">
  <img src="https://img.shields.io/badge/许可证-MIT-00e5ff?style=flat-square" alt="许可证">
  <img src="https://img.shields.io/github/stars/Chhhhhhhhhhhhhhh/cyberedu?style=social" alt="Stars">
</p>

<p align="center">
  <a href="https://chhhhhhhhhhhhhhh.github.io/cyberedu/">🚀 在线体验</a>
  &nbsp;·&nbsp;
  <a href="README.md">English Documentation</a>
  &nbsp;·&nbsp;
  <a href="versions/CHANGELOG.md">更新日志</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Chhhhhhhhhhhhhhh/cyberedu/issues/new/choose">反馈问题</a>
</p>

---

## ✨ 核心功能特色

<p align="center">
  <img src="docs/features-showcase.png" alt="功能展示" width="100%">
</p>

| 核心维度 | 功能详情与实现规格 |
|---|---|
| 📚 **原子微课与交互速查手册** | 覆盖 9 大安全方向的 171 节模块化微课，每课标配“本章你将学会”导读卡片、阶梯实战步骤、折叠思考题与高密度章末速查字典 |
| 🌐 **100% 工业级双语全量对齐** | 342 篇中英双语教材（171 篇深度中文 + 171 篇专业英文），支持顶部导航栏一键平滑切换，沉浸式专业术语悬停提示 |
| 🎯 **342 组微课随堂 Checkpoint** | 每节微课标配 2 道单选自测题，提交即刻判定并展示底层原理解析，集成“🤖 呼叫 AI 导师”一键针对错题深度辅导 |
| 🛠️ **6 大交互安全武器库与沙箱** | 内置 SQL 注入攻防沙箱（动态拼接 vs 参数化对比）、XSS 实体转义过滤演练场、命令注入管道隔离分析仪、密码学哈希雪崩效应分析仪、五维技能雷达图评测与实验抽屉 |
| 🚩 **28 道实战 CTF 竞技场** | 覆盖 Web、PWN、逆向、密码学、取证与 Misc，真实数学推导与靶机利用，SHA-256 安全哈希校验，仓库零明文 Flag 泄露 |
| 🎮 **黑客段位与成长激励体系** | 5 阶段位晋升体系（LV.1 脚本小子 → LV.5 赛博主宰），多维 EXP 经验计算、连续签到/答题加成、成就勋章解锁与通关动效 |
| 🤖 **AI 智能导师与编程副驾驶** | 原生 SSE 流式输出，支持接入 DeepSeek、OpenAI、通义千问、Claude、Ollama 本地大模型，具备全面板会话抽屉与代码语法高亮 |
| 💻 **浏览器原生代码运行与实战** | 内置 CodeMirror 5 编辑器，支持 Python / JS / C / Bash 代码高亮与编辑，配套 10 道编程练习自动校验 |
| 📱 **PWA 渐进式离线应用** | 内置 `manifest.json` 与 Service Worker 智能缓存，无网环境离线可学，新粗野主义赛博终端界面，WCAG AA 级对比度无障碍合规 |
| 🔍 **全局效率与学习工具链** | Ctrl+K 全局极速搜索、前置章节关联提示、难度星级标识、学习进度本地持久化与 JSON 备份导出/恢复 |

---

## 📚 九大核心模块全景矩阵

| 序号 | 体系方向 | 模块 ID | 章节数 | 微课数 | 核心知识矩阵与实战靶向 |
|:---:|:---|:---:|:---:|:---:|:---|
| 1 | **Web 安全** | `websec` | 10 章 | 39 讲 | SQLi 注入、XSS 跨站、CSRF/SSRF、XXE 实体、文件上传、认证会话、RCE 反序列化、API 接口安全、DevSecOps 与 WAF 防御 |
| 2 | **渗透测试** | `pentest` | 5 章 | 15 讲 | 信息收集与 OSINT 侦察、端口服务指纹扫描、漏洞挖掘评估、权限提升技术、后渗透维持与横向移动 |
| 3 | **计算机网络** | `network` | 5 章 | 15 讲 | OSI 与 TCP/IP 协议栈、DNS/ARP 欺骗防御、HTTP/1.1 至 HTTP/3 演进、路由防火墙架构、Wireshark 流量取证 |
| 4 | **密码学与现代应用** | `cryptography` | 6 章 | 18 讲 | 古典密码与数论基石、AES/DES 对称加密、RSA/ECC 非对称密码、哈希与数字签名、TLS/SSL 握手与 PKI、零知识证明与后量子密码 |
| 5 | **恶意软件分析与逆向** | `malware` | 5 章 | 15 讲 | 静态分析与 PE 文件解构、动态分析与沙箱行为、IDA/Ghidra 反编译实战、反调试与花指令对抗、威胁情报与 ATT&CK 映射 |
| 6 | **云原生与容器安全** | `cloudsec` | 5 章 | 15 讲 | Docker 容器逃逸防御、Kubernetes 集群加固、云 IAM 与元数据攻击防御、微服务与 Service Mesh、CI/CD 流水线与供应链安全 |
| 7 | **蓝队监控与应急取证** | `dfir` | 5 章 | 15 讲 | SOC 运营中心与 SIEM 分析、Windows/Linux 痕迹取证、Volatility 内存取证分析、威胁狩猎与 Sigma 规则、应急响应 SOP 与勒索处置 |
| 8 | **编程基础** | `programming` | 7 章 | 18 讲 | Python 安全脚本编写、C 语言与内存布局、Bash 运维与正则提取、Go 语言高并发工具、Wasm/JS 安全、x86/x64 汇编基础、内存安全编码规范 |
| 9 | **CTF 实战攻防** | `ctf-guide` | 7 章 | 21 讲 | 赛事体系与武器库、PWN 栈帧与 ROP 链构造、逆向反反编译、Web 高级利用链、Crypto 密码破译、Misc 多媒体流量取证、AWD 攻防对抗体系 |
| **Σ** | **9 大核心安全方向** | **全平台** | **50 章** | **171 讲** | **342 篇双语微课 · 342 组随堂自测 · 28 道 CTF 靶场 · 6 大交互沙箱** |

---

## 🏗️ 项目架构与目录索引

```
cyberedu/
├── cyberedu.html          # 前端核心单页入口（Neo-Brutalist 赛博终端架构）
├── content.js             # 171 讲原子微课正文 (中文) + 342 组 Checkpoint 评测 + CTF 靶场配置
├── script.js              # 核心交互引擎（视图路由、段位经验计算、沙箱互动、AI 对话）
├── style.css              # 赛博朋克终端主题样式（WCAG AA 级高对比度）
├── i18n.js                # 中英双语国际化字典（250+ 翻译对）
├── manifest.json          # PWA 渐进式 Web 应用清单
├── sw.js                  # Service Worker 离线网络拦截与资源缓存
├── server.js              # 零依赖本地 Node.js 服务器（仅绑定 127.0.0.1，AI 请求转发与 CTF 校验）
├── flags-hash.js          # CTF 靶场 Flag 的 SHA-256 安全摘要映射（无明文泄露）
├── package.json           # 项目配置、运行脚本与元数据
├── favicon.svg            # 站点矢量图标
├── tests/                 # 零外部依赖测试套件（114 项严苛断言）
│   ├── test-runner.js     # ANSI 彩色轻量测试运行器
│   ├── server.test.js     # 本地服务器安全、Host 校验、路径穿越与流控测试
│   └── utils.test.js      # 工具函数、游戏化段位、攻防沙箱与颜色对比度测试
├── scripts/               # 自动化质量门禁与工程维护工具链
│   ├── verify-content-quality.js # 342/342 篇微课模板合规性自动化校验门禁
│   ├── verify-ctf-solvable.js    # 21 道 CTF 题目数学与算法可解性验证
│   ├── privacy-scan.js           # 零泄漏隐私与敏感标识符扫描门禁
│   ├── gen-flag-hashes.js        # CTF 答案哈希自动轮转脚本
│   └── compact-content.js        # 课程数据结构内存压实工具
├── docs/                  # 文档与设计资产
│   ├── og-image.png
│   ├── features-showcase.png
│   └── content-roadmap.md
├── versions/              # 详细历史版本更新日志
│   └── CHANGELOG.md
└── .github/               # CI 持续集成工作流
    └── workflows/test.yml # 多版本 Node.js 自动化测试工作流
```

---

## 🧪 工业级质量保障门禁

平台内建了严谨的质量自动化门禁，确保每次提交与部署均满足工业级可靠性标准：

```bash
# 1. 运行核心回归测试套件（114 项单元测试）
npm test

# 2. 验证 CTF 挑战的数学与逻辑可解性（21/21 验证通过）
node scripts/verify-ctf-solvable.js

# 3. 验证 342 篇双语微课的模板完备性（342/342 全部达标）
node scripts/verify-content-quality.js

# 4. 执行全仓库个人与设备隐私扫描（0 泄露安全通过）
node scripts/privacy-scan.js

# 5. 执行核心 JavaScript 脚本静态语法检查
node --check server.js && node --check script.js && node --check content.js && node --check i18n.js && node --check flags-hash.js
```

---

## 🚀 快速上手

### 方式一：纯静态运行（开箱即用，无需服务器）

直接在浏览器中双击打开 `cyberedu.html`。所有 171 节原子微课、交互式 Checkpoint 自测、代码语法高亮、沙箱演练场与搜索功能均完全运行在浏览器客户端，无需连接外网。

### 方式二：本地服务运行（启用 AI 智能导师与 PWA）

需要安装 [Node.js](https://nodejs.org/) v16+：

```bash
node server.js
# 启动后浏览器访问 http://127.0.0.1:8000
```

> **安全内生设计**：本地服务默认**严格仅绑定 `127.0.0.1`**（绝不暴露给局域网其他设备），并严格校验 HTTP `Host` 请求头以杜绝 DNS 重绑定攻击，不开放跨域（CORS），安全可控。

配置 AI 智能导师：点击右下角绿色终端悬浮按钮打开 AI 聊天面板，点击 ⚙ 齿轮图标即可填入您的 API Key：

| 配置项 | 示例值 | 说明 |
|---|---|---|
| **API 类型** | `OpenAI 兼容` 或 `Anthropic` | 支持几乎所有主流大模型协议 |
| **API Base URL** | `https://api.deepseek.com` | 接口服务根地址 |
| **API Key** | `sk-...` | 仅保存在浏览器本地 `localStorage`，不上传服务器 |
| **模型名称** | `deepseek-chat`、`gpt-4o`、`qwen-plus`、`claude-3-5-sonnet` | 自定义调用的具体大模型 |

---

## 🤖 支持的大模型服务商

| 服务商 | API Base URL | 推荐模型 |
|---|---|---|
| **DeepSeek (深度求索)** | `https://api.deepseek.com` | `deepseek-chat`, `deepseek-reasoner` |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| **通义千问 (阿里云)** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus`, `qwen-max` |
| **Anthropic Claude** | `https://api.anthropic.com` | `claude-3-5-sonnet-20241022` |
| **Ollama (本地离线私有化)** | `http://localhost:11434/v1` | `llama3.1`, `qwen2.5-coder` |
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |

---

## 🛠️ 技术栈清单

| 层次 | 技术选型 | 特性与设计理念 |
|---|---|---|
| **前端展现** | HTML5 / CSS3 / 原生 JavaScript | 客户端零外部 npm 依赖，极致轻量，秒级加载 |
| **视觉风格** | 赛博朋克新粗野主义 (Neo-Brutalism) | 绿/青/黑终端美学，WCAG AA 级高对比度护眼无障碍 |
| **代码高亮** | [Prism.js](https://prismjs.com/) v1.29.0 | 定制终端配色，支持 Python, C, Bash, JS 等语言 |
| **代码编辑** | [CodeMirror 5](https://codemirror.net/) | 原生嵌入式代码编辑器，支持编程题校验与快捷键 |
| **AI 流式传输** | Server-Sent Events (SSE) | 原生打字机流式输出，支持中止生成与消息重试 |
| **Flag 防作弊** | Web Crypto SHA-256 | 靶场 Flag 哈希不可逆校验，彻底隔绝明文泄露 |
| **离线应用** | Service Worker + Web App Manifest | 支持 PWA 安装至桌面与手机主屏幕，离线断网随心学 |
| **本地服务** | Node.js 原生 `http` 模块 | 零依赖纯原生实现，DNS 重绑定防护，严格回环绑定 |

---

## 📄 开源许可证

本项目遵循 [MIT 开源许可证](LICENSE) — 允许自由用于个人学习、学术交流与商业探索。

<p align="center">
  <strong>Break the Surface, find the Truth. Every vulnerability has a story.</strong><br>
  如果 CyberEdu 对您的网络安全学习之路有所启发，欢迎为本仓库点亮一颗 ⭐ Star 支持！
</p>
