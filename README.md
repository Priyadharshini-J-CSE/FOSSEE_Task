# Chemical Equipment Parameter Visualizer

A hybrid Web + Desktop application for analyzing chemical equipment data with Django backend, React web frontend, and PyQt5 desktop frontend.

## Features

- CSV file upload and data analysis
- Summary statistics calculation
- Data visualization with charts
- History management (last 5 datasets)
- PDF report generation
- Basic authentication
- Consistent UI/UX across web and desktop

## Quick Start (Windows)

### Option 1: Automated Setup (Recommended)
```cmd
# Run the automated setup script (installs all dependencies)
setup.bat

# Create a Django superuser (required for login)
cd backend
python manage.py createsuperuser

# Run all components using batch files:
run_backend.bat    # Starts Django server on http://127.0.0.1:8000
run_web.bat        # Starts React app on http://localhost:3000
run_desktop.bat    # Starts PyQt5 desktop application
```

### Option 2: Manual Setup

## Prerequisites
- Python 3.8+ installed
- Node.js 14+ installed
- npm package manager

## Detailed Setup Instructions

### 1. Backend Setup (Django)

```cmd
# Navigate to backend directory
cd backend

# Install Python dependencies
# This installs Django, DRF, pandas, CORS headers, reportlab, etc.
pip install -r requirements.txt

# Create database tables from models
# This creates the SQLite database and applies migrations
python manage.py makemigrations api
python manage.py migrate

# Create admin user for authentication (REQUIRED)
# You'll be prompted to enter username, email, and password
python manage.py createsuperuser

# Start the Django development server
# Backend will run on http://127.0.0.1:8000
python manage.py runserver
```

**Backend Dependencies Explained:**
- `Django==4.2.7` - Main web framework
- `djangorestframework==3.14.0` - REST API framework
- `pandas>=2.0.0` - Data analysis and CSV processing
- `django-cors-headers==4.3.1` - Enables frontend-backend communication
- `reportlab==4.0.7` - PDF report generation
- `numpy>=1.24.0` - Numerical computations

### 2. Web Frontend Setup (React)

```cmd
# Navigate to web frontend directory
cd frontend-web

# Install Node.js dependencies
# This installs React, Chart.js, axios for API calls, etc.
npm install

# Start the React development server
# Web app will run on http://localhost:3000
npm start
```

**Web Frontend Dependencies:**
- React.js - Frontend framework
- Chart.js - Data visualization charts
- Axios - HTTP client for API requests
- Bootstrap - UI styling

### 3. Desktop Frontend Setup (PyQt5)

```cmd
# Navigate to desktop frontend directory
cd frontend-desktop

# Install PyQt5 and other dependencies
pip install -r requirements.txt

# Start the desktop application
python main.py
```

**Desktop Frontend Dependencies:**
- PyQt5 - Desktop GUI framework
- matplotlib - Chart generation
- requests - HTTP client for API calls
- pandas - Data processing

## Running the Application

### Step-by-Step Execution:

1. **Start Backend First (REQUIRED)**
   ```cmd
   cd backend
   python manage.py runserver
   ```
   - Backend must be running for frontends to work
   - Provides API endpoints at http://127.0.0.1:8000/api/

2. **Start Web Frontend (Optional)**
   ```cmd
   cd frontend-web
   npm start
   ```
   - Opens browser at http://localhost:3000
   - Modern web interface with responsive design

3. **Start Desktop Frontend (Optional)**
   ```cmd
   cd frontend-desktop
   python main.py
   ```
   - Opens native desktop application window
   - Same functionality as web version

### Authentication
- Both frontends require login with Django superuser credentials
- Create superuser: `python manage.py createsuperuser`
- Use these credentials to login in web/desktop app

## Usage Workflow

1. **Login**: Use Django superuser credentials
2. **Upload Data**: Select CSV file (use sample_equipment_data.csv for testing)
3. **View Analysis**: See data table, summary statistics, and charts
4. **History**: Access last 5 uploaded datasets
5. **Reports**: Generate PDF reports from history section

## Sample Data Format

The `sample_equipment_data.csv` contains:
- Equipment Name (text)
- Type (Pump/Valve/Tank/etc.)
- Flowrate (numeric, L/min)
- Pressure (numeric, bar)
- Temperature (numeric, °C)

## API Endpoints

- `POST /api/upload/` - Upload and process CSV file
- `GET /api/history/` - Retrieve upload history (last 5)
- `GET /api/dataset/<id>/` - Get specific dataset details
- `POST /api/report/` - Generate PDF report for dataset

## Troubleshooting

### Common Issues:

1. **Backend won't start**
   - Check Python version (3.8+)
   - Run `pip install -r requirements.txt`
   - Ensure migrations: `python manage.py migrate`

2. **Web frontend won't start**
   - Check Node.js version (14+)
   - Delete node_modules and run `npm install`
   - Check if port 3000 is available

3. **Desktop app won't start**
   - Install PyQt5: `pip install PyQt5`
   - Check Python GUI support

4. **Login fails**
   - Create superuser: `python manage.py createsuperuser`
   - Use exact credentials from superuser creation

5. **CORS errors**
   - Ensure django-cors-headers is installed
   - Backend must run on 127.0.0.1:8000

## Tech Stack

- **Backend**: Django 4.2.7 + Django REST Framework
- **Web Frontend**: React.js + Chart.js + Bootstrap
- **Desktop Frontend**: PyQt5 + Matplotlib
- **Database**: SQLite (development)
- **Data Processing**: Pandas + NumPy
- **Reports**: ReportLab PDF generation