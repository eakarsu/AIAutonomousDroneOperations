import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4040/api';

function colorFor(status) {
  if (status === 'active') return '#22c55e';
  if (status === 'standby') return '#38bdf8';
  if (status === 'maintenance') return '#f59e0b';
  return '#94a3b8';
}

export default function LiveDroneMap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = () => {
    const token = localStorage.getItem('token');
    axios
      .get(`${API_BASE}/custom-views/live-drone-map`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  if (err) return <div data-testid="live-drone-map" style={{ color: '#fca5a5' }}>Failed: {err}</div>;
  if (!data) return <div data-testid="live-drone-map">Loading flight path map…</div>;

  const { positions = [], summary = {} } = data;
  const W = 720, H = 380;
  const { bbox } = summary;
  const project = (lat, lng) => {
    const x = ((lng - bbox.minLng) / (bbox.maxLng - bbox.minLng)) * W;
    const y = H - ((lat - bbox.minLat) / (bbox.maxLat - bbox.minLat)) * H;
    return { x, y };
  };

  return (
    <div data-testid="live-drone-map" style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #1e293b' }}>
      <h3 style={{ marginBottom: 8 }}>Flight Path Map (Multiple Drones)</h3>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#94a3b8', marginBottom: 8, flexWrap: 'wrap' }}>
        <span>Total: <b style={{ color: '#e2e8f0' }}>{summary.totalDrones}</b></span>
        <span>Active: <b style={{ color: '#22c55e' }}>{summary.active}</b></span>
        <span>Airborne: <b style={{ color: '#38bdf8' }}>{summary.airborne}</b></span>
        <span>Avg Battery: <b style={{ color: '#fbbf24' }}>{summary.avgBattery}%</b></span>
        {selected && <span style={{ marginLeft: 'auto' }}>Selected: <b style={{ color: '#38bdf8' }}>{selected.name}</b> ({selected.batteryLevel}% · {selected.altitudeM}m · {selected.speedKmh}km/h)</span>}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ background: 'radial-gradient(ellipse at center, #0b1d3a 0%, #050a17 100%)', borderRadius: 8 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`gx-${i}`} x1={(W / 12) * i} y1={0} x2={(W / 12) * i} y2={H} stroke="#1e293b" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`gy-${i}`} x1={0} y1={(H / 8) * i} x2={W} y2={(H / 8) * i} stroke="#1e293b" strokeWidth="0.5" />
        ))}
        {positions.map((p) => {
          if (!p.path || p.path.length < 2) return null;
          const pts = p.path.map((wp) => {
            const { x, y } = project(wp.lat, wp.lng);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ');
          return (
            <polyline
              key={`path-${p.id}`}
              fill="none"
              stroke={colorFor(p.status)}
              strokeOpacity="0.45"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              points={pts}
            />
          );
        })}
        {positions.flatMap((p) =>
          (p.path || []).map((wp, k) => {
            const { x, y } = project(wp.lat, wp.lng);
            return (
              <circle key={`wp-${p.id}-${k}`} cx={x} cy={y} r="2" fill={colorFor(p.status)} opacity="0.6" />
            );
          })
        )}
        {positions.map((p) => {
          const { x, y } = project(p.lat, p.lng);
          return (
            <g key={p.id} data-testid={`drone-${p.id}`} style={{ cursor: 'pointer' }} onClick={() => setSelected(p)}>
              <circle cx={x} cy={y} r="11" fill={colorFor(p.status)} opacity="0.22" />
              <circle cx={x} cy={y} r="5" fill={colorFor(p.status)} />
              <text x={x + 8} y={y - 6} fontSize="10" fill="#cbd5e1">{p.name}</text>
              <text x={x + 8} y={y + 8} fontSize="9" fill="#94a3b8">{p.batteryLevel}% · {p.altitudeM}m</text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
        Dashed lines = planned flight path. Click a drone marker to inspect.
      </div>
    </div>
  );
}
