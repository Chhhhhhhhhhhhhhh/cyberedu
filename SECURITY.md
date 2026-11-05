# Security Policy / 安全策略

CyberEdu takes security seriously. This document explains the threat model and how to report vulnerabilities.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.8.x   | ✅        |
| < 2.8   | ❌ — please upgrade |

## Security Model（安全模型）

CyberEdu is a **local-first, single-user learning platform**. Its local server assumes a loopback-only deployment:

- The server binds to `127.0.0.1` by default and validates the `Host` header, which blocks DNS-rebinding attacks from websites you visit.
- The browser obtains a per-start token from the same-origin local server. API writes check the request origin, JSON media type and token. The server provides no cross-origin read or preflight grants.
- Code execution is off by default. On a loopback binding, `npm run start:runner` enables the host interpreter for code you trust. Use a separate isolated environment for untrusted code.
- AI credentials use per-tab session storage. Only the local proxy forwards them to the chosen provider.
- CTF submissions are checked against SHA-256 digests. Training artifacts and walkthroughs may themselves contain the answer.
- A Content-Security-Policy ships as an HTTP header locally and as an HTML `<meta>` tag on static deployments. Both restrict resources, plugins and connections; framing protection additionally requires the headers supplied by the local server. `script-src` allows `'unsafe-inline'` for the app's inline event handlers. Imported progress is validated and rendered as text, and AI output is HTML-escaped before insertion.

## Reporting a Vulnerability

Please use [GitHub's private vulnerability reporting](https://github.com/Chhhhhhhhhhhhhhh/cyberedu/security/advisories/new) rather than opening a public issue. Include reproduction steps and affected version. We aim to acknowledge reports within 72 hours.

## 漏洞报告

请通过 GitHub 私密漏洞报告通道提交，不要在公开 Issue 中描述安全漏洞。请附带复现步骤与影响版本。
