@echo off
chcp 65001 >nul
title Download Ollama

echo ========================================
echo     Downloading Ollama...
echo ========================================
echo.

powershell -Command "irm https://ollama.com/install.ps1 | iex"

echo.
echo ========================================
echo [OK] Ollama installed!
echo Please restart this computer if needed.
echo ========================================
echo.
pause
