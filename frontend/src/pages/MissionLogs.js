import React, { useState, useEffect } from 'react';
import { missionLogService, missionService, droneService } from '../services/api';

const riskColors = { low: '#4ade80', medium: '#facc15', high: '#fb923c', critical: '#f87171', unknown: '#94a3b8' };

function AILogCard({ analysis }) {
  if (!analysis) return <div style={{ color: '#64748b' }}>No AI analysis</div>;
  if (analysis.error) return <div style={{ color: '#f87171' }}>AI error: {analysis.error}</div>;

  const risk = analysis.riskLevel || 'unknown';
  const riskColor = riskColors[risk] || riskColors.unknown;
  const score = analysis.score;

  return (
    <div>
      {/* Score + Risk */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        {score != null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171' }}>
              {Math.round(score)}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>/ 100</div>
          </div>
        )}
        <div>
          <div style={{
            display: 'inline-block',
            padding: '3px 12px',
            borderRadius: 12,
            background: `${riskColor}22`,
            color: riskColor,
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid ${riskColor}44`,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            {risk} risk
          </div>
          <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.5, fontSize: 14 }}>{analysis.summary}</p>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: '#38bdf8', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>Recommendations
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1', fontSize: 13, lineHeight: 1.8 }}>
            {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      {/* Flags */}
      {analysis.flags?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: '#fb923c', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            <i className="fas fa-flag" style={{ marginRight: 6 }}></i>Flags
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#fca5a5', fontSize: 13, lineHeight: 1.8 }}>
            {analysis.flags.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      {/* Details */}
      {analysis.details && Object.keys(analysis.details).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
          {Object.entries(analysis.details).map(([k, v]) => (
            <div key={k} style={{ padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </div>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>{String(v)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MissionLogs() {
  const [logs, setLogs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [drones, setDrones] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    mission_id: '', drone_id: '',
    started_at: new Date(Date.now() - 3600000).toISOString().slice(0, 16),
    completed_at: new Date().toISOString().slice(0, 16),
    total_distance_km: 5, max_altitude_m: 100, avg_speed: 30, battery_used_pct: 40,
  });

  const load = async () => {
    try {
      const [l, m, d] = await Promise.all([
        missionLogService.getAll(1, 50),
        missionService.getAll(1, 100),
        droneService.getAll(1, 100),
      ]);
      // missionLogService returns paginated { data, pagination }
      const logData = l.data?.data || (Array.isArray(l.data) ? l.data : []);
      setLogs(logData);
      setMissions(Array.isArray(m.data) ? m.data : (m.data?.data || []));
      setDrones(Array.isArray(d.data) ? d.data : (d.data?.data || []));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleCreate = async () => {
    setLoading(true); setError(null);
    try {
      const payload = {
        mission_id: parseInt(form.mission_id, 10),
        drone_id: parseInt(form.drone_id, 10),
        started_at: new Date(form.started_at).toISOString(),
        completed_at: new Date(form.completed_at).toISOString(),
        total_distance_km: parseFloat(form.total_distance_km),
        max_altitude_m: parseFloat(form.max_altitude_m),
        avg_speed: parseFloat(form.avg_speed),
        battery_used_pct: parseFloat(form.battery_used_pct),
      };
      const res = await missionLogService.create(payload);
      setLogs([res.data, ...logs]);
      setShowCreate(false);
      setSelected(res.data);
    } catch (e) {
      setError(e.response?.data?.errors ? JSON.stringify(e.response.data.errors) : (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1><i className="fas fa-clipboard-list"></i> Mission Logs & AI Reports</h1>
          <p className="subtitle">Auto-generated structured post-mission AI reports with performance and safety insights</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ padding: '10px 20px', background: '#38bdf8', color: '#0a0e1a', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <i className="fas fa-plus"></i> New Mission Log
        </button>
      </div>

      {error && <div style={{ color: '#f87171', padding: 12, background: 'rgba(248, 113, 113, 0.08)', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 16, background: '#161b2d', borderRadius: 12 }}>
          <h3 style={{ marginBottom: 12, color: '#94a3b8' }}>Logs ({logs.length})</h3>
          {logs.length === 0 && <div style={{ color: '#64748b' }}>No mission logs yet</div>}
          {logs.map((log) => {
            const risk = log.ai_analysis?.riskLevel;
            const riskColor = riskColors[risk] || '#94a3b8';
            return (
              <div key={log.id} onClick={() => setSelected(log)}
                style={{
                  padding: 10, marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                  background: selected?.id === log.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  borderLeft: selected?.id === log.id ? '3px solid #38bdf8' : `3px solid ${riskColor}66`,
                }}>
                <div style={{ fontWeight: 600 }}>Mission #{log.mission_id} · Drone #{log.drone_id}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {log.total_distance_km?.toFixed(1)} km · {log.battery_used_pct?.toFixed(0)}% battery
                  {risk && <span style={{ marginLeft: 8, color: riskColor, fontWeight: 600, textTransform: 'uppercase' }}>{risk}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(log.createdAt).toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: 24, background: '#161b2d', borderRadius: 12 }}>
          {!selected && <div style={{ color: '#64748b', textAlign: 'center', padding: 60 }}>Select a log to view its AI report</div>}
          {selected && (
            <>
              <h2 style={{ marginBottom: 8 }}>Mission Log #{selected.id}</h2>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
                Started: {new Date(selected.started_at).toLocaleString()} · Completed: {new Date(selected.completed_at).toLocaleString()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                <div className="stat-card"><div className="stat-label">Distance</div><div className="stat-value">{selected.total_distance_km?.toFixed(1)} km</div></div>
                <div className="stat-card"><div className="stat-label">Max Altitude</div><div className="stat-value">{selected.max_altitude_m?.toFixed(0)} m</div></div>
                <div className="stat-card"><div className="stat-label">Avg Speed</div><div className="stat-value">{selected.avg_speed?.toFixed(1)} km/h</div></div>
                <div className="stat-card"><div className="stat-label">Battery</div><div className="stat-value">{selected.battery_used_pct?.toFixed(0)}%</div></div>
              </div>

              <h3 style={{ color: '#38bdf8', marginBottom: 12 }}><i className="fas fa-brain"></i> AI Report</h3>
              <div style={{ background: '#0a0e1a', padding: 16, borderRadius: 8, lineHeight: 1.7 }}>
                <AILogCard analysis={selected.ai_analysis} />
              </div>
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <div onClick={() => setShowCreate(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: '#161b2d', padding: 24, borderRadius: 12, width: 480 }}>
            <h2 style={{ marginBottom: 16 }}>Create Mission Log</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>Mission</label>
                <select value={form.mission_id} onChange={(e) => setForm({ ...form, mission_id: e.target.value })}
                  style={{ width: '100%', padding: 8, background: '#0a0e1a', color: '#e0e6ed', border: '1px solid #334155', borderRadius: 6 }}>
                  <option value="">Select mission</option>
                  {missions.map((m) => <option key={m.id} value={m.id}>#{m.id} {m.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>Drone</label>
                <select value={form.drone_id} onChange={(e) => setForm({ ...form, drone_id: e.target.value })}
                  style={{ width: '100%', padding: 8, background: '#0a0e1a', color: '#e0e6ed', border: '1px solid #334155', borderRadius: 6 }}>
                  <option value="">Select drone</option>
                  {drones.map((d) => <option key={d.id} value={d.id}>#{d.id} {d.name}</option>)}
                </select>
              </div>
              {[
                ['started_at', 'Started At', 'datetime-local'],
                ['completed_at', 'Completed At', 'datetime-local'],
                ['total_distance_km', 'Total Distance (km)', 'number'],
                ['max_altitude_m', 'Max Altitude (m)', 'number'],
                ['avg_speed', 'Avg Speed (km/h)', 'number'],
                ['battery_used_pct', 'Battery Used (%)', 'number'],
              ].map(([k, lbl, type]) => (
                <div key={k}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>{lbl}</label>
                  <input type={type} step="any" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    style={{ width: '100%', padding: 8, background: '#0a0e1a', color: '#e0e6ed', border: '1px solid #334155', borderRadius: 6 }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', background: '#334155', color: '#e0e6ed', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={loading}
                style={{ padding: '10px 20px', background: '#38bdf8', color: '#0a0e1a', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {loading ? 'Generating AI report...' : 'Create + AI Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MissionLogs;
