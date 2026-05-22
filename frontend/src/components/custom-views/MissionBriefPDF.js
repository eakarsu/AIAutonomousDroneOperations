import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4040/api';

export default function MissionBriefPDF() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get(`${API_BASE}/custom-views/mission-brief`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  const downloadText = () => {
    if (!data?.printableText) return;
    const blob = new Blob([data.printableText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission-briefs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (err) return <div style={{ color: '#fca5a5' }}>Failed: {err}</div>;
  if (!data) return <div>Loading mission briefs…</div>;

  const briefs = data.briefs || [];
  const current = briefs[selected] || briefs[0];

  return (
    <div data-testid="mission-brief-pdf" style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3>Mission Brief (Printable)</h3>
        <button
          onClick={downloadText}
          style={{ background: '#38bdf8', color: '#0a0e1a', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          Download .txt
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ minWidth: 200, maxHeight: 360, overflowY: 'auto', background: '#0b1326', padding: 8, borderRadius: 6 }}>
          {briefs.map((b, i) => (
            <div
              key={b.id || i}
              onClick={() => setSelected(i)}
              style={{
                padding: 6,
                marginBottom: 4,
                cursor: 'pointer',
                borderRadius: 4,
                background: i === selected ? '#1e293b' : 'transparent',
                fontSize: 12,
                color: i === selected ? '#e2e8f0' : '#94a3b8',
              }}
            >
              <div style={{ fontWeight: 600 }}>{b.missionName}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{b.type} · {b.status}</div>
            </div>
          ))}
        </div>
        {current && (
          <div style={{ flex: 1, background: '#f8fafc', color: '#0f172a', padding: 18, borderRadius: 6, fontFamily: 'Georgia, serif', minHeight: 340 }}>
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 6, marginBottom: 10 }}>
              <strong style={{ fontSize: 18 }}>MISSION BRIEF — {current.missionName}</strong>
              <div style={{ fontSize: 11, color: '#475569' }}>Generated {new Date(data.generatedAt).toLocaleString()}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 13 }}>
              <div><b>Type:</b> {current.type}</div>
              <div><b>Status:</b> {current.status}</div>
              <div><b>Area:</b> {current.area}</div>
              <div><b>ETA:</b> {current.eta}</div>
              <div><b>Drone:</b> {current.assignedDrone}</div>
              <div><b>Pilot:</b> {current.pilotCallsign}</div>
              <div><b>Comms:</b> {current.commsFreq}</div>
              <div><b>Rally:</b> {current.rallyPoint}</div>
            </div>
            <h4 style={{ marginTop: 12 }}>Weather</h4>
            <div style={{ fontSize: 13 }}>
              Wind {current.weather.windKt}kt · Vis {current.weather.visibilityKm}km · Ceiling {current.weather.ceilingFt}ft — {current.weather.summary}
            </div>
            <h4 style={{ marginTop: 12 }}>Objective</h4>
            <p style={{ fontSize: 13 }}>{current.objective}</p>
            <h4 style={{ marginTop: 12 }}>Risks</h4>
            <ul style={{ fontSize: 13, paddingLeft: 18 }}>
              {current.risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
