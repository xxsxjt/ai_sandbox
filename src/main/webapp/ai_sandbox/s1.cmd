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