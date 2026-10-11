@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title RevenueIQ - Revenue Intelligence Platform

rem The Python environment is shared by every RevenueIQ folder on this PC, so
rem packages are installed once - not again for every copy or new version.
set "ENVDIR=%LOCALAPPDATA%\RevenueIQ\env"
set "VPY=%ENVDIR%\Scripts\python.exe"
set "LOCK=%ENVDIR%\requirements.lock"
set "RETRIED="

echo.
echo  ============================================================
echo    RevenueIQ - Revenue Intelligence Platform
echo  ============================================================
echo.

rem ---- Fast path: environment ready and requirements unchanged ----------
if exist "%VPY%" if exist "%LOCK%" (
    fc /b "requirements.txt" "%LOCK%" >nul 2>&1 && goto start
)

:setup
rem ---- 1. Find Python 3.10+ (first run only) -----------------------------
set "PY="
for %%V in (3.13 3.12 3.11 3.14 3.10) do (
    if not defined PY (
        py -%%V -c "import sys" >nul 2>&1 && set "PY=py -%%V"
    )
)
if not defined PY (
    python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1 && set "PY=python"
)
if not defined PY (
    echo  [ERROR] Python 3.10 or newer was not found.
    echo.
    echo  Install it from https://www.python.org/downloads/
    echo  and tick "Add python.exe to PATH" during installation.
    echo  Then double-click run.bat again.
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%i in ('%PY% -c "import sys; print(sys.version.split()[0])"') do set "PYVER=%%i"
echo  [setup] Using Python %PYVER%

rem ---- 2. Shared virtual environment + packages (first run only) ---------
if not exist "%VPY%" (
    echo  [setup] Creating the shared environment in %ENVDIR% ...
    if not exist "%LOCALAPPDATA%\RevenueIQ" mkdir "%LOCALAPPDATA%\RevenueIQ"
    %PY% -m venv "%ENVDIR%"
    if errorlevel 1 (
        echo  [ERROR] Could not create the Python environment.
        pause
        exit /b 1
    )
)
echo  [setup] Installing packages - one time only, about 1-2 minutes...
"%VPY%" -m pip install -r requirements.txt --prefer-binary --disable-pip-version-check --no-input -q
if errorlevel 1 (
    echo.
    echo  [ERROR] Installing packages failed. Check your internet connection
    echo  and run run.bat again.
    pause
    exit /b 1
)
copy /y "requirements.txt" "%LOCK%" >nul
echo  [setup] Done. Next starts will be fast.
echo.

:start
"%VPY%" run.py
if errorlevel 3 if not errorlevel 4 (
    rem A package is missing or broken: reinstall once, then start again.
    if not defined RETRIED (
        set "RETRIED=1"
        del "%LOCK%" >nul 2>&1
        echo  [setup] Repairing the environment...
        goto setup
    )
)
if errorlevel 1 (
    echo.
    echo  [ERROR] RevenueIQ stopped with an error. See the messages above.
    echo  Tip: run reset.bat to rebuild the demo data, then run.bat again.
    echo.
    pause
)
endlocal
