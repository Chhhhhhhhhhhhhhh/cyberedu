# CyberEdu — Cybersecurity Learning Platform

An interactive cybersecurity learning website, from absolute beginner to advanced practitioner.

[中文](README_zh.md)
[Live Demo](https://chhhhhhhhhhhhhhh.github.io/cyberedu/) | [Changelog](versions/CHANGELOG.md)

## Features

- **Bilingual (EN/ZH)**: Full English translation of 52 chapters + one-click UI language switch
- **7 Core Modules**: Programming, Cryptography, Networking, Web Security, Pentesting, Malware Analysis, CTF
- **4 Difficulty Tiers**: Beginner → Intermediate → Advanced → Expert
- **Built-in Code Editor**: CodeMirror 5 with Python/JS/C/Bash syntax highlighting
- **Dark/Light Theme**: One-click toggle, persisted to localStorage
- **Learning Progress**: Auto-tracked with JSON export/import backup
- **AI Tutor**: Built-in AI chat assistant (DeepSeek/OpenAI/Qwen/Ollama), streaming SSE responses
- **Session History**: Multi-turn conversations auto-saved, sidebar switching
- **Global Search**: Ctrl+K to search modules, chapters, and terminology
- **Practice Exercises**: 10 coding challenges with expected output validation
- **CTF Arena**: 16 challenges covering Crypto, Web, Misc, Reverse, Forensics, and PWN

## Project Structure

```
├── cyberedu.html      # Main page
├── content.js         # Content data (bilingual: modules/chapters/exercises/CTF)
├── script.js          # Interactive logic
├── style.css          # Stylesheet
├── i18n.js            # EN/ZH localization (~140 translation pairs)
├── server.js          # Local Node.js server (AI chat proxy)
├── versions/          # Historical version archives
└── .github/           # Issue templates
```

## Getting Started

### Quick Start (no AI chat)

Open `cyberedu.html` directly in your browser. Code highlighting, theme switching, and progress tracking all work without a server.

### Local Server (enables AI chat + code execution)

Requires [Node.js](https://nodejs.org/) v16+:

```bash
node server.js
# Then open http://localhost:8000
```

Click the green floating button (bottom-right) to open the AI chat panel. Click ⚙ to configure:

| Field | Example |
|-------|---------|
| API Base URL | `https://api.deepseek.com` |
| API Key | `sk-...` |
| Model | `deepseek-chat`, `deepseek-reasoner` |

Optional: adjust temperature, max tokens, and thinking mode.

> On Windows, double-click `restart_server.bat` to restart the server.

## Supported AI Models

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

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript (zero dependencies client-side)
- [Prism.js](https://prismjs.com/) v1.29.0 — content code highlighting
- [CodeMirror 5](https://codemirror.net/) — interactive code editor
- Node.js built-in `http` module — zero-dependency local server
- SSE (Server-Sent Events) — streaming AI responses

## What's New

### v2.3 (2026-06-05)

- 🤖 **Multi-model AI** — Claude/Anthropic API support alongside OpenAI-compatible models (DeepSeek, OpenAI, Qwen, Groq, Ollama)
- 📱 **Mobile responsive** — sidebar overlay, compact navigation, responsive typography
- 🔍 **Enhanced search** — token-based fuzzy matching with per-word highlighting
- 🌐 **i18n** — AI settings panel fully bilingual (EN/ZH), site defaults to English
- ⚡ **Performance** — deferred script loading with loading overlay
- 📝 **Open source ready** — CONTRIBUTING.md, SEO meta tags, project cleanup

### v2.2 (2026-06-03)

- 🌐 **Full English translation** — all 52 chapters + bilingual UI
- 📝 **Content audit** — 22 factual errors fixed across all modules
- 🎨 **Layout improvements** — 15-30% more spacing, auto-expanding content on sidebar collapse
- 🐛 Bug fixes: language-switch chapter refresh, content-key mapping, template literal escaping

> 📋 [Full changelog →](versions/CHANGELOG.md)

## Feedback

Found a bug or have a suggestion? [Open an issue →](https://github.com/Chhhhhhhhhhhhhhh/cyberedu/issues/new/choose)

## License

MIT
