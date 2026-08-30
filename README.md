<p align="center">
  <img src="docs/og-image.png" alt="CyberEdu Banner" width="100%">
</p>

<h1 align="center">CyberEdu — Cybersecurity Learning Platform</h1>

<p align="center">
  An interactive cybersecurity learning website — from absolute beginner to advanced practitioner.<br>
  <strong>52 chapters · 28 CTF challenges · Bilingual EN/ZH · AI Tutor</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v2.7.6-00ff41?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-00e5ff?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/last-commit/Chhhhhhhhhhhhhhh/cyberedu?style=flat-square&color=00ff41" alt="Last Commit">
  <img src="https://img.shields.io/github/repo-size/Chhhhhhhhhhhhhhh/cyberedu?style=flat-square&color=00e5ff" alt="Repo Size">
  <img src="https://img.shields.io/github/languages/top/Chhhhhhhhhhhhhhh/cyberedu?style=flat-square&color=00ff41" alt="Top Language">
  <img src="https://img.shields.io/github/stars/Chhhhhhhhhhhhhhh/cyberedu?style=social" alt="Stars">
</p>

<p align="center">
  <a href="https://chhhhhhhhhhhhhhh.github.io/cyberedu/">🚀 Live Demo</a>
  &nbsp;·&nbsp;
  <a href="README_zh.md">中文</a>
  &nbsp;·&nbsp;
  <a href="versions/CHANGELOG.md">Changelog</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Chhhhhhhhhhhhhhh/cyberedu/issues/new/choose">Report Bug</a>
</p>

---



| Category | Details |
|----------|---------|
| 📚 **Content** | 52 chapters across 7 modules · 4 difficulty tiers (Beginner → Expert) |
| 🌐 **Bilingual** | Full EN/ZH translation · one-click UI language switch |
| 🤖 **AI Tutor** | Built-in chat assistant · streaming SSE · supports DeepSeek, OpenAI, Qwen, Claude, Ollama |
| 💻 **Code Editor** | CodeMirror 5 · Python / JS / C / Bash syntax highlighting |
| 🚩 **CTF Arena** | 28 challenges · Crypto, Web, Misc, Reverse, Forensics, PWN |
| ⌨️ **Practice** | 10 coding challenges with expected output validation |
| 🔍 **Search** | Ctrl+K global search · token-based fuzzy matching |
| 📱 **Responsive** | Full mobile support · sidebar overlay · compact navigation |
| 🌙 **Themes** | Dark / Light mode · persisted to localStorage |
| 📊 **Progress** | Auto-tracked learning progress · JSON export/import backup |

### 📚 7 Core Modules

```
Programming · Networking · Cryptography · Web Security · Pentesting · Malware Analysis · CTF
```

## 🏗️ Project Structure

```
cyberedu/
├── cyberedu.html          # Main page (entry point)
├── content.js             # Content data (bilingual: modules/chapters/exercises/CTF)
├── script.js              # Application logic (navigation, views, sidebar, AI chat, effects)
├── style.css              # Stylesheet (Neo-Brutalist Terminal design, WCAG AA compliant)
├── i18n.js                # EN/ZH localization (~140+ translation pairs)
├── server.js              # Local Node.js server (loopback-only: AI proxy, CTF verify, rate limiter)
├── flags-hash.js          # CTF answer SHA-256 digests — no plaintext answers shipped
├── package.json           # Scripts: npm start, npm test
├── favicon.svg            # Site icon
├── tests/                 # Zero-dependency test suite (95 checks)
│   ├── test-runner.js     # Custom test runner (Node.js assert + ANSI colors)
│   ├── server.test.js     # Server security & API tests
│   └── utils.test.js      # Client utility, WCAG contrast & hash contract tests
├── scripts/               # Maintenance tooling
│   └── gen-flag-hashes.js # Rotate CTF answer digests without committing plaintext
├── docs/                  # Documentation assets (screenshots, OG images)
├── versions/              # CHANGELOG
├── .github/               # Issue templates + CI workflow
├── SECURITY.md            # Security policy & vulnerability reporting
└── CONTRIBUTING.md        # Contribution guidelines
```

## 🚀 Getting Started

### Quick Start (no server needed)

Just open `cyberedu.html` directly in your browser. Code highlighting, theme switching, progress tracking, and search — all work without a server.

### With AI Tutor (local server)

Requires [Node.js](https://nodejs.org/) v16+:

```bash
node server.js
# Then open http://localhost:8000
```

The server binds to `127.0.0.1` only (never your LAN), validates the `Host` header against DNS rebinding, and grants no CORS privileges — a page you visit in another tab cannot drive its APIs. Set `CYBEREDU_PORT` / `CYBEREDU_HOST` / `CYBEREDU_NO_OPEN=1` as environment overrides.

Click the green floating button (bottom-right) to open the AI chat panel. Click ⚙ to configure:

| Field | Example |
|-------|---------|
| API Type | `OpenAI Compatible` or `Anthropic` |
| API Base URL | `https://api.deepseek.com` |
| API Key | `sk-...` |
| Model | `deepseek-chat`, `deepseek-reasoner`, `claude-sonnet-4-20250514` |

Optional: adjust temperature, max tokens, and thinking/reasoning mode.

> 💡 On Windows, double-click `restart_server.bat` to restart the server.

### Run Tests

```bash
npm test
# or: node tests/test-runner.js
```

Zero-dependency test suite — no `npm install` needed. 95 checks cover server security (static block-list, host validation, body caps, directory traversal, rate limiting with stale-entry eviction, CTF digest verification), client utilities (HTML escaping, URL validation, progress data), the shared answer-normalization contract, and WCAG AA contrast compliance.

## 🤖 Supported AI Models

| Provider | API Base URL | Model Examples |
|----------|-------------|--------|
| **OpenAI Compatible** |||
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat`, `deepseek-reasoner` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| Qwen (Tongyi) | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus`, `qwen-max` |
| Ollama (local) | `http://localhost:11434` | `llama3`, `qwen2` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b` |
| **Anthropic** |||
| Claude | `https://api.anthropic.com` | `claude-sonnet-4-20250514`, `claude-haiku-3-5` |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 / CSS3 / Vanilla JavaScript (zero dependencies client-side) |
| Code Highlighting | [Prism.js](https://prismjs.com/) v1.29.0 |
| Code Editor | [CodeMirror 5](https://codemirror.net/) with Python/JS/C/Bash modes |
| Local Server | Node.js built-in `http` module (zero dependencies) |
| Answer Verification | SHA-256 digests only (`flags-hash.js`) — plaintext answers never committed |
| AI Streaming | SSE (Server-Sent Events) |
| Fonts | JetBrains Mono + Noto Sans SC + Space Mono |

## 📋 What's New

### v2.7.6 (2026-08-30)

- 📚 **All 52 chapters upgraded to a beginner-friendly tutorial template** — every chapter now has a "What you'll learn" box, step-by-step examples with outputs, 3+ folded-answer exercises, and a summary table (CN + EN)
- 🗂 **Module order fixed** — Programming → Networking → Cryptography → Web → Pentesting → Malware → CTF (removes the TLS-before-HTTP dependency inversion)
- 🔢 **Sidebar section numbering** — chapters display as 01. 02. 03. for visible progression
- 🚩 **All 28 CTF challenges rebuilt to be genuinely solvable** — real RSA params, decodable payloads, embedded forensics artifacts, 2 new server-side simulators; every answer derivable from the challenge itself
- 🗂 **CTF arena tracks** — challenges sorted into category tracks with ascending difficulty
- 🔗 **Fixed 15 dead challenge-jump buttons** — lesson buttons passed numeric indexes to an API expecting string ids
- 🗂 **AI history as full-panel drawer** — search, time-grouped sessions (Today / 7d / Earlier), rename, two-step delete, clear-all
- 🤖 **AI tutor UX** — stop generation (■), per-message copy / regenerate, code-block copy + Prism highlighting, smart auto-scroll
- 📊 **Article meta bar** — difficulty stars + prerequisite hint on every chapter
- 🔒 **Security hardening** — loopback-only server, DNS-rebinding guard, CORS removed, static file block-list, CSP, SHA-256 answer hashing, privacy scan CI gate
- 🐛 Fixed: submitFlag crash (v2.5 regression), 28 CTF answer misalignment, CSP void of unsafe-inline, content.js dead assignments (5.96MB → 2.83MB compacted)

<details><summary>v2.6 (2026-08-27)</summary>

- 🔒 **Loopback-only server** · 🛡️ **DNS-rebinding guard** · 🚫 **CORS removed** · 🔑 **Answers hashed end-to-end** · 📦 **Static file block-list** · ⚡ **gzip cache / async stat / rate-limiter sweep** · 🧾 **CSP header + meta** · ♻️ portable `restart_server.bat`, CI workflow

</details>

> 📋 [Full changelog →](versions/CHANGELOG.md)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

## 💬 Feedback

Found a bug or have a suggestion? [Open an issue →](https://github.com/Chhhhhhhhhhhhhhh/cyberedu/issues/new/choose)

## 📄 License

[MIT](LICENSE) — Free for personal and commercial use.

---

<p align="center">
  <strong>If you find CyberEdu helpful, consider giving it a ⭐!</strong>
</p>
