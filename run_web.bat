@echo off
REM Chemical Equipment Parameter Visualizer - Web Frontend Runner
REM This script starts the React.js web application
REM Make sure backend is running first (run_backend.bat)

echo ========================================
echo  Chemical Equipment Parameter Visualizer
echo  Starting React Web Frontend
echo ========================================
echo.

REM Navigate to web frontend directory
cd frontend-web

echo Starting React development server...
echo Web app will be available at: http://localhost:3000
echo Make sure backend is running at: http://127.0.0.1:8000
echo.
echo The browser should open automatically
echo Press Ctrl+C to stop the server
echo.

REM Start React development server
npm start

echo.
echo Web frontend stopped.
pause