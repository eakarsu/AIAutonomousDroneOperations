const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// User Model
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'operator', 'viewer'), defaultValue: 'admin' }
});

// Drone (Fleet Management)
const Drone = sequelize.define('Drone', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING, allowNull: false },
  serialNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'maintenance', 'retired', 'standby'), defaultValue: 'active' },
  batteryLevel: { type: DataTypes.INTEGER, defaultValue: 100 },
  maxFlightTime: { type: DataTypes.INTEGER }, // minutes
  maxPayload: { type: DataTypes.FLOAT }, // kg
  currentLocation: { type: DataTypes.STRING },
  lastMaintenanceDate: { type: DataTypes.DATE },
  totalFlightHours: { type: DataTypes.FLOAT, defaultValue: 0 },
  firmwareVersion: { type: DataTypes.STRING },
  imageUrl: { type: DataTypes.STRING }
});

// Flight Plan
const FlightPlan = sequelize.define('FlightPlan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  droneId: { type: DataTypes.INTEGER },
  origin: { type: DataTypes.STRING, allowNull: false },
  destination: { type: DataTypes.STRING, allowNull: false },
  altitude: { type: DataTypes.FLOAT },
  speed: { type: DataTypes.FLOAT },
  scheduledDate: { type: DataTypes.DATE },
  estimatedDuration: { type: DataTypes.INTEGER }, // minutes
  status: { type: DataTypes.ENUM('planned', 'in-progress', 'completed', 'cancelled'), defaultValue: 'planned' },
  waypoints: { type: DataTypes.JSON },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  notes: { type: DataTypes.TEXT }
});

// Mission
const Mission = sequelize.define('Mission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('inspection', 'delivery', 'agriculture', 'surveillance', 'mapping', 'emergency'), allowNull: false },
  droneId: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('pending', 'active', 'completed', 'aborted', 'paused'), defaultValue: 'pending' },
  startTime: { type: DataTypes.DATE },
  endTime: { type: DataTypes.DATE },
  area: { type: DataTypes.STRING },
  progress: { type: DataTypes.FLOAT, defaultValue: 0 },
  telemetryData: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT }
});

// Inspection
const Inspection = sequelize.define('Inspection', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('infrastructure', 'pipeline', 'powerline', 'bridge', 'building', 'solar-panel', 'wind-turbine'), allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  droneId: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'review'), defaultValue: 'scheduled' },
  scheduledDate: { type: DataTypes.DATE },
  findings: { type: DataTypes.TEXT },
  severity: { type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'critical'), defaultValue: 'none' },
  images: { type: DataTypes.JSON },
  clientName: { type: DataTypes.STRING },
  cost: { type: DataTypes.FLOAT }
});

// Delivery
const Delivery = sequelize.define('Delivery', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  trackingNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  packageDescription: { type: DataTypes.STRING, allowNull: false },
  weight: { type: DataTypes.FLOAT },
  pickupAddress: { type: DataTypes.STRING, allowNull: false },
  deliveryAddress: { type: DataTypes.STRING, allowNull: false },
  droneId: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('pending', 'picked-up', 'in-transit', 'delivered', 'failed', 'returned'), defaultValue: 'pending' },
  scheduledDate: { type: DataTypes.DATE },
  deliveredDate: { type: DataTypes.DATE },
  recipientName: { type: DataTypes.STRING },
  recipientPhone: { type: DataTypes.STRING },
  cost: { type: DataTypes.FLOAT },
  priority: { type: DataTypes.ENUM('standard', 'express', 'urgent'), defaultValue: 'standard' }
});

// Agriculture Operation
const AgricultureOp = sequelize.define('AgricultureOp', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('crop-monitoring', 'spraying', 'seeding', 'soil-analysis', 'irrigation', 'health-assessment'), allowNull: false },
  farmName: { type: DataTypes.STRING, allowNull: false },
  fieldArea: { type: DataTypes.FLOAT }, // acres
  cropType: { type: DataTypes.STRING },
  droneId: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('planned', 'in-progress', 'completed', 'cancelled'), defaultValue: 'planned' },
  scheduledDate: { type: DataTypes.DATE },
  findings: { type: DataTypes.TEXT },
  chemicalUsed: { type: DataTypes.STRING },
  coveragePercent: { type: DataTypes.FLOAT, defaultValue: 0 },
  cost: { type: DataTypes.FLOAT }
});

// Surveillance
const Surveillance = sequelize.define('Surveillance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('perimeter', 'area', 'event', 'emergency', 'traffic', 'wildlife'), allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  droneId: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('scheduled', 'active', 'completed', 'suspended'), defaultValue: 'scheduled' },
  startTime: { type: DataTypes.DATE },
  endTime: { type: DataTypes.DATE },
  alertsGenerated: { type: DataTypes.INTEGER, defaultValue: 0 },
  recordingUrl: { type: DataTypes.STRING },
  clientName: { type: DataTypes.STRING },
  isRecurring: { type: DataTypes.BOOLEAN, defaultValue: false },
  cost: { type: DataTypes.FLOAT }
});

// Maintenance Record
const Maintenance = sequelize.define('Maintenance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  droneId: { type: DataTypes.INTEGER },
  type: { type: DataTypes.ENUM('scheduled', 'repair', 'upgrade', 'calibration', 'battery-replacement', 'firmware-update'), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'cancelled'), defaultValue: 'pending' },
  scheduledDate: { type: DataTypes.DATE },
  completedDate: { type: DataTypes.DATE },
  technicianName: { type: DataTypes.STRING },
  cost: { type: DataTypes.FLOAT },
  partsReplaced: { type: DataTypes.JSON },
  nextMaintenanceDue: { type: DataTypes.DATE }
});

// Weather Report
const WeatherReport = sequelize.define('WeatherReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  location: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  temperature: { type: DataTypes.FLOAT },
  humidity: { type: DataTypes.FLOAT },
  windSpeed: { type: DataTypes.FLOAT },
  windDirection: { type: DataTypes.STRING },
  visibility: { type: DataTypes.FLOAT },
  precipitation: { type: DataTypes.FLOAT },
  condition: { type: DataTypes.STRING },
  flyable: { type: DataTypes.BOOLEAN, defaultValue: true },
  aiRecommendation: { type: DataTypes.TEXT }
});

// Route
const Route = sequelize.define('Route', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  origin: { type: DataTypes.STRING, allowNull: false },
  destination: { type: DataTypes.STRING, allowNull: false },
  distance: { type: DataTypes.FLOAT },
  estimatedTime: { type: DataTypes.INTEGER }, // minutes
  waypoints: { type: DataTypes.JSON },
  optimized: { type: DataTypes.BOOLEAN, defaultValue: false },
  avoidZones: { type: DataTypes.JSON },
  altitude: { type: DataTypes.FLOAT },
  status: { type: DataTypes.ENUM('draft', 'active', 'archived'), defaultValue: 'draft' },
  aiScore: { type: DataTypes.FLOAT }
});

// Anomaly
const Anomaly = sequelize.define('Anomaly', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  droneId: { type: DataTypes.INTEGER },
  missionId: { type: DataTypes.INTEGER },
  type: { type: DataTypes.ENUM('equipment', 'environmental', 'behavioral', 'performance', 'security', 'structural'), allowNull: false },
  severity: { type: DataTypes.ENUM('info', 'warning', 'critical', 'emergency'), defaultValue: 'warning' },
  description: { type: DataTypes.TEXT, allowNull: false },
  detectedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  location: { type: DataTypes.STRING },
  resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
  resolvedAt: { type: DataTypes.DATE },
  aiAnalysis: { type: DataTypes.TEXT },
  actionTaken: { type: DataTypes.TEXT }
});

// Compliance Record
const Compliance = sequelize.define('Compliance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  regulation: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.ENUM('FAA', 'local', 'state', 'international', 'privacy', 'safety', 'environmental'), allowNull: false },
  status: { type: DataTypes.ENUM('compliant', 'non-compliant', 'pending-review', 'expired', 'waiver'), defaultValue: 'pending-review' },
  description: { type: DataTypes.TEXT },
  expirationDate: { type: DataTypes.DATE },
  documentUrl: { type: DataTypes.STRING },
  lastAuditDate: { type: DataTypes.DATE },
  nextAuditDate: { type: DataTypes.DATE },
  responsiblePerson: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

// Client
const Client = sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  contactName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  industry: { type: DataTypes.ENUM('construction', 'agriculture', 'energy', 'logistics', 'security', 'real-estate', 'government', 'mining'), allowNull: false },
  contractValue: { type: DataTypes.FLOAT },
  status: { type: DataTypes.ENUM('active', 'inactive', 'prospect', 'churned'), defaultValue: 'active' },
  servicesPurchased: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT }
});

// Invoice
const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoiceNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  clientId: { type: DataTypes.INTEGER },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  tax: { type: DataTypes.FLOAT, defaultValue: 0 },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'), defaultValue: 'draft' },
  issueDate: { type: DataTypes.DATE },
  dueDate: { type: DataTypes.DATE },
  paidDate: { type: DataTypes.DATE },
  services: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT }
});

// Analytics Entry
const Analytics = sequelize.define('Analytics', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  metric: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.ENUM('flights', 'revenue', 'efficiency', 'safety', 'maintenance', 'utilization'), allowNull: false },
  value: { type: DataTypes.FLOAT, allowNull: false },
  unit: { type: DataTypes.STRING },
  period: { type: DataTypes.STRING },
  date: { type: DataTypes.DATE },
  trend: { type: DataTypes.ENUM('up', 'down', 'stable'), defaultValue: 'stable' },
  notes: { type: DataTypes.TEXT }
});

// AI Flight Analysis
const FlightAnalysis = sequelize.define('FlightAnalysis', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  flightPlanId: { type: DataTypes.INTEGER },
  droneId: { type: DataTypes.INTEGER },
  analysisType: { type: DataTypes.ENUM('performance', 'safety', 'efficiency', 'risk', 'optimization', 'predictive'), allowNull: false },
  aiModel: { type: DataTypes.STRING },
  input: { type: DataTypes.JSON },
  result: { type: DataTypes.JSON },
  summary: { type: DataTypes.TEXT },
  score: { type: DataTypes.FLOAT },
  recommendations: { type: DataTypes.JSON },
  analyzedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Pilot Management
const Pilot = sequelize.define('Pilot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING },
  licenseNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  licenseType: { type: DataTypes.ENUM('Part107', 'Part61', 'recreational', 'commercial', 'military'), allowNull: false },
  licenseExpiry: { type: DataTypes.DATE },
  status: { type: DataTypes.ENUM('active', 'inactive', 'suspended', 'training'), defaultValue: 'active' },
  totalFlightHours: { type: DataTypes.FLOAT, defaultValue: 0 },
  rating: { type: DataTypes.FLOAT },
  specializations: { type: DataTypes.JSON },
  address: { type: DataTypes.STRING },
  emergencyContact: { type: DataTypes.STRING },
  hireDate: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT }
});

// Battery Management
const Battery = sequelize.define('Battery', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  serialNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  model: { type: DataTypes.STRING, allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false }, // mAh
  voltage: { type: DataTypes.FLOAT },
  currentCharge: { type: DataTypes.INTEGER, defaultValue: 100 },
  cycleCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  maxCycles: { type: DataTypes.INTEGER, defaultValue: 500 },
  healthPercent: { type: DataTypes.FLOAT, defaultValue: 100 },
  status: { type: DataTypes.ENUM('available', 'in-use', 'charging', 'retired', 'damaged'), defaultValue: 'available' },
  droneId: { type: DataTypes.INTEGER },
  purchaseDate: { type: DataTypes.DATE },
  lastChargeDate: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT }
});

// Inventory / Spare Parts
const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  partName: { type: DataTypes.STRING, allowNull: false },
  partNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  category: { type: DataTypes.ENUM('propeller', 'motor', 'battery', 'camera', 'sensor', 'frame', 'controller', 'gps', 'antenna', 'cable', 'other'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  minimumStock: { type: DataTypes.INTEGER, defaultValue: 5 },
  unitPrice: { type: DataTypes.FLOAT },
  supplier: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  compatibleDrones: { type: DataTypes.JSON },
  lastRestocked: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT }
});

// Incident Reports
const Incident = sequelize.define('Incident', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('crash', 'near-miss', 'equipment-failure', 'flyaway', 'injury', 'property-damage', 'airspace-violation', 'other'), allowNull: false },
  severity: { type: DataTypes.ENUM('minor', 'moderate', 'major', 'critical'), allowNull: false },
  droneId: { type: DataTypes.INTEGER },
  pilotId: { type: DataTypes.INTEGER },
  location: { type: DataTypes.STRING },
  date: { type: DataTypes.DATE, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  rootCause: { type: DataTypes.TEXT },
  correctiveAction: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('reported', 'investigating', 'resolved', 'closed'), defaultValue: 'reported' },
  reportedBy: { type: DataTypes.STRING },
  damageEstimate: { type: DataTypes.FLOAT },
  faaReportFiled: { type: DataTypes.BOOLEAN, defaultValue: false },
  witnesses: { type: DataTypes.JSON }
});

// Pre/Post Flight Checklists
const Checklist = sequelize.define('Checklist', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('pre-flight', 'post-flight', 'maintenance', 'safety', 'emergency'), allowNull: false },
  droneId: { type: DataTypes.INTEGER },
  pilotId: { type: DataTypes.INTEGER },
  missionId: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'failed'), defaultValue: 'pending' },
  items: { type: DataTypes.JSON }, // [{item: "Check propellers", checked: true}, ...]
  completedAt: { type: DataTypes.DATE },
  completedBy: { type: DataTypes.STRING },
  passRate: { type: DataTypes.FLOAT },
  notes: { type: DataTypes.TEXT }
});

// Documents & Certificates
const Document = sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('license', 'certificate', 'insurance', 'manual', 'sop', 'permit', 'waiver', 'report', 'contract', 'other'), allowNull: false },
  category: { type: DataTypes.ENUM('pilot', 'drone', 'company', 'client', 'regulatory', 'training'), allowNull: false },
  fileUrl: { type: DataTypes.STRING },
  fileName: { type: DataTypes.STRING },
  fileSize: { type: DataTypes.INTEGER },
  issueDate: { type: DataTypes.DATE },
  expiryDate: { type: DataTypes.DATE },
  issuedBy: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('active', 'expired', 'pending', 'revoked'), defaultValue: 'active' },
  relatedEntityType: { type: DataTypes.STRING },
  relatedEntityId: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT }
});

// Geofence / No-Fly Zones
const Geofence = sequelize.define('Geofence', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('no-fly', 'restricted', 'operational', 'emergency', 'temporary', 'permanent'), allowNull: false },
  shape: { type: DataTypes.ENUM('circle', 'polygon', 'corridor'), defaultValue: 'circle' },
  coordinates: { type: DataTypes.JSON, allowNull: false },
  radius: { type: DataTypes.FLOAT },
  minAltitude: { type: DataTypes.FLOAT },
  maxAltitude: { type: DataTypes.FLOAT },
  status: { type: DataTypes.ENUM('active', 'inactive', 'scheduled'), defaultValue: 'active' },
  startDate: { type: DataTypes.DATE },
  endDate: { type: DataTypes.DATE },
  reason: { type: DataTypes.TEXT },
  authority: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

// Equipment / Payloads
const Equipment = sequelize.define('Equipment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('camera', 'lidar', 'thermal', 'multispectral', 'gas-sensor', 'spotlight', 'speaker', 'gripper', 'sprayer', 'other'), allowNull: false },
  serialNumber: { type: DataTypes.STRING, unique: true },
  manufacturer: { type: DataTypes.STRING },
  model: { type: DataTypes.STRING },
  weight: { type: DataTypes.FLOAT },
  status: { type: DataTypes.ENUM('available', 'in-use', 'maintenance', 'retired'), defaultValue: 'available' },
  droneId: { type: DataTypes.INTEGER },
  calibrationDate: { type: DataTypes.DATE },
  nextCalibrationDue: { type: DataTypes.DATE },
  purchaseDate: { type: DataTypes.DATE },
  purchasePrice: { type: DataTypes.FLOAT },
  notes: { type: DataTypes.TEXT }
});

// Projects
const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  clientId: { type: DataTypes.INTEGER },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('planning', 'active', 'on-hold', 'completed', 'cancelled'), defaultValue: 'planning' },
  startDate: { type: DataTypes.DATE },
  endDate: { type: DataTypes.DATE },
  budget: { type: DataTypes.FLOAT },
  spent: { type: DataTypes.FLOAT, defaultValue: 0 },
  projectManager: { type: DataTypes.STRING },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  location: { type: DataTypes.STRING },
  tags: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT }
});

// Audit Log
const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  action: { type: DataTypes.ENUM('create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject'), allowNull: false },
  entityType: { type: DataTypes.STRING, allowNull: false },
  entityId: { type: DataTypes.INTEGER },
  userId: { type: DataTypes.INTEGER },
  userName: { type: DataTypes.STRING },
  oldValues: { type: DataTypes.JSON },
  newValues: { type: DataTypes.JSON },
  ipAddress: { type: DataTypes.STRING },
  userAgent: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT }
});

// Notifications
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('info', 'warning', 'error', 'success', 'alert'), defaultValue: 'info' },
  category: { type: DataTypes.ENUM('system', 'maintenance', 'flight', 'weather', 'compliance', 'safety', 'billing'), defaultValue: 'system' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  recipientId: { type: DataTypes.INTEGER },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  readAt: { type: DataTypes.DATE },
  actionUrl: { type: DataTypes.STRING },
  expiresAt: { type: DataTypes.DATE }
});

// Landing Zones
const LandingZone = sequelize.define('LandingZone', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('helipad', 'rooftop', 'field', 'dock', 'mobile', 'emergency'), allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  elevation: { type: DataTypes.FLOAT },
  surfaceType: { type: DataTypes.STRING },
  size: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('active', 'inactive', 'under-construction', 'temporary'), defaultValue: 'active' },
  hasCharging: { type: DataTypes.BOOLEAN, defaultValue: false },
  maxDroneWeight: { type: DataTypes.FLOAT },
  operatingHours: { type: DataTypes.STRING },
  contactPerson: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

// Training Records
const Training = sequelize.define('Training', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pilotId: { type: DataTypes.INTEGER },
  courseName: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('initial', 'recurrent', 'specialized', 'emergency', 'equipment', 'regulatory', 'simulator'), allowNull: false },
  provider: { type: DataTypes.STRING },
  startDate: { type: DataTypes.DATE },
  completionDate: { type: DataTypes.DATE },
  expiryDate: { type: DataTypes.DATE },
  status: { type: DataTypes.ENUM('enrolled', 'in-progress', 'completed', 'failed', 'expired'), defaultValue: 'enrolled' },
  score: { type: DataTypes.FLOAT },
  passingScore: { type: DataTypes.FLOAT },
  certificateUrl: { type: DataTypes.STRING },
  hoursCompleted: { type: DataTypes.FLOAT },
  notes: { type: DataTypes.TEXT }
});

// Insurance Policies
const Insurance = sequelize.define('Insurance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  policyNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  type: { type: DataTypes.ENUM('liability', 'hull', 'payload', 'comprehensive', 'workers-comp', 'umbrella'), allowNull: false },
  provider: { type: DataTypes.STRING, allowNull: false },
  coverageAmount: { type: DataTypes.FLOAT, allowNull: false },
  premium: { type: DataTypes.FLOAT },
  deductible: { type: DataTypes.FLOAT },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'expired', 'cancelled', 'pending', 'claim-filed'), defaultValue: 'active' },
  droneId: { type: DataTypes.INTEGER },
  coveredDrones: { type: DataTypes.JSON },
  contactName: { type: DataTypes.STRING },
  contactPhone: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

// Contracts
const Contract = sequelize.define('Contract', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  contractNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
  clientId: { type: DataTypes.INTEGER },
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('service', 'maintenance', 'subscription', 'project', 'lease', 'partnership'), allowNull: false },
  value: { type: DataTypes.FLOAT, allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE },
  status: { type: DataTypes.ENUM('draft', 'active', 'expired', 'terminated', 'renewed', 'pending-approval'), defaultValue: 'draft' },
  paymentTerms: { type: DataTypes.STRING },
  autoRenew: { type: DataTypes.BOOLEAN, defaultValue: false },
  servicesIncluded: { type: DataTypes.JSON },
  signedBy: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

// Expense Tracking
const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.ENUM('fuel', 'maintenance', 'equipment', 'insurance', 'training', 'travel', 'software', 'licensing', 'office', 'marketing', 'other'), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  vendor: { type: DataTypes.STRING },
  receiptUrl: { type: DataTypes.STRING },
  projectId: { type: DataTypes.INTEGER },
  droneId: { type: DataTypes.INTEGER },
  approvedBy: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'reimbursed'), defaultValue: 'pending' },
  paymentMethod: { type: DataTypes.ENUM('credit-card', 'bank-transfer', 'cash', 'check', 'corporate-card'), defaultValue: 'corporate-card' },
  notes: { type: DataTypes.TEXT }
});

// Shift Management
const Shift = sequelize.define('Shift', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pilotId: { type: DataTypes.INTEGER },
  pilotName: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('pilot', 'observer', 'ground-crew', 'supervisor', 'technician'), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  status: { type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'), defaultValue: 'scheduled' },
  location: { type: DataTypes.STRING },
  assignedMissions: { type: DataTypes.JSON },
  hoursWorked: { type: DataTypes.FLOAT },
  overtime: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT }
});

// Emergency Protocols
const EmergencyProtocol = sequelize.define('EmergencyProtocol', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('crash', 'flyaway', 'loss-of-signal', 'battery-failure', 'weather', 'airspace-intrusion', 'medical', 'fire', 'general'), allowNull: false },
  severity: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), allowNull: false },
  steps: { type: DataTypes.JSON, allowNull: false },
  contactNumbers: { type: DataTypes.JSON },
  responsibleTeam: { type: DataTypes.STRING },
  lastDrillDate: { type: DataTypes.DATE },
  nextDrillDate: { type: DataTypes.DATE },
  status: { type: DataTypes.ENUM('active', 'draft', 'archived', 'under-review'), defaultValue: 'active' },
  documentUrl: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

// Communication Logs
const CommunicationLog = sequelize.define('CommunicationLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.ENUM('radio', 'phone', 'email', 'app', 'atc', 'emergency', 'internal'), allowNull: false },
  direction: { type: DataTypes.ENUM('inbound', 'outbound', 'internal'), allowNull: false },
  from: { type: DataTypes.STRING, allowNull: false },
  to: { type: DataTypes.STRING, allowNull: false },
  subject: { type: DataTypes.STRING },
  message: { type: DataTypes.TEXT, allowNull: false },
  missionId: { type: DataTypes.INTEGER },
  priority: { type: DataTypes.ENUM('routine', 'priority', 'urgent', 'emergency'), defaultValue: 'routine' },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  duration: { type: DataTypes.INTEGER },
  recordingUrl: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

// Ground Control Stations
const GroundStation = sequelize.define('GroundStation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('fixed', 'mobile', 'portable', 'vehicle-mounted'), allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  status: { type: DataTypes.ENUM('online', 'offline', 'maintenance', 'standby'), defaultValue: 'online' },
  softwareVersion: { type: DataTypes.STRING },
  maxDrones: { type: DataTypes.INTEGER, defaultValue: 5 },
  activeDrones: { type: DataTypes.INTEGER, defaultValue: 0 },
  operatorName: { type: DataTypes.STRING },
  lastOnline: { type: DataTypes.DATE },
  equipment: { type: DataTypes.JSON },
  communicationRange: { type: DataTypes.FLOAT },
  notes: { type: DataTypes.TEXT }
});

// Associations
Drone.hasMany(FlightPlan, { foreignKey: 'droneId' });
FlightPlan.belongsTo(Drone, { foreignKey: 'droneId' });

Drone.hasMany(Mission, { foreignKey: 'droneId' });
Mission.belongsTo(Drone, { foreignKey: 'droneId' });

Drone.hasMany(Maintenance, { foreignKey: 'droneId' });
Maintenance.belongsTo(Drone, { foreignKey: 'droneId' });

Client.hasMany(Invoice, { foreignKey: 'clientId' });
Invoice.belongsTo(Client, { foreignKey: 'clientId' });

Drone.hasMany(Battery, { foreignKey: 'droneId' });
Battery.belongsTo(Drone, { foreignKey: 'droneId' });

Drone.hasMany(Equipment, { foreignKey: 'droneId' });
Equipment.belongsTo(Drone, { foreignKey: 'droneId' });

Pilot.hasMany(Training, { foreignKey: 'pilotId' });
Training.belongsTo(Pilot, { foreignKey: 'pilotId' });

Pilot.hasMany(Shift, { foreignKey: 'pilotId' });
Shift.belongsTo(Pilot, { foreignKey: 'pilotId' });

Client.hasMany(Contract, { foreignKey: 'clientId' });
Contract.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(Project, { foreignKey: 'clientId' });
Project.belongsTo(Client, { foreignKey: 'clientId' });

module.exports = {
  sequelize,
  User,
  Drone,
  FlightPlan,
  Mission,
  Inspection,
  Delivery,
  AgricultureOp,
  Surveillance,
  Maintenance,
  WeatherReport,
  Route,
  Anomaly,
  Compliance,
  Client,
  Invoice,
  Analytics,
  FlightAnalysis,
  Pilot,
  Battery,
  Inventory,
  Incident,
  Checklist,
  Document,
  Geofence,
  Equipment,
  Project,
  AuditLog,
  Notification,
  LandingZone,
  Training,
  Insurance,
  Contract,
  Expense,
  Shift,
  EmergencyProtocol,
  CommunicationLog,
  GroundStation
};
