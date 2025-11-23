@echo off
REM Chemical Equipment Parameter Visualizer - Backend Runner
REM This script starts the Django REST API server
REM Make sure you've run setup.bat first and created a superuser

echo ========================================
echo  Chemical Equipment Parameter Visualizer
echo  Starting Django Backend Server
echo ========================================
echo.

REM Navigate to backend directory
cd backend

REM Check if virtual environment should be activated (optional)
REM if exist "venv\Scripts\activate.bat" call venv\Scripts\activate.bat

echo Starting Django development server...
echo Backend will be available at: http://127.0.0.1:8000
echo API endpoints will be at: http://127.0.0.1:8000/api/
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start Django server on default port 8000
python manage.py runserver

echo.
echo Backend server stopped.
pause