# AI Sandbox

## 项目简介

AI 沙箱 —— 一个综合性的 AI 实验与测试平台。用户可以在多种互动场景中测试和体验 AI 模型的能力，包括多角色对话模拟、桌游对战、文字冒险等。

## 功能模块

### 对话模拟
多角色 AI 对话模拟，支持自定义角色性格与话题背景，AI 可联网搜索实时信息，用户可随时加入对话。

### 狼人杀
完整的狼人杀桌游，包含预言家、女巫、猎人、守卫等经典角色及多种进阶角色，全部由 AI 驱动决策。

### 战斗模拟
支持单挑、乱斗、团队战、大逃杀等多种战斗模式，AI 实时做出战术判断。

### 混沌玄卜
集成易经、塔罗牌、卢恩符文、数字命理等多种占卜体系，AI 提供详细解读。

### AI 分析工具
AI 回复可信度检测，支持案例管理与批量分析，可导出 JSON/Word/Excel 报告。

### AI 文字游戏
RPG 风格文字冒险，包含角色成长、装备系统、炼金术、地图探索等完整游戏机制。

## 纯前端 vs Java Web 后端

本项目前端可独立运行（配合本地 Ollama 或云端 API），**大部分功能均可正常使用**。

部署 Java Web 后端后，额外获得以下增强功能：

| 功能 | 纯前端 | + 后端 |
|------|--------|--------|
| AI 对话/游戏/占卜等核心功能 | 正常 | 正常 |
| 联网搜索（对话中 AI 实时检索信息） | 不可用 | 可用 |
| 服务健康监控 | 不可用 | 可用 |
| 后端代理请求（避免跨域限制） | 不可用 | 可用 |

> **总结**：仅使用前端只会缺失联网搜索和服务监控功能，其余所有 AI 互动模块均不受影响。

## 项目结构

```
ai_sandbox/
├── index.html              # 前端主导航页
├── shared.js               # 前端核心公共模块
├── chat/                   # 对话模拟模块
├── werewolf/               # 狼人杀模块
├── battle/                 # 战斗模拟模块
├── divination/             # 占卜模块
├── analyzer/               # AI分析工具
├── textgame/               # 文字游戏模块
├── electron/               # Electron打包配置
├── package.json            # 前端依赖配置
├── pom.xml                 # Java Web Maven配置
├── src/main/java/          # Java后端源码
│   └── com/dx/ai_sandbox/
│       ├── HelloServlet.java
│       ├── SearchServlet.java
│       └── HealthCheckServlet.java
├── src/main/webapp/
│   ├── WEB-INF/web.xml
│   ├── index.jsp
│   └── ai_sandbox/         # 前端副本（WAR部署用）
└── README.md
```

## 技术栈

### 前端
- HTML / CSS / JavaScript（原生）
- Electron（桌面端打包）
- 支持接入 Ollama、OpenAI 兼容 API

### 后端（Java Web）
- Java 24
- Jakarta EE 10（Servlet API）
- Jersey (JAX-RS)
- EclipseLink (JPA)
- Jackson (JSON)

## 开发者

**虚无圣熙** / xxsxjt

## 项目地址

https://github.com/xxsxjt/ai_sandbox

## 联系方式

- GitHub: [xxsxjt](https://github.com/xxsxjt)
