@echo off
setlocal

REM ========================================
REM WMS Application Startup Script
REM ========================================

echo.
echo ========================================
echo   WMS Application Startup Script
echo ========================================
echo.

REM Check if backend is already running
netstat -aon | findstr :3001 > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is already running on port 3001
    set BACKEND_RUNNING=1
) else (
    echo [INFO] Starting backend server...
    set BACKEND_RUNNING=0
)

REM Check if frontend is already running  
netstat -aon | findstr :5173 > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is already running on port 5173
    set FRONTEND_RUNNING=1
) else (
    echo [INFO] Starting frontend server...
    set FRONTEND_RUNNING=0
)

echo.
echo ========================================
echo.

REM Start backend if not running
if %BACKEND_RUNNING% equ 0 (
    echo [START] Starting backend on port 3001...
    start "WMS Backend" cmd /k "cd /d %~dp0 && node backend\src\server.js"
    timeout /t 2 > nul
)

REM Start frontend if not running
if %FRONTEND_RUNNING% equ 0 (
    echo [START] Starting frontend on port 5173...
    start "WMS Frontend" cmd /k "cd /d %~dp0 && node node_modules\vite\bin\vite.js --host"
    timeout /t 2 > nul
)

echo.
echo ========================================
echo   Startup Complete!
echo ========================================
echo.
echo Backend:  http://localhost:3001/api
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop all services
echo ========================================
echo.

REM Keep script running to maintain services
:loop
timeout /t 5 > nul
goto loop