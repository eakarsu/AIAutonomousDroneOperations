import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const RISK_COLORS = { low: '#22c55e', medium: '#fbbf24', high: '#ef4444' };

export default function MissionPlannerWizard() {
  const [form, setForm] = useState({
    objective: 'Perimeter survey of AOR',
    area: 'San Francisco Bay',
    altitudeM: 100,
    speedKmh: 18,
    durationMin: 45,
  });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/custom-views/mission-planner`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const setField = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div data-testid="mission-planner-wizard" style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #1e293b' }}>
      <h3 style={{ marginBottom: 10 }}>Mission Planner Wizard</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#94a3b8' }}>Objective</label>
          <input
            value={form.objective}
            onChange={(e) => setField('objective', e.target.value)}
            style={{ width: '100%', padding: 8, background: '#0b1326', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: 4 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#94a3b8' }}>Area</label>
          <input
            value={form.area}
            onChange={(e) => setField('area', e.target.value)}
            style={{ width: '100%', padding: 8, background: '#0b1326', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: 4 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#94a3b8' }}>Altitude (m)</label>
          <input
            type="number"
            value={form.altitudeM}
            onChange={(e) => setField('altitudeM', Number(e.target.value))}
            style={{ width: '100%', padding: 8, background: '#0b1326', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: 4 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#94a3b8' }}>Speed (km/h)</label>
          <input
            type="number"
            value={form.speedKmh}
            onChange={(e) => setField('speedKmh', Number(e.target.value))}
            style={{ width: '100%', padding: 8, background: '#0b1326', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: 4 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#94a3b8' }}>Duration (min)</label>
          <input
            type="number"
            value={form.durationMin}
            onChange={(e) => setField('durationMin', Number(e.target.value))}
            style={{ width: '100%', padding: 8, background: '#0b1326', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: 4 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button
            onClick={run}
            disabled={busy}
            style={{ background: '#38bdf8', color: '#0a0e1a', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
          >
            {busy ? 'Planning…' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {err && <div style={{ color: '#fca5a5', marginTop: 8 }}>{err}</div>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>Drone:</span>
            <b style={{ color: '#e2e8f0' }}>{result.plan?.assignedDrone?.name} ({result.plan?.assignedDrone?.model})</b>
            <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 12 }}>Risk:</span>
            <span style={{ color: RISK_COLORS[result.plan?.risk] || '#94a3b8', fontWeight: 700 }}>{result.plan?.risk} ({result.plan?.riskScore})</span>
            <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 12 }}>~{result.plan?.estimatedDistanceKm} km · {result.plan?.estimatedFlightMin} min</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#0b1326', padding: 10, borderRadius: 6 }}>
              <h4 style={{ marginBottom: 6 }}>Wizard Steps</h4>
              {result.steps?.map((s) => (
                <div key={s.step} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: s.status === 'complete' ? '#22c55e' : '#475569', color: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{s.step}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 13 }}>{s.name}</span>
                  <span style={{ color: '#64748b', fontSize: 11, marginLeft: 'auto' }}>{s.status}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#0b1326', padding: 10, borderRadius: 6 }}>
              <h4 style={{ marginBottom: 6 }}>Pre-Flight Checklist</h4>
              {result.checklist?.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: c.done ? '#22c55e' : '#64748b' }}>{c.done ? '☑' : '☐'}</span>
                  <span style={{ color: '#e2e8f0' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>Waypoints</h4>
          <table style={{ width: '100%', fontSize: 12, color: '#cbd5e1', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: 4 }}>#</th><th>Lat</th><th>Lng</th><th>Alt</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {result.plan?.waypoints?.map((w) => (
                <tr key={w.seq} style={{ borderTop: '1px solid #1e293b' }}>
                  <td style={{ padding: 4 }}>{w.seq}</td>
                  <td>{w.lat}</td>
                  <td>{w.lng}</td>
                  <td>{w.altitudeM}m</td>
                  <td>{w.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
