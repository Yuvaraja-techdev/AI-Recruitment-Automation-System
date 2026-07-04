@echo off
title AI Recruitment Automation System Launcher
echo ====================================================================
echo   Launching AI Recruitment Automation System (Backend ^& Frontend)
echo ====================================================================

:: 1. Launch FastAPI Backend
echo [1/2] Starting FastAPI Backend on Port 8000...
start "RecruitAI Backend" cmd /k "cd backend && .\venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

:: 2. Launch Vite Frontend
echo [2/2] Starting Vite Frontend...
start "RecruitAI Frontend" cmd /k "cd frontend && npm run dev"

echo ====================================================================
echo   All systems launched!
echo   - Backend API Docs: http://127.0.0.1:8000/docs
echo   - Frontend Portal:  http://localhost:5173
echo ====================================================================
echo Press any key to close this launcher console (processes remain active).
pause > nul
