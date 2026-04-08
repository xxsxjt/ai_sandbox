@echo off
chcp 65001 >nul
title AI 模拟箱 - 智能部署

echo ========================================
echo      AI 模拟箱 - 智能部署向导
echo ========================================
echo.

:: 检查 Ollama 是否安装
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Ollama
    echo.

        echo.
        echo 请先安装 Ollama: https://ollama.com/download/windows
        echo 可运行同目录下的自动下载ollama.cmd
        pause
        exit /b 1
    
)

echo [✓] Ollama 已安装
echo.

:: 检查 Ollama 服务是否运行
echo [检查] 正在检查 Ollama 服务状态...
curl -s http://localhost:11434 >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] Ollama 服务未运行，正在启动...
    start "Ollama 服务" cmd /c "ollama serve"
    timeout /t 3 /nobreak >nul
    echo [✓] Ollama 服务已启动
) else (
    echo [✓] Ollama 服务已在运行
)

echo.
echo ========================================
echo 请选择部署模式:
echo ========================================
echo   [1]  仅使用云端模型 (预热加载)
echo   [2]  下载并使用本地模型
echo   [3]  快速启动 (使用默认模型 qwen3:8b)
echo   [4]  查看已下载的模型
echo   [0]  退出
echo ========================================
echo.

set /p choice=请输入选项 (0-4): 

if "%choice%"=="0" exit /b 0
if "%choice%"=="1" goto cloud_only
if "%choice%"=="2" goto download_local
if "%choice%"=="3" goto quick_start
if "%choice%"=="4" goto list_models

echo [错误] 无效的选项，请重新运行
pause
exit /b 1

::=======================================
:: 云端模型 - 预热加载
::=======================================
:cloud_only
echo.
echo ========================================
echo     云端模型预热加载
echo ========================================
echo 请选择要预热的云端模型 (可多选):
echo ========================================
echo   [A] 全部云端模型
echo   [B] DeepSeek-V3.2:cloud
echo   [C] GPT-OSS:cloud
echo   [D] MiniMax-M2.5:cloud
echo   [0] 返回主菜单
echo ========================================
echo 提示：输入多个选项如 "BCD" 可以同时选择
echo.

set /p cloud_choice=请输入选项：

if "%cloud_choice%"=="0" (
    cls
    goto :eof
)

echo.
echo ========================================
echo 正在预热加载云端模型...
echo ========================================
echo [提示] 模型将在后台加载，加载完成后窗口会自动关闭
echo.

:: 预热加载云端模型 - 全部
echo %cloud_choice% | findstr /i "A" >nul && (
    echo [预热] 全部云端模型...
    start "DeepSeek-V3.2" cmd /c "echo 正在加载 DeepSeek-V3.2... && echo. | ollama run deepseek-v3.2:cloud >nul 2>&1 && echo 加载完成 && timeout /t 2 >nul"
    start "GPT-OSS" cmd /c "echo 正在加载 GPT-OSS... && echo. | ollama run gpt-oss:cloud >nul 2>&1 && echo 加载完成 && timeout /t 2 >nul"
    start "MiniMax-M2.5" cmd /c "echo 正在加载 MiniMax-M2.5... && echo. | ollama run minimax-m2.5:cloud >nul 2>&1 && echo 加载完成 && timeout /t 2 >nul"
)

:: DeepSeek-V3.2
echo %cloud_choice% | findstr /i "B" >nul && (
    start "DeepSeek-V3.2" cmd /c "echo 正在加载 DeepSeek-V3.2... && echo. | ollama run deepseek-v3.2:cloud >nul 2>&1 && echo 加载完成 && timeout /t 2 >nul"
)

:: GPT-OSS
echo %cloud_choice% | findstr /i "C" >nul && (
    start "GPT-OSS" cmd /c "echo 正在加载 GPT-OSS... && echo. | ollama run gpt-oss:cloud >nul 2>&1 && echo 加载完成 && timeout /t 2 >nul"
)

:: MiniMax-M2.5
echo %cloud_choice% | findstr /i "D" >nul && (
    start "MiniMax-M2.5" cmd /c "echo 正在加载 MiniMax-M2.5... && echo. | ollama run minimax-m2.5:cloud >nul 2>&1 && echo 加载完成 && timeout /t 2 >nul"
)

echo.
echo [✓] 云端模型预热加载已启动！
echo [提示] 模型将在各自的窗口中加载
echo.

:: 启动本地服务器
echo ========================================
echo 正在启动本地服务器...
echo ========================================

cd /d "%~dp0"
start "AI 模拟箱" cmd /c "timeout /t 2 >nul && python -m http.server 6523"
start "" "http://localhost:6523/ai_sandbox/"
echo [✓] 服务器已启动，浏览器已打开
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
pause

::=======================================
:: 下载本地模型
::=======================================
:download_local
echo.
echo ========================================
echo     本地模型下载
echo ========================================
echo 请选择要下载的模型 (可多选):
echo ========================================
echo   [A] 全部本地模型
echo   [B] Llama3.1        - Facebook 的 Llama 3.1
echo   [C] Qwen3:8b        - 阿里云千问 3
echo   [D] DeepSeek-R1:8b  - 深度求索推理模型
echo   [E] Gemma3:12b      - Google Gemma 3
echo   [0] 返回主菜单
echo ========================================
echo 提示：输入多个选项如 "BCD" 可以同时选择
echo.

set /p model_choice=请输入选项：

if "%model_choice%"=="0" (
    cls
    goto :eof
)

echo.
echo ========================================
echo 正在下载模型...
echo ========================================

:: 下载选择的模型 - 全部
echo %model_choice% | findstr /i "A" >nul && (
    echo [下载] 全部本地模型...
    start "Llama3.1" cmd /c "ollama pull llama3.1:latest"
    start "Qwen3:8b" cmd /c "ollama pull qwen3:8b"
    start "DeepSeek-R1:8b" cmd /c "ollama pull deepseek-r1:8b"
    start "Gemma3:12b" cmd /c "ollama pull gemma3:12b"
)

:: 下载选择的模型 - Llama3.1
echo %model_choice% | findstr /i "B" >nul && (
    echo [下载] llama3.1:latest...
    start "Llama3.1" cmd /c "ollama pull llama3.1:latest"
)

:: 下载选择的模型 - Qwen3:8b
echo %model_choice% | findstr /i "C" >nul && (
    echo [下载] qwen3:8b...
    start "Qwen3:8b" cmd /c "ollama pull qwen3:8b"
)

:: 下载选择的模型 - DeepSeek-R1:8b
echo %model_choice% | findstr /i "D" >nul && (
    echo [下载] deepseek-r1:8b...
    start "DeepSeek-R1:8b" cmd /c "ollama pull deepseek-r1:8b"
)

:: 下载选择的模型 - Gemma3:12b
echo %model_choice% | findstr /i "E" >nul && (
    echo [下载] gemma3:12b...
    start "Gemma3:12b" cmd /c "ollama pull gemma3:12b"
)

echo.
echo [✓] 模型下载已启动！
echo [提示] 下载将在各自的窗口中进行
echo [提示] 请等待下载完成后关闭窗口
echo.
echo ========================================
echo 正在启动服务...
echo ========================================

cd /d "%~dp0"
start "AI 模拟箱" cmd /c "timeout /t 2 >nul && python -m http.server 6523"
start "" "http://localhost:6523/ai_sandbox/"
echo [✓] 服务器已启动，浏览器已打开
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
pause

::=======================================
:: 快速启动
::=======================================
:quick_start
echo.
echo ========================================
echo     快速启动模式
echo ========================================

echo [检查] 正在检查 qwen3:8b 模型...
ollama list | findstr /i "qwen3" >nul
if %errorlevel% neq 0 (
    echo [下载] 正在下载 qwen3:8b...
    echo [提示] 请等待下载完成窗口自动关闭...
    start "Qwen3:8b 下载" cmd /c "ollama pull qwen3:8b && echo. && echo [✓] 下载完成！按任意键关闭窗口... && pause >nul"
    echo [提示] 正在等待模型下载完成...
    timeout /t 10 /nobreak >nul
) else (
    echo [✓] qwen3:8b 已存在
)

echo.
echo [1/2] 启动 Ollama 服务...
curl -s http://localhost:11434 >nul 2>&1
if %errorlevel% neq 0 (
    start "Ollama 服务" cmd /c "ollama serve"
    timeout /t 3 /nobreak >nul
)

echo [2/2] 启动本地服务器...
echo.
echo ========================================
echo 正在打开浏览器...
echo ========================================

cd /d "%~dp0"
start "AI 模拟箱" cmd /c "timeout /t 2 >nul && python -m http.server 6523"
timeout /t 2 /nobreak >nul
start "" "http://localhost:6523/ai_sandbox/"
echo [✓] 服务器已启动
echo [✓] 浏览器已打开
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
pause

::=======================================
:: 查看已下载的模型
::=======================================
:list_models
echo.
echo ========================================
echo     已下载的模型列表
echo ========================================
echo.
ollama list
echo.
pause
cls
goto :eof
