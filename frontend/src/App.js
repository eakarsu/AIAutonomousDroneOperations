import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import FleetTracking from './pages/FleetTracking';
import MissionLogs from './pages/MissionLogs';
import AIMissionStream from './pages/AIMissionStream';
import AIAutonomy from './pages/AIAutonomy';
import Extensions from './pages/Extensions'; // Apply pass 5
import CustomViewsPage from './pages/CustomViewsPage';
import Sidebar from './components/Sidebar';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-layout">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fleet-tracking" element={<FleetTracking />} />
            <Route path="/mission-logs" element={<MissionLogs />} />
            <Route path="/ai-mission-stream" element={<AIMissionStream />} />
            <Route path="/ai-autonomy" element={<AIAutonomy />} />
            <Route path="/extensions" element={<Extensions />} />
            <Route path="/custom-views" element={<CustomViewsPage />} />
            <Route path="/drones" element={<FeaturePage feature="drones" />} />
            <Route path="/flight-plans" element={<FeaturePage feature="flight-plans" />} />
            <Route path="/missions" element={<FeaturePage feature="missions" />} />
            <Route path="/inspections" element={<FeaturePage feature="inspections" />} />
            <Route path="/deliveries" element={<FeaturePage feature="deliveries" />} />
            <Route path="/agriculture" element={<FeaturePage feature="agriculture" />} />
            <Route path="/surveillance" element={<FeaturePage feature="surveillance" />} />
            <Route path="/maintenance" element={<FeaturePage feature="maintenance" />} />
            <Route path="/weather" element={<FeaturePage feature="weather" />} />
            <Route path="/routes" element={<FeaturePage feature="routes" />} />
            <Route path="/anomalies" element={<FeaturePage feature="anomalies" />} />
            <Route path="/compliance" element={<FeaturePage feature="compliance" />} />
            <Route path="/clients" element={<FeaturePage feature="clients" />} />
            <Route path="/invoices" element={<FeaturePage feature="invoices" />} />
            <Route path="/analytics" element={<FeaturePage feature="analytics" />} />
            <Route path="/flight-analysis" element={<FeaturePage feature="flight-analysis" />} />
            <Route path="/pilots" element={<FeaturePage feature="pilots" />} />
            <Route path="/batteries" element={<FeaturePage feature="batteries" />} />
            <Route path="/inventory" element={<FeaturePage feature="inventory" />} />
            <Route path="/incidents" element={<FeaturePage feature="incidents" />} />
            <Route path="/checklists" element={<FeaturePage feature="checklists" />} />
            <Route path="/documents" element={<FeaturePage feature="documents" />} />
            <Route path="/geofences" element={<FeaturePage feature="geofences" />} />
            <Route path="/equipment" element={<FeaturePage feature="equipment" />} />
            <Route path="/projects" element={<FeaturePage feature="projects" />} />
            <Route path="/audit-logs" element={<FeaturePage feature="audit-logs" />} />
            <Route path="/notifications" element={<FeaturePage feature="notifications" />} />
            <Route path="/landing-zones" element={<FeaturePage feature="landing-zones" />} />
            <Route path="/training" element={<FeaturePage feature="training" />} />
            <Route path="/insurance" element={<FeaturePage feature="insurance" />} />
            <Route path="/contracts" element={<FeaturePage feature="contracts" />} />
            <Route path="/expenses" element={<FeaturePage feature="expenses" />} />
            <Route path="/shifts" element={<FeaturePage feature="shifts" />} />
            <Route path="/emergency-protocols" element={<FeaturePage feature="emergency-protocols" />} />
            <Route path="/communication-logs" element={<FeaturePage feature="communication-logs" />} />
            <Route path="/ground-stations" element={<FeaturePage feature="ground-stations" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
