const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const createCrudRouter = require('./routes/crud');
const { aiServices } = require('./services/openrouter');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// CRUD routes with AI services
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

// Dashboard stats endpoint
const authMiddleware = require('./middleware/auth');
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const models = require('./models');
    const [drones, missions, flights, deliveries, clients, invoices] = await Promise.all([
      models.Drone.count(),
      models.Mission.count(),
      models.FlightPlan.count(),
      models.Delivery.count(),
      models.Client.count(),
      models.Invoice.findAll()
    ]);
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const activeMissions = await models.Mission.count({ where: { status: 'active' } });
    const activeDrones = await models.Drone.count({ where: { status: 'active' } });
    res.json({
      totalDrones: drones,
      activeDrones,
      totalMissions: missions,
      activeMissions,
      totalFlights: flights,
      totalDeliveries: deliveries,
      totalClients: clients,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync and start
sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`🚁 Drone Operations Backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});
