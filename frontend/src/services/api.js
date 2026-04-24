import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const createService = (endpoint) => ({
  getAll: () => api.get(`/${endpoint}`),
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

export default api;
