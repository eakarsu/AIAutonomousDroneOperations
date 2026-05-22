import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4040/api';

const KIND_COLORS = {
  'no-fly': '#ef4444',
  restricted: '#fbbf24',
  operational: '#22c55e',
  emergency: '#f97316',
  temporary: '#a78bfa',
  permanent: '#38bdf8',
};

function authHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

// Project lat/lng to SVG canvas using a fixed bbox around SF
const BBOX = { minLat: 37.74, maxLat: 37.82, minLng: -122.46, maxLng: -122.38 };
const W = 720, H = 360;
const project = (lat, lng) => {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * W;
  const y = H - ((lat - BBOX.minLat) / (BBOX.maxLat - BBOX.minLat)) * H;
  return { x, y };
};
const unproject = (x, y) => {
  const lng = BBOX.minLng + (x / W) * (BBOX.maxLng - BBOX.minLng);
  const lat = BBOX.minLat + ((H - y) / H) * (BBOX.maxLat - BBOX.minLat);
  return { lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)) };
};

export default function GeofenceEditor() {
  const [zones, setZones] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState([]); // array of {lat,lng} while drawing
  const [newName, setNewName] = useState('Zone Alpha');
  const [newKind, setNewKind] = useState('no-fly');

  const load = async () => {
    try {
      const r = await axios.get(`${API_BASE}/custom-views/geofence-zones`, { headers: authHeader() });
      setZones(r.data.zones || []);
      if (!selectedId && r.data.zones?.length) setSelectedId(r.data.zones[0].id);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onCanvasClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    const sy = (e.clientY - rect.top) * (H / rect.height);
    const pt = unproject(sx, sy);
    setDraft((d) => [...d, pt]);
  };

  const createZone = async () => {
    if (draft.length < 3) {
      setErr('Need at least 3 points to create a polygon');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const body = {
        name: newName,
        kind: newKind,
        polygon: draft,
        minAltitudeM: 0,
        maxAltitudeM: 400,
        status: 'active',
        authority: 'OPS',
      };
      const r = await axios.post(`${API_BASE}/custom-views/geofence-zones`, body, { headers: authHeader() });
      setDraft([]);
      setSelectedId(r.data.zone?.id);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const updateSelected = async (changes) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await axios.put(`${API_BASE}/custom-views/geofence-zones/${selectedId}`, changes, { headers: authHeader() });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteZone = async (id) => {
    setBusy(true);
    try {
      await axios.delete(`${API_BASE}/custom-views/geofence-zones/${id}`, { headers: authHeader() });
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const selected = zones.find((z) => z.id === selectedId);

  return (
    <div data-testid="geofence-editor" style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Geofence / No-Fly Polygon Editor</h3>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>Click canvas to add points · {draft.length} pts drawn</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div>
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            onClick={onCanvasClick}
            style={{ background: 'radial-gradient(ellipse at center, #0b1d3a 0%, #050a17 100%)', borderRadius: 8, cursor: 'crosshair' }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`gx-${i}`} x1={(W / 12) * i} y1={0} x2={(W / 12) * i} y2={H} stroke="#1e293b" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`gy-${i}`} x1={0} y1={(H / 8) * i} x2={W} y2={(H / 8) * i} stroke="#1e293b" strokeWidth="0.5" />
            ))}
            {/* existing zones */}
            {zones.map((z) => {
              const pts = z.polygon.map((p) => {
                const { x, y } = project(p.lat, p.lng);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
              const col = KIND_COLORS[z.kind] || '#94a3b8';
              return (
                <g key={z.id} data-testid={`zone-${z.id}`} onClick={(e) => { e.stopPropagation(); setSelectedId(z.id); }} style={{ cursor: 'pointer' }}>
                  <polygon
                    points={pts}
                    fill={col}
                    fillOpacity={z.id === selectedId ? 0.35 : 0.15}
                    stroke={col}
                    strokeWidth={z.id === selectedId ? 2.5 : 1.5}
                    strokeOpacity="0.9"
                  />
                </g>
              );
            })}
            {/* draft polygon being drawn */}
            {draft.length > 0 && (
              <g>
                {draft.length >= 3 && (
                  <polygon
                    points={draft.map((p) => {
                      const { x, y } = project(p.lat, p.lng);
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(' ')}
                    fill="#38bdf8"
                    fillOpacity="0.18"
                    stroke="#38bdf8"
                    strokeDasharray="5,4"
                    strokeWidth="2"
                  />
                )}
                {draft.map((p, i) => {
                  const { x, y } = project(p.lat, p.lng);
                  return <circle key={i} cx={x} cy={y} r="4" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />;
                })}
              </g>
            )}
          </svg>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <input
              data-testid="new-zone-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Zone name"
              style={{ flex: 1, minWidth: 120, padding: 6, background: '#0b1326', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: 4 }}
            />
            <select
              data-testid="new-zone-kind"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value)}
              style={{ padding: 6, background: '#0b1326', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: 4 }}
            >
              {Object.keys(KIND_COLORS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <button
              data-testid="create-zone-btn"
              onClick={createZone}
              disabled={busy || draft.length < 3}
              style={{ background: '#22c55e', color: '#0a0e1a', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, opacity: draft.length < 3 ? 0.5 : 1 }}
            >
              Create Polygon
            </button>
            <button
              onClick={() => setDraft([])}
              disabled={!draft.length}
              style={{ background: '#475569', color: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}
            >
              Clear Draft
            </button>
          </div>
        </div>

        <div style={{ background: '#0b1326', padding: 10, borderRadius: 6, maxHeight: 480, overflowY: 'auto' }}>
          <h4 style={{ marginTop: 0, color: '#e2e8f0' }}>Zones ({zones.length})</h4>
          {zones.map((z) => (
            <div
              key={z.id}
              data-testid={`zone-row-${z.id}`}
              onClick={() => setSelectedId(z.id)}
              style={{
                background: z.id === selectedId ? '#1e293b' : 'transparent',
                borderLeft: `3px solid ${KIND_COLORS[z.kind] || '#94a3b8'}`,
                padding: 8,
                marginBottom: 6,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#e2e8f0', fontSize: 13 }}>{z.name}</strong>
                <button
                  data-testid={`delete-zone-${z.id}`}
                  onClick={(e) => { e.stopPropagation(); deleteZone(z.id); }}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: 3, fontSize: 11, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                {z.kind} · {z.polygon.length} pts · alt {z.minAltitudeM}–{z.maxAltitudeM}m · {z.status}
              </div>
            </div>
          ))}
          {selected && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1e293b' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Edit selected:</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => updateSelected({ status: selected.status === 'active' ? 'inactive' : 'active' })}
                  style={{ background: '#38bdf8', color: '#0a0e1a', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                >
                  Toggle Status ({selected.status})
                </button>
                <button
                  onClick={() => updateSelected({ maxAltitudeM: (selected.maxAltitudeM || 0) + 50 })}
                  style={{ background: '#fbbf24', color: '#0a0e1a', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                >
                  Raise Ceiling +50m
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {err && <div style={{ color: '#fca5a5', marginTop: 8 }}>Error: {err}</div>}
    </div>
  );
}
