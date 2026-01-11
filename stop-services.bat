@echo off
setlocal enabledelayedexpansion

REM ========================================
REM Enhanced WMS Service Stop Script
REM Aggressively stops all services and verifies cleanup
REM ========================================

echo.
echo ========================================
echo   WMS SERVICE STOP - Enhanced
echo ========================================
echo.

set BACKEND_PORT=3001
set FRONTEND_PORT=5173
set MAX_WAIT=10
set WAIT_COUNT=0

REM Step 1: Kill processes on backend port
echo [INFO] Attempting to stop Backend API on port %BACKEND_PORT%...

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%BACKEND_PORT%"') do (
    echo [STOP] Found Backend process (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Successfully killed Backend process (PID: %%a)
    ) else (
        echo [WARNING] Failed to kill PID %%a, process may already be terminating
    )
)

REM Step 2: Kill processes on frontend port
echo [INFO] Attempting to stop Frontend (Vite) on port %FRONTEND_PORT%...

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%FRONTEND_PORT%"') do (
    echo [STOP] Found Frontend process (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Successfully killed Frontend process (PID: %%a)
    ) else (
        echo [WARNING] Failed to kill PID %%a, process may already be terminating
    )
)

timeout /t 2 /nobreak >nul

REM Step 3: Wait and verify ports are free
echo.
echo [INFO] Verifying ports are free...
:WaitLoopBackend
set /a WAIT_COUNT+=1
netstat -aon | findstr ":%BACKEND_PORT%" >nul 2>&1
if %errorlevel% equ 0 (
    if %WAIT_COUNT% lss %MAX_WAIT% (
        echo [WAIT] Backend port %BACKEND_PORT% still in use... (%WAIT_COUNT%/%MAX_WAIT%)
        for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%BACKEND_PORT%"') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 1 /nobreak >nul
        goto WaitLoopBackend
    ) else (
        echo [WARNING] Backend port %BACKEND_PORT% still occupied after %MAX_WAIT% seconds
    )
)

set WAIT_COUNT=0
:WaitLoopFrontend
set /a WAIT_COUNT+=1
netstat -aon | findstr ":%FRONTEND_PORT%" >nul 2>&1
if %errorlevel% equ 0 (
    if %WAIT_COUNT% lss %MAX_WAIT% (
        echo [WAIT] Frontend port %FRONTEND_PORT% still in use... (%WAIT_COUNT%/%MAX_WAIT%)
        for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%FRONTEND_PORT%"') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 1 /nobreak >nul
        goto WaitLoopFrontend
    ) else (
        echo [WARNING] Frontend port %FRONTEND_PORT% still occupied after %MAX_WAIT% seconds
    )
)

REM Step 4: Force kill any remaining processes
echo.
echo [INFO] Force-killing any remaining processes on ports...

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%BACKEND_PORT%"') do (
    echo [FORCE] Killing backend process (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%FRONTEND_PORT%"') do (
    echo [FORCE] Killing frontend process (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Step 5: Final verification
timeout /t 2 /nobreak >nul

set ALL_STOPPED=1

netstat -aon | findstr ":%BACKEND_PORT%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [ERROR] Backend still running on port %BACKEND_PORT%!
    set ALL_STOPPED=0
) else (
    echo [OK] Backend port %BACKEND_PORT% is free
)

netstat -aon | findstr ":%FRONTEND_PORT%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [ERROR] Frontend still running on port %FRONTEND_PORT%!
    set ALL_STOPPED=0
) else (
    echo [OK] Frontend port %FRONTEND_PORT% is free
)

echo.
echo ========================================
if %ALL_STOPPED% equ 1 (
    echo   ALL SERVICES STOPPED SUCCESSFULLY
) else (
    echo   WARNING: Some services may still be running
    echo   Try running: taskkill /F /IM node.exe
)
echo ========================================
echo.

exit /b %ALL_STOPPED%