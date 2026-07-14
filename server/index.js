/**
 * 服务端入口 — boardgame.io Server + Express
 *
 * boardgame.io :8000  — 游戏状态、WebSocket
 * Express      :8001  — REST API（健康检查、后续阶段扩展）
 *
 * boardgame.io 0.50.2 的 server 模块仅提供 CJS 构建，
 * 而本项目 package.json type=module，因此通过 createRequire 加载。
 */

import { createRequire } from 'module';
import express from 'express';

// ---------- boardgame.io server (CJS) ----------
const require = createRequire(import.meta.url);
const { Server } = require('boardgame.io/dist/cjs/server.js');

// 最简游戏定义（后续阶段替换为 Uno 等完整游戏）
const demoGame = {
  name: 'demo',
  setup: () => ({}),
};

const bgioServer = Server({
  games: [demoGame],
  origins: ['http://localhost:5173'],
});

bgioServer.run(8000).then(() => {
  console.log('✅ boardgame.io Server running on http://localhost:8000');
});

// ---------- Express REST API ----------
const app = express();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(8001, () => {
  console.log('✅ Express API running on http://localhost:8001');
});
