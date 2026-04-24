import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import * as api from '../services/api';

const featureConfig = {
  'drones': {
    title: 'Fleet Management',
    subtitle: 'Monitor and manage your drone fleet',
    icon: 'fas fa-helicopter',
    service: 'droneService',
    columns: ['name', 'model', 'status', 'batteryLevel', 'currentLocation', 'totalFlightHours'],
    columnLabels: ['Name', 'Model', 'Status', 'Battery', 'Location', 'Flight Hours'],
    fields: [
      { name: 'name', label: 'Drone Name', type: 'text', required: true },
      { name: 'model', label: 'Model', type: 'text', required: true },
      { name: 'serialNumber', label: 'Serial Number', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'maintenance', 'retired', 'standby'] },
      { name: 'batteryLevel', label: 'Battery Level (%)', type: 'number' },
      { name: 'maxFlightTime', label: 'Max Flight Time (min)', type: 'number' },
      { name: 'maxPayload', label: 'Max Payload (kg)', type: 'number' },
      { name: 'currentLocation', label: 'Current Location', type: 'text' },
      { name: 'firmwareVersion', label: 'Firmware Version', type: 'text' },
    ],
    formatCell: (col, val) => {
      if (col === 'batteryLevel') return `${val}%`;
      if (col === 'totalFlightHours') return `${val}h`;
      return val;
    },
    hasAI: false,
  },
  'flight-plans': {
    title: 'Flight Planning',
    subtitle: 'Plan and schedule drone flights',
    icon: 'fas fa-route',
    service: 'flightPlanService',
    columns: ['name', 'origin', 'destination', 'status', 'priority', 'scheduledDate'],
    columnLabels: ['Name', 'Origin', 'Destination', 'Status', 'Priority', 'Scheduled'],
    fields: [
      { name: 'name', label: 'Plan Name', type: 'text', required: true },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'origin', label: 'Origin', type: 'text', required: true },
      { name: 'destination', label: 'Destination', type: 'text', required: true },
      { name: 'altitude', label: 'Altitude (m)', type: 'number' },
      { name: 'speed', label: 'Speed (m/s)', type: 'number' },
      { name: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
      { name: 'estimatedDuration', label: 'Duration (min)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['planned', 'in-progress', 'completed', 'cancelled'] },
      { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: true,
  },
  'missions': {
    title: 'Mission Control',
    subtitle: 'Monitor and manage active missions',
    icon: 'fas fa-crosshairs',
    service: 'missionService',
    columns: ['name', 'type', 'status', 'progress', 'area', 'startTime'],
    columnLabels: ['Name', 'Type', 'Status', 'Progress', 'Area', 'Start Time'],
    fields: [
      { name: 'name', label: 'Mission Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['inspection', 'delivery', 'agriculture', 'surveillance', 'mapping', 'emergency'], required: true },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'active', 'completed', 'aborted', 'paused'] },
      { name: 'area', label: 'Area', type: 'text' },
      { name: 'startTime', label: 'Start Time', type: 'datetime-local' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'progress') return `${val}%`;
      if (col === 'startTime' && val) return new Date(val).toLocaleString();
      return val;
    },
    hasAI: true,
  },
  'inspections': {
    title: 'Inspection Services',
    subtitle: 'Infrastructure and facility inspections',
    icon: 'fas fa-search-plus',
    service: 'inspectionService',
    columns: ['name', 'type', 'location', 'status', 'severity', 'clientName'],
    columnLabels: ['Name', 'Type', 'Location', 'Status', 'Severity', 'Client'],
    fields: [
      { name: 'name', label: 'Inspection Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['infrastructure', 'pipeline', 'powerline', 'bridge', 'building', 'solar-panel', 'wind-turbine'], required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in-progress', 'completed', 'review'] },
      { name: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
      { name: 'severity', label: 'Severity', type: 'select', options: ['none', 'low', 'medium', 'high', 'critical'] },
      { name: 'clientName', label: 'Client Name', type: 'text' },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
      { name: 'findings', label: 'Findings', type: 'textarea' },
    ],
    hasAI: true,
  },
  'deliveries': {
    title: 'Delivery Management',
    subtitle: 'Track and manage drone deliveries',
    icon: 'fas fa-shipping-fast',
    service: 'deliveryService',
    columns: ['trackingNumber', 'packageDescription', 'status', 'priority', 'recipientName', 'cost'],
    columnLabels: ['Tracking #', 'Package', 'Status', 'Priority', 'Recipient', 'Cost'],
    fields: [
      { name: 'trackingNumber', label: 'Tracking Number', type: 'text', required: true },
      { name: 'packageDescription', label: 'Package Description', type: 'text', required: true },
      { name: 'weight', label: 'Weight (kg)', type: 'number' },
      { name: 'pickupAddress', label: 'Pickup Address', type: 'text', required: true },
      { name: 'deliveryAddress', label: 'Delivery Address', type: 'text', required: true },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'picked-up', 'in-transit', 'delivered', 'failed', 'returned'] },
      { name: 'recipientName', label: 'Recipient Name', type: 'text' },
      { name: 'recipientPhone', label: 'Recipient Phone', type: 'text' },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
      { name: 'priority', label: 'Priority', type: 'select', options: ['standard', 'express', 'urgent'] },
    ],
    formatCell: (col, val) => {
      if (col === 'cost') return `$${val}`;
      return val;
    },
    hasAI: true,
  },
  'agriculture': {
    title: 'Agriculture Operations',
    subtitle: 'Crop monitoring, spraying, and analysis',
    icon: 'fas fa-seedling',
    service: 'agricultureService',
    columns: ['name', 'type', 'farmName', 'cropType', 'status', 'coveragePercent'],
    columnLabels: ['Name', 'Type', 'Farm', 'Crop', 'Status', 'Coverage'],
    fields: [
      { name: 'name', label: 'Operation Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['crop-monitoring', 'spraying', 'seeding', 'soil-analysis', 'irrigation', 'health-assessment'], required: true },
      { name: 'farmName', label: 'Farm Name', type: 'text', required: true },
      { name: 'fieldArea', label: 'Field Area (acres)', type: 'number' },
      { name: 'cropType', label: 'Crop Type', type: 'text' },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['planned', 'in-progress', 'completed', 'cancelled'] },
      { name: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
      { name: 'chemicalUsed', label: 'Chemical Used', type: 'text' },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
      { name: 'findings', label: 'Findings', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'coveragePercent') return `${val}%`;
      return val;
    },
    hasAI: true,
  },
  'surveillance': {
    title: 'Surveillance & Security',
    subtitle: 'Security monitoring and patrol management',
    icon: 'fas fa-video',
    service: 'surveillanceService',
    columns: ['name', 'type', 'location', 'status', 'clientName', 'alertsGenerated'],
    columnLabels: ['Name', 'Type', 'Location', 'Status', 'Client', 'Alerts'],
    fields: [
      { name: 'name', label: 'Operation Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['perimeter', 'area', 'event', 'emergency', 'traffic', 'wildlife'], required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'active', 'completed', 'suspended'] },
      { name: 'startTime', label: 'Start Time', type: 'datetime-local' },
      { name: 'clientName', label: 'Client Name', type: 'text' },
      { name: 'isRecurring', label: 'Recurring', type: 'select', options: ['true', 'false'] },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
    ],
    hasAI: true,
  },
  'maintenance': {
    title: 'Maintenance & Repairs',
    subtitle: 'Drone maintenance tracking and scheduling',
    icon: 'fas fa-wrench',
    service: 'maintenanceService',
    columns: ['droneId', 'type', 'description', 'status', 'technicianName', 'cost'],
    columnLabels: ['Drone', 'Type', 'Description', 'Status', 'Technician', 'Cost'],
    fields: [
      { name: 'droneId', label: 'Drone ID', type: 'number', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['scheduled', 'repair', 'upgrade', 'calibration', 'battery-replacement', 'firmware-update'], required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'in-progress', 'completed', 'cancelled'] },
      { name: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
      { name: 'technicianName', label: 'Technician', type: 'text' },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
    ],
    formatCell: (col, val) => {
      if (col === 'cost') return `$${val}`;
      if (col === 'droneId') return `Drone #${val}`;
      return val;
    },
    hasAI: true,
  },
  'weather': {
    title: 'Weather Intelligence',
    subtitle: 'AI-powered weather assessment for flights',
    icon: 'fas fa-cloud-sun',
    service: 'weatherService',
    columns: ['location', 'condition', 'temperature', 'windSpeed', 'visibility', 'flyable'],
    columnLabels: ['Location', 'Condition', 'Temp (C)', 'Wind (km/h)', 'Visibility (km)', 'Flyable'],
    fields: [
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'temperature', label: 'Temperature (C)', type: 'number' },
      { name: 'humidity', label: 'Humidity (%)', type: 'number' },
      { name: 'windSpeed', label: 'Wind Speed (km/h)', type: 'number' },
      { name: 'windDirection', label: 'Wind Direction', type: 'text' },
      { name: 'visibility', label: 'Visibility (km)', type: 'number' },
      { name: 'precipitation', label: 'Precipitation (mm)', type: 'number' },
      { name: 'condition', label: 'Condition', type: 'text' },
      { name: 'flyable', label: 'Flyable', type: 'select', options: ['true', 'false'] },
    ],
    formatCell: (col, val) => {
      if (col === 'flyable') return val ? 'YES' : 'NO';
      if (col === 'temperature') return `${val}°C`;
      return val;
    },
    hasAI: true,
  },
  'routes': {
    title: 'Route Optimization',
    subtitle: 'AI-optimized flight routes',
    icon: 'fas fa-map-marked-alt',
    service: 'routeService',
    columns: ['name', 'origin', 'destination', 'distance', 'estimatedTime', 'aiScore'],
    columnLabels: ['Name', 'Origin', 'Destination', 'Distance (km)', 'Est. Time', 'AI Score'],
    fields: [
      { name: 'name', label: 'Route Name', type: 'text', required: true },
      { name: 'origin', label: 'Origin', type: 'text', required: true },
      { name: 'destination', label: 'Destination', type: 'text', required: true },
      { name: 'distance', label: 'Distance (km)', type: 'number' },
      { name: 'estimatedTime', label: 'Est. Time (min)', type: 'number' },
      { name: 'altitude', label: 'Altitude (m)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'archived'] },
    ],
    formatCell: (col, val) => {
      if (col === 'distance') return `${val} km`;
      if (col === 'estimatedTime') return `${val} min`;
      if (col === 'aiScore') return `${val}/100`;
      return val;
    },
    hasAI: true,
  },
  'anomalies': {
    title: 'Anomaly Detection',
    subtitle: 'AI-powered anomaly detection and diagnostics',
    icon: 'fas fa-exclamation-triangle',
    service: 'anomalyService',
    columns: ['droneId', 'type', 'severity', 'description', 'resolved', 'detectedAt'],
    columnLabels: ['Drone', 'Type', 'Severity', 'Description', 'Resolved', 'Detected'],
    fields: [
      { name: 'droneId', label: 'Drone ID', type: 'number', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['equipment', 'environmental', 'behavioral', 'performance', 'security', 'structural'], required: true },
      { name: 'severity', label: 'Severity', type: 'select', options: ['info', 'warning', 'critical', 'emergency'] },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'resolved', label: 'Resolved', type: 'select', options: ['true', 'false'] },
      { name: 'actionTaken', label: 'Action Taken', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'resolved') return val ? 'Yes' : 'No';
      if (col === 'droneId') return `Drone #${val}`;
      if (col === 'detectedAt') return val ? new Date(val).toLocaleString() : '-';
      if (col === 'description' && val?.length > 50) return val.substring(0, 50) + '...';
      return val;
    },
    hasAI: true,
  },
  'compliance': {
    title: 'Compliance & Regulations',
    subtitle: 'Regulatory compliance tracking',
    icon: 'fas fa-shield-alt',
    service: 'complianceService',
    columns: ['regulation', 'category', 'status', 'responsiblePerson', 'nextAuditDate'],
    columnLabels: ['Regulation', 'Category', 'Status', 'Responsible', 'Next Audit'],
    fields: [
      { name: 'regulation', label: 'Regulation', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['FAA', 'local', 'state', 'international', 'privacy', 'safety', 'environmental'], required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['compliant', 'non-compliant', 'pending-review', 'expired', 'waiver'] },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'expirationDate', label: 'Expiration Date', type: 'date' },
      { name: 'responsiblePerson', label: 'Responsible Person', type: 'text' },
      { name: 'nextAuditDate', label: 'Next Audit Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'nextAuditDate' && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: true,
  },
  'clients': {
    title: 'Client Management',
    subtitle: 'Manage clients and contracts',
    icon: 'fas fa-building',
    service: 'clientService',
    columns: ['companyName', 'contactName', 'industry', 'status', 'contractValue'],
    columnLabels: ['Company', 'Contact', 'Industry', 'Status', 'Contract Value'],
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'contactName', label: 'Contact Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'industry', label: 'Industry', type: 'select', options: ['construction', 'agriculture', 'energy', 'logistics', 'security', 'real-estate', 'government', 'mining'], required: true },
      { name: 'contractValue', label: 'Contract Value ($)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'prospect', 'churned'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'contractValue') return `$${val?.toLocaleString()}`;
      return val;
    },
    hasAI: true,
  },
  'invoices': {
    title: 'Billing & Invoicing',
    subtitle: 'Invoice and payment management',
    icon: 'fas fa-file-invoice-dollar',
    service: 'invoiceService',
    columns: ['invoiceNumber', 'clientId', 'totalAmount', 'status', 'issueDate', 'dueDate'],
    columnLabels: ['Invoice #', 'Client ID', 'Total', 'Status', 'Issued', 'Due'],
    fields: [
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { name: 'clientId', label: 'Client ID', type: 'number', required: true },
      { name: 'amount', label: 'Amount ($)', type: 'number', required: true },
      { name: 'tax', label: 'Tax ($)', type: 'number' },
      { name: 'totalAmount', label: 'Total ($)', type: 'number', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] },
      { name: 'issueDate', label: 'Issue Date', type: 'date' },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'totalAmount') return `$${val?.toLocaleString()}`;
      if (col === 'clientId') return `Client #${val}`;
      if ((col === 'issueDate' || col === 'dueDate') && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: true,
  },
  'analytics': {
    title: 'Operations Analytics',
    subtitle: 'KPIs, metrics, and operational insights',
    icon: 'fas fa-chart-line',
    service: 'analyticsService',
    columns: ['metric', 'category', 'value', 'unit', 'period', 'trend'],
    columnLabels: ['Metric', 'Category', 'Value', 'Unit', 'Period', 'Trend'],
    fields: [
      { name: 'metric', label: 'Metric Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['flights', 'revenue', 'efficiency', 'safety', 'maintenance', 'utilization'], required: true },
      { name: 'value', label: 'Value', type: 'number', required: true },
      { name: 'unit', label: 'Unit', type: 'text' },
      { name: 'period', label: 'Period', type: 'text' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'trend', label: 'Trend', type: 'select', options: ['up', 'down', 'stable'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: true,
  },
  'flight-analysis': {
    title: 'AI Flight Analysis',
    subtitle: 'AI-powered flight performance insights',
    icon: 'fas fa-brain',
    service: 'flightAnalysisService',
    columns: ['flightPlanId', 'droneId', 'analysisType', 'score', 'summary'],
    columnLabels: ['Flight Plan', 'Drone', 'Type', 'Score', 'Summary'],
    fields: [
      { name: 'flightPlanId', label: 'Flight Plan ID', type: 'number' },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'analysisType', label: 'Analysis Type', type: 'select', options: ['performance', 'safety', 'efficiency', 'risk', 'optimization', 'predictive'], required: true },
      { name: 'summary', label: 'Summary', type: 'textarea' },
      { name: 'score', label: 'Score', type: 'number' },
    ],
    formatCell: (col, val) => {
      if (col === 'flightPlanId') return `Flight #${val}`;
      if (col === 'droneId') return `Drone #${val}`;
      if (col === 'score') return `${val}/100`;
      if (col === 'summary' && val?.length > 60) return val.substring(0, 60) + '...';
      return val;
    },
    hasAI: true,
  },
  'pilots': {
    title: 'Pilot Management',
    subtitle: 'Manage pilots, licenses, and certifications',
    icon: 'fas fa-user-tie',
    service: 'pilotService',
    columns: ['firstName', 'lastName', 'licenseType', 'status', 'totalFlightHours', 'licenseExpiry'],
    columnLabels: ['First Name', 'Last Name', 'License', 'Status', 'Flight Hours', 'License Expiry'],
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'licenseNumber', label: 'License Number', type: 'text', required: true },
      { name: 'licenseType', label: 'License Type', type: 'select', options: ['Part107', 'Part61', 'recreational', 'commercial', 'military'], required: true },
      { name: 'licenseExpiry', label: 'License Expiry', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'suspended', 'training'] },
      { name: 'totalFlightHours', label: 'Total Flight Hours', type: 'number' },
      { name: 'rating', label: 'Rating (1-5)', type: 'number' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'emergencyContact', label: 'Emergency Contact', type: 'text' },
      { name: 'hireDate', label: 'Hire Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'totalFlightHours') return `${val}h`;
      if (col === 'licenseExpiry' && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: false,
  },
  'batteries': {
    title: 'Battery Management',
    subtitle: 'Track battery health, cycles, and charging',
    icon: 'fas fa-battery-three-quarters',
    service: 'batteryService',
    columns: ['serialNumber', 'model', 'currentCharge', 'healthPercent', 'cycleCount', 'status'],
    columnLabels: ['Serial #', 'Model', 'Charge', 'Health', 'Cycles', 'Status'],
    fields: [
      { name: 'serialNumber', label: 'Serial Number', type: 'text', required: true },
      { name: 'model', label: 'Model', type: 'text', required: true },
      { name: 'capacity', label: 'Capacity (mAh)', type: 'number', required: true },
      { name: 'voltage', label: 'Voltage (V)', type: 'number' },
      { name: 'currentCharge', label: 'Current Charge (%)', type: 'number' },
      { name: 'cycleCount', label: 'Cycle Count', type: 'number' },
      { name: 'maxCycles', label: 'Max Cycles', type: 'number' },
      { name: 'healthPercent', label: 'Health (%)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['available', 'in-use', 'charging', 'retired', 'damaged'] },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'currentCharge') return `${val}%`;
      if (col === 'healthPercent') return `${val}%`;
      return val;
    },
    hasAI: false,
  },
  'inventory': {
    title: 'Parts Inventory',
    subtitle: 'Spare parts, stock levels, and suppliers',
    icon: 'fas fa-boxes',
    service: 'inventoryService',
    columns: ['partName', 'partNumber', 'category', 'quantity', 'minimumStock', 'unitPrice'],
    columnLabels: ['Part Name', 'Part #', 'Category', 'Qty', 'Min Stock', 'Unit Price'],
    fields: [
      { name: 'partName', label: 'Part Name', type: 'text', required: true },
      { name: 'partNumber', label: 'Part Number', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['propeller', 'motor', 'battery', 'camera', 'sensor', 'frame', 'controller', 'gps', 'antenna', 'cable', 'other'], required: true },
      { name: 'quantity', label: 'Quantity', type: 'number' },
      { name: 'minimumStock', label: 'Minimum Stock', type: 'number' },
      { name: 'unitPrice', label: 'Unit Price ($)', type: 'number' },
      { name: 'supplier', label: 'Supplier', type: 'text' },
      { name: 'location', label: 'Storage Location', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'unitPrice') return `$${val}`;
      return val;
    },
    hasAI: false,
  },
  'incidents': {
    title: 'Incident Reports',
    subtitle: 'Safety incidents and investigations',
    icon: 'fas fa-car-crash',
    service: 'incidentService',
    columns: ['title', 'type', 'severity', 'status', 'date', 'reportedBy'],
    columnLabels: ['Title', 'Type', 'Severity', 'Status', 'Date', 'Reported By'],
    fields: [
      { name: 'title', label: 'Incident Title', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['crash', 'near-miss', 'equipment-failure', 'flyaway', 'injury', 'property-damage', 'airspace-violation', 'other'], required: true },
      { name: 'severity', label: 'Severity', type: 'select', options: ['minor', 'moderate', 'major', 'critical'], required: true },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'pilotId', label: 'Pilot ID', type: 'number' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'rootCause', label: 'Root Cause', type: 'textarea' },
      { name: 'correctiveAction', label: 'Corrective Action', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['reported', 'investigating', 'resolved', 'closed'] },
      { name: 'reportedBy', label: 'Reported By', type: 'text' },
      { name: 'damageEstimate', label: 'Damage Estimate ($)', type: 'number' },
      { name: 'faaReportFiled', label: 'FAA Report Filed', type: 'select', options: ['true', 'false'] },
    ],
    formatCell: (col, val) => {
      if (col === 'date' && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: false,
  },
  'checklists': {
    title: 'Checklists',
    subtitle: 'Pre-flight, post-flight, and safety checklists',
    icon: 'fas fa-clipboard-check',
    service: 'checklistService',
    columns: ['name', 'type', 'droneId', 'status', 'completedBy', 'passRate'],
    columnLabels: ['Name', 'Type', 'Drone', 'Status', 'Completed By', 'Pass Rate'],
    fields: [
      { name: 'name', label: 'Checklist Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['pre-flight', 'post-flight', 'maintenance', 'safety', 'emergency'], required: true },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'pilotId', label: 'Pilot ID', type: 'number' },
      { name: 'missionId', label: 'Mission ID', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'in-progress', 'completed', 'failed'] },
      { name: 'completedBy', label: 'Completed By', type: 'text' },
      { name: 'passRate', label: 'Pass Rate (%)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'passRate') return `${val}%`;
      if (col === 'droneId') return `Drone #${val}`;
      return val;
    },
    hasAI: false,
  },
  'documents': {
    title: 'Document Center',
    subtitle: 'Licenses, certificates, SOPs, and manuals',
    icon: 'fas fa-folder-open',
    service: 'documentService',
    columns: ['title', 'type', 'category', 'status', 'issuedBy', 'expiryDate'],
    columnLabels: ['Title', 'Type', 'Category', 'Status', 'Issued By', 'Expiry'],
    fields: [
      { name: 'title', label: 'Document Title', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['license', 'certificate', 'insurance', 'manual', 'sop', 'permit', 'waiver', 'report', 'contract', 'other'], required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['pilot', 'drone', 'company', 'client', 'regulatory', 'training'], required: true },
      { name: 'fileUrl', label: 'File URL', type: 'text' },
      { name: 'fileName', label: 'File Name', type: 'text' },
      { name: 'issueDate', label: 'Issue Date', type: 'date' },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { name: 'issuedBy', label: 'Issued By', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'expired', 'pending', 'revoked'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'expiryDate' && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: false,
  },
  'geofences': {
    title: 'Geofence Management',
    subtitle: 'No-fly zones, restricted areas, and boundaries',
    icon: 'fas fa-draw-polygon',
    service: 'geofenceService',
    columns: ['name', 'type', 'shape', 'status', 'authority', 'maxAltitude'],
    columnLabels: ['Name', 'Type', 'Shape', 'Status', 'Authority', 'Max Alt'],
    fields: [
      { name: 'name', label: 'Zone Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['no-fly', 'restricted', 'operational', 'emergency', 'temporary', 'permanent'], required: true },
      { name: 'shape', label: 'Shape', type: 'select', options: ['circle', 'polygon', 'corridor'] },
      { name: 'radius', label: 'Radius (m)', type: 'number' },
      { name: 'minAltitude', label: 'Min Altitude (m)', type: 'number' },
      { name: 'maxAltitude', label: 'Max Altitude (m)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'scheduled'] },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'reason', label: 'Reason', type: 'textarea' },
      { name: 'authority', label: 'Authority', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'maxAltitude') return `${val}m`;
      return val;
    },
    hasAI: false,
  },
  'equipment': {
    title: 'Payloads & Sensors',
    subtitle: 'Cameras, LiDAR, thermal, and sensor equipment',
    icon: 'fas fa-camera',
    service: 'equipmentService',
    columns: ['name', 'type', 'manufacturer', 'status', 'droneId', 'weight'],
    columnLabels: ['Name', 'Type', 'Manufacturer', 'Status', 'Drone', 'Weight'],
    fields: [
      { name: 'name', label: 'Equipment Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['camera', 'lidar', 'thermal', 'multispectral', 'gas-sensor', 'spotlight', 'speaker', 'gripper', 'sprayer', 'other'], required: true },
      { name: 'serialNumber', label: 'Serial Number', type: 'text' },
      { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'weight', label: 'Weight (kg)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['available', 'in-use', 'maintenance', 'retired'] },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'calibrationDate', label: 'Last Calibration', type: 'date' },
      { name: 'nextCalibrationDue', label: 'Next Calibration', type: 'date' },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { name: 'purchasePrice', label: 'Purchase Price ($)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'weight') return `${val}kg`;
      if (col === 'droneId') return val ? `Drone #${val}` : '-';
      return val;
    },
    hasAI: false,
  },
  'projects': {
    title: 'Project Management',
    subtitle: 'Group operations into managed projects',
    icon: 'fas fa-project-diagram',
    service: 'projectService',
    columns: ['name', 'status', 'priority', 'projectManager', 'budget', 'spent'],
    columnLabels: ['Name', 'Status', 'Priority', 'Manager', 'Budget', 'Spent'],
    fields: [
      { name: 'name', label: 'Project Name', type: 'text', required: true },
      { name: 'clientId', label: 'Client ID', type: 'number' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['planning', 'active', 'on-hold', 'completed', 'cancelled'] },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'budget', label: 'Budget ($)', type: 'number' },
      { name: 'spent', label: 'Spent ($)', type: 'number' },
      { name: 'projectManager', label: 'Project Manager', type: 'text' },
      { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'budget' || col === 'spent') return `$${val?.toLocaleString()}`;
      return val;
    },
    hasAI: false,
  },
  'audit-logs': {
    title: 'Audit Log',
    subtitle: 'Track all system actions and changes',
    icon: 'fas fa-history',
    service: 'auditLogService',
    columns: ['action', 'entityType', 'entityId', 'userName', 'createdAt'],
    columnLabels: ['Action', 'Entity', 'Entity ID', 'User', 'Timestamp'],
    fields: [
      { name: 'action', label: 'Action', type: 'select', options: ['create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject'], required: true },
      { name: 'entityType', label: 'Entity Type', type: 'text', required: true },
      { name: 'entityId', label: 'Entity ID', type: 'number' },
      { name: 'userName', label: 'User Name', type: 'text' },
      { name: 'ipAddress', label: 'IP Address', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'createdAt' && val) return new Date(val).toLocaleString();
      return val;
    },
    hasAI: false,
  },
  'notifications': {
    title: 'Notifications',
    subtitle: 'System alerts, reminders, and messages',
    icon: 'fas fa-bell',
    service: 'notificationService',
    columns: ['title', 'type', 'category', 'priority', 'read', 'createdAt'],
    columnLabels: ['Title', 'Type', 'Category', 'Priority', 'Read', 'Time'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['info', 'warning', 'error', 'success', 'alert'] },
      { name: 'category', label: 'Category', type: 'select', options: ['system', 'maintenance', 'flight', 'weather', 'compliance', 'safety', 'billing'] },
      { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
      { name: 'read', label: 'Read', type: 'select', options: ['true', 'false'] },
      { name: 'actionUrl', label: 'Action URL', type: 'text' },
    ],
    formatCell: (col, val) => {
      if (col === 'read') return val ? 'Read' : 'Unread';
      if (col === 'createdAt' && val) return new Date(val).toLocaleString();
      return val;
    },
    hasAI: false,
  },
  'landing-zones': {
    title: 'Landing Zones',
    subtitle: 'Manage takeoff and landing locations',
    icon: 'fas fa-map-pin',
    service: 'landingZoneService',
    columns: ['name', 'type', 'status', 'hasCharging', 'address', 'contactPerson'],
    columnLabels: ['Name', 'Type', 'Status', 'Charging', 'Address', 'Contact'],
    fields: [
      { name: 'name', label: 'Zone Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['helipad', 'rooftop', 'field', 'dock', 'mobile', 'emergency'], required: true },
      { name: 'latitude', label: 'Latitude', type: 'number', required: true },
      { name: 'longitude', label: 'Longitude', type: 'number', required: true },
      { name: 'elevation', label: 'Elevation (m)', type: 'number' },
      { name: 'surfaceType', label: 'Surface Type', type: 'text' },
      { name: 'size', label: 'Size', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'under-construction', 'temporary'] },
      { name: 'hasCharging', label: 'Has Charging', type: 'select', options: ['true', 'false'] },
      { name: 'maxDroneWeight', label: 'Max Drone Weight (kg)', type: 'number' },
      { name: 'operatingHours', label: 'Operating Hours', type: 'text' },
      { name: 'contactPerson', label: 'Contact Person', type: 'text' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'hasCharging') return val ? 'Yes' : 'No';
      return val;
    },
    hasAI: false,
  },
  'training': {
    title: 'Training Records',
    subtitle: 'Pilot training, courses, and certifications',
    icon: 'fas fa-graduation-cap',
    service: 'trainingService',
    columns: ['courseName', 'type', 'pilotId', 'status', 'score', 'completionDate'],
    columnLabels: ['Course', 'Type', 'Pilot', 'Status', 'Score', 'Completed'],
    fields: [
      { name: 'pilotId', label: 'Pilot ID', type: 'number' },
      { name: 'courseName', label: 'Course Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['initial', 'recurrent', 'specialized', 'emergency', 'equipment', 'regulatory', 'simulator'], required: true },
      { name: 'provider', label: 'Provider', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'completionDate', label: 'Completion Date', type: 'date' },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['enrolled', 'in-progress', 'completed', 'failed', 'expired'] },
      { name: 'score', label: 'Score', type: 'number' },
      { name: 'passingScore', label: 'Passing Score', type: 'number' },
      { name: 'hoursCompleted', label: 'Hours Completed', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'pilotId') return `Pilot #${val}`;
      if (col === 'score') return `${val}%`;
      if (col === 'completionDate' && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: false,
  },
  'insurance': {
    title: 'Insurance Policies',
    subtitle: 'Policies, coverage, claims, and renewals',
    icon: 'fas fa-file-contract',
    service: 'insuranceService',
    columns: ['policyNumber', 'type', 'provider', 'coverageAmount', 'status', 'endDate'],
    columnLabels: ['Policy #', 'Type', 'Provider', 'Coverage', 'Status', 'End Date'],
    fields: [
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['liability', 'hull', 'payload', 'comprehensive', 'workers-comp', 'umbrella'], required: true },
      { name: 'provider', label: 'Provider', type: 'text', required: true },
      { name: 'coverageAmount', label: 'Coverage Amount ($)', type: 'number', required: true },
      { name: 'premium', label: 'Premium ($)', type: 'number' },
      { name: 'deductible', label: 'Deductible ($)', type: 'number' },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'expired', 'cancelled', 'pending', 'claim-filed'] },
      { name: 'droneId', label: 'Primary Drone ID', type: 'number' },
      { name: 'contactName', label: 'Contact Name', type: 'text' },
      { name: 'contactPhone', label: 'Contact Phone', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'coverageAmount') return `$${val?.toLocaleString()}`;
      if (col === 'endDate' && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: false,
  },
  'contracts': {
    title: 'Contract Management',
    subtitle: 'Client contracts, terms, and renewals',
    icon: 'fas fa-handshake',
    service: 'contractService',
    columns: ['contractNumber', 'title', 'type', 'value', 'status', 'endDate'],
    columnLabels: ['Contract #', 'Title', 'Type', 'Value', 'Status', 'End Date'],
    fields: [
      { name: 'contractNumber', label: 'Contract Number', type: 'text', required: true },
      { name: 'clientId', label: 'Client ID', type: 'number' },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['service', 'maintenance', 'subscription', 'project', 'lease', 'partnership'], required: true },
      { name: 'value', label: 'Value ($)', type: 'number', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'expired', 'terminated', 'renewed', 'pending-approval'] },
      { name: 'paymentTerms', label: 'Payment Terms', type: 'text' },
      { name: 'autoRenew', label: 'Auto Renew', type: 'select', options: ['true', 'false'] },
      { name: 'signedBy', label: 'Signed By', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'value') return `$${val?.toLocaleString()}`;
      if (col === 'endDate' && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: false,
  },
  'expenses': {
    title: 'Expense Tracking',
    subtitle: 'Operational costs, receipts, and approvals',
    icon: 'fas fa-receipt',
    service: 'expenseService',
    columns: ['title', 'category', 'amount', 'date', 'vendor', 'status'],
    columnLabels: ['Title', 'Category', 'Amount', 'Date', 'Vendor', 'Status'],
    fields: [
      { name: 'title', label: 'Expense Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['fuel', 'maintenance', 'equipment', 'insurance', 'training', 'travel', 'software', 'licensing', 'office', 'marketing', 'other'], required: true },
      { name: 'amount', label: 'Amount ($)', type: 'number', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'vendor', label: 'Vendor', type: 'text' },
      { name: 'receiptUrl', label: 'Receipt URL', type: 'text' },
      { name: 'projectId', label: 'Project ID', type: 'number' },
      { name: 'droneId', label: 'Drone ID', type: 'number' },
      { name: 'approvedBy', label: 'Approved By', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected', 'reimbursed'] },
      { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['credit-card', 'bank-transfer', 'cash', 'check', 'corporate-card'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'amount') return `$${val?.toLocaleString()}`;
      if (col === 'date' && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: false,
  },
  'shifts': {
    title: 'Shift Management',
    subtitle: 'Operator schedules, shifts, and availability',
    icon: 'fas fa-calendar-alt',
    service: 'shiftService',
    columns: ['pilotName', 'role', 'date', 'startTime', 'endTime', 'status'],
    columnLabels: ['Pilot', 'Role', 'Date', 'Start', 'End', 'Status'],
    fields: [
      { name: 'pilotId', label: 'Pilot ID', type: 'number' },
      { name: 'pilotName', label: 'Pilot Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'select', options: ['pilot', 'observer', 'ground-crew', 'supervisor', 'technician'], required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'startTime', label: 'Start Time', type: 'time', required: true },
      { name: 'endTime', label: 'End Time', type: 'time', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'] },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'hoursWorked', label: 'Hours Worked', type: 'number' },
      { name: 'overtime', label: 'Overtime', type: 'select', options: ['true', 'false'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: false,
  },
  'emergency-protocols': {
    title: 'Emergency Protocols',
    subtitle: 'Emergency procedures, contacts, and drills',
    icon: 'fas fa-first-aid',
    service: 'emergencyProtocolService',
    columns: ['name', 'type', 'severity', 'status', 'responsibleTeam', 'lastDrillDate'],
    columnLabels: ['Name', 'Type', 'Severity', 'Status', 'Team', 'Last Drill'],
    fields: [
      { name: 'name', label: 'Protocol Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['crash', 'flyaway', 'loss-of-signal', 'battery-failure', 'weather', 'airspace-intrusion', 'medical', 'fire', 'general'], required: true },
      { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'], required: true },
      { name: 'responsibleTeam', label: 'Responsible Team', type: 'text' },
      { name: 'lastDrillDate', label: 'Last Drill Date', type: 'date' },
      { name: 'nextDrillDate', label: 'Next Drill Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'archived', 'under-review'] },
      { name: 'documentUrl', label: 'Document URL', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'lastDrillDate' && val) return new Date(val).toLocaleDateString();
      return val;
    },
    hasAI: false,
  },
  'communication-logs': {
    title: 'Communication Logs',
    subtitle: 'Radio, ATC, and team communication records',
    icon: 'fas fa-comments',
    service: 'communicationLogService',
    columns: ['type', 'direction', 'from', 'to', 'subject', 'priority'],
    columnLabels: ['Type', 'Direction', 'From', 'To', 'Subject', 'Priority'],
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['radio', 'phone', 'email', 'app', 'atc', 'emergency', 'internal'], required: true },
      { name: 'direction', label: 'Direction', type: 'select', options: ['inbound', 'outbound', 'internal'], required: true },
      { name: 'from', label: 'From', type: 'text', required: true },
      { name: 'to', label: 'To', type: 'text', required: true },
      { name: 'subject', label: 'Subject', type: 'text' },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'missionId', label: 'Mission ID', type: 'number' },
      { name: 'priority', label: 'Priority', type: 'select', options: ['routine', 'priority', 'urgent', 'emergency'] },
      { name: 'duration', label: 'Duration (sec)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: false,
  },
  'ground-stations': {
    title: 'Ground Control Stations',
    subtitle: 'Ground control station management',
    icon: 'fas fa-broadcast-tower',
    service: 'groundStationService',
    columns: ['name', 'type', 'location', 'status', 'activeDrones', 'maxDrones'],
    columnLabels: ['Name', 'Type', 'Location', 'Status', 'Active', 'Max Drones'],
    fields: [
      { name: 'name', label: 'Station Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['fixed', 'mobile', 'portable', 'vehicle-mounted'], required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'latitude', label: 'Latitude', type: 'number' },
      { name: 'longitude', label: 'Longitude', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['online', 'offline', 'maintenance', 'standby'] },
      { name: 'softwareVersion', label: 'Software Version', type: 'text' },
      { name: 'maxDrones', label: 'Max Drones', type: 'number' },
      { name: 'activeDrones', label: 'Active Drones', type: 'number' },
      { name: 'operatorName', label: 'Operator', type: 'text' },
      { name: 'communicationRange', label: 'Range (km)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    formatCell: (col, val) => {
      if (col === 'communicationRange') return `${val}km`;
      return val;
    },
    hasAI: false,
  },
};

function FeaturePage({ feature }) {
  const config = featureConfig[feature];
  const service = api[config.service];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await service.getAll();
      setItems(res.data);
    } catch (err) {
      console.error('Error loading:', err);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadItems();
    setSelectedItem(null);
    setShowForm(false);
    setAiAnalysis(null);
  }, [feature, loadItems]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setAiAnalysis(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await service.delete(id);
      setSelectedItem(null);
      loadItems();
    } catch (err) {
      alert('Error deleting item: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    const data = {};
    config.fields.forEach(f => {
      let val = item[f.name];
      if (f.type === 'date' && val) val = val.split('T')[0];
      if (f.type === 'datetime-local' && val) val = val.slice(0, 16);
      data[f.name] = val || '';
    });
    setFormData(data);
    setShowForm(true);
    setSelectedItem(null);
  };

  const handleNew = () => {
    setEditItem(null);
    const data = {};
    config.fields.forEach(f => { data[f.name] = ''; });
    setFormData(data);
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      // Convert types
      config.fields.forEach(f => {
        if (f.type === 'number' && submitData[f.name] !== '') {
          submitData[f.name] = Number(submitData[f.name]);
        }
        if (submitData[f.name] === '') {
          submitData[f.name] = null;
        }
        if (f.type === 'select' && (f.options?.includes('true'))) {
          if (submitData[f.name] === 'true') submitData[f.name] = true;
          if (submitData[f.name] === 'false') submitData[f.name] = false;
        }
      });

      if (editItem) {
        await service.update(editItem.id, submitData);
      } else {
        await service.create(submitData);
      }
      setShowForm(false);
      loadItems();
    } catch (err) {
      alert('Error saving: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAIAnalysis = async (item) => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await service.analyze(item.id);
      setAiAnalysis(res.data.analysis);
    } catch (err) {
      setAiAnalysis('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const formatValue = (col, val) => {
    if (val === null || val === undefined) return '-';
    if (config.formatCell) return config.formatCell(col, val);
    return String(val);
  };

  const getBadgeClass = (val) => {
    if (!val) return '';
    const v = String(val).toLowerCase().replace(/\s+/g, '-');
    return `badge badge-${v}`;
  };

  const statusColumns = ['status', 'severity', 'priority', 'trend', 'flyable'];
  const isStatusCol = (col) => statusColumns.includes(col);

  if (loading) {
    return <div className="loading-container"><div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(56,189,248,0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><i className={config.icon} style={{ marginRight: 12 }}></i>{config.title}</h1>
          <p className="subtitle">{config.subtitle}</p>
        </div>
        <button className="btn-new" onClick={handleNew}>
          <i className="fas fa-plus"></i> New {config.title.split(' ')[0]}
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {config.columnLabels.map((label, i) => (
                <th key={i}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={config.columns.length} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No items found</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)}>
                  {config.columns.map((col, i) => (
                    <td key={i}>
                      {isStatusCol(col) ? (
                        <span className={getBadgeClass(item[col])}>
                          {formatValue(col, item[col])}
                        </span>
                      ) : (
                        formatValue(col, item[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedItem(null)}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setSelectedItem(null)}>
              <i className="fas fa-times"></i>
            </button>
            <h2 className="modal-title">
              <i className={config.icon} style={{ marginRight: 10, color: '#38bdf8' }}></i>
              {selectedItem.name || selectedItem.invoiceNumber || selectedItem.trackingNumber || selectedItem.regulation || selectedItem.metric || `Item #${selectedItem.id}`}
            </h2>

            <div className="detail-grid">
              {Object.entries(selectedItem).filter(([key]) =>
                !['id', 'createdAt', 'updatedAt', 'waypoints', 'telemetryData', 'images', 'partsReplaced', 'avoidZones', 'servicesPurchased', 'services', 'input', 'result', 'recommendations'].includes(key)
              ).map(([key, val]) => (
                <div key={key} className={`detail-item ${(key === 'notes' || key === 'findings' || key === 'description' || key === 'aiAnalysis' || key === 'aiRecommendation' || key === 'summary' || key === 'actionTaken') ? 'detail-full' : ''}`}>
                  <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
                  <span>
                    {val === null || val === undefined ? '-' :
                     typeof val === 'boolean' ? (val ? 'Yes' : 'No') :
                     isStatusCol(key) ? <span className={getBadgeClass(val)}>{String(val)}</span> :
                     String(val)}
                  </span>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-edit" onClick={() => handleEdit(selectedItem)}>
                <i className="fas fa-edit"></i> Edit
              </button>
              <button className="btn-delete" onClick={() => handleDelete(selectedItem.id)}>
                <i className="fas fa-trash"></i> Delete
              </button>
              {config.hasAI && (
                <button className="btn-ai" onClick={() => handleAIAnalysis(selectedItem)} disabled={aiLoading}>
                  <i className="fas fa-brain"></i> AI Analysis
                </button>
              )}
            </div>

            {/* AI Analysis Result */}
            {(aiLoading || aiAnalysis) && (
              <div className="ai-analysis-container">
                <div className="ai-analysis-header">
                  <i className="fas fa-robot"></i>
                  <h3>AI Analysis</h3>
                  <span className="ai-model">OpenRouter / Claude Haiku</span>
                </div>
                {aiLoading ? (
                  <div className="ai-loading">
                    <div className="spinner"></div>
                    <span>Analyzing with AI...</span>
                  </div>
                ) : (
                  <div className="ai-analysis-body">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-content form-modal">
            <button className="modal-close" onClick={() => setShowForm(false)}>
              <i className="fas fa-times"></i>
            </button>
            <h2 className="modal-title">
              {editItem ? 'Edit' : 'New'} {config.title.split(' ')[0]}
            </h2>

            <form onSubmit={handleFormSubmit}>
              <div className="form-row">
                {config.fields.map((field) => (
                  <div key={field.name} className={`form-group ${field.type === 'textarea' ? 'detail-full' : ''}`}>
                    <label>{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.required}
                      >
                        <option value="">Select...</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        rows={3}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <i className="fas fa-check"></i> {editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturePage;
