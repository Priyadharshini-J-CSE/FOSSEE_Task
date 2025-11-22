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

## Setup Instructions

### 1. Backend (Django)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 2. Web Frontend (React)

```bash
cd frontend-web
npm install
npm start
```

### 3. Desktop Frontend (PyQt5)

```bash
cd frontend-desktop
pip install -r requirements.txt
python main.py
```

## Usage

1. Start the Django backend server
2. Launch either the web or desktop frontend
3. Login with your Django credentials
4. Upload the sample CSV file or your own equipment data
5. View data tables, charts, and summary statistics
6. Generate PDF reports from the history section

## Sample Data

The `sample_equipment_data.csv` file contains sample chemical equipment data with columns:
- Equipment Name
- Type
- Flowrate
- Pressure
- Temperature

## API Endpoints

- `POST /api/upload/` - Upload CSV file
- `GET /api/history/` - Get upload history
- `GET /api/dataset/<id>/` - Get specific dataset
- `POST /api/report/` - Generate PDF report

## Tech Stack

- **Backend**: Django + Django REST Framework
- **Web Frontend**: React.js + Chart.js
- **Desktop Frontend**: PyQt5 + Matplotlib
- **Database**: SQLite
- **Data Processing**: Pandas