@echo off
chcp 65001 >nul
title 狼人杀AI模拟器 - 服务器启动

echo ========================================
echo      狼人杀AI模拟器 - 服务器
echo ========================================
echo.

where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Ollama
    echo 请先安装: https://ollama.com/download/windows
    pause
    exit /b 1
)

echo [1/2] 启动 Ollama 服务...
curl -s http://localhost:11434 >nul 2>&1
if %errorlevel% neq 0 (
    start "Ollama服务" cmd /c "ollama serve"
    timeout /t 3 /nobreak >nul
)

echo [2/2] 启动本地服务器...
start "" "http://localhost:5500/werewolf/werewolf.html"
echo.
echo 正在打开浏览器...

cd /d "%~dp0"
python -m http.server 5500
