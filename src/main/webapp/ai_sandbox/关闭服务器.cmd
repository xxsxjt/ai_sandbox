@echo off
chcp 65001 >nul
title AI模拟箱 - 关闭服务器

echo ========================================
echo      关闭 AI模拟箱 服务器
echo ========================================
echo.

:: 关闭 HTTP 服务器 (端口 6523)
echo 关闭 HTTP 服务器 (端口 6523)...
for /f "tokens=5" %a in ('netstat -ano ^| findstr ":6523" ^| findstr "LISTENING"') do (
    taskkill /f /pid %a >nul 2>&1
)

echo.
echo ✓ 服务器已关闭
echo.
pause
