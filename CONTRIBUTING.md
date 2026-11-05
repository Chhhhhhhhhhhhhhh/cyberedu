# Contributing to CyberEdu

Thanks for your interest! Here's how to contribute.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cyberedu.git
   cd cyberedu
   ```
3. Start the local server:
   ```bash
   node server.js
   # Open http://localhost:8000
   ```

## Project Structure

```
├── cyberedu.html    # Main HTML page (UI layout + inline styles)
├── content.js       # Course catalog, exercises, CTF and glossary
├── lessons/         # Bilingual module packs (HTML and checkpoints)
├── script.js        # Interactive logic (navigation, search, theme, AI chat)
├── style.css        # Stylesheet (dark/light themes, animations, layout)
├── i18n.js          # Bilingual EN/ZH localization (~140 translation pairs)
├── server.js        # Local Node.js proxy (AI chat, code execution)
├── favicon.svg      # Browser tab icon
└── versions/        # Version changelog
```

## How to Contribute

### Content Improvements

For typos, factual errors, or content suggestions:

- Open an Issue with the `📝 content correction` label
- Include the **module name** and **section name**
- If possible, suggest the corrected text

### Translation

To improve English or Chinese translations:

- Edit `i18n.js` — find the relevant key in both `zh` and `en` sections
- Keep keys identical between the two language blocks
- Test with `node server.js` to verify

### Bug Fixes & Features

1. Check existing Issues to avoid duplicates
2. Create an Issue describing the bug or feature first
3. Once discussed, submit a Pull Request
4. Keep PRs focused — one feature/fix per PR

### Code Style

- JavaScript: ES6+, no build tools required (vanilla)
- Indentation: 2 spaces
- Language: commit messages and code comments in English
- Test locally with `node server.js` before submitting

## Adding New Content

Add the module, chapter and section metadata to `content.js`. Each section’s `contentKey` must exist in both `lessons/<module>.en.js` and `lessons/<module>.zh.js` with its HTML and two checkpoints. Use `node scripts/replace-section.js <key> <zh-file> [en-file]` to update an existing article. Run `node scripts/verify-content-quality.js` and open the lesson in both languages.

For the browser regression suite install the Playwright version pinned in the CI workflow, run `python -m playwright install chromium`, then `python tests/browser_smoke.py`. The tests use disposable loopback servers and a temporary browser profile.

## Reporting Issues

Use the Issue template — it covers bugs, feature requests, content corrections, and translation improvements.

**License**: By contributing, you agree that your contributions will be licensed under the MIT License.
