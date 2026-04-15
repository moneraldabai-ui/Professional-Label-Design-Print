@echo off
cd /d "%~dp0"
:: Kill server by PID file if available
if exist .server.pid (
    set /p PID=<.server.pid
    taskkill /pid %PID% /t /f >nul 2>&1
    del .server.pid >nul 2>&1
    echo Server stopped.
) else (
    echo No PID file found. Checking port 3001...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
        taskkill /pid %%a /t /f >nul 2>&1
        echo Killed process %%a on port 3001.
    )
)
:: Kill tray process (systray binary)
taskkill /im tray_windows_release.exe /f >nul 2>&1
echo Done.
pause
