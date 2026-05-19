/**
 * Operational Alerts Router
 * Exposes business-logic alert endpoints:
 *   GET /api/alerts/batteries          - batteries near end-of-life
 *   GET /api/alerts/low-stock          - inventory items at/below minimum stock
 *   GET /api/alerts/expiring-licenses  - pilots with licenses expiring soon
 */
const express = require('express');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const models = require('../models');

const router = express.Router();

// GET /api/alerts/batteries — batteries with health < 20% OR cycle count >= 90% of max
router.get('/batteries', authMiddleware, async (req, res) => {
  try {
    const alerts = await models.Battery.findAll({
      where: {
        [Op.or]: [
          { healthPercent: { [Op.lt]: 20 } },
          { cycleCount: { [Op.gte]: models.Battery.sequelize.literal('"maxCycles" * 0.9') } },
        ],
        status: { [Op.notIn]: ['retired'] },
      },
      order: [['healthPercent', 'ASC']],
    });
    res.json({
      count: alerts.length,
      alerts,
      message: alerts.length === 0 ? 'All batteries are healthy' : `${alerts.length} batteries require attention`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alerts/low-stock — inventory items at or below minimum stock level
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const items = await models.Inventory.findAll({
      where: {
        quantity: { [Op.lte]: models.Inventory.sequelize.col('minimumStock') },
      },
      order: [['quantity', 'ASC']],
    });
    res.json({
      count: items.length,
      items,
      message: items.length === 0 ? 'All inventory is sufficiently stocked' : `${items.length} items need restocking`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alerts/expiring-licenses?days=30 — pilots with licenses expiring within N days
router.get('/expiring-licenses', authMiddleware, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.query.days) || 30));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const pilots = await models.Pilot.findAll({
      where: {
        licenseExpiry: {
          [Op.lte]: cutoff,
          [Op.gte]: new Date(), // not yet expired — just expiring soon
        },
        status: { [Op.notIn]: ['inactive', 'suspended'] },
      },
      order: [['licenseExpiry', 'ASC']],
    });

    // Also fetch already expired
    const expired = await models.Pilot.findAll({
      where: {
        licenseExpiry: { [Op.lt]: new Date() },
        status: { [Op.notIn]: ['inactive'] },
      },
      order: [['licenseExpiry', 'ASC']],
    });

    res.json({
      expiringWithinDays: days,
      expiringSoon: { count: pilots.length, pilots },
      alreadyExpired: { count: expired.length, pilots: expired },
      message: `${pilots.length} licenses expiring within ${days} days, ${expired.length} already expired`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alerts/summary — combined alert counts for dashboard
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { Op: Op2 } = require('sequelize');
    const days = 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const [batteryAlerts, lowStockItems, expiringPilots] = await Promise.all([
      models.Battery.count({
        where: {
          [Op2.or]: [
            { healthPercent: { [Op2.lt]: 20 } },
            { cycleCount: { [Op2.gte]: models.Battery.sequelize.literal('"maxCycles" * 0.9') } },
          ],
          status: { [Op2.notIn]: ['retired'] },
        },
      }),
      models.Inventory.count({
        where: {
          quantity: { [Op2.lte]: models.Inventory.sequelize.col('minimumStock') },
        },
      }),
      models.Pilot.count({
        where: {
          licenseExpiry: { [Op2.lte]: cutoff, [Op2.gte]: new Date() },
          status: { [Op2.notIn]: ['inactive', 'suspended'] },
        },
      }),
    ]);

    res.json({
      batteryAlerts,
      lowStockItems,
      expiringPilotLicenses: expiringPilots,
      total: batteryAlerts + lowStockItems + expiringPilots,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
