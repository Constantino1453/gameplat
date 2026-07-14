@echo off
chcp 65001 >nul
cd /d E:\project-gameplat
echo.
echo ╔════════════════════════════════════╗
echo ║   🃏 一键刷新卡面资产           ║
echo ╚════════════════════════════════════╝
echo.

echo [1/3] 复制卡面图片到 public/cards ...
xcopy /Y /Q "cardsasset\*.png" "public\cards\" >nul 2>&1
xcopy /Y /Q "cardsasset\*.jpeg" "public\cards\" >nul 2>&1
xcopy /Y /Q "cardsasset\*.PNG" "public\cards\" >nul 2>&1
xcopy /Y /Q "cardsasset\*.JPEG" "public\cards\" >nul 2>&1

echo [2/3] 复制牌背到 public/cards/cardback ...
xcopy /Y /Q "cardsasset\cardback\*" "public\cards\cardback\" >nul 2>&1

echo [3/3] 同步 cards.json ...
copy /Y "cardsasset\cards.json" "src\data\cards.json" >nul 2>&1

echo.
echo ✅ 刷新完成！请在浏览器中 Ctrl+Shift+R 强制刷新。
echo.
pause
