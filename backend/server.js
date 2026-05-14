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
app.use('/api/flight-plans', createCrudRouter('FlightPlan', aiServices.analyzeFlightPlan));
app.use('/api/missions', createCrudRouter('Mission', aiServices.missionPlanning));
app.use('/api/inspections', createCrudRouter('Inspection', aiServices.analyzeInspection));
app.use('/api/deliveries', createCrudRouter('Delivery', aiServices.deliveryOptimization));
app.use('/api/agriculture', createCrudRouter('AgricultureOp', aiServices.agricultureAnalysis));
app.use('/api/surveillance', createCrudRouter('Surveillance', aiServices.surveillanceAnalysis));
app.use('/api/maintenance', createCrudRouter('Maintenance', aiServices.maintenancePrediction));
app.use('/api/weather', createCrudRouter('WeatherReport', aiServices.weatherAssessment));
app.use('/api/routes', createCrudRouter('Route', aiServices.optimizeRoute));
app.use('/api/anomalies', createCrudRouter('Anomaly', aiServices.analyzeAnomaly));
app.use('/api/compliance', createCrudRouter('Compliance', aiServices.complianceCheck));
app.use('/api/clients', createCrudRouter('Client', aiServices.clientRecommendation));
app.use('/api/invoices', createCrudRouter('Invoice', aiServices.invoiceAnalysis));
app.use('/api/analytics', createCrudRouter('Analytics', aiServices.analyticsInsights));
app.use('/api/flight-analysis', createCrudRouter('FlightAnalysis', aiServices.flightPerformanceAnalysis));

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
app.use('/api/ai', aiStreamRouter);

// ── Autonomous AI features (mission planning, obstacle avoidance, swarm, etc.)
app.use('/api/ai', require('./routes/ai'));

// ── Apply pass 5 extensions (vendor link, C2 queue, NOAA, image-analysis, SLAM)
app.use('/api/ai', require('./routes/extensions'));

// ── AI Results history ────────────────────────────────────────────────────
app.use('/api/ai-results', aiResultsRouter);

// ── Operational alerts ────────────────────────────────────────────────────
app.use('/api/alerts', alertsRouter);

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
sequelize.sync({ alter: true }).then(() => {
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

// === Batch 00 Gaps & Frontend Mounts ===
app.use('/api/gap-ai-mission-planning-generator-objectives', require('./routes/gap_ai_mission_planning_generator_objectives'));
app.use('/api/gap-ai-real-time-obstacle-avoidance', require('./routes/gap_ai_real_time_obstacle_avoidance'));
app.use('/api/gap-ai-multi-drone-swarm-coordination', require('./routes/gap_ai_multi_drone_swarm_coordination'));
app.use('/api/gap-ai-geofence-optimization-learning', require('./routes/gap_ai_geofence_optimization_learning'));
app.use('/api/gap-ai-flight-telemetry-anomaly-detection', require('./routes/gap_ai_flight_telemetry_anomaly_detection'));
app.use('/api/gap-live-drone-platform-integration-dji', require('./routes/gap_live_drone_platform_integration_dji'));
app.use('/api/gap-real-time-c2-command-control', require('./routes/gap_real_time_c2_command_control'));
app.use('/api/gap-weather-integration-wind-rain-forecasts', require('./routes/gap_weather_integration_wind_rain_forecasts'));
app.use('/api/gap-captured-imagery-analysis-pipeline', require('./routes/gap_captured_imagery_analysis_pipeline'));
app.use('/api/gap-notifications-subsystem', require('./routes/gap_notifications_subsystem'));
app.use('/api/gap-outbound-webhooks', require('./routes/gap_outbound_webhooks'));
