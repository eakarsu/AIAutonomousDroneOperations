const express = require('express');
const authMiddleware = require('../middleware/auth');
const { queryAIStructured } = require('../services/openrouter');

const router = express.Router();

router.use(authMiddleware);

// POST /api/ai/mission-planner — auto-generate mission plan from objective + constraints
router.post('/mission-planner', async (req, res) => {
  try {
    const { objective, area_of_operations, constraints, drone_specs, weather, no_fly_zones } = req.body || {};
    if (!objective) return res.status(400).json({ error: 'objective is required' });

    const result = await queryAIStructured(
      `You are an autonomous drone mission planner. Given the objective and constraints, propose a mission plan with waypoints, flight altitude, payload, time estimates, and contingency plans. Always respond with valid JSON only following the schema below.`,
      JSON.stringify({
        objective,
        area_of_operations: area_of_operations || null,
        constraints: constraints || null,
        drone_specs: drone_specs || null,
        weather: weather || null,
        no_fly_zones: no_fly_zones || [],
        output_schema: {
          summary: 'string',
          waypoints: [{ lat: 0, lon: 0, alt_m: 0, action: 'string' }],
          altitude_m: 0,
          estimated_duration_min: 0,
          estimated_battery_pct: 0,
          payload_recommended: 'string',
          contingencies: ['string'],
          risk_level: 'low|medium|high',
          recommendations: ['string']
        }
      }, null, 2)
    );
    res.json({ success: true, mission: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/obstacle-avoidance — propose replan when obstacle detected
router.post('/obstacle-avoidance', async (req, res) => {
  try {
    const { current_position, current_heading, obstacle, target, drone_specs } = req.body || {};
    if (!current_position || !target) return res.status(400).json({ error: 'current_position and target are required' });

    const result = await queryAIStructured(
      `You are an autonomous drone obstacle-avoidance system (SLAM + cv replanning). Given the current state and obstacle data, return a safe replanned route.`,
      JSON.stringify({
        current_position, current_heading, obstacle, target, drone_specs: drone_specs || null,
        output_schema: {
          replanned_route: [{ lat: 0, lon: 0, alt_m: 0 }],
          maneuver: 'climb|descend|left|right|hover|abort',
          urgency: 'low|medium|high|critical',
          rationale: 'string',
          safety_buffer_m: 0
        }
      }, null, 2)
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/swarm-coordination — coordinate multi-drone choreography
router.post('/swarm-coordination', async (req, res) => {
  try {
    const { mission_objective, drones, area, constraints } = req.body || {};
    if (!Array.isArray(drones) || drones.length < 2) return res.status(400).json({ error: 'drones must be an array of at least 2' });

    const result = await queryAIStructured(
      `You are a drone swarm coordination AI. Allocate roles, sectors and timing across the drones; minimize conflicts and battery overlap.`,
      JSON.stringify({
        mission_objective: mission_objective || 'unspecified',
        drones, area: area || null, constraints: constraints || null,
        output_schema: {
          assignments: [{ drone_id: 'string', role: 'string', sector: 'string', start_time: 'string', end_time: 'string' }],
          deconfliction_rules: ['string'],
          rendezvous_points: [{ lat: 0, lon: 0, alt_m: 0 }],
          summary: 'string'
        }
      }, null, 2)
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/geofence-optimize — recommend optimized geofence boundaries
router.post('/geofence-optimize', async (req, res) => {
  try {
    const { mission_history, no_fly_zones, terrain, current_geofence } = req.body || {};

    const result = await queryAIStructured(
      `You are a geospatial drone-ops planner. Recommend an optimized geofence (polygon) given prior mission patterns, no-fly constraints, and terrain.`,
      JSON.stringify({
        mission_history: mission_history || [], no_fly_zones: no_fly_zones || [], terrain: terrain || null, current_geofence: current_geofence || null,
        output_schema: {
          recommended_polygon: [{ lat: 0, lon: 0 }],
          buffer_m: 0,
          excluded_areas: [{ lat: 0, lon: 0 }],
          rationale: 'string',
          coverage_score: 0
        }
      }, null, 2)
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/telemetry-anomaly — flag anomalies in flight telemetry
router.post('/telemetry-anomaly', async (req, res) => {
  try {
    const { telemetry, drone_id, baseline } = req.body || {};
    if (!Array.isArray(telemetry) || telemetry.length === 0) return res.status(400).json({ error: 'telemetry must be a non-empty array' });

    const result = await queryAIStructured(
      `You are a drone telemetry anomaly detector. Identify outliers (battery, altitude, GPS, vibration, heading) and likely root cause.`,
      JSON.stringify({
        drone_id: drone_id || null, baseline: baseline || null, telemetry,
        output_schema: {
          anomalies: [{ index: 0, field: 'string', value: 0, reason: 'string', severity: 'low|medium|high|critical' }],
          overall_health: 'normal|warning|critical',
          recommended_action: 'continue|return_to_home|land_immediately|maintenance',
          summary: 'string'
        }
      }, null, 2)
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
