import React, { useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const API_BASE = 'http://localhost:8000/api';

function App() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [auth, setAuth] = useState({ username: '', password: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ username: '', password: '', email: '' });

  const login = async () => {
    try {
      const response = await axios.post(`${API_BASE}/login/`, {
        username: auth.username,
        password: auth.password
      });
      setIsAuthenticated(true);
      loadHistory();
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || 'Invalid credentials'));
    }
  };

  const register = async () => {
    try {
      await axios.post(`${API_BASE}/register/`, registerData);
      alert('Registration successful! Please login.');
      setShowRegister(false);
      setRegisterData({ username: '', password: '', email: '' });
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuth({ username: '', password: '' });
    setData([]);
    setSummary(null);
    setHistory([]);
  };

  const uploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/upload/`, formData, {
        auth: { username: auth.username, password: auth.password }
      });
      setData(response.data.data);
      setSummary(response.data.summary);
      loadHistory();
    } catch (error) {
      alert('Upload failed: ' + error.response?.data?.error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/history/`, {
        auth: { username: auth.username, password: auth.password }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to load history');
    }
  };

  const generateReport = async (datasetId) => {
    try {
      const response = await axios.post(`${API_BASE}/report/`, 
        { dataset_id: datasetId },
        { 
          auth: { username: auth.username, password: auth.password },
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'report.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      alert('Report generation failed');
    }
  };

  const barChartData = summary ? {
    labels: Object.keys(summary.type_distribution),
    datasets: [{
      label: 'Equipment Count',
      data: Object.values(summary.type_distribution),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
    }]
  } : null;

  const pieChartData = summary ? {
    labels: Object.keys(summary.type_distribution),
    datasets: [{
      data: Object.values(summary.type_distribution),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
    }]
  } : null;

  const lineChartData = data.length > 0 ? {
    labels: data.map(item => item['Equipment Name']),
    datasets: [
      {
        label: 'Flowrate',
        data: data.map(item => item.Flowrate),
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      },
      {
        label: 'Pressure',
        data: data.map(item => item.Pressure),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1
      },
      {
        label: 'Temperature',
        data: data.map(item => item.Temperature),
        borderColor: '#FFCE56',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        tension: 0.1
      }
    ]
  } : null;

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        {!showRegister ? (
          <div className="login">
            <h2>Login</h2>
            <input 
              type="text" 
              placeholder="Username" 
              value={auth.username}
              onChange={(e) => setAuth({...auth, username: e.target.value})}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={auth.password}
              onChange={(e) => setAuth({...auth, password: e.target.value})}
            />
            <button onClick={login}>Login</button>
            <p>Don't have an account? <span className="link" onClick={() => setShowRegister(true)}>Register here</span></p>
          </div>
        ) : (
          <div className="register">
            <h2>Register</h2>
            <input 
              type="text" 
              placeholder="Username" 
              value={registerData.username}
              onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
            />
            <input 
              type="email" 
              placeholder="Email (optional)" 
              value={registerData.email}
              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={registerData.password}
              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
            />
            <button onClick={register}>Register</button>
            <p>Already have an account? <span className="link" onClick={() => setShowRegister(false)}>Login here</span></p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <div className="header">
        <h1>Chemical Equipment Parameter Visualizer</h1>
        <div className="user-info">
          <span>Welcome, {auth.username}!</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>
      
      <div className="upload-section">
        <input type="file" accept=".csv" onChange={uploadFile} />
      </div>

      {summary && (
        <div className="summary">
          <h3>Summary Statistics</h3>
          <p>Total Equipment: {summary.total_count}</p>
          <p>Average Flowrate: {summary.avg_flowrate.toFixed(2)}</p>
          <p>Average Pressure: {summary.avg_pressure.toFixed(2)}</p>
          <p>Average Temperature: {summary.avg_temperature.toFixed(2)}</p>
        </div>
      )}

      {barChartData && (
        <div className="charts-container">
          <div className="chart">
            <h3>Equipment Type Distribution (Bar)</h3>
            <Bar data={barChartData} options={{responsive: true, maintainAspectRatio: false}} />
          </div>
          
          <div className="chart">
            <h3>Equipment Type Distribution (Pie)</h3>
            <Pie data={pieChartData} options={{responsive: true, maintainAspectRatio: false}} />
          </div>
          
          {lineChartData && (
            <div className="chart-wide">
              <h3>Equipment Parameters Comparison</h3>
              <Line data={lineChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }} />
            </div>
          )}
        </div>
      )}

      {data.length > 0 && (
        <div className="data-table">
          <h3>Equipment Data</h3>
          <table>
            <thead>
              <tr>
                <th>Equipment Name</th>
                <th>Type</th>
                <th>Flowrate</th>
                <th>Pressure</th>
                <th>Temperature</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item['Equipment Name']}</td>
                  <td>{item.Type}</td>
                  <td>{item.Flowrate}</td>
                  <td>{item.Pressure}</td>
                  <td>{item.Temperature}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {history.length > 0 && (
        <div className="history">
          <h3>Upload History</h3>
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <span>{item.name} - {new Date(item.uploaded_at).toLocaleDateString()}</span>
              <button onClick={() => generateReport(item.id)}>Generate Report</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;