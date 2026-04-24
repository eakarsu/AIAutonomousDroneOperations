import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { section: 'Overview', items: [
    { path: '/', icon: 'fas fa-th-large', label: 'Dashboard' },
  ]},
  { section: 'Operations', items: [
    { path: '/drones', icon: 'fas fa-helicopter', label: 'Fleet Management' },
    { path: '/flight-plans', icon: 'fas fa-route', label: 'Flight Planning' },
    { path: '/missions', icon: 'fas fa-crosshairs', label: 'Mission Control' },
    { path: '/routes', icon: 'fas fa-map-marked-alt', label: 'Route Optimization' },
    { path: '/geofences', icon: 'fas fa-draw-polygon', label: 'Geofences' },
    { path: '/landing-zones', icon: 'fas fa-map-pin', label: 'Landing Zones' },
    { path: '/ground-stations', icon: 'fas fa-broadcast-tower', label: 'Ground Stations' },
  ]},
  { section: 'Services', items: [
    { path: '/inspections', icon: 'fas fa-search-plus', label: 'Inspections' },
    { path: '/deliveries', icon: 'fas fa-shipping-fast', label: 'Deliveries' },
    { path: '/agriculture', icon: 'fas fa-seedling', label: 'Agriculture' },
    { path: '/surveillance', icon: 'fas fa-video', label: 'Surveillance' },
    { path: '/projects', icon: 'fas fa-project-diagram', label: 'Projects' },
  ]},
  { section: 'Personnel', items: [
    { path: '/pilots', icon: 'fas fa-user-tie', label: 'Pilots' },
    { path: '/training', icon: 'fas fa-graduation-cap', label: 'Training' },
    { path: '/shifts', icon: 'fas fa-calendar-alt', label: 'Shift Management' },
    { path: '/checklists', icon: 'fas fa-clipboard-check', label: 'Checklists' },
  ]},
  { section: 'Equipment', items: [
    { path: '/batteries', icon: 'fas fa-battery-three-quarters', label: 'Batteries' },
    { path: '/equipment', icon: 'fas fa-camera', label: 'Payloads & Sensors' },
    { path: '/inventory', icon: 'fas fa-boxes', label: 'Parts Inventory' },
    { path: '/maintenance', icon: 'fas fa-wrench', label: 'Maintenance' },
  ]},
  { section: 'Intelligence', items: [
    { path: '/weather', icon: 'fas fa-cloud-sun', label: 'Weather Intel' },
    { path: '/anomalies', icon: 'fas fa-exclamation-triangle', label: 'Anomaly Detection' },
    { path: '/flight-analysis', icon: 'fas fa-brain', label: 'AI Flight Analysis' },
    { path: '/analytics', icon: 'fas fa-chart-line', label: 'Analytics' },
  ]},
  { section: 'Safety & Compliance', items: [
    { path: '/incidents', icon: 'fas fa-car-crash', label: 'Incident Reports' },
    { path: '/emergency-protocols', icon: 'fas fa-first-aid', label: 'Emergency Protocols' },
    { path: '/compliance', icon: 'fas fa-shield-alt', label: 'Compliance' },
    { path: '/insurance', icon: 'fas fa-file-contract', label: 'Insurance' },
  ]},
  { section: 'Business', items: [
    { path: '/clients', icon: 'fas fa-building', label: 'Clients' },
    { path: '/contracts', icon: 'fas fa-handshake', label: 'Contracts' },
    { path: '/invoices', icon: 'fas fa-file-invoice-dollar', label: 'Invoices' },
    { path: '/expenses', icon: 'fas fa-receipt', label: 'Expenses' },
  ]},
  { section: 'System', items: [
    { path: '/documents', icon: 'fas fa-folder-open', label: 'Documents' },
    { path: '/notifications', icon: 'fas fa-bell', label: 'Notifications' },
    { path: '/communication-logs', icon: 'fas fa-comments', label: 'Comm Logs' },
    { path: '/audit-logs', icon: 'fas fa-history', label: 'Audit Log' },
  ]},
];

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2><i className="fas fa-helicopter"></i> DroneOps AI</h2>
      </div>

      {menuItems.map((section) => (
        <div className="sidebar-section" key={section.section}>
          <div className="sidebar-section-title">{section.section}</div>
          {section.items.map((item) => (
            <div
              key={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.[0] || 'A'}</div>
          <div>
            <div className="user-name">{user?.name || 'Admin'}</div>
            <div className="user-role">{user?.role || 'admin'}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i> Sign Out
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
