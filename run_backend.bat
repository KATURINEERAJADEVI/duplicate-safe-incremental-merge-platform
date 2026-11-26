@echo off
title Duplicate-Safe Platform - Backend Server
cd /d "%~dp0"
echo ====================================================
echo Starting Backend (FastAPI + MySQL) on port 8000...
echo ====================================================
"C:\Users\Akkhash\anaconda3\python.exe" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
