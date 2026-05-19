import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

/**
 * Creates a service object for a CRUD endpoint.
 * All getAll() calls now support pagination via ?page=N&limit=N.
 */
export const createService = (endpoint) => ({
  getAll: (page = 1, limit = 20) => api.get(`/${endpoint}?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/${endpoint}/${id}`),
  create: (data) => api.post(`/${endpoint}`, data),
  update: (id, data) => api.put(`/${endpoint}/${id}`, data),
  delete: (id) => api.delete(`/${endpoint}/${id}`),
  analyze: (id) => api.post(`/${endpoint}/${id}/analyze`),
});

export const droneService = createService('drones');
export const flightPlanService = createService('flight-plans');
export const missionService = createService('missions');
export const inspectionService = createService('inspections');
export const deliveryService = createService('deliveries');
export const agricultureService = createService('agriculture');
export const surveillanceService = createService('surveillance');
export const maintenanceService = createService('maintenance');
export const weatherService = createService('weather');
export const routeService = createService('routes');
export const anomalyService = createService('anomalies');
export const complianceService = createService('compliance');
export const clientService = createService('clients');
export const invoiceService = createService('invoices');
export const analyticsService = createService('analytics');
export const flightAnalysisService = createService('flight-analysis');
export const pilotService = createService('pilots');
export const batteryService = createService('batteries');
export const inventoryService = createService('inventory');
export const incidentService = createService('incidents');
export const checklistService = createService('checklists');
export const documentService = createService('documents');
export const geofenceService = createService('geofences');
export const equipmentService = createService('equipment');
export const projectService = createService('projects');
export const auditLogService = createService('audit-logs');
export const notificationService = createService('notifications');
export const landingZoneService = createService('landing-zones');
export const trainingService = createService('training');
export const insuranceService = createService('insurance');
export const contractService = createService('contracts');
export const expenseService = createService('expenses');
export const shiftService = createService('shifts');
export const emergencyProtocolService = createService('emergency-protocols');
export const communicationLogService = createService('communication-logs');
export const groundStationService = createService('ground-stations');

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

// ── Telemetry / real-time fleet tracking ─────────────────────────────────
export const telemetryService = {
  push: (droneId, point) => api.post(`/drones/${droneId}/telemetry`, point),
  history: (droneId) => api.get(`/drones/${droneId}/telemetry/history`),
};

// ── Geofence enforcement check ───────────────────────────────────────────
export const geofenceCheckService = {
  check: (droneId, point) => api.post(`/drones/${droneId}/check-geofence`, point),
};

// ── Mission Logs (after-mission AI report generation) ────────────────────
export const missionLogService = {
  getAll: (page = 1, limit = 20) => api.get(`/mission-logs?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/mission-logs/${id}`),
  create: (data) => api.post('/mission-logs', data),
};

// ── AI Results history ────────────────────────────────────────────────────
export const aiResultsService = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.entityType && { entityType: params.entityType }),
      ...(params.entityId && { entityId: params.entityId }),
      ...(params.riskLevel && { riskLevel: params.riskLevel }),
    }).toString();
    return api.get(`/ai-results?${qs}`);
  },
  getById: (id) => api.get(`/ai-results/${id}`),
};

// ── Operational alerts ────────────────────────────────────────────────────
export const alertsService = {
  batteries: () => api.get('/alerts/batteries'),
  lowStock: () => api.get('/alerts/low-stock'),
  expiringLicenses: (days = 30) => api.get(`/alerts/expiring-licenses?days=${days}`),
  summary: () => api.get('/alerts/summary'),
};

// ── AI streaming SSE for mission analysis ────────────────────────────────
export const aiStream = {
  missionStreamUrl: (missionId) => {
    const token = localStorage.getItem('token');
    return { url: `${API_BASE}/ai/analyze/stream?missionId=${missionId}`, token };
  },
};

// ── Autonomous flight AI features ─────────────────────────────────────────
export const aiAutonomyService = {
  missionPlanner: (data) => api.post('/ai/mission-planner', data),
  obstacleAvoidance: (data) => api.post('/ai/obstacle-avoidance', data),
  swarmCoordination: (data) => api.post('/ai/swarm-coordination', data),
  geofenceOptimize: (data) => api.post('/ai/geofence-optimize', data),
  telemetryAnomaly: (data) => api.post('/ai/telemetry-anomaly', data),
};

export default api;
