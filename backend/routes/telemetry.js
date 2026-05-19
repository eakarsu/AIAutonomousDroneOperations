const express = require('express');
const { body, validationResult, query } = require('express-validator');
const authMiddleware = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// In-memory telemetry store (last 1000 points per drone)
const telemetryStore = new Map();
const MAX_HISTORY = 1000;

// Will be set by server.js after Socket.IO is initialized
let io = null;
function setIo(ioInstance) { io = ioInstance; }

// POST /api/drones/:id/telemetry - Accept real-time telemetry data
router.post(
  '/',
  authMiddleware,
  [
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
    body('altitude').isFloat({ min: 0, max: 500 }).withMessage('altitude must be 0-500 meters'),
    body('battery').isFloat({ min: 0, max: 100 }).withMessage('battery must be 0-100 percent'),
    body('speed').isFloat({ min: 0, max: 200 }).withMessage('speed must be 0-200 km/h'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const droneId = req.params.id;
    const point = {
      ...req.body,
      timestamp: new Date().toISOString(),
      droneId,
    };

    // Store in ring buffer
    if (!telemetryStore.has(droneId)) {
      telemetryStore.set(droneId, []);
    }
    const history = telemetryStore.get(droneId);
    history.push(point);
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    // Emit via Socket.IO
    if (io) {
      io.to(`drone:${droneId}`).emit('drone:telemetry', point);
    }

    res.status(201).json({ received: true, point });
  }
);

// GET /api/drones/:id/telemetry/history - Return last 1000 telemetry points
router.get('/history', authMiddleware, (req, res) => {
  const droneId = req.params.id;
  const history = telemetryStore.get(droneId) || [];
  res.json({ droneId, count: history.length, history });
});

module.exports = { router, setIo };
