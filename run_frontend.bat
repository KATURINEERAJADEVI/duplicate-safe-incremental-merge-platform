@echo off
title Duplicate-Safe Platform - Frontend Server
cd /d "%~dp0frontend"
echo ====================================================
echo Starting Frontend (Vite + React) on port 5173...
echo ====================================================
npm run dev
pause
