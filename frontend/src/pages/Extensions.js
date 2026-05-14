// Apply pass 5 — surface /api/ai/* extension endpoints
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const SECTIONS = [
  {
    id: 'vendor-status',
    title: 'Vendor Fleet Status (NEEDS-CREDS: DRONE_VENDOR + DRONE_VENDOR_API_KEY)',
    method: 'GET',
    path: '/ai/vendor/status',
  },
  {
    id: 'vendor-link',
    title: 'Vendor Drone Link (NEEDS-CREDS)',
    method: 'POST',
    path: '/ai/vendor/link-drone',
    sample: { drone_id: 1, vendor_drone_id: 'DJI-12345' },
  },
  {
    id: 'c2-enqueue',
    title: 'C2 Command Enqueue (TOO-RISKY → registry only)',
    method: 'POST',
    path: '/ai/c2/enqueue',
    sample: { drone_id: 1, command: 'return_to_home', params: { reason: 'low_battery' } },
  },
  {
    id: 'noaa',
    title: 'NOAA Weather (NEEDS-CREDS: NOAA_API_TOKEN)',
    method: 'GET',
    path: '/ai/weather/noaa?lat=37.42&lon=-122.08',
  },
  {
    id: 'image',
    title: 'Image Analysis Job (TOO-RISKY → registry only)',
    method: 'POST',
    path: '/ai/image-analysis/jobs',
    sample: { drone_id: 1, image_ref: 's3://bucket/photo1.jpg', analysis_type: 'thermal_anomaly' },
  },
  {
    id: 'slam',
    title: 'SLAM Replan (TOO-RISKY → text-grounded waypoint stub)',
    method: 'POST',
    path: '/ai/slam-replan',
    sample: { drone_id: 1, current_waypoint: { lat: 37.42, lon: -122.08, alt_m: 50 }, obstacles: [{ description: 'tree at 30m, 0.7 confidence' }] },
  },
];

export default function Extensions() {
  const [out, setOut] = useState({});
  const [busy, setBusy] = useState({});

  async function run(s) {
    setBusy({ ...busy, [s.id]: true });
    try {
      const url = `${API_BASE}${s.path}`;
      const res = await axios({ method: s.method, url, data: s.sample, headers: authHeaders(), validateStatus: () => true });
      setOut({ ...out, [s.id]: { status: res.status, body: res.data } });
    } catch (e) {
      setOut({ ...out, [s.id]: { status: 0, body: { error: e.message } } });
    } finally {
      setBusy({ ...busy, [s.id]: false });
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Backlog Extensions (Apply pass 5)</h2>
      <p>503 means env vars missing; configure backend `.env` to enable.</p>
      {SECTIONS.map(s => (
        <div key={s.id} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, margin: '12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{s.title}</strong>
            <button onClick={() => run(s)} disabled={busy[s.id]}>
              {busy[s.id] ? 'Calling…' : `Run ${s.method}`}
            </button>
          </div>
          {s.sample && (
            <details>
              <summary>Sample payload</summary>
              <pre>{JSON.stringify(s.sample, null, 2)}</pre>
            </details>
          )}
          {out[s.id] && (
            <div>
              <div>HTTP <code>{out[s.id].status}</code></div>
              <pre>{JSON.stringify(out[s.id].body, null, 2)}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
