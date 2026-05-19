const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { queryAIStructured } = require('../services/openrouter');

const router = express.Router();

// Lazy-load sequelize so the module can be required before DB sync
let sequelize;
function getDb() {
  if (!sequelize) sequelize = require('../config/database');
  return sequelize;
}

async function ensureTable() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS mission_logs (
      id            SERIAL PRIMARY KEY,
      mission_id    INTEGER,
      drone_id      INTEGER,
      started_at    TIMESTAMPTZ,
      completed_at  TIMESTAMPTZ,
      total_distance_km FLOAT,
      max_altitude_m    FLOAT,
      avg_speed         FLOAT,
      battery_used_pct  FLOAT,
      ai_analysis       JSONB,
      "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

const MISSION_LOG_AI_INSTRUCTION = `
You MUST respond with ONLY a valid JSON object (no markdown fences, no extra text) with this exact structure:
{
  "summary": "<2-3 sentence executive summary of mission performance>",
  "riskLevel": "<low|medium|high|critical>",
  "score": <0-100 performance score>,
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "flags": ["<issue or concern 1>", "<issue or concern 2>"],
  "details": {
    "performanceRating": "<excellent|good|fair|poor>",
    "batteryEfficiency": "<assessment of battery usage>",
    "speedAssessment": "<assessment of speed vs distance>",
    "altitudeCompliance": "<assessment of altitude usage>"
  }
}`;

// POST /api/mission-logs - Create a mission log and auto-generate AI report
router.post(
  '/',
  authMiddleware,
  [
    body('mission_id').isInt().withMessage('mission_id must be an integer'),
    body('drone_id').isInt().withMessage('drone_id must be an integer'),
    body('started_at').isISO8601().withMessage('started_at must be ISO8601'),
    body('completed_at').isISO8601().withMessage('completed_at must be ISO8601'),
    body('total_distance_km').isFloat({ min: 0 }).withMessage('total_distance_km must be >= 0'),
    body('max_altitude_m').isFloat({ min: 0, max: 500 }).withMessage('max_altitude_m must be 0-500'),
    body('avg_speed').isFloat({ min: 0, max: 200 }).withMessage('avg_speed must be 0-200 km/h'),
    body('battery_used_pct').isFloat({ min: 0, max: 100 }).withMessage('battery_used_pct must be 0-100'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { mission_id, drone_id, started_at, completed_at, total_distance_km, max_altitude_m, avg_speed, battery_used_pct } = req.body;

    try {
      await ensureTable();
      const db = getDb();

      // Generate structured AI mission report
      let ai_analysis = null;
      try {
        const durationMin = Math.round((new Date(completed_at) - new Date(started_at)) / 60000);
        ai_analysis = await queryAIStructured(
          `You are a drone mission analyst. Analyze the completed mission performance data and provide an assessment. ${MISSION_LOG_AI_INSTRUCTION}`,
          `Mission Log Data:\n- Mission ID: ${mission_id}\n- Drone ID: ${drone_id}\n- Started: ${started_at}\n- Completed: ${completed_at}\n- Duration: ${durationMin} min\n- Distance: ${total_distance_km} km\n- Max Altitude: ${max_altitude_m} m\n- Avg Speed: ${avg_speed} km/h\n- Battery Used: ${battery_used_pct}%`
        );
        ai_analysis.generated_at = new Date().toISOString();
      } catch (aiErr) {
        ai_analysis = { error: aiErr.message };
      }

      const [rows] = await db.query(
        `INSERT INTO mission_logs (mission_id, drone_id, started_at, completed_at, total_distance_km, max_altitude_m, avg_speed, battery_used_pct, ai_analysis, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        { bind: [mission_id, drone_id, started_at, completed_at, total_distance_km, max_altitude_m, avg_speed, battery_used_pct, JSON.stringify(ai_analysis)], type: db.QueryTypes.INSERT }
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/mission-logs - List all mission logs with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const db = getDb();

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [countRows] = await db.query('SELECT COUNT(*) as total FROM mission_logs', { type: db.QueryTypes.SELECT });
    const total = parseInt(countRows.total, 10);

    const [rows] = await db.query(
      `SELECT * FROM mission_logs ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`,
      { bind: [limit, offset], type: db.QueryTypes.SELECT }
    );

    res.json({
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mission-logs/:id - Get single log
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM mission_logs WHERE id = $1', {
      bind: [req.params.id],
      type: db.QueryTypes.SELECT,
    });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Mission log not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
