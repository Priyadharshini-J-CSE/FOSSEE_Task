import sys
import requests
from PyQt5.QtWidgets import *
from PyQt5.QtCore import Qt
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import json

class EquipmentAnalyzer(QMainWindow):
    def __init__(self):
        super().__init__()
        self.api_base = 'http://localhost:8000/api'
        self.auth = None
        self.initUI()
        
    def initUI(self):
        self.setWindowTitle('Chemical Equipment Parameter Visualizer')
        self.setGeometry(100, 100, 1000, 700)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Layout
        layout = QVBoxLayout()
        central_widget.setLayout(layout)
        
        # Login section
        self.login_widget = QWidget()
        login_layout = QHBoxLayout()
        self.login_widget.setLayout(login_layout)
        
        login_layout.addWidget(QLabel('Username:'))
        self.username_input = QLineEdit()
        login_layout.addWidget(self.username_input)
        
        login_layout.addWidget(QLabel('Password:'))
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.Password)
        login_layout.addWidget(self.password_input)
        
        self.login_btn = QPushButton('Login')
        self.login_btn.clicked.connect(self.login)
        login_layout.addWidget(self.login_btn)
        
        layout.addWidget(self.login_widget)
        
        # Main content (initially hidden)
        self.main_widget = QWidget()
        self.main_widget.setVisible(False)
        main_layout = QVBoxLayout()
        self.main_widget.setLayout(main_layout)
        
        # Upload section
        upload_layout = QHBoxLayout()
        self.upload_btn = QPushButton('Upload CSV File')
        self.upload_btn.clicked.connect(self.upload_file)
        upload_layout.addWidget(self.upload_btn)
        main_layout.addLayout(upload_layout)
        
        # Summary section
        self.summary_label = QLabel('No data uploaded yet')
        main_layout.addWidget(self.summary_label)
        
        # Chart section
        self.figure = Figure(figsize=(10, 6))
        self.canvas = FigureCanvas(self.figure)
        main_layout.addWidget(self.canvas)
        
        # Data table
        self.table = QTableWidget()
        main_layout.addWidget(self.table)
        
        # History section
        history_layout = QVBoxLayout()
        history_layout.addWidget(QLabel('Upload History:'))
        self.history_list = QListWidget()
        self.history_list.itemDoubleClicked.connect(self.load_dataset)
        history_layout.addWidget(self.history_list)
        
        self.report_btn = QPushButton('Generate Report')
        self.report_btn.clicked.connect(self.generate_report)
        history_layout.addWidget(self.report_btn)
        
        main_layout.addLayout(history_layout)
        
        layout.addWidget(self.main_widget)
        
    def login(self):
        username = self.username_input.text()
        password = self.password_input.text()
        
        if username and password:
            self.auth = (username, password)
            self.login_widget.setVisible(False)
            self.main_widget.setVisible(True)
            self.load_history()
            
    def upload_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, 'Select CSV File', '', 'CSV Files (*.csv)')
        if file_path:
            try:
                with open(file_path, 'rb') as f:
                    files = {'file': f}
                    response = requests.post(f'{self.api_base}/upload/', files=files, auth=self.auth)
                    
                if response.status_code == 200:
                    data = response.json()
                    self.display_data(data['data'], data['summary'])
                    self.load_history()
                else:
                    QMessageBox.warning(self, 'Error', f'Upload failed: {response.json().get("error", "Unknown error")}')
                    
            except Exception as e:
                QMessageBox.critical(self, 'Error', f'Upload failed: {str(e)}')
                
    def display_data(self, data, summary):
        # Update summary
        summary_text = f"""
        Total Equipment: {summary['total_count']}
        Average Flowrate: {summary['avg_flowrate']:.2f}
        Average Pressure: {summary['avg_pressure']:.2f}
        Average Temperature: {summary['avg_temperature']:.2f}
        """
        self.summary_label.setText(summary_text)
        
        # Update chart
        self.figure.clear()
        ax = self.figure.add_subplot(111)
        
        types = list(summary['type_distribution'].keys())
        counts = list(summary['type_distribution'].values())
        
        ax.bar(types, counts, color=['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'])
        ax.set_title('Equipment Type Distribution')
        ax.set_xlabel('Equipment Type')
        ax.set_ylabel('Count')
        
        self.canvas.draw()
        
        # Update table
        if data:
            self.table.setRowCount(len(data))
            self.table.setColumnCount(5)
            self.table.setHorizontalHeaderLabels(['Equipment Name', 'Type', 'Flowrate', 'Pressure', 'Temperature'])
            
            for i, row in enumerate(data):
                self.table.setItem(i, 0, QTableWidgetItem(str(row['Equipment Name'])))
                self.table.setItem(i, 1, QTableWidgetItem(str(row['Type'])))
                self.table.setItem(i, 2, QTableWidgetItem(str(row['Flowrate'])))
                self.table.setItem(i, 3, QTableWidgetItem(str(row['Pressure'])))
                self.table.setItem(i, 4, QTableWidgetItem(str(row['Temperature'])))
                
    def load_history(self):
        try:
            response = requests.get(f'{self.api_base}/history/', auth=self.auth)
            if response.status_code == 200:
                history = response.json()
                self.history_list.clear()
                self.history_data = {}
                
                for item in history:
                    list_item = f"{item['name']} - {item['uploaded_at'][:10]}"
                    self.history_list.addItem(list_item)
                    self.history_data[list_item] = item['id']
                    
        except Exception as e:
            print(f'Failed to load history: {e}')
            
    def load_dataset(self, item):
        dataset_id = self.history_data[item.text()]
        try:
            response = requests.get(f'{self.api_base}/dataset/{dataset_id}/', auth=self.auth)
            if response.status_code == 200:
                data = response.json()
                self.display_data(data['data'], data['summary'])
        except Exception as e:
            QMessageBox.critical(self, 'Error', f'Failed to load dataset: {str(e)}')
            
    def generate_report(self):
        current_item = self.history_list.currentItem()
        if current_item:
            dataset_id = self.history_data[current_item.text()]
            try:
                response = requests.post(f'{self.api_base}/report/', 
                                       json={'dataset_id': dataset_id}, 
                                       auth=self.auth)
                
                if response.status_code == 200:
                    file_path, _ = QFileDialog.getSaveFileName(self, 'Save Report', 'report.pdf', 'PDF Files (*.pdf)')
                    if file_path:
                        with open(file_path, 'wb') as f:
                            f.write(response.content)
                        QMessageBox.information(self, 'Success', 'Report generated successfully!')
                        
            except Exception as e:
                QMessageBox.critical(self, 'Error', f'Report generation failed: {str(e)}')

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = EquipmentAnalyzer()
    window.show()
    sys.exit(app.exec_())