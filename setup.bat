@echo off
echo Setting up Chemical Equipment Parameter Visualizer...

echo.
echo 1. Setting up Django backend...
cd backend
python -m pip install -r requirements.txt
python manage.py makemigrations api
python manage.py migrate
echo Backend setup complete!

echo.
echo 2. Setting up React web frontend...
cd ..\frontend-web
npm install
echo Web frontend setup complete!

echo.
echo 3. Setting up PyQt5 desktop frontend...
cd ..\frontend-desktop
python -m pip install -r requirements.txt
echo Desktop frontend setup complete!

echo.
echo Setup complete! 
echo.
echo To run the application:
echo 1. Start backend: cd backend && python manage.py runserver
echo 2. Start web frontend: cd frontend-web && npm start
echo 3. Start desktop frontend: cd frontend-desktop && python main.py
echo.
echo Don't forget to create a superuser: cd backend && python manage.py createsuperuser

pause