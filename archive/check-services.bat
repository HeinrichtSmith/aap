@echo off
setlocal

REM ========================================
REM WMS Service Status Checker
REM ========================================

echo.
echo ========================================
echo   WMS Service Status Checker
echo ========================================
echo.

REM Check backend
netstat -aon | findstr :3001 > nul 2>&1
if %errorlevel% equ 0 (
    echo [RUNNING] Backend server on port 3001
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
        set BACKEND_PID=%%a
        goto :found_backend
    )
    :found_backend
    echo           PID: %BACKEND_PID%
    echo           URL: http://localhost:3001/api
) else (
    echo [STOPPED] Backend server (port 3001)
)

echo.

REM Check frontend
netstat -aon | findstr :5173 > nul 2>&1
if %errorlevel% equ 0 (
    echo [RUNNING] Frontend server on port 5173
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
        set FRONTEND_PID=%%a
        goto :found_frontend
    )
    :found_frontend
    echo           PID: %FRONTEND_PID%
    echo           URL: http://localhost:5173
) else (
    echo [STOPPED] Frontend server (port 5173)
)

echo.
echo ========================================
echo.

REM Check for port conflicts
netstat -aon | findstr ":3001" | find /c /v "" > temp.txt
set /p BACKEND_COUNT=<temp.txt
netstat -aon | findstr ":5173" | find /c /v "" > temp.txt
set /p FRONTEND_COUNT=<temp.txt
del temp.txt

if %BACKEND_COUNT% gtr 1 (
    echo [WARNING] Multiple processes detected on port 3001!
) else if %FRONTEND_COUNT% gtr 1 (
    echo [WARNING] Multiple processes detected on port 5173!
)

echo.
echo Press any key to close...
pause > nul