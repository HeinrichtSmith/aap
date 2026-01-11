@echo off
setlocal enabledelayedexpansion

REM ========================================
REM WMS MASTER RESTART SCRIPT
REM Authoritative restart mechanism - ALWAYS stops first
REM ========================================

echo.
echo =====================================================
echo.
echo       WMS - MASTER RESTART SCRIPT
echo.
echo =====================================================
echo.

set SCRIPT_DIR=%~dp0
set BACKEND_PORT=3001
set FRONTEND_PORT=5173
set STARTUP_TIMEOUT=30
set ELAPSED=0

REM Step 1: Stop all existing services
echo.
echo [STEP 1/4] Stopping existing services...
echo -----------------------------------------------------
call "%SCRIPT_DIR%stop-services.bat"
if %errorlevel% neq 0 (
    echo.
    echo [FATAL] Failed to stop services cleanly
    echo [FATAL] Cannot proceed with restart
    echo.
    pause
    exit /b 1
)

REM Step 2: Verify ports are free
echo.
echo [STEP 2/4] Verifying ports are free...
echo -----------------------------------------------------

netstat -aon | findstr :%BACKEND_PORT% >nul 2>&1
if %errorlevel% equ 0 (
    echo [ERROR] Backend port %BACKEND_PORT% is still occupied!
    echo [ERROR] Port verification failed
    echo.
    echo [HELP] Run: taskkill /F /IM node.exe
    echo        Then try again
    echo.
    pause
    exit /b 1
)
echo [OK] Backend port %BACKEND_PORT% is free

netstat -aon | findstr :%FRONTEND_PORT% >nul 2>&1
if %errorlevel% equ 0 (
    echo [ERROR] Frontend port %FRONTEND_PORT% is still occupied!
    echo [ERROR] Port verification failed
    echo.
    echo [HELP] Run: taskkill /F /IM node.exe
    echo        Then try again
    echo.
    pause
    exit /b 1
)
echo [OK] Frontend port %FRONTEND_PORT% is free

REM Step 3: Start services using concurrently
echo.
echo [STEP 3/4] Starting backend and frontend...
echo -----------------------------------------------------

cd /d "%SCRIPT_DIR%"
echo [START] Backend API on port %BACKEND_PORT%...
echo [START] Frontend (Vite) on port %FRONTEND_PORT%...
echo.
echo -----------------------------------------------------
echo   Services starting... (Press Ctrl+C to stop both)
echo -----------------------------------------------------
echo.

REM Use npm run restart:all which uses concurrently
npm run restart:all

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start services
    echo.
    pause
    exit /b 1
)

REM Step 4: Verify services started
echo.
echo [STEP 4/4] Waiting for services to start...
echo -----------------------------------------------------

:WaitLoop
set /a ELAPSED+=2
if %ELAPSED% geq %STARTUP_TIMEOUT% (
    echo [WARNING] Startup verification timed out
    echo [WARNING] Services may still be starting
    echo.
    echo [INFO] Backend:  http://localhost:%BACKEND_PORT%/api
    echo [INFO] Frontend: http://localhost:%FRONTEND_PORT%/
    goto :Success
)

timeout /t 2 /nobreak >nul

REM Check backend
netstat -aon | findstr :%BACKEND_PORT% >nul 2>&1
set BACKEND_READY=%errorlevel%

REM Check frontend
netstat -aon | findstr :%FRONTEND_PORT% >nul 2>&1
set FRONTEND_READY=%errorlevel%

if %BACKEND_READY% equ 0 (
    echo [OK] Backend is listening on port %BACKEND_PORT%
) else (
    echo [WAIT] Backend not ready yet (%ELAPSED%s/%STARTUP_TIMEOUT%s)
)

if %FRONTEND_READY% equ 0 (
    echo [OK] Frontend is listening on port %FRONTEND_PORT%
) else (
    echo [WAIT] Frontend not ready yet (%ELAPSED%s/%STARTUP_TIMEOUT%s)
)

if %BACKEND_READY% equ 0 (
    if %FRONTEND_READY% equ 0 (
        goto :Success
    )
)

goto WaitLoop

:Success
echo.
echo =====================================================
echo.
echo   [SUCCESS] All services started successfully!
echo.
echo =====================================================
echo.
echo   Backend:  http://localhost:%BACKEND_PORT%/api
echo   Frontend: http://localhost:%FRONTEND_PORT%/
echo.
echo =====================================================
echo.

exit /b 0