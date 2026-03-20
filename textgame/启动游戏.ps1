# AI文字游戏 - 本地服务器启动器
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI文字游戏 - 本地服务器启动器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请在浏览器访问: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "确保 Ollama 服务正在运行中..." -ForegroundColor Yellow
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

# 启动Python HTTP服务器
python -m http.server 8080
