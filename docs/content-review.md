# Learning experience and content review

Reviewed in November 2026. The catalog contains 173 sections in 9 modules, with Chinese and English lesson packs. This change does **not** claim a factual review of all 346 articles.

## Reviewed scope

| Area | Change | Verification |
| --- | --- | --- |
| `prog-01-01`–`prog-01-05`, both languages | Five progressive lessons: variables → loops → functions → dictionaries → error handling. Build a fixed-format failed-login counter. Keep the previous three advanced articles as optional reading. | Execute all 10 primary examples, compare their published output, then check the downloadable log's counts and rejected rows. |
| Python type/dictionary guidance | Numeric types can interoperate; strings need explicit conversion for arithmetic. Use `get` for optional keys and validated indexed access for required keys. | [Python introduction](https://docs.python.org/3/tutorial/introduction.html), [control flow](https://docs.python.org/3/tutorial/controlflow.html), [dictionaries](https://docs.python.org/3/tutorial/datastructures.html#dictionaries), [exceptions](https://docs.python.org/3/tutorial/errors.html). |
| `web-01-01`, both languages | Correct the specific SQL predicate: `AND` binds before `OR`; this example matches admin rows or rows with password xxx, not all rows. Do not assume row order or an absent SQL comment. | Execute the published predicate with SQLite; compare parameterized input handling. [SQLite precedence](https://www.sqlite.org/lang_expr.html), [OWASP prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html). This is a targeted correction, not a full SQL chapter audit. |
| CTF 006 / 021 | Add real synthetic PCAP / PNG files with reproducible extraction instructions. | Decode HTTP response headers / PNG red-channel LSB data from the files and verify existing flag hashes. |
| 11 transcript-only challenges | Label as case studies. | UI checks that case notes and file download controls match the material type. |

## What progress means

- **Read** is a learner's manual mark, not proof of understanding.
- **Quiz passed** requires both answers to be correct. A later wrong answer returns that item to the review queue. Feedback stays until retry; progress persists across reloads and JSON backup/restore.
- **In-lesson exercise** checks the learner's entered output against the exercise answers. It is not a code submission or independent programming assessment.
- A five-question diagnostic reports correct/review topics and lets the learner choose a path. It does not estimate a skill percentage or certify competence.

Legacy read marks are preserved without inventing quiz or exercise passes. Quiz results carry the section's `quizVersion`; a changed version invalidates stale answers. The first three rewritten lessons use version 2. Section reset clears reading, quiz, exercise and resume data together. Case-study completions remain compatible with existing CTF records.

## Authoring and verification

Edit the canonical `lessons/<module>.<language>.js` packs and the catalog in `content.js`. Keep both language versions aligned. Use two checkpoints per section; bump `quizVersion` when their meaning changes. New output exercises should also have a documented version/migration policy before changing accepted answers.

For reviewed material, include primary references, a review date, runtime assumptions, expected output and limitations. Keep advanced material optional for beginner paths. Do not call a transcript an executable lab, and do not equate a formatting check with a factual review.

Run:

```sh
npm test
node scripts/verify-content-quality.js
node scripts/verify-ctf-solvable.js
python tests/lesson_examples.py
python tests/browser_smoke.py
node scripts/privacy-scan.js
```

`training/login-sample.log` is a fixed synthetic input with documentation-range IPs. Rebuild `capture.pcap` and `landscape.png` with `python scripts/generate-training-samples.py`. They contain no captured traffic or personal data. These files are public static assets and are cached for offline use.

## Remaining editorial work

Other advanced articles and glossary entries still need individual technical review, source annotations and executable examples. Memory forensics and binary exploitation cases still provide transcripts rather than runnable targets. These limitations are visible in the challenge labels; supplying realistic, maintained labs is separate future work.
