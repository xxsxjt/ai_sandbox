@echo off
chcp 65001 >nul
echo ========================================
echo   AI文字游戏 - 本地服务器启动器
echo ========================================
echo.
echo 请在浏览器访问: http://localhost:8080
echo.
echo 确保 Ollama 服务正在运行
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================

cd /d "%~dp0"
python -m http.server 8080
