@echo off
echo Launching Gmail AI Agent Protocol Registration Assistant...

:: Check for administrative privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

if %errorlevel% neq 0 (
    echo Administrator privileges are required to register protocol handlers.
    echo.
    echo Please right-click on this batch file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

:: Execute the registration script
node protocol-assistant.js

pause 