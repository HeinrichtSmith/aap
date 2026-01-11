@echo off
setlocal

REM ========================================
REM WMS Service Verification Script
REM Checks for orphaned processes and port conflicts
REM ========================================

echo.
echo ========================================
echo   WMS SERVICE VERIFICATION
echo ========================================
echo.

set BACKEND_PORT=3001
set FRONTEND_PORT=5173
set ISSUES_FOUND=0

REM Check for processes on backend port
echo [CHECK] Backend port %BACKEND_PORT%...
netstat -aon | findstr :%BACKEND_PORT% >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Backend port %BACKEND_PORT% is in use!
    echo.
    netstat -aon | findstr :%BACKEND_PORT%
    echo.
    set /a ISSUES_FOUND+=1
) else (
    echo [OK] Backend port %BACKEND_PORT% is free
)

REM Check for processes on frontend port
echo.
echo [CHECK] Frontend port %FRONTEND_PORT%...
netstat -aon | findstr :%FRONTEND_PORT% >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Frontend port %FRONTEND_PORT% is in use!
    echo.
    netstat -aon | findstr :%FRONTEND_PORT%
    echo.
    set /a ISSUES_FOUND+=1
) else (
    echo [OK] Frontend port %FRONTEND_PORT% is free
)

REM Check for node.exe processes
echo.
echo [CHECK] Node.js processes running...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /c /i "node.exe" >nul
if %errorlevel% equ 0 (
    echo [INFO] Found running Node.js processes:
    tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
) else (
    echo [OK] No Node.js processes running
)

REM Check for cmd.exe processes (possible orphans)
echo.
echo [CHECK] Command prompt processes...
tasklist /FI "IMAGENAME eq cmd.exe" 2>nul | find /c /i "cmd.exe" >nul
if %errorlevel% equ 0 (
    for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq cmd.exe" /FO CSV ^| find /c /i "cmd.exe"') do (
        echo [INFO] Found %%a cmd.exe processes (possible orphaned terminals)
    )
)

REM Summary
echo.
echo ========================================
if %ISSUES_FOUND% gtr 0 (
    echo   VERIFICATION FAILED
    echo.
    echo   Issues found: %ISSUES_FOUND%
    echo.
    echo   Recommended actions:
    echo   1. Run: stop-services.bat
    echo   2. Or: taskkill /F /IM node.exe
    echo   3. Then: restart-all.bat
) else (
    echo   VERIFICATION PASSED
    echo.
    echo   All ports are free
    echo   No conflicts detected
)
echo ========================================
echo.

exit /b %ISSUES_FOUND%