const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const { body, validationResult } = require('express-validator');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const createCrudRouter = require('./routes/crud');
const { aiServices } = require('./services/openrouter');
const { aiRateLimiter, generalLimiter } = require('./middleware/rateLimiter');
const authMiddleware = require('./middleware/auth');
const geofenceRouter = require('./routes/geofence');
const missionLogsRouter = require('./routes/missionLogs');
const aiStreamRouter = require('./routes/aiStream');
const aiResultsRouter = require('./routes/aiResults');
const alertsRouter = require('./routes/alerts');
const { router: telemetryRouter, setIo } = require('./routes/telemetry');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  },
});
const PORT = process.env.BACKEND_PORT || 4000;

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet());

// ── CORS (restrict to CLIENT_URL) ─────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ── General rate limiter on all /api routes ────────────────────────────────
app.use('/api', generalLimiter);

// ── Auth routes (public) ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/runtime-ai', require('./routes/runtimeAi'));

// ── Health check (public - no sensitive data) ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rate limiter applied to all AI routes ──────────────────────────────────
app.use((req, res, next) => {
  if (req.path.includes('/analyze') || req.path.startsWith('/api/ai')) {
    return aiRateLimiter(req, res, next);
  }
  next();
});

// ── Drone-specific routes with input validation ────────────────────────────
const flightPlanValidation = [
  body('altitude')
    .optional()
    .isFloat({ min: 0, max: 500 })
    .withMessage('altitude must be 0-500 meters'),
  body('speed')
    .optional()
    .isFloat({ min: 0, max: 200 })
    .withMessage('speed must be 0-200 km/h'),
  body('waypoints')
    .optional()
    .isArray()
    .withMessage('flight_plan (waypoints) must be an array'),
];

// Inject validation into the flight-plans create/update path before the crud router
app.post('/api/flight-plans', flightPlanValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
});
app.put('/api/flight-plans/:id', flightPlanValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
});

// ── CRUD routes with AI services ──────────────────────────────────────────
app.use('/api/drones', createCrudRouter('Drone', null));
app.use('/api/flight-plans', createCrudRouter('FlightPlan', null));
app.use('/api/missions', createCrudRouter('Mission', null));
app.use('/api/inspections', createCrudRouter('Inspection', null));
app.use('/api/deliveries', createCrudRouter('Delivery', null));
app.use('/api/agriculture', createCrudRouter('AgricultureOp', null));
app.use('/api/surveillance', createCrudRouter('Surveillance', null));
app.use('/api/maintenance', createCrudRouter('Maintenance', null));
app.use('/api/weather', createCrudRouter('WeatherReport', null));
app.use('/api/routes', createCrudRouter('Route', null));
app.use('/api/anomalies', createCrudRouter('Anomaly', null));
app.use('/api/compliance', createCrudRouter('Compliance', null));
app.use('/api/clients', createCrudRouter('Client', null));
app.use('/api/invoices', createCrudRouter('Invoice', null));
app.use('/api/analytics', createCrudRouter('Analytics', null));
app.use('/api/flight-analysis', createCrudRouter('FlightAnalysis', null));

// Non-AI CRUD routes
app.use('/api/pilots', createCrudRouter('Pilot', null));
app.use('/api/batteries', createCrudRouter('Battery', null));
app.use('/api/inventory', createCrudRouter('Inventory', null));
app.use('/api/incidents', createCrudRouter('Incident', null));
app.use('/api/checklists', createCrudRouter('Checklist', null));
app.use('/api/documents', createCrudRouter('Document', null));
app.use('/api/geofences', createCrudRouter('Geofence', null));
app.use('/api/equipment', createCrudRouter('Equipment', null));
app.use('/api/projects', createCrudRouter('Project', null));
app.use('/api/audit-logs', createCrudRouter('AuditLog', null));
app.use('/api/notifications', createCrudRouter('Notification', null));
app.use('/api/landing-zones', createCrudRouter('LandingZone', null));
app.use('/api/training', createCrudRouter('Training', null));
app.use('/api/insurance', createCrudRouter('Insurance', null));
app.use('/api/contracts', createCrudRouter('Contract', null));
app.use('/api/expenses', createCrudRouter('Expense', null));
app.use('/api/shifts', createCrudRouter('Shift', null));
app.use('/api/emergency-protocols', createCrudRouter('EmergencyProtocol', null));
app.use('/api/communication-logs', createCrudRouter('CommunicationLog', null));
app.use('/api/ground-stations', createCrudRouter('GroundStation', null));

// ── Telemetry routes ───────────────────────────────────────────────────────
app.use('/api/drones/:id/telemetry', telemetryRouter);

// ── Geofence enforcement per-drone ────────────────────────────────────────
app.use('/api/drones/:id', geofenceRouter);

// ── Mission logs ──────────────────────────────────────────────────────────
app.use('/api/mission-logs', missionLogsRouter);

// ── AI SSE stream ─────────────────────────────────────────────────────────
// Generic AI/C2 routes are not mounted; governed missions are deterministic and approval-gated.

// ── AI Results history ────────────────────────────────────────────────────
app.use('/api/ai-results', aiResultsRouter);

// ── Operational alerts ────────────────────────────────────────────────────
app.use('/api/alerts', alertsRouter);
app.use('/api/governed-missions', require('./routes/governedMissions'));

// ── Dashboard stats ───────────────────────────────────────────────────────
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const models = require('./models');
    const { Op } = require('sequelize');
    const [
      drones, missions, flights, deliveries, clients, totalRevenue, activeMissions, activeDrones
    ] = await Promise.all([
      models.Drone.count(),
      models.Mission.count(),
      models.FlightPlan.count(),
      models.Delivery.count(),
      models.Client.count(),
      models.Invoice.sum('totalAmount'),
      models.Mission.count({ where: { status: 'active' } }),
      models.Drone.count({ where: { status: 'active' } }),
    ]);
    res.json({
      totalDrones: drones,
      activeDrones,
      totalMissions: missions,
      activeMissions,
      totalFlights: flights,
      totalDeliveries: deliveries,
      totalClients: clients,
      totalRevenue: totalRevenue || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Socket.IO: drone telemetry rooms ──────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('subscribe:drone', (droneId) => {
    socket.join(`drone:${droneId}`);
  });
  socket.on('unsubscribe:drone', (droneId) => {
    socket.leave(`drone:${droneId}`);
  });
});

// Pass io to telemetry router
setIo(io);

// ── Start ──────────────────────────────────────────────────────────────────
sequelize.authenticate().then(() => {
  server.listen(PORT, () => {
    console.log(`Drone Operations Backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});

// BATCH_00_AUDIT_MOUNTS
app.use('/api/mission-planner', require('./routes/missionPlanner'));
app.use('/api/obstacle-avoidance', require('./routes/obstacleAvoidance'));
app.use('/api/swarm-choreography', require('./routes/swarmChoreography'));
app.use('/api/weather-planning', require('./routes/weatherPlanning'));
app.use('/api/drone-platform-bridge', require('./routes/dronePlatformBridge'));

// Generated gap routes remain in source for audit history but are deliberately not mounted.

// === Custom Views (4 synthesizing endpoints) ===
app.use('/api/custom-views', require('./routes/customViews'));
