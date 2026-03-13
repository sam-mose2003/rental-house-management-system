@echo off
title RHMS Server Manager
echo ========================================
echo RHMS Rental House Management System
echo ========================================
echo.
echo Starting servers...
echo.

echo [1] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && python app.py"

echo [2] Starting Frontend Server...
timeout /t 3 >nul
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo.
echo Frontend: http://localhost:5176
echo Admin Dashboard: http://localhost:5000/dashboard
echo.
echo Press any key to exit...
pause >nul
