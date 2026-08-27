# Security Policy / 安全策略

CyberEdu takes security seriously. This document explains the threat model and how to report vulnerabilities.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.6.x   | ✅        |
| < 2.6   | ❌ — please upgrade |

## Security Model（安全模型）

CyberEdu is a **local-first, single-user learning platform**. Its local server assumes a loopback-only deployment:

- The server binds to `127.0.0.1` by default and validates the `Host` header, which blocks DNS-rebinding attacks from websites you visit.
- No CORS headers are emitted anywhere: third-party origins cannot drive any API in your browser.
- `/api/run` executes submitted practice code **unsandboxed by design** — it must never be reachable from untrusted networks. Do not set `CYBEREDU_HOST=0.0.0.0` unless you fully understand the consequences.
- CTF answers are stored only as SHA-256 digests (`flags-hash.js`). Answers for the five simulator-based challenges are derivable *by performing the simulated technique* — that is inherent to their design.
- A strict Content-Security-Policy ships both as an HTTP header and as an HTML `<meta>` tag, so GitHub Pages deployments get equivalent protection.

## Reporting a Vulnerability

Please use [GitHub's private vulnerability reporting](https://github.com/Chhhhhhhhhhhhhhh/cyberedu/security/advisories/new) rather than opening a public issue. Include reproduction steps and affected version. We aim to acknowledge reports within 72 hours.

## 漏洞报告

请通过 GitHub 私密漏洞报告通道提交，不要在公开 Issue 中描述安全漏洞。请附带复现步骤与影响版本。
