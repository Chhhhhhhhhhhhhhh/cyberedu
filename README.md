# CyberEdu - 网络安全学习平台

一个涵盖网络安全基础知识的交互式学习网站，面向零基础到高级的学习者。

## 功能特色

- **7大核心模块**：编程基础、密码学、网络基础、Web安全、渗透测试、恶意软件分析、CTF竞赛
- **分级学习**：按零基础、入门、中级、高级四个难度层级组织内容
- **代码编辑器**：集成 CodeMirror 5，支持 Python/JS/C/Bash 语法高亮与实时编辑
- **深色/浅色主题**：一键切换，状态持久保存
- **学习进度管理**：自动记录进度，支持导出/导入备份
- **AI 导师对话**：内置 AI 聊天助手，支持 DeepSeek/OpenAI/Qwen/Ollama 等模型
- **历史会话**：多轮对话自动保存，侧边栏快速切换与恢复
- **响应式设计**：适配桌面端和移动端

## 项目结构

```
├── cyberedu.html      # 主页面
├── content.js         # 内容数据（模块/章节/练习/CTF挑战）
├── script.js          # 交互逻辑
├── style.css          # 样式表
├── server.js          # 本地 Node.js 服务器（AI 聊天代理）
├── restart_server.bat # Windows 一键重启服务器脚本
├── versions/          # 历史版本归档
└── .gitignore
```

## 使用方式

### 方式一：纯静态浏览（无 AI 聊天）

直接在浏览器中打开 `cyberedu.html` 即可，代码高亮、主题切换、进度管理等功能正常使用。

### 方式二：本地服务器（启用 AI 聊天）

需要 [Node.js](https://nodejs.org/) 环境（v16+）：

1. 打开终端，进入项目目录
2. 启动服务器：
   ```bash
   node server.js
   ```
3. 浏览器访问 `http://localhost:8000`
4. 点击右下角绿色悬浮按钮打开 AI 聊天面板
5. 点击 ⚙ 配置你的 API：
   - **API Base URL**：如 `https://api.deepseek.com`
   - **API Key**：你的密钥（`sk-...`）
   - **模型**：如 `deepseek-chat`、`deepseek-reasoner`
6. 可选：调整温度、最大 Token 数、是否启用思考模式

> 如需重启服务器，双击 `restart_server.bat`（Windows）或在终端中 `Ctrl+C` 后重新运行 `node server.js`。

## 支持的 AI 模型

| 提供商 | API Base URL | 模型示例 |
|--------|-------------|---------|
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat`, `deepseek-reasoner` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus`, `qwen-max` |
| Ollama（本地） | `http://localhost:11434` | `llama3`, `qwen2` |

## 技术栈

- HTML5 / CSS3 / JavaScript
- [Prism.js](https://prismjs.com/) v1.29.0（内容代码高亮）
- [CodeMirror 5](https://codemirror.net/)（代码编辑器）
- Node.js 内置 `http` 模块（零依赖本地服务器）
- SSE（Server-Sent Events）流式输出

## 更新日志

### v2.1（2026-06-02）

**AI 聊天功能增强**
- 🧠 DeepSeek 适配：支持思考模式（reasoning_content），折叠展示思考过程
- 📊 Token 用量显示：每条回复底部显示输入/输出/思考 token 数
- ⚙️ 设置面板增强：温度滑块、最大 Token 数、思考模式开关
- 💬 历史会话侧边栏：多轮对话自动保存（localStorage），支持切换/删除/新建会话
- 🎨 亮色主题全面重写：新色彩体系（森林绿）、中性灰边框、去除霓虹光效
- 🐛 修复：设置面板无法滚动、思考时显示代码标签、思考过程顺序、SSE 解析跨 chunk 截断
- 🎬 Matrix 数字雨亮度提升

### v2.0（2026-06-01）

- 🤖 AI 导师聊天功能：悬浮窗对话，支持流式输出（SSE）
- 🔌 本地 Node.js 服务器：零依赖 API 代理，解决 CORS 问题
- 🎨 深色/浅色主题切换：一键切换，localStorage 持久保存
- ✏️ CodeMirror 代码编辑器：Python/JS/C/Bash 语法高亮
- 💾 学习进度导出/导入：JSON 格式备份与恢复
- 📦 内容模块化拆分：`content.js` 独立数据文件
- 🐛 修复：侧边栏导航在 Web安全/渗透测试/恶意软件/CTF 模块中失效

### v1.0（2026-05-30）

- 🎉 CyberEdu 初始版本发布
- 📚 7 大模块 51 章内容：编程基础/密码学/网络基础/Web安全/渗透测试/恶意软件/CTF
- 🏷️ 四级难度分层：零基础 → 入门 → 中级 → 高级
- 🔍 全局搜索（Ctrl+K）
- 📊 学习进度自动记录
- 🎮 CTF 实战练习与在线工具（Base64/MD5/Hex/XOR/ROT13）

## License

MIT
