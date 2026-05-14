const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

let sequelize;
function getDb() {
  if (!sequelize) sequelize = require('../config/database');
  return sequelize;
}

async function ensureTable() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id           SERIAL PRIMARY KEY,
      entity_type  VARCHAR(100) NOT NULL,
      entity_id    INTEGER NOT NULL,
      summary      TEXT,
      risk_level   VARCHAR(20),
      score        FLOAT,
      recommendations JSONB DEFAULT '[]',
      flags        JSONB DEFAULT '[]',
      details      JSONB DEFAULT '{}',
      raw          JSONB,
      "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Index for fast lookup by entity
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_ai_results_entity ON ai_results (entity_type, entity_id)
  `);
}

// GET /api/ai-results — list all AI results with optional filters and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const db = getDb();

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const binds = [];

    if (req.query.entityType) {
      binds.push(req.query.entityType);
      conditions.push(`entity_type = $${binds.length}`);
    }
    if (req.query.entityId) {
      binds.push(parseInt(req.query.entityId, 10));
      conditions.push(`entity_id = $${binds.length}`);
    }
    if (req.query.riskLevel) {
      binds.push(req.query.riskLevel);
      conditions.push(`risk_level = $${binds.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM ai_results ${where}`,
      { bind: binds, type: db.QueryTypes.SELECT }
    );
    const total = parseInt(countRows.total, 10);

    const limitBind = [...binds, limit, offset];
    const [rows] = await db.query(
      `SELECT * FROM ai_results ${where} ORDER BY "createdAt" DESC LIMIT $${limitBind.length - 1} OFFSET $${limitBind.length}`,
      { bind: limitBind, type: db.QueryTypes.SELECT }
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

// GET /api/ai-results/:id — single result
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureTable();
    const db = getDb();
    const [rows] = await db.query(
      'SELECT * FROM ai_results WHERE id = $1',
      { bind: [req.params.id], type: db.QueryTypes.SELECT }
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'AI result not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
