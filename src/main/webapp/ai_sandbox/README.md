# AI模拟箱 - 全功能AI应用集合

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML)

一个功能丰富的AI模拟器集合，支持多种AI交互场景。基于本地Ollama API，可扩展云端模型，纯前端实现，支持Electron桌面打包。

## ✨ 功能特性

### 🎮 六大核心模块

| 模块 | 描述 | 特色功能 |
|------|------|----------|
| **🗣️ 对话模拟** | 多个AI角色根据设定背景进行自由对话 | 角色设定、对话历史、联网搜索、消息暂停 |
| **🐺 狼人杀** | AI角色自动进行狼人杀游戏 | 多种角色、自动判定、夜间行动、投票系统 |
| **⚔️ 战斗模拟** | AI角色进行战斗对决 | 单挑/乱斗/团队战、实时战斗、AI主持判定 |
| **🔮 混沌玄卜** | 量子占卜系统 | 塔罗牌、易经卦象、符文、灵数、AI智能解读 |
| **🔍 AI分析工具** | 检测回答中的可疑陈述 | 问题识别、案例库管理、可信度分析 |
| **📚 AI文字游戏** | 与AI共同创造精彩故事 | 角色扮演、物品收集、多分支剧情 |

### 🛠️ 技术特性

- **🔒 安全第一**: 修复了所有XSS漏洞，所有动态内容均经过HTML转义
- **⚡ 高性能**: 统一API调用，超时控制，消息列表管理
- **🌐 多模型支持**: 本地Ollama + 云端模型无缝切换
- **💾 自动保存**: 实时缓存游戏进度，断点续玩
- **🎨 精美UI**: 赛博朋克风格设计，响应式布局
- **📱 跨平台**: 浏览器直接运行，支持Electron打包

## 🚀 快速开始

### 环境要求

- **Node.js**: v16+ (如需打包或代理)
- **Ollama**: 本地大模型运行时（可选，支持云端备用）
- **浏览器**: 现代浏览器（Chrome 80+, Firefox 75+, Safari 13+）

### 安装步骤

1. **下载项目**
   ```bash
   # 克隆仓库
   git clone <repository-url>
   cd ai_sandbox
   
   # 或直接下载并解压
   ```

2. **启动本地Ollama**（可选）
   ```bash
   # 安装Ollama
   # 访问 https://ollama.com/download 安装
   
   # 拉取模型
   ollama pull qwen3.5:latest
   ollama pull deepseek-r1:8b
   ```

3. **运行项目**
   ```bash
   # 方法一：直接打开浏览器（推荐）
   open index.html
   
   # 方法二：使用Python简单服务器
   python -m http.server 8080
   # 访问 http://localhost:8080
   
   # 方法三：使用Node.js服务器
   npx serve
   ```

4. **使用Electron打包**（可选）
   ```bash
   # 安装依赖
   npm install
   
   # 启动应用
   npm start
   
   # 打包为桌面应用
   npm run dist
   ```

## 📖 使用指南

### 基础操作

1. **选择模型**
   - 点击首页各模块卡片进入
   - 在设置中选择AI模型
   - 支持本地和云端模型混合使用

2. **配置API**
   - 默认API: `http://localhost:11434`
   - 默认密钥: `ollama`
   - 支持自定义端点和密钥

3. **保存进度**
   - 所有模块自动保存进度
   - 数据存储在浏览器localStorage
   - 支持手动导入/导出

### 各模块详解

#### 对话模拟
- 设置多个AI角色背景和性格
- 观察AI之间的自由对话
- 支持实时联网搜索增强对话
- 可暂停/继续对话进程

#### 狼人杀游戏
- AI自动分配角色（狼人、预言家、女巫等）
- 自动进行夜间行动和白天讨论
- 智能投票判定和游戏流程控制
- 支持自定义游戏规则

#### 战斗模拟
- 创建不同的战斗角色
- 支持多种战斗模式（1v1, 3v3, 自由乱斗）
- AI实时计算伤害和判定
- 可设置主持AI进行公正裁决

#### 混沌玄卜
- 六种占卜方式：塔罗牌、易经、符文、灵数、梅花易数、奇门遁甲
- AI智能解读占卜结果
- 历史记录和结果分析
- 支持多次抽签对比

#### AI分析工具
- 输入文本让AI检测问题
- 识别事实错误、偏见、不确定性
- 生成可信度评分和改进建议
- 案例库管理和历史记录

#### AI文字游戏
- 创建自定义角色和世界观
- 与AI共同编织故事
- 收集物品，选择行动
- 多分支剧情发展

## ⚙️ 配置说明

### 模型配置

```javascript
// 本地模型示例
'qwen3.5:latest'
'deepseek-r1:8b'
'granite4:latest'

// 云端模型示例  
'minimax-m2.7:cloud'
'qwen3-coder-next:cloud'
'cogito-2.1:671b-cloud'
```

### API配置

```javascript
// 默认配置
{
  apiEndpoint: "http://localhost:11434",
  apiKey: "ollama",
  defaultModel: "qwen3:8b"
}
```

## 🔧 开发说明

### 项目结构

```
ai_sandbox/
├── index.html              # 主导航页
├── shared.js               # 核心公共模块
├── chat/                   # 对话模拟模块
├── werewolf/               # 狼人杀模块
├── battle/                 # 战斗模拟模块
├── divination/             # 占卜模块
├── analyzer/               # AI分析工具
├── textgame/               # 文字游戏模块
├── electron/               # Electron打包配置
├── dist-win/               # Windows打包输出
└── README.md              # 项目说明
```

### 核心模块说明

#### shared.js
- 统一的模型管理
- API调用封装
- 安全工具函数（escapeHtml, safeHtml）
- 配置管理系统（AppSettings）

#### 各模块脚本
- 使用ES6+语法
- 模块化设计
- 统一的错误处理
- 响应式数据管理

### 安全特性

1. **XSS防护**
   - 所有用户输入均进行HTML转义
   - 使用escapeHtml()函数处理动态内容
   - 防止脚本注入攻击

2. **API安全**
   - 支持自定义认证头
   - 统一的错误处理机制
   - 超时和重试机制

3. **数据安全**
   - 客户端数据存储
   - 无敏感信息传输
   - 支持数据导入导出

## 🚨 已知问题

1. **CORS限制**: 某些浏览器的隐私保护可能阻止外部CDN，已添加备选CDN
2. **联网搜索**: 因浏览器安全策略，搜索功能可能被自动禁用
3. **模型兼容**: 不同模型API响应格式可能有差异，已做兼容处理

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork项目
2. 创建特性分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -m 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交Pull Request

### 代码规范

- 使用ES6+语法
- 遵循现有代码风格
- 添加必要的注释
- 确保功能完整性

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- 项目地址: [GitHub Repository]
- 问题反馈: [Issues]
- 开发者: [Your Name]

---

**提示**: 这是一个纯前端项目，所有数据处理均在浏览器端完成。请确保您的浏览器支持现代JavaScript特性。