import React, { useState } from 'react';
import { aiAutonomyService } from '../services/api';

const tabs = [
  { key: 'mission',  label: 'Mission Planner' },
  { key: 'obstacle', label: 'Obstacle Avoidance' },
  { key: 'swarm',    label: 'Swarm Coordination' },
  { key: 'geofence', label: 'Geofence Optimize' },
  { key: 'telemetry', label: 'Telemetry Anomaly' },
];

const inputStyle = {
  width: '100%', padding: 10, background: '#0a0e1a', color: '#e0e6ed',
  border: '1px solid #334155', borderRadius: 6, fontFamily: 'inherit',
};
const labelStyle = { display: 'block', color: '#94a3b8', marginBottom: 4, fontSize: 13, marginTop: 12 };
const btnStyle = {
  padding: '10px 24px', background: '#38bdf8', color: '#0a0e1a',
  border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, marginTop: 16
};

function AIAutonomy() {
  const [tab, setTab] = useState('mission');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [missionForm, setMissionForm] = useState({
    objective: 'Inspect 12 km of high-voltage power line corridor',
    area_of_operations: '',
    constraints: '',
    drone_specs_json: '{"battery_min": 35, "max_altitude_m": 120}',
    weather: '',
    no_fly_zones_json: '[]',
  });
  const [obstacleForm, setObstacleForm] = useState({
    current_position_json: '{"lat": 37.7749, "lng": -122.4194, "alt": 80}',
    current_heading: 'NE 045',
    obstacle_json: '{"type": "static", "lat": 37.7755, "lng": -122.4180, "alt": 75, "radius_m": 25}',
    target_json: '{"lat": 37.7820, "lng": -122.4100, "alt": 90}',
    drone_specs_json: '{"max_speed_ms": 18}',
  });
  const [swarmForm, setSwarmForm] = useState({
    mission_objective: 'Coordinated farmland mapping over 200 hectares',
    drones_json: '[{"id": "D1", "battery": 92}, {"id": "D2", "battery": 88}, {"id": "D3", "battery": 80}]',
    area_json: '{"polygon": [[37.5, -120.1],[37.5, -120.0],[37.4, -120.0]]}',
    constraints: 'Maintain 50m separation; no overlap',
  });
  const [geofenceForm, setGeofenceForm] = useState({
    mission_history_json: '[]',
    no_fly_zones_json: '[{"name": "Airport", "buffer_m": 8000}]',
    terrain: 'Coastal cliffs and urban',
    current_geofence_json: '{"polygon": []}',
  });
  const [telemetryForm, setTelemetryForm] = useState({
    drone_id: 'D-007',
    baseline_json: '{"avg_battery_drain_pct_per_min": 1.2, "avg_temp_c": 38}',
    telemetry_json: '{"battery_drain_pct_per_min": 2.7, "temp_c": 65, "vibration": 0.45}',
  });

  const safeParse = (str, label) => {
    try { return JSON.parse(str); } catch (e) { setError(`Invalid JSON for ${label}: ${e.message}`); return null; }
  };

  const wrap = async (fn) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fn();
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const onTab = (k) => { setTab(k); setError(null); setResult(null); };

  const runMission = () => {
    const drone_specs = safeParse(missionForm.drone_specs_json || '{}', 'drone_specs'); if (drone_specs === null) return;
    const no_fly_zones = safeParse(missionForm.no_fly_zones_json || '[]', 'no_fly_zones'); if (no_fly_zones === null) return;
    wrap(() => aiAutonomyService.missionPlanner({
      objective: missionForm.objective,
      area_of_operations: missionForm.area_of_operations,
      constraints: missionForm.constraints,
      drone_specs, weather: missionForm.weather, no_fly_zones,
    }));
  };

  const runObstacle = () => {
    const current_position = safeParse(obstacleForm.current_position_json, 'current_position'); if (current_position === null) return;
    const obstacle = safeParse(obstacleForm.obstacle_json, 'obstacle'); if (obstacle === null) return;
    const target = safeParse(obstacleForm.target_json, 'target'); if (target === null) return;
    const drone_specs = safeParse(obstacleForm.drone_specs_json || '{}', 'drone_specs'); if (drone_specs === null) return;
    wrap(() => aiAutonomyService.obstacleAvoidance({
      current_position, current_heading: obstacleForm.current_heading, obstacle, target, drone_specs,
    }));
  };

  const runSwarm = () => {
    const drones = safeParse(swarmForm.drones_json, 'drones'); if (drones === null) return;
    const area = safeParse(swarmForm.area_json || '{}', 'area'); if (area === null) return;
    wrap(() => aiAutonomyService.swarmCoordination({
      mission_objective: swarmForm.mission_objective, drones, area, constraints: swarmForm.constraints,
    }));
  };

  const runGeofence = () => {
    const mission_history = safeParse(geofenceForm.mission_history_json || '[]', 'mission_history'); if (mission_history === null) return;
    const no_fly_zones = safeParse(geofenceForm.no_fly_zones_json || '[]', 'no_fly_zones'); if (no_fly_zones === null) return;
    const current_geofence = safeParse(geofenceForm.current_geofence_json || '{}', 'current_geofence'); if (current_geofence === null) return;
    wrap(() => aiAutonomyService.geofenceOptimize({
      mission_history, no_fly_zones, terrain: geofenceForm.terrain, current_geofence,
    }));
  };

  const runTelemetry = () => {
    const baseline = safeParse(telemetryForm.baseline_json || '{}', 'baseline'); if (baseline === null) return;
    const telemetry = safeParse(telemetryForm.telemetry_json, 'telemetry'); if (telemetry === null) return;
    wrap(() => aiAutonomyService.telemetryAnomaly({
      drone_id: telemetryForm.drone_id, baseline, telemetry,
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><i className="fas fa-robot"></i> AI Autonomous Flight</h1>
          <p className="subtitle">Mission planning, obstacle avoidance, swarm, geofence, telemetry anomaly</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => onTab(t.key)} style={{
            padding: '8px 16px',
            background: tab === t.key ? '#38bdf8' : '#1e293b',
            color: tab === t.key ? '#0a0e1a' : '#e0e6ed',
            border: '1px solid #334155', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 16, background: '#161b2d', borderRadius: 12 }}>
          {tab === 'mission' && (
            <>
              <h3>Mission Planner</h3>
              <label style={labelStyle}>Objective</label>
              <input style={inputStyle} value={missionForm.objective}
                onChange={(e) => setMissionForm({ ...missionForm, objective: e.target.value })} />
              <label style={labelStyle}>Area of operations</label>
              <input style={inputStyle} value={missionForm.area_of_operations}
                onChange={(e) => setMissionForm({ ...missionForm, area_of_operations: e.target.value })} />
              <label style={labelStyle}>Constraints</label>
              <input style={inputStyle} value={missionForm.constraints}
                onChange={(e) => setMissionForm({ ...missionForm, constraints: e.target.value })} />
              <label style={labelStyle}>Drone specs (JSON)</label>
              <textarea rows={3} style={inputStyle} value={missionForm.drone_specs_json}
                onChange={(e) => setMissionForm({ ...missionForm, drone_specs_json: e.target.value })} />
              <label style={labelStyle}>Weather</label>
              <input style={inputStyle} value={missionForm.weather}
                onChange={(e) => setMissionForm({ ...missionForm, weather: e.target.value })} />
              <label style={labelStyle}>No-fly zones (JSON array)</label>
              <textarea rows={3} style={inputStyle} value={missionForm.no_fly_zones_json}
                onChange={(e) => setMissionForm({ ...missionForm, no_fly_zones_json: e.target.value })} />
              <button style={btnStyle} onClick={runMission} disabled={loading}>
                {loading ? 'Working...' : 'Plan Mission'}
              </button>
            </>
          )}

          {tab === 'obstacle' && (
            <>
              <h3>Obstacle Avoidance</h3>
              <label style={labelStyle}>Current position (JSON)</label>
              <textarea rows={3} style={inputStyle} value={obstacleForm.current_position_json}
                onChange={(e) => setObstacleForm({ ...obstacleForm, current_position_json: e.target.value })} />
              <label style={labelStyle}>Current heading</label>
              <input style={inputStyle} value={obstacleForm.current_heading}
                onChange={(e) => setObstacleForm({ ...obstacleForm, current_heading: e.target.value })} />
              <label style={labelStyle}>Obstacle (JSON)</label>
              <textarea rows={3} style={inputStyle} value={obstacleForm.obstacle_json}
                onChange={(e) => setObstacleForm({ ...obstacleForm, obstacle_json: e.target.value })} />
              <label style={labelStyle}>Target (JSON)</label>
              <textarea rows={3} style={inputStyle} value={obstacleForm.target_json}
                onChange={(e) => setObstacleForm({ ...obstacleForm, target_json: e.target.value })} />
              <label style={labelStyle}>Drone specs (JSON)</label>
              <textarea rows={2} style={inputStyle} value={obstacleForm.drone_specs_json}
                onChange={(e) => setObstacleForm({ ...obstacleForm, drone_specs_json: e.target.value })} />
              <button style={btnStyle} onClick={runObstacle} disabled={loading}>
                {loading ? 'Working...' : 'Compute Avoidance'}
              </button>
            </>
          )}

          {tab === 'swarm' && (
            <>
              <h3>Swarm Coordination</h3>
              <label style={labelStyle}>Mission objective</label>
              <input style={inputStyle} value={swarmForm.mission_objective}
                onChange={(e) => setSwarmForm({ ...swarmForm, mission_objective: e.target.value })} />
              <label style={labelStyle}>Drones (JSON array)</label>
              <textarea rows={4} style={inputStyle} value={swarmForm.drones_json}
                onChange={(e) => setSwarmForm({ ...swarmForm, drones_json: e.target.value })} />
              <label style={labelStyle}>Area (JSON)</label>
              <textarea rows={3} style={inputStyle} value={swarmForm.area_json}
                onChange={(e) => setSwarmForm({ ...swarmForm, area_json: e.target.value })} />
              <label style={labelStyle}>Constraints</label>
              <input style={inputStyle} value={swarmForm.constraints}
                onChange={(e) => setSwarmForm({ ...swarmForm, constraints: e.target.value })} />
              <button style={btnStyle} onClick={runSwarm} disabled={loading}>
                {loading ? 'Working...' : 'Coordinate Swarm'}
              </button>
            </>
          )}

          {tab === 'geofence' && (
            <>
              <h3>Geofence Optimization</h3>
              <label style={labelStyle}>Mission history (JSON array)</label>
              <textarea rows={3} style={inputStyle} value={geofenceForm.mission_history_json}
                onChange={(e) => setGeofenceForm({ ...geofenceForm, mission_history_json: e.target.value })} />
              <label style={labelStyle}>No-fly zones (JSON array)</label>
              <textarea rows={3} style={inputStyle} value={geofenceForm.no_fly_zones_json}
                onChange={(e) => setGeofenceForm({ ...geofenceForm, no_fly_zones_json: e.target.value })} />
              <label style={labelStyle}>Terrain</label>
              <input style={inputStyle} value={geofenceForm.terrain}
                onChange={(e) => setGeofenceForm({ ...geofenceForm, terrain: e.target.value })} />
              <label style={labelStyle}>Current geofence (JSON)</label>
              <textarea rows={3} style={inputStyle} value={geofenceForm.current_geofence_json}
                onChange={(e) => setGeofenceForm({ ...geofenceForm, current_geofence_json: e.target.value })} />
              <button style={btnStyle} onClick={runGeofence} disabled={loading}>
                {loading ? 'Working...' : 'Optimize Geofence'}
              </button>
            </>
          )}

          {tab === 'telemetry' && (
            <>
              <h3>Telemetry Anomaly</h3>
              <label style={labelStyle}>Drone ID</label>
              <input style={inputStyle} value={telemetryForm.drone_id}
                onChange={(e) => setTelemetryForm({ ...telemetryForm, drone_id: e.target.value })} />
              <label style={labelStyle}>Baseline (JSON)</label>
              <textarea rows={3} style={inputStyle} value={telemetryForm.baseline_json}
                onChange={(e) => setTelemetryForm({ ...telemetryForm, baseline_json: e.target.value })} />
              <label style={labelStyle}>Telemetry sample (JSON)</label>
              <textarea rows={4} style={inputStyle} value={telemetryForm.telemetry_json}
                onChange={(e) => setTelemetryForm({ ...telemetryForm, telemetry_json: e.target.value })} />
              <button style={btnStyle} onClick={runTelemetry} disabled={loading}>
                {loading ? 'Working...' : 'Detect Anomaly'}
              </button>
            </>
          )}

          {error && <p style={{ color: '#f87171', marginTop: 12 }}>{error}</p>}
        </div>

        <div className="card" style={{ padding: 16, background: '#161b2d', borderRadius: 12 }}>
          <h3>Result</h3>
          {!result && <p style={{ color: '#64748b' }}>Run a feature to see the response.</p>}
          {result && (
            <pre style={{
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 700,
              overflow: 'auto', background: '#0a0e1a', padding: 12, borderRadius: 8, fontSize: 12,
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIAutonomy;
