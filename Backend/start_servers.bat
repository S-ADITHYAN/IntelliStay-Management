@echo off
echo Setting up servers...

cd "ml model"

@REM REM Kill any Python processes that might be locking files
@REM taskkill /F /IM python.exe /FI "MEMUSAGE gt 0" 2>NUL
@REM taskkill /F /IM pythonw.exe /FI "MEMUSAGE gt 0" 2>NUL

@REM REM Wait a moment for processes to close
@REM timeout /t 2 /nobreak >NUL

@REM REM Try to remove existing venv if it exists
@REM if exist "venv" (
@REM     echo Removing existing virtual environment...
@REM     rd /s /q "venv" 2>NUL
@REM     REM If removal failed, just continue
@REM )

@REM REM Create new virtual environment with full path to python
@REM echo Creating virtual environment...
@REM "C:\Users\Asus\AppData\Local\Programs\Python\Python312\python.exe" -m venv venv

@REM REM Activate virtual environment using full path
echo Activating virtual environment...
call venv\Scripts\activate.bat

@REM REM Upgrade pip using python -m
@REM echo Upgrading pip...
@REM python -m ensurepip --upgrade
@REM python -m pip install --upgrade pip

REM Install required packages from requirements.txt
@REM echo Installing required packages...
@REM python -m pip install -r requirements.txt

REM Start Flask server
echo Starting Flask server...
start /B python flask_server.py

REM Wait for Flask server to initialize
echo Waiting for Flask server to start...
timeout /t 5

REM Keep virtual environment active for Flask server
REM Do not deactivate here

REM Return to parent directory and start Node.js server
cd ..
echo Starting Node.js server...
npm start

echo Both servers are now running.
pause 