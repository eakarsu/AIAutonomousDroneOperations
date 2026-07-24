const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const {
  sequelize, User, Drone, FlightPlan, Mission, Inspection, Delivery,
  AgricultureOp, Surveillance, Maintenance, WeatherReport, Route,
  Anomaly, Compliance, Client, Invoice, Analytics, FlightAnalysis
} = require('./models');

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced.');

    // Users
    const hashedPassword = await bcrypt.hash(requireDemoPassword(), 10);
    await User.bulkCreate([
      { email: 'admin@droneops.com', password: hashedPassword, name: 'Admin User', role: 'admin' },
      { email: 'operator@droneops.com', password: hashedPassword, name: 'John Operator', role: 'operator' },
      { email: 'viewer@droneops.com', password: hashedPassword, name: 'Jane Viewer', role: 'viewer' }
    ]);
    console.log('Users seeded.');

    // Drones (15+)
    await Drone.bulkCreate([
      { name: 'Eagle-1', model: 'DJI Matrice 350 RTK', serialNumber: 'DRN-001', status: 'active', batteryLevel: 95, maxFlightTime: 55, maxPayload: 2.7, currentLocation: 'Hangar A - Bay 1', totalFlightHours: 342.5, firmwareVersion: 'v4.2.1' },
      { name: 'Falcon-2', model: 'DJI Matrice 30T', serialNumber: 'DRN-002', status: 'active', batteryLevel: 78, maxFlightTime: 41, maxPayload: 0.3, currentLocation: 'Field Station Alpha', totalFlightHours: 512.8, firmwareVersion: 'v3.8.2' },
      { name: 'Hawk-3', model: 'Autel EVO II Pro', serialNumber: 'DRN-003', status: 'maintenance', batteryLevel: 45, maxFlightTime: 42, maxPayload: 0.9, currentLocation: 'Maintenance Bay', totalFlightHours: 789.2, firmwareVersion: 'v2.5.0' },
      { name: 'Osprey-4', model: 'Skydio X10', serialNumber: 'DRN-004', status: 'active', batteryLevel: 100, maxFlightTime: 35, maxPayload: 1.0, currentLocation: 'Hangar B - Bay 3', totalFlightHours: 156.4, firmwareVersion: 'v5.1.0' },
      { name: 'Condor-5', model: 'DJI Agras T40', serialNumber: 'DRN-005', status: 'active', batteryLevel: 88, maxFlightTime: 20, maxPayload: 40.0, currentLocation: 'Agricultural Depot', totalFlightHours: 623.1, firmwareVersion: 'v3.2.1' },
      { name: 'Raptor-6', model: 'Freefly Astro', serialNumber: 'DRN-006', status: 'standby', batteryLevel: 100, maxFlightTime: 28, maxPayload: 5.4, currentLocation: 'Hangar A - Bay 4', totalFlightHours: 234.6, firmwareVersion: 'v1.9.3' },
      { name: 'Phoenix-7', model: 'Wingtra WingtraOne', serialNumber: 'DRN-007', status: 'active', batteryLevel: 67, maxFlightTime: 59, maxPayload: 0.8, currentLocation: 'Mapping Station', totalFlightHours: 891.3, firmwareVersion: 'v4.0.2' },
      { name: 'Harrier-8', model: 'senseFly eBee X', serialNumber: 'DRN-008', status: 'active', batteryLevel: 82, maxFlightTime: 90, maxPayload: 0.5, currentLocation: 'Survey Base Camp', totalFlightHours: 1023.7, firmwareVersion: 'v6.1.0' },
      { name: 'Kestrel-9', model: 'DJI Mavic 3 Enterprise', serialNumber: 'DRN-009', status: 'active', batteryLevel: 91, maxFlightTime: 45, maxPayload: 0.2, currentLocation: 'Urban Station 1', totalFlightHours: 445.9, firmwareVersion: 'v4.3.0' },
      { name: 'Merlin-10', model: 'Parrot ANAFI USA', serialNumber: 'DRN-010', status: 'maintenance', batteryLevel: 12, maxFlightTime: 32, maxPayload: 0.3, currentLocation: 'Repair Center', totalFlightHours: 678.4, firmwareVersion: 'v3.5.1' },
      { name: 'Vulture-11', model: 'DJI Inspire 3', serialNumber: 'DRN-011', status: 'active', batteryLevel: 74, maxFlightTime: 28, maxPayload: 1.5, currentLocation: 'Media Hub', totalFlightHours: 321.0, firmwareVersion: 'v2.8.4' },
      { name: 'Sparrow-12', model: 'Zipline P2', serialNumber: 'DRN-012', status: 'active', batteryLevel: 96, maxFlightTime: 120, maxPayload: 1.8, currentLocation: 'Delivery Hub East', totalFlightHours: 2341.2, firmwareVersion: 'v7.0.1' },
      { name: 'Pelican-13', model: 'Volansi VOLY C10', serialNumber: 'DRN-013', status: 'standby', batteryLevel: 100, maxFlightTime: 60, maxPayload: 4.5, currentLocation: 'Logistics Center', totalFlightHours: 178.5, firmwareVersion: 'v2.1.0' },
      { name: 'Albatross-14', model: 'Quantum Systems Trinity F90+', serialNumber: 'DRN-014', status: 'active', batteryLevel: 85, maxFlightTime: 90, maxPayload: 1.0, currentLocation: 'Survey Depot North', totalFlightHours: 567.8, firmwareVersion: 'v3.7.2' },
      { name: 'Raven-15', model: 'DJI Matrice 300 RTK', serialNumber: 'DRN-015', status: 'retired', batteryLevel: 0, maxFlightTime: 55, maxPayload: 2.7, currentLocation: 'Storage', totalFlightHours: 3456.2, firmwareVersion: 'v3.0.0' },
      { name: 'Peregrine-16', model: 'Skydio X2', serialNumber: 'DRN-016', status: 'active', batteryLevel: 92, maxFlightTime: 35, maxPayload: 0.5, currentLocation: 'Security Post Alpha', totalFlightHours: 412.3, firmwareVersion: 'v4.5.1' }
    ]);
    console.log('Drones seeded.');

    // Flight Plans (15+)
    await FlightPlan.bulkCreate([
      { name: 'Bridge Inspection Route Alpha', droneId: 1, origin: 'Hangar A', destination: 'Golden Gate Bridge', altitude: 120, speed: 15, scheduledDate: new Date('2026-03-20'), estimatedDuration: 45, status: 'planned', priority: 'high', waypoints: [{lat:37.8199,lng:-122.4783},{lat:37.8185,lng:-122.4786}], notes: 'Annual structural inspection' },
      { name: 'Farm Survey Delta', droneId: 5, origin: 'Agricultural Depot', destination: 'Green Valley Farm', altitude: 50, speed: 10, scheduledDate: new Date('2026-03-21'), estimatedDuration: 90, status: 'planned', priority: 'medium', waypoints: [{lat:38.2,lng:-122.1},{lat:38.21,lng:-122.12}], notes: 'Spring crop assessment' },
      { name: 'Urban Delivery Circuit', droneId: 12, origin: 'Delivery Hub East', destination: 'Downtown District', altitude: 80, speed: 20, scheduledDate: new Date('2026-03-19'), estimatedDuration: 30, status: 'in-progress', priority: 'high', waypoints: [{lat:37.78,lng:-122.41}], notes: 'Medical supply delivery' },
      { name: 'Pipeline Patrol West', droneId: 2, origin: 'Field Station Alpha', destination: 'Western Pipeline Segment', altitude: 100, speed: 12, scheduledDate: new Date('2026-03-22'), estimatedDuration: 120, status: 'planned', priority: 'medium', waypoints: [{lat:37.5,lng:-122.3},{lat:37.6,lng:-122.4}], notes: 'Monthly pipeline integrity check' },
      { name: 'Solar Farm Scan', droneId: 7, origin: 'Mapping Station', destination: 'Sunnyvale Solar Park', altitude: 60, speed: 8, scheduledDate: new Date('2026-03-23'), estimatedDuration: 75, status: 'planned', priority: 'low', waypoints: [{lat:37.37,lng:-122.03}], notes: 'Panel efficiency mapping' },
      { name: 'Perimeter Security Night', droneId: 16, origin: 'Security Post Alpha', destination: 'Industrial Zone Perimeter', altitude: 90, speed: 18, scheduledDate: new Date('2026-03-19'), estimatedDuration: 180, status: 'in-progress', priority: 'high', waypoints: [{lat:37.45,lng:-122.15}], notes: 'Night surveillance patrol' },
      { name: 'Emergency Response Alpha', droneId: 4, origin: 'Hangar B', destination: 'Highway 101 Accident Site', altitude: 150, speed: 25, scheduledDate: new Date('2026-03-18'), estimatedDuration: 15, status: 'completed', priority: 'critical', waypoints: [{lat:37.55,lng:-122.25}], notes: 'Traffic accident response' },
      { name: 'Coastal Mapping Survey', droneId: 8, origin: 'Survey Base Camp', destination: 'Pacific Coastline Section B', altitude: 200, speed: 14, scheduledDate: new Date('2026-03-24'), estimatedDuration: 180, status: 'planned', priority: 'medium', waypoints: [{lat:37.7,lng:-122.5},{lat:37.65,lng:-122.48}], notes: 'Erosion monitoring' },
      { name: 'Wind Turbine Check', droneId: 9, origin: 'Urban Station 1', destination: 'Altamont Pass Wind Farm', altitude: 130, speed: 10, scheduledDate: new Date('2026-03-25'), estimatedDuration: 60, status: 'planned', priority: 'medium', waypoints: [{lat:37.73,lng:-121.63}], notes: 'Blade inspection routine' },
      { name: 'Warehouse Inventory Flight', droneId: 11, origin: 'Media Hub', destination: 'Central Warehouse', altitude: 15, speed: 5, scheduledDate: new Date('2026-03-20'), estimatedDuration: 45, status: 'planned', priority: 'low', waypoints: [{lat:37.76,lng:-122.39}], notes: 'Indoor inventory scanning' },
      { name: 'River Monitoring Route', droneId: 14, origin: 'Survey Depot North', destination: 'Sacramento River Delta', altitude: 80, speed: 12, scheduledDate: new Date('2026-03-26'), estimatedDuration: 150, status: 'planned', priority: 'medium', waypoints: [{lat:38.05,lng:-121.85}], notes: 'Water level and quality monitoring' },
      { name: 'Construction Site Survey', droneId: 1, origin: 'Hangar A', destination: 'Bay Area Construction Site 7', altitude: 100, speed: 8, scheduledDate: new Date('2026-03-27'), estimatedDuration: 60, status: 'planned', priority: 'high', waypoints: [{lat:37.42,lng:-122.08}], notes: 'Progress documentation' },
      { name: 'Wildfire Watch Patrol', droneId: 2, origin: 'Field Station Alpha', destination: 'Mt. Diablo State Park', altitude: 300, speed: 20, scheduledDate: new Date('2026-03-28'), estimatedDuration: 240, status: 'planned', priority: 'critical', waypoints: [{lat:37.88,lng:-121.91}], notes: 'Fire season early detection' },
      { name: 'Power Line Inspection', droneId: 9, origin: 'Urban Station 1', destination: 'PG&E Grid Section 14', altitude: 80, speed: 8, scheduledDate: new Date('2026-03-29'), estimatedDuration: 90, status: 'planned', priority: 'high', waypoints: [{lat:37.33,lng:-121.89}], notes: 'Post-storm damage assessment' },
      { name: 'Agricultural Spraying Run', droneId: 5, origin: 'Agricultural Depot', destination: 'Napa Valley Vineyard', altitude: 10, speed: 6, scheduledDate: new Date('2026-03-30'), estimatedDuration: 120, status: 'planned', priority: 'medium', waypoints: [{lat:38.5,lng:-122.47}], notes: 'Precision pesticide application' }
    ]);
    console.log('Flight Plans seeded.');

    // Missions (15+)
    await Mission.bulkCreate([
      { name: 'Bay Bridge Structural Assessment', type: 'inspection', droneId: 1, status: 'active', startTime: new Date('2026-03-18T08:00:00'), area: 'San Francisco Bay', progress: 65, notes: 'Annual structural integrity inspection of Bay Bridge' },
      { name: 'Napa Valley Crop Survey', type: 'agriculture', droneId: 5, status: 'completed', startTime: new Date('2026-03-15T06:00:00'), endTime: new Date('2026-03-15T10:00:00'), area: 'Napa Valley', progress: 100, notes: 'Complete vineyard health assessment' },
      { name: 'Downtown Package Express', type: 'delivery', droneId: 12, status: 'active', startTime: new Date('2026-03-18T09:00:00'), area: 'SF Downtown', progress: 40, notes: 'Priority medical supplies delivery' },
      { name: 'Harbor Security Sweep', type: 'surveillance', droneId: 16, status: 'active', startTime: new Date('2026-03-18T00:00:00'), area: 'Port of Oakland', progress: 75, notes: '24-hour port security monitoring' },
      { name: 'Highway 101 Emergency', type: 'emergency', droneId: 4, status: 'completed', startTime: new Date('2026-03-17T14:30:00'), endTime: new Date('2026-03-17T15:45:00'), area: 'Highway 101 South', progress: 100, notes: 'Multi-vehicle accident scene assessment' },
      { name: 'Solar Panel Efficiency Map', type: 'inspection', droneId: 7, status: 'pending', area: 'Sunnyvale Solar Park', progress: 0, notes: 'Thermal imaging of 5000 solar panels' },
      { name: 'Coastline Erosion Mapping', type: 'mapping', droneId: 8, status: 'pending', area: 'Pacific Coast Highway', progress: 0, notes: 'Quarterly erosion monitoring survey' },
      { name: 'Corn Field Spraying Op', type: 'agriculture', droneId: 5, status: 'completed', startTime: new Date('2026-03-12T05:00:00'), endTime: new Date('2026-03-12T09:00:00'), area: 'Central Valley Farm', progress: 100, notes: 'Pre-season fertilizer application' },
      { name: 'Industrial Zone Surveillance', type: 'surveillance', droneId: 16, status: 'pending', area: 'East Bay Industrial Zone', progress: 0, notes: 'Routine security patrol' },
      { name: 'Pipeline Leak Detection', type: 'inspection', droneId: 2, status: 'active', startTime: new Date('2026-03-18T07:00:00'), area: 'Western Pipeline Network', progress: 30, notes: 'Methane leak detection using thermal sensors' },
      { name: 'Pharmacy Delivery Route', type: 'delivery', droneId: 13, status: 'pending', area: 'Silicon Valley', progress: 0, notes: 'Prescription medication delivery' },
      { name: 'Wildfire Perimeter Watch', type: 'emergency', droneId: 2, status: 'pending', area: 'Mt. Diablo', progress: 0, notes: 'Fire season monitoring' },
      { name: 'Wind Farm Assessment', type: 'inspection', droneId: 9, status: 'pending', area: 'Altamont Pass', progress: 0, notes: 'Blade damage detection' },
      { name: 'Ranch Livestock Count', type: 'agriculture', droneId: 14, status: 'completed', startTime: new Date('2026-03-16T06:00:00'), endTime: new Date('2026-03-16T08:00:00'), area: 'Point Reyes Ranch', progress: 100, notes: 'AI-assisted livestock counting' },
      { name: 'Construction Progress Doc', type: 'mapping', droneId: 1, status: 'pending', area: 'Palo Alto Building Site', progress: 0, notes: 'Weekly construction progress documentation' },
      { name: 'Traffic Flow Analysis', type: 'surveillance', droneId: 9, status: 'completed', startTime: new Date('2026-03-14T07:00:00'), endTime: new Date('2026-03-14T19:00:00'), area: 'Highway 280 Corridor', progress: 100, notes: 'Rush hour traffic pattern analysis' }
    ]);
    console.log('Missions seeded.');

    // Inspections (15+)
    await Inspection.bulkCreate([
      { name: 'Golden Gate South Tower', type: 'bridge', location: 'Golden Gate Bridge, SF', droneId: 1, status: 'completed', scheduledDate: new Date('2026-03-10'), findings: 'Minor surface corrosion on south cables', severity: 'low', clientName: 'CalTrans', cost: 450 },
      { name: 'Chevron Pipeline Segment 7', type: 'pipeline', location: 'Richmond Refinery', droneId: 2, status: 'in-progress', scheduledDate: new Date('2026-03-18'), findings: null, severity: 'none', clientName: 'Chevron Corp', cost: 380 },
      { name: 'PG&E Tower Line 14A', type: 'powerline', location: 'San Jose Grid', droneId: 9, status: 'scheduled', scheduledDate: new Date('2026-03-22'), clientName: 'PG&E', cost: 320 },
      { name: 'Salesforce Tower Facade', type: 'building', location: 'Salesforce Tower, SF', droneId: 4, status: 'completed', scheduledDate: new Date('2026-03-08'), findings: 'All panels in excellent condition', severity: 'none', clientName: 'Salesforce Inc', cost: 500 },
      { name: 'Sunnyvale Solar Array B', type: 'solar-panel', location: 'Sunnyvale Solar Park', droneId: 7, status: 'scheduled', scheduledDate: new Date('2026-03-25'), clientName: 'SunPower Corp', cost: 275 },
      { name: 'Altamont Turbine 47', type: 'wind-turbine', location: 'Altamont Pass', droneId: 9, status: 'review', scheduledDate: new Date('2026-03-12'), findings: 'Hairline crack detected on blade 2', severity: 'high', clientName: 'NextEra Energy', cost: 420 },
      { name: 'Bay Bridge Deck Section 3', type: 'bridge', location: 'Bay Bridge East Span', droneId: 1, status: 'completed', scheduledDate: new Date('2026-03-05'), findings: 'Expansion joints within tolerance', severity: 'none', clientName: 'CalTrans', cost: 480 },
      { name: 'Tesoro Pipeline Junction', type: 'pipeline', location: 'Martinez Refinery', droneId: 2, status: 'scheduled', scheduledDate: new Date('2026-03-28'), clientName: 'Marathon Petroleum', cost: 350 },
      { name: 'Apple Park Building 5', type: 'building', location: 'Apple Park, Cupertino', droneId: 4, status: 'completed', scheduledDate: new Date('2026-03-02'), findings: 'Roof drainage system clear', severity: 'none', clientName: 'Apple Inc', cost: 550 },
      { name: 'Stanford Solar Canopy', type: 'solar-panel', location: 'Stanford University', droneId: 7, status: 'in-progress', scheduledDate: new Date('2026-03-18'), findings: 'Initial scan shows 3% degraded panels', severity: 'low', clientName: 'Stanford University', cost: 300 },
      { name: 'Contra Costa Power Line', type: 'powerline', location: 'Contra Costa County', droneId: 14, status: 'scheduled', scheduledDate: new Date('2026-03-30'), clientName: 'PG&E', cost: 340 },
      { name: 'Dumbarton Bridge Rail', type: 'bridge', location: 'Dumbarton Bridge', droneId: 1, status: 'scheduled', scheduledDate: new Date('2026-04-02'), clientName: 'CalTrans', cost: 460 },
      { name: 'Facebook HQ Campus', type: 'building', location: 'Meta HQ, Menlo Park', droneId: 11, status: 'completed', scheduledDate: new Date('2026-02-28'), findings: 'Green roof vegetation healthy', severity: 'none', clientName: 'Meta Platforms', cost: 520 },
      { name: 'Moss Landing Turbines', type: 'wind-turbine', location: 'Moss Landing', droneId: 9, status: 'scheduled', scheduledDate: new Date('2026-04-05'), clientName: 'Orsted Energy', cost: 440 },
      { name: 'SFO Runway Infrastructure', type: 'infrastructure', location: 'SFO Airport', droneId: 4, status: 'review', scheduledDate: new Date('2026-03-15'), findings: 'Taxiway C showing surface wear', severity: 'medium', clientName: 'SFO International', cost: 600 },
      { name: 'Hetch Hetchy Aqueduct', type: 'pipeline', location: 'Hetch Hetchy System', droneId: 2, status: 'scheduled', scheduledDate: new Date('2026-04-10'), clientName: 'SFPUC', cost: 390 }
    ]);
    console.log('Inspections seeded.');

    // Deliveries (15+)
    await Delivery.bulkCreate([
      { trackingNumber: 'DEL-2026-0001', packageDescription: 'Emergency Insulin Supply', weight: 0.5, pickupAddress: 'UCSF Medical Center', deliveryAddress: '742 Lombard St, SF', droneId: 12, status: 'delivered', scheduledDate: new Date('2026-03-17'), deliveredDate: new Date('2026-03-17'), recipientName: 'Maria Santos', recipientPhone: '415-555-0101', cost: 150, priority: 'urgent' },
      { trackingNumber: 'DEL-2026-0002', packageDescription: 'Lab Test Samples', weight: 0.3, pickupAddress: 'Stanford Medical Lab', deliveryAddress: 'Quest Diagnostics, SJ', droneId: 12, status: 'in-transit', scheduledDate: new Date('2026-03-18'), recipientName: 'Dr. Robert Chen', recipientPhone: '408-555-0202', cost: 120, priority: 'express' },
      { trackingNumber: 'DEL-2026-0003', packageDescription: 'Electronic Components', weight: 1.2, pickupAddress: 'Arrow Electronics Warehouse', deliveryAddress: 'Tesla Factory, Fremont', droneId: 13, status: 'pending', scheduledDate: new Date('2026-03-19'), recipientName: 'Alex Kim', recipientPhone: '510-555-0303', cost: 85, priority: 'standard' },
      { trackingNumber: 'DEL-2026-0004', packageDescription: 'Legal Documents', weight: 0.2, pickupAddress: 'Morrison & Foerster LLP', deliveryAddress: 'Santa Clara County Court', droneId: 12, status: 'delivered', scheduledDate: new Date('2026-03-16'), deliveredDate: new Date('2026-03-16'), recipientName: 'Judge Patricia Wu', recipientPhone: '408-555-0404', cost: 200, priority: 'urgent' },
      { trackingNumber: 'DEL-2026-0005', packageDescription: 'Prescription Medications', weight: 0.8, pickupAddress: 'CVS Pharmacy Hub', deliveryAddress: '1234 Oak Ave, Palo Alto', droneId: 12, status: 'picked-up', scheduledDate: new Date('2026-03-18'), recipientName: 'James Morrison', recipientPhone: '650-555-0505', cost: 95, priority: 'express' },
      { trackingNumber: 'DEL-2026-0006', packageDescription: 'Camera Equipment', weight: 1.5, pickupAddress: 'B&H Photo Warehouse', deliveryAddress: 'NBC Studios, SF', droneId: 13, status: 'pending', scheduledDate: new Date('2026-03-20'), recipientName: 'Sarah Mitchell', recipientPhone: '415-555-0606', cost: 110, priority: 'standard' },
      { trackingNumber: 'DEL-2026-0007', packageDescription: 'Blood Samples', weight: 0.4, pickupAddress: 'Kaiser Oakland', deliveryAddress: 'UCSF Lab, SF', droneId: 12, status: 'in-transit', scheduledDate: new Date('2026-03-18'), recipientName: 'Lab Team Alpha', recipientPhone: '415-555-0707', cost: 175, priority: 'urgent' },
      { trackingNumber: 'DEL-2026-0008', packageDescription: 'Drone Spare Parts', weight: 1.0, pickupAddress: 'DJI Service Center', deliveryAddress: 'DroneOps Hangar A', droneId: 13, status: 'pending', scheduledDate: new Date('2026-03-19'), recipientName: 'Tech Team', recipientPhone: '510-555-0808', cost: 65, priority: 'standard' },
      { trackingNumber: 'DEL-2026-0009', packageDescription: 'Organic Produce Bundle', weight: 1.8, pickupAddress: 'Farm Fresh Distribution', deliveryAddress: '567 Pine St, SF', droneId: 12, status: 'delivered', scheduledDate: new Date('2026-03-15'), deliveredDate: new Date('2026-03-15'), recipientName: 'Emily Watson', recipientPhone: '415-555-0909', cost: 55, priority: 'standard' },
      { trackingNumber: 'DEL-2026-0010', packageDescription: 'Emergency AED Device', weight: 0.6, pickupAddress: 'MedEquip Warehouse', deliveryAddress: 'Bay Trail Park Office', droneId: 12, status: 'delivered', scheduledDate: new Date('2026-03-14'), deliveredDate: new Date('2026-03-14'), recipientName: 'Park Ranger Office', recipientPhone: '510-555-1010', cost: 250, priority: 'urgent' },
      { trackingNumber: 'DEL-2026-0011', packageDescription: 'Architectural Plans', weight: 0.3, pickupAddress: 'Foster + Partners', deliveryAddress: 'City Planning Dept, SJ', droneId: 13, status: 'pending', scheduledDate: new Date('2026-03-21'), recipientName: 'Planning Dept', recipientPhone: '408-555-1111', cost: 90, priority: 'express' },
      { trackingNumber: 'DEL-2026-0012', packageDescription: 'Vaccine Shipment', weight: 0.7, pickupAddress: 'CDC Regional Office', deliveryAddress: 'Community Health Center', droneId: 12, status: 'in-transit', scheduledDate: new Date('2026-03-18'), recipientName: 'Dr. Lisa Park', recipientPhone: '650-555-1212', cost: 300, priority: 'urgent' },
      { trackingNumber: 'DEL-2026-0013', packageDescription: 'Soil Test Kits', weight: 1.1, pickupAddress: 'AgriLab Supplies', deliveryAddress: 'Green Valley Farm', droneId: 13, status: 'pending', scheduledDate: new Date('2026-03-22'), recipientName: 'Farm Manager Bob', recipientPhone: '707-555-1313', cost: 70, priority: 'standard' },
      { trackingNumber: 'DEL-2026-0014', packageDescription: 'Defibrillator Battery', weight: 0.4, pickupAddress: 'Medical Supplies Inc', deliveryAddress: 'St. Mary Hospital', droneId: 12, status: 'delivered', scheduledDate: new Date('2026-03-13'), deliveredDate: new Date('2026-03-13'), recipientName: 'ER Department', recipientPhone: '415-555-1414', cost: 180, priority: 'urgent' },
      { trackingNumber: 'DEL-2026-0015', packageDescription: 'Contract Documents', weight: 0.2, pickupAddress: 'Google Legal, MTV', deliveryAddress: 'Wilson Sonsini, PA', droneId: 13, status: 'pending', scheduledDate: new Date('2026-03-23'), recipientName: 'Legal Team', recipientPhone: '650-555-1515', cost: 100, priority: 'express' },
      { trackingNumber: 'DEL-2026-0016', packageDescription: 'Watch Repair Parts', weight: 0.1, pickupAddress: 'Precision Parts Co', deliveryAddress: 'Rolex Service Center', droneId: 12, status: 'pending', scheduledDate: new Date('2026-03-24'), recipientName: 'Service Dept', recipientPhone: '415-555-1616', cost: 75, priority: 'standard' }
    ]);
    console.log('Deliveries seeded.');

    // Agriculture Operations (15+)
    await AgricultureOp.bulkCreate([
      { name: 'Napa Vineyard Spring Survey', type: 'crop-monitoring', farmName: 'Robert Mondavi Winery', fieldArea: 150, cropType: 'Cabernet Sauvignon', droneId: 5, status: 'completed', scheduledDate: new Date('2026-03-10'), findings: 'Healthy vine growth, bud break on schedule', coveragePercent: 100, cost: 280 },
      { name: 'Salinas Lettuce Spraying', type: 'spraying', farmName: 'Dole Fresh Farms', fieldArea: 500, cropType: 'Romaine Lettuce', droneId: 5, status: 'in-progress', scheduledDate: new Date('2026-03-18'), chemicalUsed: 'Organic Neem Oil', coveragePercent: 45, cost: 750 },
      { name: 'Almond Orchard Seeding', type: 'seeding', farmName: 'Blue Diamond Growers', fieldArea: 300, cropType: 'Almonds', droneId: 5, status: 'planned', scheduledDate: new Date('2026-03-25'), coveragePercent: 0, cost: 420 },
      { name: 'Central Valley Soil Analysis', type: 'soil-analysis', farmName: 'Harris Ranch', fieldArea: 1000, cropType: 'Mixed Crops', droneId: 14, status: 'completed', scheduledDate: new Date('2026-03-05'), findings: 'pH levels optimal, nitrogen slightly low in sector 7', coveragePercent: 100, cost: 550 },
      { name: 'Strawberry Field Irrigation', type: 'irrigation', farmName: 'Driscoll Berry Farm', fieldArea: 80, cropType: 'Strawberries', droneId: 5, status: 'planned', scheduledDate: new Date('2026-03-22'), coveragePercent: 0, cost: 320 },
      { name: 'Walnut Grove Health Check', type: 'health-assessment', farmName: 'Diamond Foods', fieldArea: 200, cropType: 'Walnuts', droneId: 14, status: 'completed', scheduledDate: new Date('2026-03-08'), findings: 'Early signs of blight in northeast section', coveragePercent: 100, cost: 380 },
      { name: 'Rice Paddy Monitoring', type: 'crop-monitoring', farmName: 'Sacramento Valley Rice', fieldArea: 800, cropType: 'Calrose Rice', droneId: 8, status: 'planned', scheduledDate: new Date('2026-04-01'), coveragePercent: 0, cost: 620 },
      { name: 'Tomato Pest Control Spray', type: 'spraying', farmName: 'Morning Star Farms', fieldArea: 400, cropType: 'Roma Tomatoes', droneId: 5, status: 'completed', scheduledDate: new Date('2026-03-12'), chemicalUsed: 'Bacillus thuringiensis', coveragePercent: 100, cost: 580 },
      { name: 'Avocado Grove Survey', type: 'crop-monitoring', farmName: 'Calavo Growers', fieldArea: 120, cropType: 'Hass Avocado', droneId: 14, status: 'in-progress', scheduledDate: new Date('2026-03-18'), findings: 'Monitoring water stress indicators', coveragePercent: 60, cost: 340 },
      { name: 'Cotton Field Seeding', type: 'seeding', farmName: 'San Joaquin Cotton', fieldArea: 600, cropType: 'Pima Cotton', droneId: 5, status: 'planned', scheduledDate: new Date('2026-04-05'), coveragePercent: 0, cost: 480 },
      { name: 'Citrus Orchard Health', type: 'health-assessment', farmName: 'Sunkist Growers', fieldArea: 180, cropType: 'Valencia Oranges', droneId: 14, status: 'planned', scheduledDate: new Date('2026-03-28'), coveragePercent: 0, cost: 360 },
      { name: 'Wheat Field Monitoring', type: 'crop-monitoring', farmName: 'General Mills Farm', fieldArea: 700, cropType: 'Winter Wheat', droneId: 8, status: 'completed', scheduledDate: new Date('2026-03-01'), findings: 'Excellent growth rate, no disease detected', coveragePercent: 100, cost: 540 },
      { name: 'Artichoke Soil Analysis', type: 'soil-analysis', farmName: 'Ocean Mist Farms', fieldArea: 90, cropType: 'Globe Artichokes', droneId: 14, status: 'planned', scheduledDate: new Date('2026-04-02'), coveragePercent: 0, cost: 290 },
      { name: 'Garlic Field Irrigation', type: 'irrigation', farmName: 'Christopher Ranch', fieldArea: 250, cropType: 'Garlic', droneId: 5, status: 'in-progress', scheduledDate: new Date('2026-03-18'), coveragePercent: 30, cost: 410 },
      { name: 'Broccoli Spraying Round 2', type: 'spraying', farmName: 'Mann Packing', fieldArea: 350, cropType: 'Broccoli', droneId: 5, status: 'planned', scheduledDate: new Date('2026-03-26'), chemicalUsed: 'Spinosad', coveragePercent: 0, cost: 520 }
    ]);
    console.log('Agriculture Operations seeded.');

    // Surveillance (15+)
    await Surveillance.bulkCreate([
      { name: 'Port of Oakland Night Watch', type: 'perimeter', location: 'Port of Oakland', droneId: 16, status: 'active', startTime: new Date('2026-03-18T00:00:00'), alertsGenerated: 3, clientName: 'Port Authority', isRecurring: true, cost: 350 },
      { name: 'Stanford Campus Evening', type: 'area', location: 'Stanford University', droneId: 9, status: 'scheduled', startTime: new Date('2026-03-19T18:00:00'), clientName: 'Stanford Security', isRecurring: true, cost: 200 },
      { name: 'Bay to Breakers Race', type: 'event', location: 'SF City Center', droneId: 4, status: 'scheduled', startTime: new Date('2026-05-17T07:00:00'), clientName: 'SF Events Committee', isRecurring: false, cost: 500 },
      { name: 'Wildfire Watch Zone A', type: 'emergency', location: 'Mt. Tamalpais', droneId: 2, status: 'active', startTime: new Date('2026-03-18T06:00:00'), alertsGenerated: 1, clientName: 'Marin Fire Dept', isRecurring: true, cost: 280 },
      { name: 'Highway 101 Traffic Monitor', type: 'traffic', location: 'Highway 101 Corridor', droneId: 9, status: 'completed', startTime: new Date('2026-03-17T07:00:00'), endTime: new Date('2026-03-17T19:00:00'), alertsGenerated: 5, clientName: 'CalTrans', isRecurring: true, cost: 320 },
      { name: 'Pt. Reyes Wildlife Survey', type: 'wildlife', location: 'Pt. Reyes National Seashore', droneId: 14, status: 'scheduled', startTime: new Date('2026-03-22T05:00:00'), clientName: 'NPS', isRecurring: false, cost: 400 },
      { name: 'Google Campus Security', type: 'perimeter', location: 'Googleplex, Mountain View', droneId: 16, status: 'scheduled', startTime: new Date('2026-03-20T20:00:00'), clientName: 'Google Security', isRecurring: true, cost: 380 },
      { name: 'SF Giants Game Coverage', type: 'event', location: 'Oracle Park, SF', droneId: 4, status: 'scheduled', startTime: new Date('2026-04-01T17:00:00'), clientName: 'SF Giants', isRecurring: false, cost: 450 },
      { name: 'Industrial Zone Patrol', type: 'area', location: 'East Bay Industrial', droneId: 16, status: 'completed', startTime: new Date('2026-03-16T22:00:00'), endTime: new Date('2026-03-17T06:00:00'), alertsGenerated: 0, clientName: 'Industrial Assn', isRecurring: true, cost: 250 },
      { name: 'Tesla Fremont Perimeter', type: 'perimeter', location: 'Tesla Factory, Fremont', droneId: 16, status: 'active', startTime: new Date('2026-03-18T00:00:00'), alertsGenerated: 2, clientName: 'Tesla Security', isRecurring: true, cost: 400 },
      { name: 'Alcatraz Island Monitor', type: 'area', location: 'Alcatraz Island', droneId: 9, status: 'scheduled', startTime: new Date('2026-03-21T08:00:00'), clientName: 'NPS', isRecurring: false, cost: 300 },
      { name: 'Hwy 280 Rush Hour', type: 'traffic', location: 'Highway 280', droneId: 9, status: 'scheduled', startTime: new Date('2026-03-19T06:00:00'), clientName: 'CalTrans', isRecurring: true, cost: 280 },
      { name: 'Marina District Night', type: 'area', location: 'Marina District, SF', droneId: 16, status: 'completed', startTime: new Date('2026-03-15T21:00:00'), endTime: new Date('2026-03-16T05:00:00'), alertsGenerated: 1, clientName: 'SF Police Dept', isRecurring: true, cost: 320 },
      { name: 'Earthquake Damage Survey', type: 'emergency', location: 'Hayward Fault Zone', droneId: 4, status: 'completed', startTime: new Date('2026-03-10T08:00:00'), endTime: new Date('2026-03-10T16:00:00'), alertsGenerated: 8, clientName: 'USGS', isRecurring: false, cost: 600 },
      { name: 'Elephant Seal Monitor', type: 'wildlife', location: 'Año Nuevo State Park', droneId: 14, status: 'completed', startTime: new Date('2026-03-08T06:00:00'), endTime: new Date('2026-03-08T12:00:00'), alertsGenerated: 0, clientName: 'CA State Parks', isRecurring: false, cost: 350 }
    ]);
    console.log('Surveillance seeded.');

    // Maintenance (15+)
    await Maintenance.bulkCreate([
      { droneId: 3, type: 'repair', description: 'Motor 3 replacement - unusual vibration detected', status: 'in-progress', scheduledDate: new Date('2026-03-18'), technicianName: 'Carlos Rivera', cost: 450, partsReplaced: ['Motor 3', 'ESC 3'] },
      { droneId: 10, type: 'battery-replacement', description: 'Battery cycle limit reached - full replacement', status: 'in-progress', scheduledDate: new Date('2026-03-18'), technicianName: 'Mike Johnson', cost: 280, partsReplaced: ['LiPo Battery Pack'] },
      { droneId: 1, type: 'scheduled', description: 'Quarterly comprehensive maintenance check', status: 'pending', scheduledDate: new Date('2026-03-25'), technicianName: 'Carlos Rivera', cost: 200 },
      { droneId: 5, type: 'calibration', description: 'Spray nozzle calibration for precision agriculture', status: 'completed', scheduledDate: new Date('2026-03-15'), completedDate: new Date('2026-03-15'), technicianName: 'Sarah Lee', cost: 150, partsReplaced: ['Nozzle set A'] },
      { droneId: 12, type: 'firmware-update', description: 'Critical firmware update v7.0.2 - delivery route optimization', status: 'completed', scheduledDate: new Date('2026-03-14'), completedDate: new Date('2026-03-14'), technicianName: 'Alex Wong', cost: 50 },
      { droneId: 7, type: 'scheduled', description: 'Annual propeller inspection and replacement', status: 'pending', scheduledDate: new Date('2026-03-28'), technicianName: 'Carlos Rivera', cost: 180, partsReplaced: ['4x Carbon fiber props'] },
      { droneId: 2, type: 'repair', description: 'GPS module intermittent signal - replacement needed', status: 'completed', scheduledDate: new Date('2026-03-08'), completedDate: new Date('2026-03-09'), technicianName: 'Mike Johnson', cost: 320, partsReplaced: ['GPS Module v3'] },
      { droneId: 16, type: 'upgrade', description: 'Night vision camera upgrade - Gen 4 thermal', status: 'completed', scheduledDate: new Date('2026-03-12'), completedDate: new Date('2026-03-13'), technicianName: 'Sarah Lee', cost: 1200, partsReplaced: ['Thermal Camera Gen 4', 'IR Illuminator'] },
      { droneId: 8, type: 'calibration', description: 'Mapping sensor calibration - photogrammetry accuracy', status: 'pending', scheduledDate: new Date('2026-03-22'), technicianName: 'Alex Wong', cost: 175 },
      { droneId: 14, type: 'battery-replacement', description: 'Preventive battery swap - 400 cycles reached', status: 'pending', scheduledDate: new Date('2026-03-24'), technicianName: 'Mike Johnson', cost: 350, partsReplaced: ['LiPo Battery Pack'] },
      { droneId: 4, type: 'firmware-update', description: 'Obstacle avoidance AI update v5.2', status: 'completed', scheduledDate: new Date('2026-03-10'), completedDate: new Date('2026-03-10'), technicianName: 'Alex Wong', cost: 50 },
      { droneId: 9, type: 'repair', description: 'Gimbal stabilizer replacement - drift issue', status: 'completed', scheduledDate: new Date('2026-03-06'), completedDate: new Date('2026-03-07'), technicianName: 'Carlos Rivera', cost: 380, partsReplaced: ['3-Axis Gimbal Motor', 'IMU Sensor'] },
      { droneId: 11, type: 'scheduled', description: 'Semi-annual full inspection and certification', status: 'pending', scheduledDate: new Date('2026-04-01'), technicianName: 'Sarah Lee', cost: 250 },
      { droneId: 13, type: 'upgrade', description: 'Extended range antenna installation', status: 'completed', scheduledDate: new Date('2026-03-11'), completedDate: new Date('2026-03-11'), technicianName: 'Mike Johnson', cost: 420, partsReplaced: ['Long-range Antenna', 'Signal Amplifier'] },
      { droneId: 6, type: 'calibration', description: 'Cinema camera lens calibration and sensor cleaning', status: 'pending', scheduledDate: new Date('2026-03-26'), technicianName: 'Sarah Lee', cost: 200 },
      { droneId: 15, type: 'scheduled', description: 'Decommission inspection - retirement processing', status: 'completed', scheduledDate: new Date('2026-03-01'), completedDate: new Date('2026-03-01'), technicianName: 'Carlos Rivera', cost: 100 }
    ]);
    console.log('Maintenance seeded.');

    // Weather Reports (15+)
    await WeatherReport.bulkCreate([
      { location: 'San Francisco', date: new Date('2026-03-18'), temperature: 16, humidity: 72, windSpeed: 18, windDirection: 'W', visibility: 12, precipitation: 0, condition: 'Partly Cloudy', flyable: true, aiRecommendation: 'Good conditions for flight. Monitor wind gusts near coast.' },
      { location: 'Oakland', date: new Date('2026-03-18'), temperature: 18, humidity: 65, windSpeed: 12, windDirection: 'NW', visibility: 15, precipitation: 0, condition: 'Clear', flyable: true, aiRecommendation: 'Excellent flying conditions.' },
      { location: 'San Jose', date: new Date('2026-03-18'), temperature: 20, humidity: 55, windSpeed: 8, windDirection: 'N', visibility: 20, precipitation: 0, condition: 'Sunny', flyable: true, aiRecommendation: 'Optimal conditions for all drone operations.' },
      { location: 'Napa Valley', date: new Date('2026-03-18'), temperature: 15, humidity: 80, windSpeed: 5, windDirection: 'S', visibility: 8, precipitation: 2, condition: 'Light Rain', flyable: false, aiRecommendation: 'Postpone agriculture operations. Light rain may affect sensors.' },
      { location: 'Sacramento', date: new Date('2026-03-18'), temperature: 22, humidity: 45, windSpeed: 10, windDirection: 'SW', visibility: 25, precipitation: 0, condition: 'Clear', flyable: true, aiRecommendation: 'Perfect for long-range survey missions.' },
      { location: 'Palo Alto', date: new Date('2026-03-18'), temperature: 19, humidity: 60, windSpeed: 14, windDirection: 'W', visibility: 18, precipitation: 0, condition: 'Clear', flyable: true, aiRecommendation: 'Good conditions. Moderate wind - adjust altitude for stability.' },
      { location: 'Fremont', date: new Date('2026-03-18'), temperature: 21, humidity: 50, windSpeed: 6, windDirection: 'NW', visibility: 22, precipitation: 0, condition: 'Sunny', flyable: true, aiRecommendation: 'Ideal for delivery and inspection flights.' },
      { location: 'Mountain View', date: new Date('2026-03-18'), temperature: 20, humidity: 58, windSpeed: 9, windDirection: 'W', visibility: 20, precipitation: 0, condition: 'Partly Cloudy', flyable: true, aiRecommendation: 'Good visibility. Suitable for mapping operations.' },
      { location: 'Half Moon Bay', date: new Date('2026-03-18'), temperature: 14, humidity: 85, windSpeed: 25, windDirection: 'W', visibility: 5, precipitation: 5, condition: 'Fog & Rain', flyable: false, aiRecommendation: 'NO FLY - High winds and poor visibility. Coastal fog advisory.' },
      { location: 'Mt. Diablo', date: new Date('2026-03-18'), temperature: 12, humidity: 40, windSpeed: 30, windDirection: 'NW', visibility: 30, precipitation: 0, condition: 'Windy Clear', flyable: false, aiRecommendation: 'NO FLY - Wind speeds exceed safety limits for most drones.' },
      { location: 'Hayward', date: new Date('2026-03-18'), temperature: 19, humidity: 62, windSpeed: 11, windDirection: 'W', visibility: 16, precipitation: 0, condition: 'Clear', flyable: true, aiRecommendation: 'Suitable for operations. Watch for afternoon thermal activity.' },
      { location: 'Santa Cruz', date: new Date('2026-03-18'), temperature: 17, humidity: 70, windSpeed: 16, windDirection: 'SW', visibility: 14, precipitation: 0, condition: 'Overcast', flyable: true, aiRecommendation: 'Acceptable conditions. Overcast sky ideal for photogrammetry.' },
      { location: 'Livermore', date: new Date('2026-03-18'), temperature: 23, humidity: 35, windSpeed: 20, windDirection: 'W', visibility: 25, precipitation: 0, condition: 'Sunny Windy', flyable: true, aiRecommendation: 'Flyable but use caution. Altamont Pass winds affect stability.' },
      { location: 'Concord', date: new Date('2026-03-18'), temperature: 21, humidity: 48, windSpeed: 7, windDirection: 'NW', visibility: 22, precipitation: 0, condition: 'Clear', flyable: true, aiRecommendation: 'Excellent conditions for all operations.' },
      { location: 'San Mateo', date: new Date('2026-03-18'), temperature: 18, humidity: 66, windSpeed: 13, windDirection: 'W', visibility: 15, precipitation: 0, condition: 'Partly Cloudy', flyable: true, aiRecommendation: 'Good for standard operations. Cloud cover at 3000ft.' },
      { location: 'Vallejo', date: new Date('2026-03-18'), temperature: 17, humidity: 75, windSpeed: 15, windDirection: 'SW', visibility: 10, precipitation: 1, condition: 'Drizzle', flyable: false, aiRecommendation: 'Light drizzle - avoid flights with non-waterproof drones.' }
    ]);
    console.log('Weather Reports seeded.');

    // Routes (15+)
    await Route.bulkCreate([
      { name: 'SF Downtown Express', origin: 'Hangar A, SFO Area', destination: 'Union Square, SF', distance: 18.5, estimatedTime: 12, waypoints: [{lat:37.62,lng:-122.38},{lat:37.78,lng:-122.41}], optimized: true, altitude: 120, status: 'active', aiScore: 94 },
      { name: 'Peninsula Medical Route', origin: 'Stanford Medical', destination: 'UCSF Medical', distance: 35.2, estimatedTime: 22, waypoints: [{lat:37.43,lng:-122.17},{lat:37.76,lng:-122.46}], optimized: true, altitude: 150, status: 'active', aiScore: 91 },
      { name: 'East Bay Industrial Loop', origin: 'Oakland Hub', destination: 'Fremont Depot', distance: 28.7, estimatedTime: 18, waypoints: [{lat:37.8,lng:-122.27},{lat:37.55,lng:-121.99}], optimized: true, altitude: 100, status: 'active', aiScore: 88 },
      { name: 'Napa Agriculture Circuit', origin: 'Agricultural Depot', destination: 'Napa Valley Farms', distance: 45.3, estimatedTime: 35, waypoints: [{lat:38.3,lng:-122.3},{lat:38.5,lng:-122.47}], optimized: true, altitude: 50, status: 'active', aiScore: 92 },
      { name: 'Coastal Survey Path', origin: 'Half Moon Bay', destination: 'Santa Cruz', distance: 62.1, estimatedTime: 45, waypoints: [{lat:37.46,lng:-122.43},{lat:36.97,lng:-122.03}], optimized: false, altitude: 200, status: 'draft', aiScore: 75 },
      { name: 'Bay Bridge Inspection', origin: 'Treasure Island', destination: 'Bay Bridge East', distance: 5.2, estimatedTime: 25, waypoints: [{lat:37.82,lng:-122.37},{lat:37.81,lng:-122.35}], optimized: true, altitude: 80, status: 'active', aiScore: 96 },
      { name: 'Silicon Valley Delivery', origin: 'Delivery Hub East', destination: 'Apple Park', distance: 22.4, estimatedTime: 15, waypoints: [{lat:37.4,lng:-122.05},{lat:37.33,lng:-122.01}], optimized: true, altitude: 110, status: 'active', aiScore: 93 },
      { name: 'Sacramento Express', origin: 'Oakland Hub', destination: 'Sacramento Depot', distance: 95.8, estimatedTime: 55, waypoints: [{lat:37.8,lng:-122.27},{lat:38.58,lng:-121.49}], optimized: false, altitude: 250, status: 'draft', aiScore: 70 },
      { name: 'Altamont Wind Farm Path', origin: 'Livermore Station', destination: 'Altamont Pass', distance: 15.6, estimatedTime: 12, waypoints: [{lat:37.68,lng:-121.77},{lat:37.73,lng:-121.63}], optimized: true, altitude: 130, status: 'active', aiScore: 89 },
      { name: 'Port Security Route', origin: 'Security Post Alpha', destination: 'Port of Oakland', distance: 8.3, estimatedTime: 15, waypoints: [{lat:37.8,lng:-122.3},{lat:37.79,lng:-122.31}], optimized: true, altitude: 90, status: 'active', aiScore: 95 },
      { name: 'Solar Farm Survey Loop', origin: 'Mapping Station', destination: 'Sunnyvale Solar Park', distance: 12.1, estimatedTime: 20, waypoints: [{lat:37.38,lng:-122.05},{lat:37.37,lng:-122.03}], optimized: true, altitude: 60, status: 'active', aiScore: 90 },
      { name: 'Emergency Hospital Route', origin: 'Any Origin', destination: 'Regional Medical Center', distance: 10.0, estimatedTime: 8, waypoints: [{lat:37.55,lng:-122.1}], optimized: true, altitude: 150, status: 'active', aiScore: 98 },
      { name: 'Pipeline Patrol Route', origin: 'Field Station Alpha', destination: 'Richmond Refinery', distance: 32.5, estimatedTime: 28, waypoints: [{lat:37.9,lng:-122.35},{lat:37.93,lng:-122.38}], optimized: false, altitude: 100, status: 'draft', aiScore: 82 },
      { name: 'Campus Survey Route', origin: 'Stanford Main', destination: 'Stanford Medical', distance: 3.2, estimatedTime: 8, waypoints: [{lat:37.43,lng:-122.17}], optimized: true, altitude: 40, status: 'active', aiScore: 97 },
      { name: 'Marin Wildfire Watch', origin: 'Marin Station', destination: 'Mt. Tamalpais', distance: 18.9, estimatedTime: 15, waypoints: [{lat:37.9,lng:-122.55},{lat:37.92,lng:-122.58}], optimized: true, altitude: 300, status: 'active', aiScore: 87 }
    ]);
    console.log('Routes seeded.');

    // Anomalies (15+)
    await Anomaly.bulkCreate([
      { droneId: 3, type: 'equipment', severity: 'critical', description: 'Motor 3 RPM fluctuation exceeding 15% threshold', location: 'En route to inspection site', resolved: false, aiAnalysis: 'Bearing wear detected. Immediate grounding recommended.' },
      { droneId: 10, type: 'performance', severity: 'warning', description: 'Battery discharge rate 30% faster than normal', location: 'Hangar A', resolved: false, aiAnalysis: 'Battery cell degradation. Replace before next flight.' },
      { droneId: 2, type: 'environmental', severity: 'info', description: 'Unexpected wind shear at 100m altitude', location: 'Western Pipeline Route', resolved: true, resolvedAt: new Date('2026-03-17'), aiAnalysis: 'Microburst activity detected. Route adjustment recommended.' },
      { droneId: 16, type: 'security', severity: 'warning', description: 'Signal interference detected - possible jamming attempt', location: 'Port of Oakland', resolved: false, aiAnalysis: 'RF interference pattern consistent with commercial jammer. Notify security.' },
      { droneId: 9, type: 'structural', severity: 'warning', description: 'Landing gear micro-crack detected by onboard sensor', location: 'Urban Station 1', resolved: true, resolvedAt: new Date('2026-03-16'), aiAnalysis: 'Stress fracture from hard landing. Landing gear replaced.', actionTaken: 'Landing gear replaced, flight test passed' },
      { droneId: 12, type: 'performance', severity: 'info', description: 'GPS accuracy degraded to 5m in urban canyon', location: 'Downtown SF', resolved: true, resolvedAt: new Date('2026-03-15'), aiAnalysis: 'Multipath interference in dense urban area. Switch to RTK mode.' },
      { droneId: 5, type: 'equipment', severity: 'warning', description: 'Spray nozzle 4 flow rate deviation +12%', location: 'Napa Valley Farm', resolved: true, resolvedAt: new Date('2026-03-14'), aiAnalysis: 'Nozzle partially clogged. Cleaning restored normal flow.', actionTaken: 'Nozzle cleaned and recalibrated' },
      { droneId: 1, type: 'behavioral', severity: 'info', description: 'Unexpected altitude gain of 5m during hover', location: 'Golden Gate Bridge', resolved: true, resolvedAt: new Date('2026-03-13'), aiAnalysis: 'Thermal updraft from bridge surface. Normal in afternoon conditions.' },
      { droneId: 7, type: 'performance', severity: 'warning', description: 'Camera resolution degraded - possible lens condensation', location: 'Mapping Station', resolved: false, aiAnalysis: 'Humidity-related condensation. Recommend pre-flight heating protocol.' },
      { droneId: 4, type: 'environmental', severity: 'critical', description: 'Bird strike during emergency response flight', location: 'Highway 101', resolved: true, resolvedAt: new Date('2026-03-17'), aiAnalysis: 'Propeller 2 damaged by bird strike. Drone returned safely on 3 motors.', actionTaken: 'Propeller replaced, bird deterrent system upgraded' },
      { droneId: 14, type: 'equipment', severity: 'info', description: 'Compass calibration drift detected', location: 'Survey Depot North', resolved: true, resolvedAt: new Date('2026-03-12'), aiAnalysis: 'Magnetic interference from nearby equipment. Recalibration successful.', actionTaken: 'Compass recalibrated' },
      { droneId: 8, type: 'structural', severity: 'warning', description: 'Propeller blade edge erosion detected', location: 'Survey Base Camp', resolved: false, aiAnalysis: 'Sand/dust erosion from coastal surveys. Replace props within 10 flight hours.' },
      { droneId: 13, type: 'behavioral', severity: 'warning', description: 'Return-to-home triggered unexpectedly', location: 'Logistics Center', resolved: true, resolvedAt: new Date('2026-03-11'), aiAnalysis: 'Low battery warning triggered prematurely due to cold weather.', actionTaken: 'Battery cold-weather threshold adjusted' },
      { droneId: 6, type: 'security', severity: 'critical', description: 'Unauthorized access attempt on telemetry link', location: 'Airspace Sector 7', resolved: true, resolvedAt: new Date('2026-03-09'), aiAnalysis: 'Attempted telemetry hijacking detected. Encryption upgraded.', actionTaken: 'AES-256 encryption enabled, incident reported to FAA' },
      { droneId: 11, type: 'performance', severity: 'info', description: 'Gimbal vibration slightly above baseline', location: 'Media Hub', resolved: false, aiAnalysis: 'Minor gimbal damper wear. Schedule replacement in next maintenance.' }
    ]);
    console.log('Anomalies seeded.');

    // Compliance (15+)
    await Compliance.bulkCreate([
      { regulation: 'FAA Part 107 Remote Pilot Certificate', category: 'FAA', status: 'compliant', description: 'All operators certified under FAA Part 107', expirationDate: new Date('2027-06-15'), lastAuditDate: new Date('2026-01-15'), nextAuditDate: new Date('2026-07-15'), responsiblePerson: 'John Operator' },
      { regulation: 'FAA Airspace Authorization', category: 'FAA', status: 'compliant', description: 'LAANC authorization for controlled airspace operations', expirationDate: new Date('2026-12-31'), lastAuditDate: new Date('2026-02-01'), nextAuditDate: new Date('2026-08-01'), responsiblePerson: 'Admin User' },
      { regulation: 'California Privacy Act Compliance', category: 'privacy', status: 'compliant', description: 'Surveillance data handling per CCPA requirements', lastAuditDate: new Date('2026-01-10'), nextAuditDate: new Date('2026-07-10'), responsiblePerson: 'Jane Viewer' },
      { regulation: 'Local Noise Ordinance - SF', category: 'local', status: 'compliant', description: 'Drone noise levels within city limits compliance', lastAuditDate: new Date('2026-02-20'), nextAuditDate: new Date('2026-08-20'), responsiblePerson: 'John Operator' },
      { regulation: 'FAA Night Operations Waiver', category: 'FAA', status: 'compliant', description: 'Approved waiver for nighttime surveillance operations', expirationDate: new Date('2026-09-30'), lastAuditDate: new Date('2026-01-05'), nextAuditDate: new Date('2026-07-05'), responsiblePerson: 'Admin User' },
      { regulation: 'State Agricultural Spraying Permit', category: 'state', status: 'compliant', description: 'California Dept of Pesticide Regulation compliance', expirationDate: new Date('2026-12-31'), lastAuditDate: new Date('2026-03-01'), nextAuditDate: new Date('2026-09-01'), responsiblePerson: 'John Operator' },
      { regulation: 'OSHA Safety Standards', category: 'safety', status: 'compliant', description: 'Workplace safety compliance for drone operations', lastAuditDate: new Date('2026-02-15'), nextAuditDate: new Date('2026-08-15'), responsiblePerson: 'Admin User' },
      { regulation: 'EPA Environmental Compliance', category: 'environmental', status: 'pending-review', description: 'Environmental impact assessment for coastal operations', lastAuditDate: new Date('2025-12-01'), nextAuditDate: new Date('2026-06-01'), responsiblePerson: 'Jane Viewer', notes: 'Awaiting updated EIA for expanded coastal survey area' },
      { regulation: 'FAA Beyond Visual Line of Sight', category: 'FAA', status: 'waiver', description: 'BVLOS waiver for pipeline inspection routes', expirationDate: new Date('2026-08-15'), lastAuditDate: new Date('2026-01-20'), nextAuditDate: new Date('2026-07-20'), responsiblePerson: 'Admin User' },
      { regulation: 'Local Flight Restrictions - Oakland', category: 'local', status: 'compliant', description: 'Port of Oakland restricted zone authorization', expirationDate: new Date('2026-11-30'), lastAuditDate: new Date('2026-02-28'), nextAuditDate: new Date('2026-08-28'), responsiblePerson: 'John Operator' },
      { regulation: 'Data Retention Policy', category: 'privacy', status: 'compliant', description: 'Surveillance footage retention and deletion schedules', lastAuditDate: new Date('2026-03-05'), nextAuditDate: new Date('2026-09-05'), responsiblePerson: 'Jane Viewer' },
      { regulation: 'International Aviation Standards', category: 'international', status: 'non-compliant', description: 'ICAO compliance for cross-border operations', lastAuditDate: new Date('2025-11-15'), nextAuditDate: new Date('2026-05-15'), responsiblePerson: 'Admin User', notes: 'Awaiting international certifications for 3 drones' },
      { regulation: 'Fire Safety Protocol', category: 'safety', status: 'compliant', description: 'Battery storage and charging safety compliance', lastAuditDate: new Date('2026-02-10'), nextAuditDate: new Date('2026-08-10'), responsiblePerson: 'John Operator' },
      { regulation: 'State Delivery License', category: 'state', status: 'compliant', description: 'California drone delivery operations license', expirationDate: new Date('2027-01-31'), lastAuditDate: new Date('2026-01-31'), nextAuditDate: new Date('2026-07-31'), responsiblePerson: 'Admin User' },
      { regulation: 'Wildlife Disturbance Regulations', category: 'environmental', status: 'compliant', description: 'Protected species buffer zone compliance', lastAuditDate: new Date('2026-02-25'), nextAuditDate: new Date('2026-08-25'), responsiblePerson: 'Jane Viewer' },
      { regulation: 'FAA Drone Registration', category: 'FAA', status: 'compliant', description: 'All 16 drones registered with FAA', expirationDate: new Date('2027-03-01'), lastAuditDate: new Date('2026-03-01'), nextAuditDate: new Date('2027-03-01'), responsiblePerson: 'Admin User' }
    ]);
    console.log('Compliance seeded.');

    // Clients (15+)
    await Client.bulkCreate([
      { companyName: 'CalTrans', contactName: 'Michael Rivera', email: 'mrivera@caltrans.ca.gov', phone: '916-555-0101', address: '1120 N St, Sacramento, CA', industry: 'government', contractValue: 120000, status: 'active', servicesPurchased: ['inspection', 'mapping', 'surveillance'] },
      { companyName: 'PG&E', contactName: 'Jennifer Walsh', email: 'jwalsh@pge.com', phone: '415-555-0202', address: '77 Beale St, SF, CA', industry: 'energy', contractValue: 250000, status: 'active', servicesPurchased: ['inspection', 'surveillance'] },
      { companyName: 'Chevron Corp', contactName: 'David Park', email: 'dpark@chevron.com', phone: '925-555-0303', address: '6001 Bollinger Canyon Rd, San Ramon, CA', industry: 'energy', contractValue: 180000, status: 'active', servicesPurchased: ['inspection', 'surveillance', 'mapping'] },
      { companyName: 'Robert Mondavi Winery', contactName: 'Sofia Torres', email: 'storres@mondavi.com', phone: '707-555-0404', address: '7801 St Helena Hwy, Oakville, CA', industry: 'agriculture', contractValue: 45000, status: 'active', servicesPurchased: ['agriculture', 'mapping'] },
      { companyName: 'Tesla Inc', contactName: 'Ryan Kim', email: 'rkim@tesla.com', phone: '510-555-0505', address: '45500 Fremont Blvd, Fremont, CA', industry: 'construction', contractValue: 85000, status: 'active', servicesPurchased: ['surveillance', 'delivery'] },
      { companyName: 'Stanford University', contactName: 'Dr. Amanda Chen', email: 'achen@stanford.edu', phone: '650-555-0606', address: '450 Serra Mall, Stanford, CA', industry: 'real-estate', contractValue: 65000, status: 'active', servicesPurchased: ['inspection', 'mapping', 'surveillance'] },
      { companyName: 'Salesforce Inc', contactName: 'Mark Johnson', email: 'mjohnson@salesforce.com', phone: '415-555-0707', address: '415 Mission St, SF, CA', industry: 'real-estate', contractValue: 35000, status: 'active', servicesPurchased: ['inspection'] },
      { companyName: 'Dole Fresh Farms', contactName: 'Carlos Mendez', email: 'cmendez@dole.com', phone: '831-555-0808', address: '100 Produce Row, Salinas, CA', industry: 'agriculture', contractValue: 92000, status: 'active', servicesPurchased: ['agriculture', 'mapping'] },
      { companyName: 'Port of Oakland', contactName: 'Lisa Chang', email: 'lchang@portofoakland.com', phone: '510-555-0909', address: '530 Water St, Oakland, CA', industry: 'government', contractValue: 150000, status: 'active', servicesPurchased: ['surveillance', 'inspection'] },
      { companyName: 'SFO International', contactName: 'James Patterson', email: 'jpatterson@flysfo.com', phone: '650-555-1010', address: 'SFO, San Francisco, CA', industry: 'government', contractValue: 200000, status: 'active', servicesPurchased: ['inspection', 'surveillance', 'mapping'] },
      { companyName: 'NextEra Energy', contactName: 'Sarah Martinez', email: 'smartinez@nextera.com', phone: '925-555-1111', address: '1000 Altamont Pass Rd, Livermore, CA', industry: 'energy', contractValue: 110000, status: 'active', servicesPurchased: ['inspection', 'surveillance'] },
      { companyName: 'Meta Platforms', contactName: 'Kevin O Brien', email: 'kobrien@meta.com', phone: '650-555-1212', address: '1 Hacker Way, Menlo Park, CA', industry: 'real-estate', contractValue: 55000, status: 'active', servicesPurchased: ['inspection', 'surveillance'] },
      { companyName: 'Harris Ranch', contactName: 'Bob Harris', email: 'bharris@harrisranch.com', phone: '559-555-1313', address: '24505 W Dorris Ave, Coalinga, CA', industry: 'agriculture', contractValue: 78000, status: 'active', servicesPurchased: ['agriculture', 'mapping'] },
      { companyName: 'Marin Fire Department', contactName: 'Chief Tom Bradley', email: 'tbradley@marincounty.gov', phone: '415-555-1414', address: '200 Marin County Civic Center, San Rafael, CA', industry: 'government', contractValue: 95000, status: 'active', servicesPurchased: ['surveillance', 'emergency'] },
      { companyName: 'Apple Inc', contactName: 'Diana Lee', email: 'dlee@apple.com', phone: '408-555-1515', address: 'One Apple Park Way, Cupertino, CA', industry: 'real-estate', contractValue: 42000, status: 'inactive', servicesPurchased: ['inspection'] },
      { companyName: 'Morning Star Farms', contactName: 'Greg Thompson', email: 'gthompson@morningstar.com', phone: '530-555-1616', address: '720 Main St, Woodland, CA', industry: 'agriculture', contractValue: 58000, status: 'prospect', servicesPurchased: ['agriculture'] }
    ]);
    console.log('Clients seeded.');

    // Invoices (15+)
    await Invoice.bulkCreate([
      { invoiceNumber: 'INV-2026-001', clientId: 1, amount: 4500, tax: 405, totalAmount: 4905, status: 'paid', issueDate: new Date('2026-02-01'), dueDate: new Date('2026-03-01'), paidDate: new Date('2026-02-25'), services: [{service: 'Bridge Inspection', flights: 3, rate: 450}] },
      { invoiceNumber: 'INV-2026-002', clientId: 2, amount: 8500, tax: 765, totalAmount: 9265, status: 'paid', issueDate: new Date('2026-02-15'), dueDate: new Date('2026-03-15'), paidDate: new Date('2026-03-10'), services: [{service: 'Power Line Inspection', flights: 12, rate: 320}] },
      { invoiceNumber: 'INV-2026-003', clientId: 3, amount: 6200, tax: 558, totalAmount: 6758, status: 'sent', issueDate: new Date('2026-03-01'), dueDate: new Date('2026-04-01'), services: [{service: 'Pipeline Inspection', flights: 8, rate: 380}] },
      { invoiceNumber: 'INV-2026-004', clientId: 4, amount: 3800, tax: 342, totalAmount: 4142, status: 'paid', issueDate: new Date('2026-02-10'), dueDate: new Date('2026-03-10'), paidDate: new Date('2026-03-05'), services: [{service: 'Crop Monitoring', flights: 6, rate: 280}] },
      { invoiceNumber: 'INV-2026-005', clientId: 5, amount: 12000, tax: 1080, totalAmount: 13080, status: 'sent', issueDate: new Date('2026-03-05'), dueDate: new Date('2026-04-05'), services: [{service: 'Perimeter Surveillance', flights: 30, rate: 400}] },
      { invoiceNumber: 'INV-2026-006', clientId: 6, amount: 5200, tax: 468, totalAmount: 5668, status: 'paid', issueDate: new Date('2026-01-20'), dueDate: new Date('2026-02-20'), paidDate: new Date('2026-02-18'), services: [{service: 'Campus Inspection', flights: 8, rate: 300}] },
      { invoiceNumber: 'INV-2026-007', clientId: 9, amount: 15000, tax: 1350, totalAmount: 16350, status: 'overdue', issueDate: new Date('2026-02-01'), dueDate: new Date('2026-03-01'), services: [{service: 'Port Surveillance', flights: 40, rate: 350}] },
      { invoiceNumber: 'INV-2026-008', clientId: 10, amount: 18500, tax: 1665, totalAmount: 20165, status: 'sent', issueDate: new Date('2026-03-10'), dueDate: new Date('2026-04-10'), services: [{service: 'Airport Inspection', flights: 15, rate: 600}] },
      { invoiceNumber: 'INV-2026-009', clientId: 8, amount: 7500, tax: 675, totalAmount: 8175, status: 'paid', issueDate: new Date('2026-02-20'), dueDate: new Date('2026-03-20'), paidDate: new Date('2026-03-15'), services: [{service: 'Agricultural Spraying', flights: 10, rate: 750}] },
      { invoiceNumber: 'INV-2026-010', clientId: 11, amount: 9200, tax: 828, totalAmount: 10028, status: 'sent', issueDate: new Date('2026-03-12'), dueDate: new Date('2026-04-12'), services: [{service: 'Wind Turbine Inspection', flights: 12, rate: 420}] },
      { invoiceNumber: 'INV-2026-011', clientId: 12, amount: 4800, tax: 432, totalAmount: 5232, status: 'paid', issueDate: new Date('2026-01-15'), dueDate: new Date('2026-02-15'), paidDate: new Date('2026-02-10'), services: [{service: 'Building Inspection', flights: 4, rate: 520}] },
      { invoiceNumber: 'INV-2026-012', clientId: 14, amount: 11000, tax: 990, totalAmount: 11990, status: 'paid', issueDate: new Date('2026-02-05'), dueDate: new Date('2026-03-05'), paidDate: new Date('2026-03-01'), services: [{service: 'Wildfire Surveillance', flights: 25, rate: 280}] },
      { invoiceNumber: 'INV-2026-013', clientId: 13, amount: 6800, tax: 612, totalAmount: 7412, status: 'sent', issueDate: new Date('2026-03-15'), dueDate: new Date('2026-04-15'), services: [{service: 'Livestock Survey', flights: 10, rate: 340}] },
      { invoiceNumber: 'INV-2026-014', clientId: 7, amount: 2500, tax: 225, totalAmount: 2725, status: 'draft', issueDate: new Date('2026-03-18'), dueDate: new Date('2026-04-18'), services: [{service: 'Building Facade Scan', flights: 2, rate: 500}] },
      { invoiceNumber: 'INV-2026-015', clientId: 1, amount: 5600, tax: 504, totalAmount: 6104, status: 'sent', issueDate: new Date('2026-03-16'), dueDate: new Date('2026-04-16'), services: [{service: 'Traffic Monitoring', flights: 14, rate: 320}] },
      { invoiceNumber: 'INV-2026-016', clientId: 15, amount: 2100, tax: 189, totalAmount: 2289, status: 'cancelled', issueDate: new Date('2026-01-10'), dueDate: new Date('2026-02-10'), services: [{service: 'Roof Inspection', flights: 3, rate: 500}], notes: 'Contract paused - client inactive' }
    ]);
    console.log('Invoices seeded.');

    // Analytics (15+)
    await Analytics.bulkCreate([
      { metric: 'Total Flights Completed', category: 'flights', value: 1247, unit: 'flights', period: 'Q1 2026', date: new Date('2026-03-18'), trend: 'up', notes: '15% increase from Q4 2025' },
      { metric: 'Average Flight Duration', category: 'flights', value: 42.5, unit: 'minutes', period: 'March 2026', date: new Date('2026-03-18'), trend: 'stable' },
      { metric: 'Monthly Revenue', category: 'revenue', value: 125000, unit: 'USD', period: 'March 2026', date: new Date('2026-03-18'), trend: 'up', notes: 'New enterprise clients onboarded' },
      { metric: 'Revenue Per Flight', category: 'revenue', value: 285, unit: 'USD', period: 'March 2026', date: new Date('2026-03-18'), trend: 'up' },
      { metric: 'Fleet Utilization Rate', category: 'utilization', value: 78.5, unit: '%', period: 'March 2026', date: new Date('2026-03-18'), trend: 'up' },
      { metric: 'Drone Availability', category: 'utilization', value: 81.3, unit: '%', period: 'March 2026', date: new Date('2026-03-18'), trend: 'stable' },
      { metric: 'Mission Success Rate', category: 'efficiency', value: 96.8, unit: '%', period: 'Q1 2026', date: new Date('2026-03-18'), trend: 'up' },
      { metric: 'Average Delivery Time', category: 'efficiency', value: 18.2, unit: 'minutes', period: 'March 2026', date: new Date('2026-03-18'), trend: 'down', notes: 'Route optimization AI improved delivery times' },
      { metric: 'Safety Incidents', category: 'safety', value: 2, unit: 'incidents', period: 'Q1 2026', date: new Date('2026-03-18'), trend: 'down', notes: 'Lowest incident rate in company history' },
      { metric: 'Near-Miss Events', category: 'safety', value: 5, unit: 'events', period: 'Q1 2026', date: new Date('2026-03-18'), trend: 'down' },
      { metric: 'Maintenance Cost Ratio', category: 'maintenance', value: 8.5, unit: '%', period: 'March 2026', date: new Date('2026-03-18'), trend: 'stable', notes: 'Maintenance costs as % of revenue' },
      { metric: 'Preventive Maintenance Rate', category: 'maintenance', value: 92, unit: '%', period: 'Q1 2026', date: new Date('2026-03-18'), trend: 'up' },
      { metric: 'Customer Satisfaction Score', category: 'efficiency', value: 4.7, unit: '/5', period: 'Q1 2026', date: new Date('2026-03-18'), trend: 'up' },
      { metric: 'Inspection Accuracy', category: 'efficiency', value: 98.2, unit: '%', period: 'Q1 2026', date: new Date('2026-03-18'), trend: 'up', notes: 'AI-enhanced defect detection' },
      { metric: 'Battery Cycle Efficiency', category: 'utilization', value: 85.7, unit: '%', period: 'March 2026', date: new Date('2026-03-18'), trend: 'stable' },
      { metric: 'Quarterly Revenue Growth', category: 'revenue', value: 22.5, unit: '%', period: 'Q1 2026', date: new Date('2026-03-18'), trend: 'up', notes: 'YoY growth driven by agriculture expansion' }
    ]);
    console.log('Analytics seeded.');

    // Flight Analysis (15+)
    await FlightAnalysis.bulkCreate([
      { flightPlanId: 1, droneId: 1, analysisType: 'safety', aiModel: 'claude-haiku', summary: 'Bridge inspection flight rated SAFE with minor wind considerations', score: 92, recommendations: ['Monitor wind at tower level', 'Use obstacle avoidance mode'] },
      { flightPlanId: 2, droneId: 5, analysisType: 'efficiency', aiModel: 'claude-haiku', summary: 'Agricultural survey route optimized for 15% battery savings', score: 88, recommendations: ['Reduce altitude to 40m for better imaging', 'Use zigzag pattern'] },
      { flightPlanId: 3, droneId: 12, analysisType: 'risk', aiModel: 'claude-haiku', summary: 'Urban delivery route moderate risk due to building density', score: 75, recommendations: ['Maintain 50m clearance from buildings', 'Have manual override ready'] },
      { flightPlanId: 4, droneId: 2, analysisType: 'performance', aiModel: 'claude-haiku', summary: 'Pipeline patrol performance within optimal parameters', score: 90, recommendations: ['Thermal camera calibration optimal', 'Consistent speed recommended'] },
      { flightPlanId: 5, droneId: 7, analysisType: 'optimization', aiModel: 'claude-haiku', summary: 'Solar farm scan route can be optimized with parallel passes', score: 85, recommendations: ['Switch to parallel pass pattern', 'Increase overlap to 80%'] },
      { flightPlanId: 6, droneId: 16, analysisType: 'safety', aiModel: 'claude-haiku', summary: 'Night surveillance flight meets all safety requirements', score: 95, recommendations: ['Anti-collision lights active', 'Thermal camera primary sensor'] },
      { flightPlanId: 7, droneId: 4, analysisType: 'risk', aiModel: 'claude-haiku', summary: 'Emergency response flight HIGH priority - expedited clearance', score: 98, recommendations: ['Direct route approved', 'All traffic yielding'] },
      { flightPlanId: 8, droneId: 8, analysisType: 'efficiency', aiModel: 'claude-haiku', summary: 'Coastal survey requires multiple battery swaps - plan accordingly', score: 72, recommendations: ['Pre-position 3 battery sets', 'Use waypoint resume feature'] },
      { flightPlanId: 9, droneId: 9, analysisType: 'performance', aiModel: 'claude-haiku', summary: 'Wind turbine inspection flight parameters validated', score: 87, recommendations: ['Maintain 10m standoff distance', 'Use slow-motion capture at joints'] },
      { flightPlanId: 10, droneId: 11, analysisType: 'safety', aiModel: 'claude-haiku', summary: 'Indoor warehouse flight requires special precautions', score: 78, recommendations: ['GPS-denied navigation mode', 'Reduced speed indoor protocol'] },
      { flightPlanId: 11, droneId: 14, analysisType: 'optimization', aiModel: 'claude-haiku', summary: 'River monitoring route can be streamlined by 20%', score: 83, recommendations: ['Follow river path directly', 'Reduce unnecessary waypoints'] },
      { flightPlanId: 12, droneId: 1, analysisType: 'predictive', aiModel: 'claude-haiku', summary: 'Construction documentation flight conditions favorable next 3 days', score: 90, recommendations: ['Best window: 10AM-2PM', 'Clear skies predicted'] },
      { flightPlanId: 13, droneId: 2, analysisType: 'risk', aiModel: 'claude-haiku', summary: 'Wildfire watch patrol HIGH RISK - extreme caution required', score: 65, recommendations: ['Maintain 500m from active fires', 'Real-time wind monitoring', 'Auto-RTH at 40% battery'] },
      { flightPlanId: 14, droneId: 9, analysisType: 'performance', aiModel: 'claude-haiku', summary: 'Power line inspection optimal with current sensor loadout', score: 91, recommendations: ['LiDAR + thermal dual capture', 'Maintain constant speed'] },
      { flightPlanId: 15, droneId: 5, analysisType: 'efficiency', aiModel: 'claude-haiku', summary: 'Agricultural spraying route optimized for minimal chemical waste', score: 94, recommendations: ['Variable rate spraying active', 'Wind-compensated nozzle control'] }
    ]);
    console.log('Flight Analysis seeded.');

    console.log('\n✅ All data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
