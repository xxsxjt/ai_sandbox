@echo off
chcp 65001 >nul
title AI模拟箱 - 服务器启动

echo ========================================
echo      AI模拟箱 - 本地服务器
echo ========================================
echo.

:: 检查 Ollama
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Ollama
    echo 请先安装: https://ollama.com/download/windows
    pause
    exit /b 1
)

:: 启动 Ollama 服务
echo [1/2] 启动 Ollama 服务...
curl -s http://localhost:11434 >nul 2>&1
if %errorlevel% neq 0 (
    start "Ollama服务" cmd /c "ollama serve"
    timeout /t 3 /nobreak >nul
)

:: 启动 HTTP 服务器
echo [2/2] 启动本地服务器...
cd /d "%~dp0"
start "AI模拟箱服务器" cmd /c "python -m http.server 6523"
timeout /t 2 /nobreak >nul

echo.
echo ✓ 服务器已启动！
echo.
echo 正在打开浏览器...
start http://localhost:6523
echo.
echo ========================================
echo.
echo 访问地址: http://localhost:6523
echo 关闭服务器: 直接关闭 "AI模拟箱服务器" 窗口
echo.
