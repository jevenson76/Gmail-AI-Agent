@echo off
echo =======================================
echo Gmail AI Agent - Windows Build Script
echo =======================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in your PATH.
    echo Please install Node.js with npm from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Checking for dependencies...
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install dependencies.
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo.
echo Please select the build type:
echo 1. Full Package (Installer + Portable)
echo 2. Installer Only
echo 3. Portable Only
echo.

set /p choice="Enter your choice (1-3): "

echo.
if "%choice%"=="1" (
    echo Building full Windows package (Installer + Portable)...
    npm run build:win
) else if "%choice%"=="2" (
    echo Building Windows installer...
    npm run build:win-installer
) else if "%choice%"=="3" (
    echo Building portable Windows executable...
    npm run build:win-portable
) else (
    echo Invalid choice. Exiting.
    pause
    exit /b 1
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo Build failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo =======================================
echo Build completed successfully!
echo.
echo Your application has been built and is available in the "release" folder.
echo =======================================
echo.

pause 