# CyberEdu - 网络安全学习平台

[English](README.md)
[Live Demo](https://chhhhhhhhhhhhhhh.github.io/cyberedu/) | [更新日志](versions/CHANGELOG.md)

一个涵盖网络安全基础知识的交互式学习网站，面向零基础到高级的学习者。

## 功能特色

- **中英文双语**：52 个章节完整英文翻译，UI 一键切换（i18n）
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
├── content.js         # 内容数据（中英双语：模块/章节/练习/CTF挑战）
├── script.js          # 交互逻辑
├── style.css          # 样式表
├── i18n.js            # 中英文切换系统（~140 翻译键值对）
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
| **OpenAI 兼容** |||
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat`, `deepseek-reasoner` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus`, `qwen-max` |
| Ollama（本地） | `http://localhost:11434` | `llama3`, `qwen2` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b` |
| **Anthropic** |||
| Claude | `https://api.anthropic.com` | `claude-sonnet-4-20250514`, `claude-haiku-3-5` |

## 技术栈

- HTML5 / CSS3 / JavaScript
- [Prism.js](https://prismjs.com/) v1.29.0（内容代码高亮）
- [CodeMirror 5](https://codemirror.net/)（代码编辑器）
- Node.js 内置 `http` 模块（零依赖本地服务器）
- SSE（Server-Sent Events）流式输出

## 更新日志

### v2.3（2026-06-05）

- 🤖 **多模型 AI**：支持 Claude/Anthropic API，兼容 OpenAI 系列模型
- 📱 **移动端适配**：侧边栏覆盖层、紧凑导航、全响应式布局
- 🔍 **搜索增强**：分词模糊匹配，多词分别高亮
- 🌐 **国际化**：AI 设置面板完整双语，网站默认英文
- ⚡ **性能优化**：defer 脚本加载 + 加载动画
- 📝 **开源配套**：CONTRIBUTING.md、SEO 标签、项目目录清理

> 📋 [查看完整版本历史 →](versions/CHANGELOG.md)

> 📋 [查看完整版本历史 →](versions/CHANGELOG.md)

## License

MIT
