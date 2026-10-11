@echo off
cd /d "%~dp0"
echo This deletes all RevenueIQ data (accounts, action cards, outcomes, model).
echo Fresh demo data is generated the next time you start run.bat.
echo.
set /p ok="Type YES to continue: "
if /i not "%ok%"=="YES" (
    echo Cancelled.
    pause
    exit /b 0
)
if exist "data" rmdir /s /q "data"
echo Data deleted. Double-click run.bat to start again.
pause
