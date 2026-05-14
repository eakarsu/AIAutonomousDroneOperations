import React, { useState, useEffect, useRef } from 'react';
import { droneService, telemetryService, geofenceCheckService } from '../services/api';

/**
 * Real-Time Fleet Tracking page.
 * - Lists all drones, allows selecting one
 * - Polls /telemetry/history every 3s to render last-known position, battery, altitude, speed
 * - Renders a simple SVG map with relative coords (lat/lng -> bbox) plus history trail
 * - Allows pushing a synthetic telemetry point and checking geofences
 */
function FleetTracking() {
  const [drones, setDrones] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState(null);
  const [pushing, setPushing] = useState(false);
  const [geofenceResult, setGeofenceResult] = useState(null);
  const [pushForm, setPushForm] = useState({ lat: 37.7749, lng: -122.4194, altitude: 50, battery: 80, speed: 15 });
  const pollRef = useRef(null);

  useEffect(() => {
    droneService.getAll(1, 100)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setDrones(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const load = async () => {
      try {
        const res = await telemetryService.history(selectedId);
        const h = res.data?.history || [];
        setHistory(h);
        setLatest(h[h.length - 1] || null);
      } catch (e) {
        setError(e.message);
      }
    };
    load();
    pollRef.current = setInterval(load, 3000);
    return () => clearInterval(pollRef.current);
  }, [selectedId]);

  const handlePush = async () => {
    if (!selectedId) return;
    setPushing(true);
    try {
      const point = {
        lat: parseFloat(pushForm.lat),
        lng: parseFloat(pushForm.lng),
        altitude: parseFloat(pushForm.altitude),
        battery: parseFloat(pushForm.battery),
        speed: parseFloat(pushForm.speed),
      };
      await telemetryService.push(selectedId, point);
    } catch (e) {
      setError(e.response?.data?.errors ? JSON.stringify(e.response.data.errors) : e.message);
    } finally {
      setPushing(false);
    }
  };

  const handleGeofenceCheck = async () => {
    if (!selectedId) return;
    try {
      const res = await geofenceCheckService.check(selectedId, {
        lat: parseFloat(pushForm.lat),
        lng: parseFloat(pushForm.lng),
      });
      setGeofenceResult(res.data);
    } catch (e) {
      setError(e.message);
    }
  };

  // Build a tiny SVG to visualise the trail.
  const renderMap = () => {
    if (history.length === 0) {
      return <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No telemetry yet</div>;
    }
    const lats = history.map((p) => p.lat);
    const lngs = history.map((p) => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat) * 0.2 || 0.001;
    const padLng = (maxLng - minLng) * 0.2 || 0.001;
    const W = 600, H = 360;
    const fx = (lng) => ((lng - (minLng - padLng)) / ((maxLng + padLng) - (minLng - padLng))) * W;
    const fy = (lat) => H - ((lat - (minLat - padLat)) / ((maxLat + padLat) - (minLat - padLat))) * H;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: '#0a0e1a', borderRadius: 8 }}>
        {/* trail */}
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          points={history.map((p) => `${fx(p.lng)},${fy(p.lat)}`).join(' ')}
        />
        {/* points */}
        {history.map((p, i) => (
          <circle key={i} cx={fx(p.lng)} cy={fy(p.lat)} r={i === history.length - 1 ? 6 : 2}
            fill={i === history.length - 1 ? '#4ade80' : '#818cf8'} />
        ))}
      </svg>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><i className="fas fa-satellite-dish"></i> Real-Time Fleet Tracking</h1>
          <p className="subtitle">Live drone telemetry, position trails, and geofence enforcement</p>
        </div>
      </div>

      {error && <div style={{ color: '#f87171', padding: 12, background: 'rgba(248, 113, 113, 0.08)', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* Drone list */}
        <div className="card" style={{ padding: 16, background: '#161b2d', borderRadius: 12 }}>
          <h3 style={{ marginBottom: 12, color: '#94a3b8' }}>Fleet</h3>
          {drones.length === 0 && <div style={{ color: '#64748b' }}>No drones</div>}
          {drones.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              style={{
                padding: 10, marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                background: selectedId === d.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                borderLeft: selectedId === d.id ? '3px solid #38bdf8' : '3px solid transparent',
              }}
            >
              <div style={{ fontWeight: 600 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{d.model || d.serialNumber}</div>
              <div style={{ fontSize: 12, color: d.status === 'active' ? '#4ade80' : '#94a3b8' }}>● {d.status}</div>
            </div>
          ))}
        </div>

        {/* Map + telemetry panel */}
        <div>
          <div className="card" style={{ padding: 16, background: '#161b2d', borderRadius: 12, marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12, color: '#94a3b8' }}>Position History</h3>
            {renderMap()}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-label">Battery</div>
              <div className="stat-value">{latest?.battery?.toFixed(1) ?? '—'}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Altitude</div>
              <div className="stat-value">{latest?.altitude?.toFixed(1) ?? '—'} m</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Speed</div>
              <div className="stat-value">{latest?.speed?.toFixed(1) ?? '—'} km/h</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Position</div>
              <div className="stat-value" style={{ fontSize: 14 }}>
                {latest ? `${latest.lat.toFixed(4)}, ${latest.lng.toFixed(4)}` : '—'}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, background: '#161b2d', borderRadius: 12 }}>
            <h3 style={{ marginBottom: 12, color: '#94a3b8' }}>Push Telemetry / Check Geofence</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
              {['lat', 'lng', 'altitude', 'battery', 'speed'].map((f) => (
                <input
                  key={f}
                  type="number"
                  step="any"
                  placeholder={f}
                  value={pushForm[f]}
                  onChange={(e) => setPushForm({ ...pushForm, [f]: e.target.value })}
                  style={{ padding: 8, background: '#0a0e1a', border: '1px solid #334155', borderRadius: 6, color: '#e0e6ed' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handlePush} disabled={pushing}
                style={{ padding: '10px 20px', background: '#38bdf8', color: '#0a0e1a', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {pushing ? 'Pushing…' : 'Push Telemetry'}
              </button>
              <button onClick={handleGeofenceCheck}
                style={{ padding: '10px 20px', background: '#f472b6', color: '#0a0e1a', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Check Geofence
              </button>
            </div>
            {geofenceResult && (
              <div style={{ marginTop: 12, padding: 12, background: '#0a0e1a', borderRadius: 8 }}>
                <div>In Bounds: <strong style={{ color: geofenceResult.in_bounds ? '#4ade80' : '#f87171' }}>{String(geofenceResult.in_bounds)}</strong></div>
                <div>Nearest Boundary: {geofenceResult.nearest_boundary_km ?? '—'} km</div>
                <div>Violations: {geofenceResult.violations?.length || 0}</div>
                {geofenceResult.violations?.map((v, i) => (
                  <div key={i} style={{ marginTop: 4, padding: 6, background: 'rgba(248, 113, 113, 0.12)', borderRadius: 4 }}>
                    <strong>{v.name}</strong> ({v.type}) — {v.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FleetTracking;
