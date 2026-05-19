import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/api';

const featureCards = [
  { path: '/drones', icon: 'fas fa-helicopter', label: 'Fleet Management', desc: 'Monitor and manage your drone fleet in real-time', color: '#38bdf8', bg: 'bg-blue' },
  { path: '/fleet-tracking', icon: 'fas fa-satellite-dish', label: 'Real-Time Tracking', desc: 'Live telemetry, position trails, geofence enforcement', color: '#22c55e', bg: 'bg-green' },
  { path: '/mission-logs', icon: 'fas fa-clipboard-list', label: 'Mission Logs (AI)', desc: 'Auto-generated post-mission AI reports', color: '#a78bfa', bg: 'bg-purple' },
  { path: '/ai-mission-stream', icon: 'fas fa-stream', label: 'AI Mission Stream', desc: 'Live SSE-streamed mission analysis', color: '#f472b6', bg: 'bg-pink' },
  { path: '/flight-plans', icon: 'fas fa-route', label: 'Flight Planning', desc: 'Plan, schedule, and optimize flight routes', color: '#818cf8', bg: 'bg-indigo' },
  { path: '/missions', icon: 'fas fa-crosshairs', label: 'Mission Control', desc: 'Real-time mission monitoring and management', color: '#4ade80', bg: 'bg-green' },
  { path: '/inspections', icon: 'fas fa-search-plus', label: 'Inspections', desc: 'Infrastructure, pipeline, and building inspections', color: '#fb923c', bg: 'bg-orange' },
  { path: '/deliveries', icon: 'fas fa-shipping-fast', label: 'Delivery Management', desc: 'Track and manage drone delivery operations', color: '#f472b6', bg: 'bg-pink' },
  { path: '/agriculture', icon: 'fas fa-seedling', label: 'Agriculture Ops', desc: 'Crop monitoring, spraying, and soil analysis', color: '#4ade80', bg: 'bg-green' },
  { path: '/surveillance', icon: 'fas fa-video', label: 'Surveillance', desc: 'Security monitoring and patrol management', color: '#f87171', bg: 'bg-red' },
  { path: '/maintenance', icon: 'fas fa-wrench', label: 'Maintenance', desc: 'Preventive and corrective maintenance tracking', color: '#facc15', bg: 'bg-yellow' },
  { path: '/weather', icon: 'fas fa-cloud-sun', label: 'Weather Intelligence', desc: 'AI-powered weather assessment for flight safety', color: '#38bdf8', bg: 'bg-blue' },
  { path: '/routes', icon: 'fas fa-map-marked-alt', label: 'Route Optimization', desc: 'AI-optimized flight routes and no-fly zones', color: '#2dd4bf', bg: 'bg-teal' },
  { path: '/anomalies', icon: 'fas fa-exclamation-triangle', label: 'Anomaly Detection', desc: 'AI-powered anomaly detection and diagnostics', color: '#fb923c', bg: 'bg-orange' },
  { path: '/compliance', icon: 'fas fa-shield-alt', label: 'Compliance', desc: 'FAA regulations and compliance tracking', color: '#818cf8', bg: 'bg-purple' },
  { path: '/clients', icon: 'fas fa-building', label: 'Client Management', desc: 'Manage clients, contracts, and services', color: '#2dd4bf', bg: 'bg-teal' },
  { path: '/invoices', icon: 'fas fa-file-invoice-dollar', label: 'Billing & Invoicing', desc: 'Invoice management and payment tracking', color: '#4ade80', bg: 'bg-green' },
  { path: '/analytics', icon: 'fas fa-chart-line', label: 'Analytics', desc: 'Operational analytics and KPI dashboards', color: '#a78bfa', bg: 'bg-purple' },
  { path: '/flight-analysis', icon: 'fas fa-brain', label: 'AI Flight Analysis', desc: 'AI-powered flight performance analysis', color: '#f472b6', bg: 'bg-pink' },
  { path: '/pilots', icon: 'fas fa-user-tie', label: 'Pilot Management', desc: 'Manage pilots, licenses, and certifications', color: '#38bdf8', bg: 'bg-blue' },
  { path: '/batteries', icon: 'fas fa-battery-three-quarters', label: 'Battery Management', desc: 'Track battery health, cycles, and charging', color: '#4ade80', bg: 'bg-green' },
  { path: '/inventory', icon: 'fas fa-boxes', label: 'Parts Inventory', desc: 'Spare parts, stock levels, and suppliers', color: '#fb923c', bg: 'bg-orange' },
  { path: '/incidents', icon: 'fas fa-car-crash', label: 'Incident Reports', desc: 'Safety incidents, near-misses, and investigations', color: '#f87171', bg: 'bg-red' },
  { path: '/checklists', icon: 'fas fa-clipboard-check', label: 'Checklists', desc: 'Pre-flight, post-flight, and safety checklists', color: '#2dd4bf', bg: 'bg-teal' },
  { path: '/documents', icon: 'fas fa-folder-open', label: 'Document Center', desc: 'Licenses, certificates, SOPs, and manuals', color: '#818cf8', bg: 'bg-indigo' },
  { path: '/geofences', icon: 'fas fa-draw-polygon', label: 'Geofences', desc: 'No-fly zones, restricted areas, and boundaries', color: '#f472b6', bg: 'bg-pink' },
  { path: '/equipment', icon: 'fas fa-camera', label: 'Payloads & Sensors', desc: 'Cameras, LiDAR, thermal, and sensor equipment', color: '#facc15', bg: 'bg-yellow' },
  { path: '/projects', icon: 'fas fa-project-diagram', label: 'Projects', desc: 'Group operations into managed projects', color: '#a78bfa', bg: 'bg-purple' },
  { path: '/audit-logs', icon: 'fas fa-history', label: 'Audit Log', desc: 'Track all system actions and changes', color: '#94a3b8', bg: 'bg-gray' },
  { path: '/notifications', icon: 'fas fa-bell', label: 'Notifications', desc: 'System alerts, reminders, and messages', color: '#38bdf8', bg: 'bg-blue' },
  { path: '/landing-zones', icon: 'fas fa-map-pin', label: 'Landing Zones', desc: 'Manage takeoff/landing pads and locations', color: '#4ade80', bg: 'bg-green' },
  { path: '/training', icon: 'fas fa-graduation-cap', label: 'Training Records', desc: 'Pilot training, courses, and certifications', color: '#fb923c', bg: 'bg-orange' },
  { path: '/insurance', icon: 'fas fa-file-contract', label: 'Insurance', desc: 'Policies, coverage, claims, and renewals', color: '#818cf8', bg: 'bg-indigo' },
  { path: '/contracts', icon: 'fas fa-handshake', label: 'Contracts', desc: 'Client contracts, terms, and renewals', color: '#2dd4bf', bg: 'bg-teal' },
  { path: '/expenses', icon: 'fas fa-receipt', label: 'Expense Tracking', desc: 'Operational costs, receipts, and approvals', color: '#f87171', bg: 'bg-red' },
  { path: '/shifts', icon: 'fas fa-calendar-alt', label: 'Shift Management', desc: 'Operator schedules, shifts, and availability', color: '#facc15', bg: 'bg-yellow' },
  { path: '/emergency-protocols', icon: 'fas fa-first-aid', label: 'Emergency Protocols', desc: 'Emergency procedures, contacts, and drills', color: '#f87171', bg: 'bg-red' },
  { path: '/communication-logs', icon: 'fas fa-comments', label: 'Communication Logs', desc: 'Radio, ATC, and team communication records', color: '#38bdf8', bg: 'bg-blue' },
  { path: '/ground-stations', icon: 'fas fa-broadcast-tower', label: 'Ground Stations', desc: 'Ground control station management', color: '#a78bfa', bg: 'bg-purple' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardService.getStats().then(res => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Command Center</h1>
          <p className="subtitle">AI Autonomous Drone Operations Overview</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon bg-blue"><i className="fas fa-helicopter"></i></div>
          <div className="stat-value">{stats?.activeDrones || 0}/{stats?.totalDrones || 0}</div>
          <div className="stat-label">Active / Total Drones</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green"><i className="fas fa-crosshairs"></i></div>
          <div className="stat-value">{stats?.activeMissions || 0}</div>
          <div className="stat-label">Active Missions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple"><i className="fas fa-route"></i></div>
          <div className="stat-value">{stats?.totalFlights || 0}</div>
          <div className="stat-label">Flight Plans</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-pink"><i className="fas fa-shipping-fast"></i></div>
          <div className="stat-value">{stats?.totalDeliveries || 0}</div>
          <div className="stat-label">Deliveries</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-teal"><i className="fas fa-building"></i></div>
          <div className="stat-value">{stats?.totalClients || 0}</div>
          <div className="stat-label">Clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green"><i className="fas fa-dollar-sign"></i></div>
          <div className="stat-value">${stats?.totalRevenue?.toLocaleString() || 0}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#94a3b8', marginBottom: 20 }}>
        <i className="fas fa-th" style={{ marginRight: 8 }}></i> Operations & Services
      </h2>

      <div className="feature-cards">
        {featureCards.map((card) => (
          <div
            key={card.path}
            className="feature-card"
            style={{ '--card-color': card.color }}
            onClick={() => navigate(card.path)}
          >
            <div className={`card-icon ${card.bg}`}>
              <i className={card.icon}></i>
            </div>
            <h3>{card.label}</h3>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
