@echo off
REM ############################################################################
REM Velocity Smart-Traffic Testbed - Startup Script (Windows)
REM 
REM This script checks prerequisites and starts the Velocity server
REM ############################################################################

setlocal enabledelayedexpansion

echo ============================================================
echo   Velocity Smart-Traffic Testbed
echo   Startup Script (Windows)
echo ============================================================
echo.

REM Check Python
echo Checking Python version...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python version: %PYTHON_VERSION%

REM Check if we're in the right directory
if not exist "server.py" (
    echo [ERROR] server.py not found. Please run this script from the velocity-python directory.
    pause
    exit /b 1
)

REM Check dependencies
echo Checking dependencies...
python -c "import flask, flask_socketio, eventlet" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Dependencies not installed or incomplete.
    echo Installing dependencies from requirements.txt...
    
    if exist "requirements.txt" (
        python -m pip install -r requirements.txt
        echo [OK] Dependencies installed
    ) else (
        echo [ERROR] requirements.txt not found
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies OK
)

REM Get local IP address
echo Detecting local IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP_RAW=%%a
    set LOCAL_IP=!IP_RAW:~1!
    goto :found_ip
)
:found_ip

if defined LOCAL_IP (
    echo [OK] Local IP: %LOCAL_IP%
) else (
    echo [WARNING] Could not detect IP address
    set LOCAL_IP=YOUR_IP
)

REM Display access information
echo.
echo ============================================================
echo Starting Velocity server...
echo.
echo Access URLs:
echo   Localhost:
echo     Vehicle: http://localhost:5000/vehicle.html
echo     Signal:  http://localhost:5000/signal.html
echo     Status:  http://localhost:5000/status
echo.
if defined LOCAL_IP (
    echo   LAN (for mobile devices):
    echo     Vehicle: http://%LOCAL_IP%:5000/vehicle.html
    echo     Signal:  http://%LOCAL_IP%:5000/signal.html
)
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

REM Start the server
python server.py

pause


