// Apply pass 5 — backlog extensions for AIAutonomousDroneOperations
//
// Implements the 5 deferred backlog items from _AUDIT_NOTE.md as additive endpoints:
//   1. DJI / Skydio / Freefly fleet integration (NEEDS-CREDS)
//      -> env: DRONE_VENDOR (dji|skydio|freefly), DRONE_VENDOR_API_KEY
//   2. Real-time C2 (Command & Control) command queue (TOO-RISKY -> additive registry)
//   3. NOAA weather feed (NEEDS-CREDS)
//      -> env: NOAA_API_TOKEN  (note: NWS public API works without one, but we gate to be explicit)
//   4. On-board image analysis pipeline (TOO-RISKY -> registry only, no actual CV inference)
//      -> env: OPENROUTER_API_KEY  (text-grounded fallback only, no images uploaded)
//   5. SLAM / CV obstacle replanning (TOO-RISKY -> waypoint-replan stub gated on AI key)
//      -> env: OPENROUTER_API_KEY
//
// All endpoints use authMiddleware. CREATE TABLE IF NOT EXISTS only — no ALTER on existing tables.
// PRODUCT-DECISION: command_queue + image_analysis_jobs are queue-style tables (status enum:
//   pending|in_progress|completed|failed) so they're safe to evolve.

const express = require('express');
const authMiddleware = require('../middleware/auth');
const { queryAIStructured } = require('../services/openrouter');
const { sequelize } = require('../models');

const router = express.Router();
router.use(authMiddleware);

// ── Bootstrap additive tables ──────────────────────────────────────────────
async function bootstrap() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS drone_vendor_links (
        id SERIAL PRIMARY KEY,
        drone_id INTEGER NOT NULL,
        vendor TEXT NOT NULL,
        vendor_drone_id TEXT,
        status TEXT DEFAULT 'unlinked',
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS drone_command_queue (
        id SERIAL PRIMARY KEY,
        drone_id INTEGER NOT NULL,
        command TEXT NOT NULL,
        params JSONB,
        status TEXT DEFAULT 'pending',
        issued_by INTEGER,
        issued_at TIMESTAMPTZ DEFAULT NOW(),
        executed_at TIMESTAMPTZ,
        result JSONB
      )
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS image_analysis_jobs (
        id SERIAL PRIMARY KEY,
        drone_id INTEGER,
        mission_id INTEGER,
        image_ref TEXT,
        analysis_type TEXT,
        status TEXT DEFAULT 'pending',
        result JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS noaa_weather_cache (
        id SERIAL PRIMARY KEY,
        lat DOUBLE PRECISION,
        lon DOUBLE PRECISION,
        payload JSONB,
        fetched_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (e) {
    console.error('extensions bootstrap warning:', e.message);
  }
}
bootstrap();

// ── 1. Vendor fleet integration (NEEDS-CREDS) ─────────────────────────────
function vendorEnvCheck() {
  const missing = [];
  if (!process.env.DRONE_VENDOR) missing.push('DRONE_VENDOR');
  if (!process.env.DRONE_VENDOR_API_KEY) missing.push('DRONE_VENDOR_API_KEY');
  return missing;
}

router.get('/vendor/status', (req, res) => {
  const missing = vendorEnvCheck();
  if (missing.length) return res.status(503).json({ error: 'vendor not configured', missing });
  res.json({ vendor: process.env.DRONE_VENDOR, configured: true });
});

router.post('/vendor/link-drone', async (req, res) => {
  const missing = vendorEnvCheck();
  if (missing.length) return res.status(503).json({ error: 'vendor not configured', missing });
  try {
    const { drone_id, vendor_drone_id } = req.body || {};
    if (!drone_id) return res.status(400).json({ error: 'drone_id required' });
    const [rows] = await sequelize.query(
      `INSERT INTO drone_vendor_links (drone_id, vendor, vendor_drone_id, status, last_synced_at)
       VALUES (:drone_id, :vendor, :vendor_drone_id, 'linked', NOW())
       RETURNING *`,
      { replacements: { drone_id, vendor: process.env.DRONE_VENDOR, vendor_drone_id: vendor_drone_id || null } }
    );
    res.json({ link: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/vendor/links', async (req, res) => {
  try {
    const [rows] = await sequelize.query(`SELECT * FROM drone_vendor_links ORDER BY id DESC LIMIT 200`);
    res.json({ links: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 2. Real-time C2 (additive command queue, TOO-RISKY) ───────────────────
// PRODUCT-DECISION: this is a queue, not a live socket. Operators enqueue
//   commands; an external worker (not in scope) would dispatch them. Status
//   transitions: pending -> in_progress -> completed|failed.
router.post('/c2/enqueue', async (req, res) => {
  try {
    const { drone_id, command, params } = req.body || {};
    if (!drone_id || !command) return res.status(400).json({ error: 'drone_id and command required' });
    const allowed = ['takeoff','land','rtl','goto','hover','set_altitude','set_speed','abort'];
    if (!allowed.includes(command)) return res.status(400).json({ error: 'unsupported command', allowed });
    const [rows] = await sequelize.query(
      `INSERT INTO drone_command_queue (drone_id, command, params, status, issued_by)
       VALUES (:drone_id, :command, :params, 'pending', :issued_by)
       RETURNING *`,
      { replacements: { drone_id, command, params: JSON.stringify(params || {}), issued_by: req.user?.id || null } }
    );
    res.json({ command: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/c2/queue/:drone_id', async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT * FROM drone_command_queue WHERE drone_id = :drone_id ORDER BY id DESC LIMIT 100`,
      { replacements: { drone_id: req.params.drone_id } }
    );
    res.json({ queue: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 3. NOAA weather (NEEDS-CREDS) ─────────────────────────────────────────
router.get('/weather/noaa', async (req, res) => {
  if (!process.env.NOAA_API_TOKEN) {
    return res.status(503).json({ error: 'NOAA not configured', missing: 'NOAA_API_TOKEN' });
  }
  // PRODUCT-DECISION: returns cache if recent (<10min); does NOT actually call NOAA in this pass.
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
    const [rows] = await sequelize.query(
      `SELECT * FROM noaa_weather_cache
        WHERE lat = :lat AND lon = :lon
          AND fetched_at > NOW() - INTERVAL '10 minutes'
        ORDER BY id DESC LIMIT 1`,
      { replacements: { lat: parseFloat(lat), lon: parseFloat(lon) } }
    );
    if (rows.length) return res.json({ cached: true, ...rows[0] });
    res.json({ cached: false, message: 'no cached entry; live fetch not implemented this pass' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 4. On-board image analysis (TOO-RISKY -> registry + text-grounded AI) ─
router.post('/image-analysis/jobs', async (req, res) => {
  try {
    const { drone_id, mission_id, image_ref, analysis_type } = req.body || {};
    if (!image_ref || !analysis_type) return res.status(400).json({ error: 'image_ref and analysis_type required' });
    const [rows] = await sequelize.query(
      `INSERT INTO image_analysis_jobs (drone_id, mission_id, image_ref, analysis_type, status)
       VALUES (:drone_id, :mission_id, :image_ref, :analysis_type, 'pending')
       RETURNING *`,
      { replacements: { drone_id: drone_id || null, mission_id: mission_id || null, image_ref, analysis_type } }
    );
    res.json({ job: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/image-analysis/jobs', async (req, res) => {
  try {
    const [rows] = await sequelize.query(`SELECT * FROM image_analysis_jobs ORDER BY id DESC LIMIT 200`);
    res.json({ jobs: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/image-analysis/text-advisory', async (req, res) => {
  // Text-grounded fallback that does NOT touch images (no image-capable model used).
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI not configured', missing: 'OPENROUTER_API_KEY' });
  }
  try {
    const { description, analysis_type, context } = req.body || {};
    if (!description) return res.status(400).json({ error: 'description required' });
    const result = await queryAIStructured(
      `You are an aerial-image analysis advisor. The user provides a textual description (no image is sent). Identify likely findings, confidence, and suggested follow-up data capture.`,
      JSON.stringify({ description, analysis_type: analysis_type || 'general', context: context || null,
        output_schema: { findings: ['string'], confidence: 'low|medium|high', follow_up: ['string'], summary: 'string' } }, null, 2)
    );
    res.json({ success: true, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 5. SLAM / CV replan (TOO-RISKY -> waypoint replan via text AI) ────────
router.post('/slam-replan', async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI not configured', missing: 'OPENROUTER_API_KEY' });
  }
  try {
    const { current_pose, detected_obstacles, target_waypoints } = req.body || {};
    if (!current_pose || !target_waypoints) return res.status(400).json({ error: 'current_pose and target_waypoints required' });
    const result = await queryAIStructured(
      `You are an autonomous-drone SLAM replanner. Given current pose, detected obstacles (textual), and target waypoints, propose a safe replanned waypoint sequence.`,
      JSON.stringify({ current_pose, detected_obstacles: detected_obstacles || [], target_waypoints,
        output_schema: { replanned_waypoints: [{ lat: 0, lon: 0, alt_m: 0 }], maneuvers: ['string'], safety_buffer_m: 0, rationale: 'string' } }, null, 2)
    );
    res.json({ success: true, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
