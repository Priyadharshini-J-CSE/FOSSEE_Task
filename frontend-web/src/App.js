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
  const [showRegister, setShowRegister] = useState(null);
  const [registerData, setRegisterData] = useState({ username: '', password: '', email: '' });
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [historyAnalytics, setHistoryAnalytics] = useState(null);


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

  const viewHistoryAnalytics = async (datasetId) => {
    try {
      const response = await axios.get(`${API_BASE}/dataset/${datasetId}/`, {
        auth: { username: auth.username, password: auth.password }
      });
      setSelectedHistoryItem(datasetId);
      setHistoryAnalytics(response.data.analytics);
      setData(response.data.data);
      setSummary(response.data.summary);
    } catch (error) {
      alert('Failed to load analytics');
    }
  };

  const closeHistoryAnalytics = () => {
    setSelectedHistoryItem(null);
    setHistoryAnalytics(null);
    setData([]);
    setSummary(null);
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
      <div className="landing-page">
        <div className="landing-nav">
          <div className="nav-logo">
            <h2>ChemAnalyzer Pro</h2>
          </div>
          <div className="nav-buttons">
            <button className="nav-btn" onClick={() => setShowRegister(false)}>Login</button>
            <button className="nav-btn register" onClick={() => setShowRegister(true)}>Register</button>
          </div>
        </div>
        
        <div className="hero-section">
          <div className="hero-content">
            <h1>Your Equipment Data, Our Expertise</h1>
            <p>Advanced Chemical Equipment Analysis Made Simple</p>
            <p className="hero-subtitle">Transform your CSV data into actionable insights with cutting-edge analytics and professional reporting tools.</p>
          </div>
          
          <div className="stats-section">
            <div className="stat-card">
              <h3>500+</h3>
              <p>Equipment Types Analyzed</p>
            </div>
            <div className="stat-card">
              <h3>15+</h3>
              <p>Analysis Parameters</p>
            </div>
            <div className="stat-card">
              <h3>24/7</h3>
              <p>Data Processing</p>
            </div>
            <div className="stat-card">
              <h3>99.9%</h3>
              <p>Accuracy Rate</p>
            </div>
          </div>
        </div>



        {(showRegister !== null) && (
          <div className="auth-modal">
            <div className="modal-content">
              <button className="close-modal" onClick={() => setShowRegister(null)}>×</button>
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

      {summary && !selectedHistoryItem && (
        <div className="summary">
          <h3>Summary Statistics</h3>
          <p>Total Equipment: {summary.total_count}</p>
          <p>Average Flowrate: {summary.avg_flowrate.toFixed(2)}</p>
          <p>Average Pressure: {summary.avg_pressure.toFixed(2)}</p>
          <p>Average Temperature: {summary.avg_temperature.toFixed(2)}</p>
        </div>
      )}

      {barChartData && !selectedHistoryItem && (
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

      {data.length > 0 && !selectedHistoryItem && (
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
              <div className="history-info">
                <span>{item.name} - {new Date(item.uploaded_at).toLocaleDateString()}</span>
                <div className="history-preview">
                  <small>Total Equipment: {item.preview_chart_data.total_count}</small>
                </div>
              </div>
              <div className="history-actions">
                <button onClick={() => viewHistoryAnalytics(item.id)}>View Analytics</button>
                <button onClick={() => generateReport(item.id)}>Generate Report</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedHistoryItem && historyAnalytics && (
        <div className="history-analytics">
          <div className="analytics-header">
            <h3>Analytics for Selected Dataset</h3>
            <button className="close-btn" onClick={closeHistoryAnalytics}>Close Analytics</button>
          </div>
          
          <div className="analytics-summary">
            <h4>Statistical Summary</h4>
            <div className="stats-grid">
              <div className="stat-card">
                <h5>Flowrate</h5>
                <p>Min: {historyAnalytics.statistics.flowrate_stats.min.toFixed(2)}</p>
                <p>Max: {historyAnalytics.statistics.flowrate_stats.max.toFixed(2)}</p>
                <p>Mean: {historyAnalytics.statistics.flowrate_stats.mean.toFixed(2)}</p>
                <p>Std: {historyAnalytics.statistics.flowrate_stats.std.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <h5>Pressure</h5>
                <p>Min: {historyAnalytics.statistics.pressure_stats.min.toFixed(2)}</p>
                <p>Max: {historyAnalytics.statistics.pressure_stats.max.toFixed(2)}</p>
                <p>Mean: {historyAnalytics.statistics.pressure_stats.mean.toFixed(2)}</p>
                <p>Std: {historyAnalytics.statistics.pressure_stats.std.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <h5>Temperature</h5>
                <p>Min: {historyAnalytics.statistics.temperature_stats.min.toFixed(2)}</p>
                <p>Max: {historyAnalytics.statistics.temperature_stats.max.toFixed(2)}</p>
                <p>Mean: {historyAnalytics.statistics.temperature_stats.mean.toFixed(2)}</p>
                <p>Std: {historyAnalytics.statistics.temperature_stats.std.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="analytics-charts">
            <div className="chart">
              <h4>Equipment Type Distribution</h4>
              <Bar data={{
                labels: Object.keys(historyAnalytics.type_distribution),
                datasets: [{
                  label: 'Equipment Count',
                  data: Object.values(historyAnalytics.type_distribution),
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
              }} options={{responsive: true, maintainAspectRatio: false}} />
            </div>
            
            <div className="chart">
              <h4>Equipment Type Distribution (Pie)</h4>
              <Pie data={{
                labels: Object.keys(historyAnalytics.type_distribution),
                datasets: [{
                  data: Object.values(historyAnalytics.type_distribution),
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
              }} options={{responsive: true, maintainAspectRatio: false}} />
            </div>
            
            <div className="chart-wide">
              <h4>Parameter Trends</h4>
              <Line data={{
                labels: historyAnalytics.parameter_trends.equipment_names,
                datasets: [
                  {
                    label: 'Flowrate',
                    data: historyAnalytics.parameter_trends.flowrates,
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1
                  },
                  {
                    label: 'Pressure',
                    data: historyAnalytics.parameter_trends.pressures,
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.1
                  },
                  {
                    label: 'Temperature',
                    data: historyAnalytics.parameter_trends.temperatures,
                    borderColor: '#FFCE56',
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    tension: 0.1
                  }
                ]
              }} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }} />
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default App;