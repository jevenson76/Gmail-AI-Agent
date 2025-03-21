@echo off
echo =======================================
echo Gmail AI Agent - Electron Dev Mode
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
echo Starting Gmail AI Agent in Electron development mode...
echo.
echo NOTE: This will run the application in development mode with hot-reloading.
echo Press Ctrl+C to stop the application.
echo.

npm run dev:electron

if %ERRORLEVEL% neq 0 (
    echo.
    echo Application exited with an error. Please check the messages above.
    pause
    exit /b 1
)

pause 