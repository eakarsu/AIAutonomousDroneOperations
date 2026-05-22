import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4040/api';

const BAND_COLORS = {
  good: '#22c55e',
  warn: '#fbbf24',
  low: '#fb923c',
  critical: '#ef4444',
};

// Mini SVG line chart for time series
function MiniChart({ series, color = '#38bdf8', metric = 'batteryPct', height = 60 }) {
  if (!series || !series.length) return null;
  const W = 260;
  const H = height;
  const vals = series.map((s) => s[metric]);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = Math.max(1, max - min);
  const pts = series.map((s, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = H - ((s[metric] - min) / range) * (H - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
      <polyline
        fill={color}
        opacity="0.18"
        stroke="none"
        points={`0,${H} ${pts} ${W},${H}`}
      />
    </svg>
  );
}

export default function BatteryStatusGrid() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [metric, setMetric] = useState('batteryPct');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get(`${API_BASE}/custom-views/battery-status-grid`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <div data-testid="battery-status-grid" style={{ color: '#fca5a5' }}>Failed: {err}</div>;
  if (!data) return <div data-testid="battery-status-grid">Loading battery grid…</div>;

  const { tiles = [], distribution = {}, totals = {} } = data;
  const metricColor = metric === 'batteryPct' ? '#22c55e' : metric === 'altitudeM' ? '#38bdf8' : '#fbbf24';
  const metricLabel = metric === 'batteryPct' ? 'Battery %' : metric === 'altitudeM' ? 'Altitude (m)' : 'Speed (km/h)';

  return (
    <div data-testid="battery-status-grid" style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Battery &amp; Telemetry Per Drone</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            ['batteryPct', 'Battery'],
            ['altitudeM', 'Altitude'],
            ['speedKmh', 'Speed'],
          ].map(([k, label]) => (
            <button
              key={k}
              data-testid={`metric-${k}`}
              onClick={() => setMetric(k)}
              style={{
                background: metric === k ? '#38bdf8' : '#1e293b',
                color: metric === k ? '#0a0e1a' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', marginBottom: 12, flexWrap: 'wrap' }}>
        <span>Drones: <b style={{ color: '#e2e8f0' }}>{totals.drones}</b></span>
        <span>Spare packs: <b style={{ color: '#e2e8f0' }}>{totals.sparePacks}</b></span>
        {Object.entries(distribution).map(([k, v]) => (
          <span key={k}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: BAND_COLORS[k], borderRadius: 2, marginRight: 4 }} />
            {k}: <b style={{ color: '#e2e8f0' }}>{v}</b>
          </span>
        ))}
        <span style={{ marginLeft: 'auto' }}>Showing: <b style={{ color: metricColor }}>{metricLabel}</b></span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {tiles.map((t) => (
          <div key={t.droneId} data-testid={`drone-tile-${t.droneId}`} style={{ background: '#0b1326', borderLeft: `4px solid ${BAND_COLORS[t.band] || '#64748b'}`, padding: 10, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ color: '#e2e8f0' }}>{t.droneName}</strong>
              <span style={{ color: BAND_COLORS[t.band], fontWeight: 700 }}>{t.level}%</span>
            </div>
            <div style={{ background: '#1e293b', height: 6, borderRadius: 4, marginTop: 6 }}>
              <div style={{ width: `${t.level}%`, height: '100%', background: BAND_COLORS[t.band] || '#64748b', borderRadius: 4 }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <MiniChart series={t.series} metric={metric} color={metricColor} height={56} />
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span>{t.chemistry}</span>
              <span>{t.cycles} cyc</span>
              <span>{t.healthPct}% SoH</span>
              <span>{t.tempC}°C</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
