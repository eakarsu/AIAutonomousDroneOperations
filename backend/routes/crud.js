const express = require('express');
const authMiddleware = require('../middleware/auth');
const models = require('../models');
const { aiServices } = require('../services/openrouter');

function createCrudRouter(modelName, aiServiceFn) {
  const router = express.Router();
  const Model = models[modelName];

  // Get all
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const items = await Model.findAll({ order: [['createdAt', 'DESC']] });
      res.json(items);
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

  // AI Analysis endpoint
  if (aiServiceFn) {
    router.post('/:id/analyze', authMiddleware, async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: `${modelName} not found` });
        const analysis = await aiServiceFn(item.toJSON());
        res.json({ analysis, item: item.toJSON() });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  return router;
}

module.exports = createCrudRouter;
