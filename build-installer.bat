@echo off
chcp 65001 >nul
title AmlakPro - Build Windows Installer
echo ==================================================
echo    AmlakPro - Building Windows Installer (Setup.exe)
echo ==================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
    color 4F
    echo  [ERROR] Node.js is not installed on this system!
    echo.
    echo  1. Go to https://nodejs.org
    echo  2. Download and install the LTS version
    echo  3. Run this file again
    echo.
    pause
    exit /b 1
)
echo  Step 1/2 : Installing dependencies (first time only, needs internet)...
call npm install --no-audit --no-fund
if errorlevel 1 (
    color 4F
    echo  [ERROR] npm install failed. Check your internet connection.
    pause
    exit /b 1
)
echo.
echo  Step 2/2 : Building Setup.exe and Portable.exe ...
call npx electron-builder --win
if errorlevel 1 (
    color 4F
    echo  [ERROR] Build failed. Check your internet connection and try again.
    pause
    exit /b 1
)
color 2F
echo.
echo  =========================================================
echo   DONE! Your installer files are ready in the "dist" folder:
echo      - AmlakPro-Setup-1.0.0.exe   (installer)
echo      - AmlakPro-Portable-1.0.0.exe (portable, no install)
echo  =========================================================
start "" explorer "%~dp0dist"
echo.
pause
