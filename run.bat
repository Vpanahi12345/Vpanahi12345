@echo off
chcp 65001 >nul
title AmlakPro - Run (Development)
where node >nul 2>nul
if errorlevel 1 (
    color 4F
    echo  [ERROR] Node.js is not installed! Install LTS version from https://nodejs.org
    pause
    exit /b 1
)
if not exist node_modules (
    echo  Installing dependencies (first run, needs internet)...
    call npm install --no-audit --no-fund
)
echo  Starting AmlakPro ...
call npx electron .
