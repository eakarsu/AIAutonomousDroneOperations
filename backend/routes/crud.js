const express = require('express');
const authMiddleware = require('../middleware/auth');
const models = require('../models');

/**
 * Helper: persist an AI result to the ai_results table.
 * Lazy-loads sequelize to avoid circular dependency issues.
 */
async function persistAiResult(entityType, entityId, result) {
  try {
    const db = require('../config/database');
    await db.query(
      `INSERT INTO ai_results (entity_type, entity_id, summary, risk_level, score, recommendations, flags, details, raw, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      {
        bind: [
          entityType,
          entityId,
          result.summary || null,
          result.riskLevel || null,
          result.score != null ? result.score : null,
          result.recommendations ? JSON.stringify(result.recommendations) : '[]',
          result.flags ? JSON.stringify(result.flags) : '[]',
          result.details ? JSON.stringify(result.details) : '{}',
          JSON.stringify(result),
        ],
        type: db.QueryTypes.INSERT,
      }
    );
  } catch (err) {
    // Log but don't fail the main request
    console.error('Failed to persist AI result:', err.message);
  }
}

function createCrudRouter(modelName, aiServiceFn) {
  const router = express.Router();
  const Model = models[modelName];

  // Get all — with pagination
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const { count, rows } = await Model.findAndCountAll({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      res.json({
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get by ID
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: `${modelName} not found` });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: `${modelName} not found` });
      await item.update(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: `${modelName} not found` });
      await item.destroy();
      res.json({ message: `${modelName} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Analysis endpoint — persists result to ai_results table
  if (aiServiceFn) {
    router.post('/:id/analyze', authMiddleware, async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: `${modelName} not found` });
        const analysis = await aiServiceFn(item.toJSON());

        // Persist asynchronously (don't block response)
        persistAiResult(modelName, item.id, analysis);

        res.json({ analysis, item: item.toJSON() });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  return router;
}

module.exports = createCrudRouter;
