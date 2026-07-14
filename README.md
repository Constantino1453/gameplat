# 🎴 GamePlat — 桌游平台

一个基于 **boardgame.io** 的在线桌游平台，支持骰子投掷、卡牌管理与对战。

## 🚀 一键启动

```bash
# 双击运行
dev.bat

# 浏览器访问
http://localhost:5173/
```

`dev.bat` 会自动启动：
- **boardgame.io Server** — `http://localhost:8000`（游戏状态同步 + WebSocket）
- **Express API** — `http://localhost:8001`（REST 接口）
- **Vite Dev Server** — `http://localhost:5173`（前端页面）

## 🛠 技术栈

| 类别 | 技术 |
|---|---|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 游戏引擎 | boardgame.io 0.50 |
| 后端框架 | Express 5 |
| 数据库 | better-sqlite3 |
| 拖拽交互 | @dnd-kit/core |
| 图片裁剪 | react-easy-crop |

## ⚙️ 运行环境

| 需求 | 说明 |
|---|---|
| Node.js | ≥ 18（推荐 v24+） |
| npm | ≥ 9 |
| 系统 | Windows / macOS / Linux |
| 构建工具 | Visual Studio 2022 +「使用 C++ 的桌面开发」（Windows 编译 better-sqlite3 所需） |

## 📦 安装

```bash
git clone <repo-url>
cd project-gameplat
npm install
```

## 🎯 项目目标

构建一个**通用在线桌游平台**，核心能力包括：

1. **通用桌游元件库** — 骰子（多面数、自定义骰、掷骰动画）、卡牌（牌堆管理、手牌栏、抽牌/打出交互、多款牌背）
2. **房间系统** — 创建/加入房间、Ready 机制、多人联机
3. **示例游戏** — Uno 等经典桌游的完整实现
4. **扩展能力** — 支持用户自定义卡牌、骰子与规则

> 当前进度：元件库阶段 — 骰子系统、卡牌系统已就绪。

## 🃏 卡面替换

将新卡面放入 `cardsasset/`，然后：

```bash
refresh-cards.bat          # 同步资产
# 浏览器 Ctrl+Shift+R 强制刷新
```
