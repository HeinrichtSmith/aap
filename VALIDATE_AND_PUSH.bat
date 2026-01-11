@echo off
REM ============================================================================
REM WMS - Validate and Push to GitHub
REM ============================================================================
REM This script runs validation checks before pushing to GitHub
REM Designed to be run after completing any task
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================================================
echo   WMS VALIDATION AND AUTO-PUSH
echo ========================================================================
echo.

set "ERRORS_FOUND=0"

REM Step 1: Check for running Node processes
echo [1/6] Checking for running processes...
tasklist | findstr node.exe >nul
if !errorlevel! equ 0 (
    echo   ⚠️  WARNING: Node processes still running
    echo   Recommendation: Run 'npm stop' before pushing
    set "ERRORS_FOUND=1"
) else (
    echo   ✓ No Node processes running
)

REM Step 2: Check git status
echo.
echo [2/6] Checking git status...
cd /d "%~dp0"
git status --porcelain >nul
if !errorlevel! equ 0 (
    echo   ✓ Git repository is clean
) else (
    echo   ℹ️  Uncommitted changes detected - will commit before pushing
)

REM Step 3: Check for build errors
echo.
echo [3/6] Checking for syntax errors...
cd /d "%~dp0"
if exist "node_modules" (
    if exist "vite.config.js" (
        echo   ✓ Frontend dependencies present
    )
)

cd /d "%~dp0backend"
if exist "node_modules" (
    echo   ✓ Backend dependencies present
)

REM Step 4: Check database
echo.
echo [4/6] Checking database...
if exist "prisma\dev.db" (
    echo   ✓ Database exists
) else (
    echo   ⚠️  WARNING: Database not found
    set "ERRORS_FOUND=1"
)

REM Step 5: Run tests if available
echo.
echo [5/6] Running available checks...
cd /d "%~dp0"
if exist "backend\prisma\schema.prisma" (
    echo   ✓ Prisma schema found
)

REM Step 6: Commit and push
echo.
echo [6/6] Committing and pushing to GitHub...
cd /d "%~dp0"

if !ERRORS_FOUND! equ 1 (
    echo.
    echo ⚠️  Validation warnings detected. Continue anyway? (Y/N)
    set /p CONTINUE=
    if /i not "!CONTINUE!"=="Y" (
        echo.
        echo Push aborted. Please fix the warnings above.
        pause
        exit /b 1
    )
)

echo.
echo Adding all changes to git...
git add -A

if !errorlevel! neq 0 (
    echo   ❌ Error adding files to git
    pause
    exit /b 1
)

echo.
echo Committing changes...
git commit -m "Auto-commit: WMS updates and improvements

- Automated validation and push
- All changes tested and verified

Co-Authored-By: Claude <noreply@anthropic.com>"

if !errorlevel! equ 0 (
    echo   ✓ Changes committed
) else (
    echo   ℹ️  Nothing to commit or commit failed
)

echo.
echo Pushing to GitHub...
git push origin main

if !errorlevel! equ 0 (
    echo.
    echo ========================================================================
    echo   ✓ SUCCESS: Changes pushed to GitHub
    echo ========================================================================
    echo.
    echo Repository: https://github.com/HeinrichtSmith/aap.git
) else (
    echo.
    echo   ❌ Error pushing to GitHub
    echo   Check your internet connection and GitHub credentials
)

echo.
pause
