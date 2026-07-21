const crypto = require('crypto');

const STATES = Object.freeze({
  draft: ['submitted'], submitted: ['approved', 'rejected'], approved: ['active', 'cancelled'],
  active: ['contingency', 'closed'], contingency: ['closed'], rejected: [], cancelled: [], closed: [],
});

function invariant(condition, message, code = 'INVALID_MISSION') {
  if (!condition) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = canonicalize(value[key]);
      return out;
    }, {});
  }
  return value;
}

function pointInsideBox(point, box) {
  return point.latitude >= box.south && point.latitude <= box.north &&
    point.longitude >= box.west && point.longitude <= box.east;
}

function validateMission(input, now = new Date()) {
  invariant(input && typeof input === 'object', 'mission body is required');
  invariant(typeof input.aircraftId === 'string' && input.aircraftId.trim(), 'aircraftId is required');
  invariant(typeof input.operatorId === 'string' && input.operatorId.trim(), 'operatorId is required');
  invariant(typeof input.authorizationRef === 'string' && input.authorizationRef.trim(), 'written authorization reference is required');
  invariant(input.remoteIdVerified === true, 'Remote ID must be verified');
  invariant(input.weatherStatus === 'accepted', 'authoritative weather review must be accepted');
  invariant(Number(input.batteryReservePct) >= 20, 'battery reserve must be at least 20%');
  invariant(new Date(input.operatorCredentialExpiresAt).getTime() > now.getTime(), 'operator credential is expired');
  invariant(Array.isArray(input.waypoints) && input.waypoints.length >= 2 && input.waypoints.length <= 200, '2-200 waypoints are required');

  const maxAltitudeM = Math.min(Number(input.maxAltitudeM || 120), 120);
  const blocked = Array.isArray(input.prohibitedGeofences) ? input.prohibitedGeofences : [];
  const waypoints = input.waypoints.map((point, index) => {
    const latitude = Number(point.latitude);
    const longitude = Number(point.longitude);
    const altitudeM = Number(point.altitudeM);
    invariant(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90, `waypoint ${index} latitude is invalid`);
    invariant(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180, `waypoint ${index} longitude is invalid`);
    invariant(Number.isFinite(altitudeM) && altitudeM >= 0 && altitudeM <= maxAltitudeM, `waypoint ${index} altitude exceeds mission limit`);
    invariant(!blocked.some(box => pointInsideBox({ latitude, longitude }, box)), `waypoint ${index} intersects a prohibited geofence`, 'GEOFENCE_VIOLATION');
    return { latitude, longitude, altitudeM };
  });

  const plan = canonicalize({
    aircraftId: input.aircraftId.trim(), operatorId: input.operatorId.trim(),
    authorizationRef: input.authorizationRef.trim(), operatorCredentialExpiresAt: input.operatorCredentialExpiresAt,
    remoteIdVerified: true, weatherStatus: 'accepted', batteryReservePct: Number(input.batteryReservePct),
    maxAltitudeM, waypoints, contingency: input.contingency || { lostLink: 'return_then_land', lowBattery: 'land_safe' },
    inputVersions: input.inputVersions || {},
  });
  return { plan, digest: crypto.createHash('sha256').update(JSON.stringify(plan)).digest('hex') };
}

function assertTransition(from, to, context = {}) {
  invariant(STATES[from] && STATES[from].includes(to), `transition ${from} -> ${to} is not allowed`, 'INVALID_TRANSITION');
  if (to === 'approved') {
    invariant(['admin', 'safety_officer'].includes(context.role), 'safety officer approval is required', 'FORBIDDEN');
    invariant(String(context.actorId) !== String(context.operatorId), 'operator cannot approve their own mission', 'SEPARATION_OF_DUTIES');
    invariant(typeof context.signature === 'string' && context.signature.length >= 16, 'approval signature is required');
  }
}

function assessTelemetry(sample, now = new Date()) {
  invariant(sample && typeof sample === 'object', 'telemetry sample is required');
  const ageMs = now.getTime() - new Date(sample.observedAt).getTime();
  invariant(Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= 30000, 'telemetry is stale or future-dated', 'STALE_TELEMETRY');
  const reasons = [];
  if (Number(sample.batteryPct) < 20) reasons.push('LOW_BATTERY');
  if (Number(sample.linkQualityPct) < 30) reasons.push('LOST_LINK_RISK');
  if (sample.geofenceBreach === true) reasons.push('GEOFENCE_BREACH');
  return { safe: reasons.length === 0, reasons, recommendedAction: reasons.length ? 'RETURN_OR_LAND_PER_APPROVED_CONTINGENCY' : 'CONTINUE' };
}

module.exports = { STATES, validateMission, assertTransition, assessTelemetry };
