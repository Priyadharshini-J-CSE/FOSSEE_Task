@echo off
REM Chemical Equipment Parameter Visualizer - Desktop Frontend Runner
REM This script starts the PyQt5 desktop application
REM Make sure backend is running first (run_backend.bat)

echo ========================================
echo  Chemical Equipment Parameter Visualizer
echo  Starting PyQt5 Desktop Application
echo ========================================
echo.

REM Navigate to desktop frontend directory
cd frontend-desktop

echo Starting PyQt5 desktop application...
echo Make sure backend is running at: http://127.0.0.1:8000
echo Desktop window will open shortly...
echo.
echo Close the application window to stop
echo.

REM Start PyQt5 desktop application
python main.py

echo.
echo Desktop application closed.
pause