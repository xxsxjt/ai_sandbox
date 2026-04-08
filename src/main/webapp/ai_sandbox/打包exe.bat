@echo off
echo 正在打包 Windows 版本...

cd /d "%~dp0"

:: 删除旧的打包文件
if exist "dist-win" rmdir /s /q "dist-win"

:: 使用 electron-packager 打包
npx electron-packager . "AI狼人杀" --platform=win32 --arch=x64 --out=dist-win --overwrite

if %errorlevel% equ 0 (
    echo.
    echo 打包成功！
    echo 可执行文件位于 dist-win\AI狼人杀-win32-x64\
) else (
    echo.
    echo 打包失败！
)

pause
