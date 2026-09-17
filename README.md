<p align="center">
  <img src="docs/og-image.png" alt="CyberEdu Banner" width="100%">
</p>

<h1 align="center">CyberEdu — Cybersecurity Learning Platform</h1>

<p align="center">
  An interactive cybersecurity learning platform and reference manual — from absolute beginner to advanced red/blue team operations.<br>
  <strong>9 Core Modules · 50 Chapters · 171 Atomic Micro-Lessons · 342 Bilingual Articles · 342 Interactive Checkpoints · 28 CTF Challenges · AI Tutor</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v2.7.6-00ff41?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/modules-9_core-00e5ff?style=flat-square" alt="Modules">
  <img src="https://img.shields.io/badge/lessons-171_atomic-00ff41?style=flat-square" alt="Lessons">
  <img src="https://img.shields.io/badge/bilingual-100%25_EN%2FZH-00e5ff?style=flat-square" alt="Bilingual">
  <img src="https://img.shields.io/badge/tests-114_passed-00ff41?style=flat-square" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-00e5ff?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/stars/Chhhhhhhhhhhhhhh/cyberedu?style=social" alt="Stars">
</p>

<p align="center">
  <a href="https://chhhhhhhhhhhhhhh.github.io/cyberedu/">🚀 Live Demo</a>
  &nbsp;·&nbsp;
  <a href="README_zh.md">中文文档</a>
  &nbsp;·&nbsp;
  <a href="versions/CHANGELOG.md">Changelog</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Chhhhhhhhhhhhhhh/cyberedu/issues/new/choose">Report Bug</a>
</p>

---

## ✨ Key Features

<p align="center">
  <img src="docs/features-showcase.png" alt="Features Showcase" width="100%">
</p>

| Category | Details |
|----------|---------|
| 📚 **Atomic Micro-Lessons** | 171 structured micro-lessons across 9 core domains, equipped with "What You'll Learn", reproducible exploit/defense steps, folded exercises, and summary cheatsheets |
| 🌐 **100% Bilingual Manual** | Complete side-by-side English and Chinese technical manuals across all 171 lessons (342 total articles) with one-click seamless switching |
| 🎯 **342 Interactive Checkpoints** | 2 self-assessment checkpoints per lesson with immediate feedback, detailed technical explanations, and one-click "Ask AI Tutor" |
| 🛠️ **6 Security Tools & Sandboxes** | Interactive SQLi injection simulator, XSS entity filter tester, Command injection visualizer, Hash avalanche bit analyzer, 5-point Radar skill evaluator, and hands-on Lab Drawer |
| 🚩 **28 CTF Challenges** | Mathematically and technically verified challenges across Web, Reverse, PWN, Crypto, Misc, and Forensics — SHA-256 hashed verification |
| 🎮 **Gamification & Ranks** | 5-tier hacker rank progression (LV.1 Script Kiddie → LV.5 Cyber Sovereign), dynamic EXP engine, daily streaks, unlockable achievements, and celebration effects |
| 🤖 **AI Tutor & Copilot** | Built-in streaming SSE chat assistant supporting DeepSeek, OpenAI, Qwen, Claude, Ollama, and Groq with full-screen conversation drawer |
| 💻 **In-Browser Code Playground** | Embedded CodeMirror 5 with syntax highlighting for Python, JS, C, and Bash + 10 executable challenges with auto-verification |
| 📱 **PWA & Offline Support** | Native PWA with `manifest.json` and Service Worker offline caching; neo-brutalist cyber terminal UI with WCAG AA contrast compliance |
| 🔍 **Global Navigation** | Ctrl+K fuzzy search, prerequisite tracking, difficulty star ratings, and persistent progress backup (JSON export/import) |

---

## 📚 9 Core Modules & Curriculum Matrix

| # | Domain | Identifier | Chapters | Lessons | Key Topics & Technical Focus |
|:---:|:---|:---:|:---:|:---:|:---|
| 1 | **Web Security** | `websec` | 10 | 39 | SQL Injection, XSS, CSRF, SSRF, XXE, File Upload, Auth & Session, RCE & Insecure Deserialization, API Security, DevSecOps & WAF |
| 2 | **Penetration Testing** | `pentest` | 5 | 15 | Reconnaissance & OSINT, Port & Service Fingerprinting, Vulnerability Scanning, Privilege Escalation, Post-Exploitation & Lateral Movement |
| 3 | **Computer Networking** | `network` | 5 | 15 | OSI & TCP/IP Model, DNS/ARP Security & Poisoning, HTTP/1.1 to HTTP/3 Evolution, Routing & Firewall Hardening, Wireshark Packet Forensics |
| 4 | **Cryptography & Modern Apps** | `cryptography` | 6 | 18 | Classical Ciphers & Math Foundations, Symmetric Ciphers (AES/DES), Asymmetric Ciphers (RSA/ECC), Hash Functions & Signatures, TLS/SSL & PKI, Modern ZKP & Post-Quantum Cryptography |
| 5 | **Malware Analysis & Reverse** | `malware` | 5 | 15 | Static Analysis & PE Architecture, Dynamic Sandboxing & Behavioral Analysis, Disassembly & Decompilation (IDA/Ghidra), Anti-Debugging & Evasion, Threat Intel & MITRE ATT&CK |
| 6 | **Cloud-Native & Container** | `cloudsec` | 5 | 15 | Docker Container Isolation & Escape Defense, Kubernetes Cluster Hardening, Cloud IAM & Metadata Security, Microservices & Service Mesh, CI/CD Pipeline & Supply Chain Security |
| 7 | **Blue Team DFIR & SOC** | `dfir` | 5 | 15 | SOC Architecture & SIEM Triage, Windows & Linux Host Artifact Forensics, Volatility Memory Forensics, Threat Hunting with Sigma Rules, Incident Response SOP & Ransomware Playbooks |
| 8 | **Programming Fundamentals** | `programming` | 7 | 18 | Python Exploit Scripting, C Language & Memory Layout, Bash Automation & Regex, Go Concurrency Tools, Wasm & JS Security, x86/x64 Assembly, Secure Coding & Memory Safety |
| 9 | **CTF Arena & AWD Strategy** | `ctf-guide` | 7 | 21 | CTF Architecture & Arsenal, PWN Stack Frames & ROP Chains, Reverse Engineering Anti-Decompilation, Advanced Web Exploit Chains, Cryptanalysis, Misc Forensics, AWD Attack & Defense Strategy |
| **Σ** | **All 9 Modules** | **Complete** | **50** | **171** | **342 Bilingual Lessons · 342 Checkpoints · 28 CTF Challenges · 6 Interactive Sandboxes** |

---

## 🏗️ Project Structure

```
cyberedu/
├── cyberedu.html          # Main application entry point
├── content.js             # 171 atomic micro-lessons (CN) + 342 checkpoints + CTF metadata
├── script.js              # Application core (state management, views, gamification, AI chat)
├── style.css              # Neo-brutalist cyber terminal styles (WCAG AA compliant)
├── i18n.js                # Dual-language localization system (~250+ translation pairs)
├── manifest.json          # Progressive Web App (PWA) manifest
├── sw.js                  # Service Worker offline cache engine
├── server.js              # Zero-dependency local Node.js server (loopback-only AI proxy & CTF verification)
├── flags-hash.js          # CTF answer SHA-256 digests — zero plaintext answers shipped
├── package.json           # Project manifest, scripts & metadata
├── favicon.svg            # CyberEdu vector terminal icon
├── tests/                 # Zero-dependency regression test suite (114 checks)
│   ├── test-runner.js     # Custom ANSI color test runner
│   ├── server.test.js     # Server security, host guards, traversal & rate limiter tests
│   └── utils.test.js      # Client utilities, gamification engine, playgrounds & WCAG AA contrast tests
├── scripts/               # Quality verification & automation tooling
│   ├── verify-content-quality.js # Automated 342/342 lesson template & structure validator
│   ├── verify-ctf-solvable.js    # Mathematical & programmatic CTF solvability verifier
│   ├── privacy-scan.js           # Pre-push zero-leak privacy & credential scanner
│   ├── gen-flag-hashes.js        # Answer digest rotation tool
│   └── compact-content.js        # Content memory compaction utility
├── docs/                  # Documentation assets & screenshots
│   ├── og-image.png
│   ├── features-showcase.png
│   └── content-roadmap.md
├── versions/              # Detailed version changelogs
│   └── CHANGELOG.md
└── .github/               # GitHub workflows & issue templates
    └── workflows/test.yml # Multi-version Node.js CI test suite
```

---

## 🧪 Quality Gates & Automated Testing

The platform enforces four automated CI quality gates:

```bash
# 1. Run unit test suite (114 tests covering security, gamification, sandboxes & contrast)
npm test

# 2. Verify mathematical solvability of CTF challenges (21/21 verified)
node scripts/verify-ctf-solvable.js

# 3. Validate structural completeness of all 342 micro-lessons (342/342 OK)
node scripts/verify-content-quality.js

# 4. Scan repository for personal identifiers and sensitive leaks
node scripts/privacy-scan.js

# 5. Static syntax verification across all core files
node --check server.js && node --check script.js && node --check content.js && node --check i18n.js && node --check flags-hash.js
```

---

## 🚀 Getting Started

### Option 1: Static Offline Browsing (No Server Required)

Simply double-click `cyberedu.html` or open it in any modern browser. All 171 micro-lessons, interactive checkpoints, code highlighting, search, and sandboxes work completely client-side without internet connectivity.

### Option 2: Local Server (Full AI Tutor & PWA Support)

Requires [Node.js](https://nodejs.org/) v16+:

```bash
node server.js
# Then open http://127.0.0.1:8000 in your browser
```

> **Security by Design**: The local server binds strictly to `127.0.0.1` (loopback only, never exposed to your local network), enforces `Host` header whitelisting against DNS rebinding, and rejects cross-origin requests.

To configure your AI Tutor, click the green terminal button at the bottom-right and open Settings (⚙):

| Field | Example | Description |
|-------|---------|-------------|
| **API Type** | `OpenAI Compatible` or `Anthropic` | Protocol selection |
| **API Base URL** | `https://api.deepseek.com` | Endpoint base address |
| **API Key** | `sk-...` | Stored strictly in browser `localStorage` |
| **Model** | `deepseek-chat`, `gpt-4o`, `qwen-plus`, `claude-3-5-sonnet` | Model identifier |

---

## 🤖 Supported AI Providers

| Provider | Base URL | Recommended Models |
|----------|----------|--------------------|
| **DeepSeek** | `https://api.deepseek.com` | `deepseek-chat`, `deepseek-reasoner` |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| **Alibaba Qwen** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus`, `qwen-max` |
| **Anthropic Claude** | `https://api.anthropic.com` | `claude-3-5-sonnet-20241022` |
| **Ollama (Local)** | `http://localhost:11434/v1` | `llama3.1`, `qwen2.5-coder` |
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |

---

## 🛠️ Technology Stack

| Layer | Implementation | Details |
|---|---|---|
| **Frontend** | HTML5 / CSS3 / Vanilla JavaScript | Zero third-party npm runtime dependencies |
| **Styling** | Cyberpunk Neo-Brutalist Architecture | CSS Custom Properties, WCAG AA contrast compliant |
| **Code Highlighting** | [Prism.js](https://prismjs.com/) v1.29.0 | Cyberpunk theme syntax highlighting |
| **Code Editor** | [CodeMirror 5](https://codemirror.net/) | Python, JavaScript, C, and Bash modes |
| **AI Stream Engine** | Server-Sent Events (SSE) | Multi-provider streaming parser with fallback |
| **Flag Verification** | Web Crypto SHA-256 | Zero plaintext answers in frontend or git tree |
| **PWA Engine** | Service Worker + Web App Manifest | Offline first, installable desktop/mobile experience |
| **Local Proxy** | Node.js native `http` module | DNS rebinding protection, zero external server deps |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for educational, personal, and commercial exploration.

<p align="center">
  <strong>Break the Surface, find the Truth. Every vulnerability has a story.</strong><br>
  If CyberEdu helped your security journey, don't forget to star ⭐ this repository!
</p>
