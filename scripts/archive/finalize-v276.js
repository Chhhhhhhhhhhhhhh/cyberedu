#!/usr/bin/env node
// finalize v2.7.6: uniform versions, CI privacy gate, changelog note
const fs = require('fs');

// 1) CI: add privacy gate
let w = fs.readFileSync('.github/workflows/test.yml', 'utf8');
if (!w.includes('privacy-scan')) {
  w = w.replace(
    '      - run: node scripts/verify-content-quality.js\n',
    '      - run: node scripts/verify-content-quality.js\n      - run: node scripts/privacy-scan.js\n'
  );
  fs.writeFileSync('.github/workflows/test.yml', w);
  console.log('✓ CI privacy gate added');
} else console.log('CI already has privacy gate');

// 2) uniform version 2.7.6
const bump = (file, pairs) => {
  let t = fs.readFileSync(file, 'utf8');
  for (const [from, to] of pairs) t = t.split(from).join(to);
  fs.writeFileSync(file, t);
};
bump('package.json', [['"version": "2.7.5"', '"version": "2.7.6"'], ['"version": "2.7.2"', '"version": "2.7.6"']]);
bump('cyberedu.html', [['>v2.7.5</div>', '>v2.7.6</div>'], ['>v2.7.2</div>', '>v2.7.6</div>']]);
bump('server.js', [['v2.7.0', 'v2.7.6'], ['v2.6.2', 'v2.7.6']]);
bump('tests/test-runner.js', [['v2.6.2', 'v2.7.6'], ['v2.7.0', 'v2.7.6']]);
bump('README.md', [['version-v2.7.5-00ff41', 'version-v2.7.6-00ff41'], ['version-v2.7.2-00ff41', 'version-v2.7.6-00ff41']]);
bump('README_zh.md', [['版本-v2.7.5-00ff41', '版本-v2.7.6-00ff41'], ['版本-v2.7.2-00ff41', '版本-v2.7.6-00ff41']]);

// 3) CHANGELOG: add privacy-gate note to the v2.7.6 entry
let cl = fs.readFileSync('versions/CHANGELOG.md', 'utf8');
if (!cl.includes('privacy-scan')) {
  cl = cl.replace(
    '### 🧹 顺带\n',
    '### 🔒 隐私扫描门禁（进 CI）\n- 新增 `scripts/privacy-scan.js`：扫描全仓库的盘符路径 / Windows 用户目录 / Unix home / API 密钥样式（sk-、AKIA）/ 私钥块 / 真实邮箱等个人与机器痕迹，发现即 CI 失败；支持未提交的本地自定义规则\n- 缘起：用户要求所有提交不得泄露个人信息与本机信息；首轮扫描即清理了 .gitignore 中的内部工具名字样\n\n'
  );
  fs.writeFileSync('versions/CHANGELOG.md', cl);
  console.log('✓ changelog privacy note added');
} else console.log('changelog already noted');
