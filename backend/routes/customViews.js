// customViews.js — 4 synthesizing endpoints for autonomous drone ops
// Mounted at /api/custom-views (BEFORE any 404 handler)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

let models = null;
try {
  models = require('../models');
} catch (e) {
  console.warn('[custom-views] models not loaded yet:', e.message);
}

function safeNum(n, d = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : d;
}

async function fetchSafe(modelName, opts = {}) {
  try {
    if (!models || !models[modelName]) return [];
    const rows = await models[modelName].findAll({ raw: true, limit: 200, ...opts });
    return rows || [];
  } catch (e) {
    console.warn(`[custom-views] ${modelName} fetch failed:`, e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 1. VIZ — Flight Path Map (multiple drones, leaflet-compatible)
// GET /api/custom-views/live-drone-map
// ─────────────────────────────────────────────────────────────────────────
router.get('/live-drone-map', async (req, res) => {
  try {
    const drones = await fetchSafe('Drone');
    const baseLat = 37.7749, baseLng = -122.4194;
    const positions = drones.map((d, i) => {
      const angle = (i * 360) / Math.max(drones.length, 1);
      const radius = 0.04 + (i % 5) * 0.012;
      const lat = baseLat + Math.cos((angle * Math.PI) / 180) * radius;
      const lng = baseLng + Math.sin((angle * Math.PI) / 180) * radius;
      // Synthesize a deterministic flight path (5 waypoints) per drone
      const path = Array.from({ length: 5 }).map((_, k) => ({
        lat: parseFloat((lat + Math.cos(k * (Math.PI / 3) + i) * 0.008).toFixed(5)),
        lng: parseFloat((lng + Math.sin(k * (Math.PI / 3) + i) * 0.008).toFixed(5)),
      }));
      return {
        id: d.id,
        name: d.name,
        model: d.model,
        status: d.status || 'unknown',
        batteryLevel: safeNum(d.batteryLevel, 0),
        altitudeM: 40 + (i % 8) * 22,
        speedKmh: 8 + (i % 6) * 5,
        headingDeg: (i * 47) % 360,
        lat: parseFloat(lat.toFixed(5)),
        lng: parseFloat(lng.toFixed(5)),
        path,
        lastSeen: new Date(Date.now() - (i * 17_000)).toISOString(),
        link: ['nominal', 'nominal', 'degraded', 'nominal'][i % 4],
      };
    });
    const summary = {
      totalDrones: positions.length,
      active: positions.filter((p) => p.status === 'active').length,
      avgBattery: positions.length
        ? Math.round(positions.reduce((a, b) => a + b.batteryLevel, 0) / positions.length)
        : 0,
      airborne: positions.filter((p) => p.altitudeM > 0 && p.status === 'active').length,
      bbox: { minLat: baseLat - 0.1, maxLat: baseLat + 0.1, minLng: baseLng - 0.1, maxLng: baseLng + 0.1 },
      generatedAt: new Date().toISOString(),
    };
    res.json({ success: true, summary, positions });
  } catch (e) {
    console.error('[custom-views/live-drone-map]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// 2. VIZ — Battery/Telemetry chart per drone (time series + grid summary)
// GET /api/custom-views/battery-status-grid
// ─────────────────────────────────────────────────────────────────────────
router.get('/battery-status-grid', async (req, res) => {
  try {
    const [drones, batteries] = await Promise.all([
      fetchSafe('Drone'),
      fetchSafe('Battery'),
    ]);

    const tiles = drones.map((d, i) => {
      const lvl = safeNum(d.batteryLevel, 50);
      const cycles = 120 + ((i * 37) % 600);
      const healthPct = Math.max(0, 100 - Math.floor(cycles / 12));
      const tempC = 22 + ((i * 7) % 18);
      // Time series — 30 data points showing battery + altitude history
      const series = Array.from({ length: 30 }).map((_, t) => {
        const pct = Math.max(5, Math.min(100, lvl + Math.round(Math.sin(t * 0.4 + i) * 12) + (30 - t) * 0.4));
        const alt = Math.max(0, 60 + Math.round(Math.sin(t * 0.3 + i * 0.7) * 40));
        const spd = Math.max(0, 14 + Math.round(Math.cos(t * 0.5 + i * 0.3) * 6));
        return {
          tSec: t * 10,
          batteryPct: Math.round(pct),
          altitudeM: alt,
          speedKmh: spd,
        };
      });
      let band = 'critical';
      if (lvl >= 75) band = 'good';
      else if (lvl >= 40) band = 'warn';
      else if (lvl >= 20) band = 'low';
      return {
        droneId: d.id,
        droneName: d.name,
        level: lvl,
        cycles,
        healthPct,
        tempC,
        chemistry: ['LiPo', 'LiHV', 'LiIon'][i % 3],
        band,
        estFlightMin: Math.round((lvl / 100) * safeNum(d.maxFlightTime, 30)),
        series,
      };
    });

    const distribution = {
      good: tiles.filter((t) => t.band === 'good').length,
      warn: tiles.filter((t) => t.band === 'warn').length,
      low: tiles.filter((t) => t.band === 'low').length,
      critical: tiles.filter((t) => t.band === 'critical').length,
    };

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      totals: { drones: tiles.length, sparePacks: batteries.length },
      distribution,
      tiles,
    });
  } catch (e) {
    console.error('[custom-views/battery-status-grid]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// 3. NON-VIZ — Mission Brief PDF (printable text)
// GET /api/custom-views/mission-brief
// ─────────────────────────────────────────────────────────────────────────
router.get('/mission-brief', async (req, res) => {
  try {
    const [missions, drones, weather] = await Promise.all([
      fetchSafe('Mission'),
      fetchSafe('Drone'),
      fetchSafe('WeatherReport'),
    ]);

    const briefs = missions.slice(0, 12).map((m, i) => {
      const drone = drones.find((d) => d.id === m.droneId) || drones[i % Math.max(drones.length, 1)] || {};
      const wx = weather[i % Math.max(weather.length, 1)] || {};
      return {
        id: m.id,
        missionName: m.name,
        objective: m.notes || `Conduct ${m.type || 'general'} operation in ${m.area || 'AOR'}.`,
        type: m.type,
        status: m.status,
        area: m.area,
        startTime: m.startTime,
        assignedDrone: drone.name || 'Unassigned',
        droneModel: drone.model || 'N/A',
        pilotCallsign: ['HAWK-1', 'EAGLE-2', 'OSPREY-3', 'FALCON-4'][i % 4],
        commsFreq: ['122.900 MHz', '5.8 GHz LTE', '900 MHz LR', '2.4 GHz'][i % 4],
        rallyPoint: ['LZ-Alpha', 'LZ-Bravo', 'LZ-Charlie', 'LZ-Delta'][i % 4],
        weather: {
          windKt: 4 + (i % 9),
          visibilityKm: 8 + (i % 6),
          ceilingFt: 1500 + (i * 130) % 4000,
          summary: wx.summary || wx.conditions || 'VMC, light winds',
        },
        risks: [
          i % 2 ? 'Bird activity reported in sector' : 'Solar interference at apogee',
          'RC link degradation possible past 2 km',
        ],
        eta: `${15 + (i % 30)} min`,
      };
    });

    const printableText = briefs.map((b, i) =>
      `# MISSION BRIEF ${i + 1} — ${b.missionName}\n` +
      `Type: ${b.type}   Status: ${b.status}   Area: ${b.area}\n` +
      `Drone: ${b.assignedDrone} (${b.droneModel})   Pilot: ${b.pilotCallsign}\n` +
      `Comms: ${b.commsFreq}   Rally: ${b.rallyPoint}   ETA: ${b.eta}\n` +
      `WX: wind ${b.weather.windKt}kt, vis ${b.weather.visibilityKm}km, ceiling ${b.weather.ceilingFt}ft — ${b.weather.summary}\n` +
      `Objective: ${b.objective}\n` +
      `Risks: ${b.risks.join('; ')}`
    ).join('\n\n---\n\n');

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      count: briefs.length,
      briefs,
      printableText,
    });
  } catch (e) {
    console.error('[custom-views/mission-brief]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// 4. NON-VIZ — Geofence / No-Fly polygon editor (CRUD, in-memory + read-from-db)
// /api/custom-views/geofence-zones  (GET, POST, PUT/:id, DELETE/:id)
// ─────────────────────────────────────────────────────────────────────────
// In-memory CRUD store seeded from DB Geofence rows (does NOT modify DB).
let _zoneStore = null;
let _nextId = 1;

function _seedFromDb(rows) {
  _zoneStore = (rows || []).slice(0, 12).map((g, i) => {
    const coords = Array.isArray(g.coordinates) && g.coordinates.length
      ? g.coordinates
      : Array.from({ length: 5 }).map((_, k) => ({
          lat: parseFloat((37.78 + Math.cos(k * 1.2 + i) * 0.02).toFixed(5)),
          lng: parseFloat((-122.42 + Math.sin(k * 1.2 + i) * 0.02).toFixed(5)),
        }));
    const id = g.id || (_nextId++);
    if (id >= _nextId) _nextId = id + 1;
    return {
      id,
      name: g.name || `Zone ${i + 1}`,
      kind: g.type || 'no-fly',
      shape: 'polygon',
      polygon: coords,
      minAltitudeM: safeNum(g.minAltitude, 0),
      maxAltitudeM: safeNum(g.maxAltitude, 500),
      status: g.status || 'active',
      authority: g.authority || 'FAA',
      notes: g.notes || '',
    };
  });
  // Always ensure at least 3 demo polygons so the editor is interactive
  while (_zoneStore.length < 3) {
    const i = _zoneStore.length;
    _zoneStore.push({
      id: _nextId++,
      name: `Demo Zone ${i + 1}`,
      kind: ['no-fly', 'restricted', 'operational'][i % 3],
      shape: 'polygon',
      polygon: Array.from({ length: 5 }).map((_, k) => ({
        lat: parseFloat((37.78 + Math.cos(k * 1.2 + i) * 0.02).toFixed(5)),
        lng: parseFloat((-122.42 + Math.sin(k * 1.2 + i) * 0.02).toFixed(5)),
      })),
      minAltitudeM: 0,
      maxAltitudeM: 400,
      status: 'active',
      authority: 'OPS',
      notes: 'Synthesized demo polygon',
    });
  }
}

async function _ensureSeeded() {
  if (_zoneStore) return;
  const rows = await fetchSafe('Geofence');
  _seedFromDb(rows);
}

router.get('/geofence-zones', async (req, res) => {
  try {
    await _ensureSeeded();
    res.json({
      success: true,
      count: _zoneStore.length,
      zones: _zoneStore,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[custom-views/geofence-zones GET]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/geofence-zones', async (req, res) => {
  try {
    await _ensureSeeded();
    const b = req.body || {};
    const polygon = Array.isArray(b.polygon) && b.polygon.length >= 3
      ? b.polygon.map((p) => ({ lat: safeNum(p.lat), lng: safeNum(p.lng) }))
      : Array.from({ length: 5 }).map((_, k) => ({
          lat: parseFloat((37.78 + Math.cos(k) * 0.015).toFixed(5)),
          lng: parseFloat((-122.42 + Math.sin(k) * 0.015).toFixed(5)),
        }));
    const zone = {
      id: _nextId++,
      name: b.name || `Zone ${_nextId}`,
      kind: b.kind || 'no-fly',
      shape: 'polygon',
      polygon,
      minAltitudeM: safeNum(b.minAltitudeM, 0),
      maxAltitudeM: safeNum(b.maxAltitudeM, 400),
      status: b.status || 'active',
      authority: b.authority || 'OPS',
      notes: b.notes || '',
    };
    _zoneStore.push(zone);
    res.status(201).json({ success: true, zone });
  } catch (e) {
    console.error('[custom-views/geofence-zones POST]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/geofence-zones/:id', async (req, res) => {
  try {
    await _ensureSeeded();
    const id = parseInt(req.params.id, 10);
    const idx = _zoneStore.findIndex((z) => z.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Zone not found' });
    const b = req.body || {};
    const merged = {
      ..._zoneStore[idx],
      ...b,
      id,
      polygon: Array.isArray(b.polygon) && b.polygon.length >= 3
        ? b.polygon.map((p) => ({ lat: safeNum(p.lat), lng: safeNum(p.lng) }))
        : _zoneStore[idx].polygon,
    };
    _zoneStore[idx] = merged;
    res.json({ success: true, zone: merged });
  } catch (e) {
    console.error('[custom-views/geofence-zones PUT]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/geofence-zones/:id', async (req, res) => {
  try {
    await _ensureSeeded();
    const id = parseInt(req.params.id, 10);
    const before = _zoneStore.length;
    _zoneStore = _zoneStore.filter((z) => z.id !== id);
    if (_zoneStore.length === before) return res.status(404).json({ success: false, error: 'Zone not found' });
    res.json({ success: true, deletedId: id, remaining: _zoneStore.length });
  } catch (e) {
    console.error('[custom-views/geofence-zones DELETE]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ feature: 'custom-views', status: 'ok', endpoints: 4 });
});

module.exports = router;
