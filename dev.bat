@echo off
chcp 65001 >nul
cd /d E:\project-gameplat
echo.
echo ╔════════════════════════════════╗
echo ║   🎲 GamePlat 一键启动       ║
echo ╚════════════════════════════════╝
echo.
echo  🔵 server  → http://localhost:8000 (boardgame.io)
echo  🔵 api     → http://localhost:8001 (Express)
echo  🟢 web     → http://localhost:5173 (Vite)
echo.

echo [1/2] 启动服务端...
start "GamePlat-Server" cmd /c "cd /d E:\project-gameplat && node server/index.js"

echo [2/2] 启动前端...
call npm run dev
pause
