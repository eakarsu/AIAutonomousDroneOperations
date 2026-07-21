const test = require('node:test');
const assert = require('node:assert/strict');
const { validateMission, assertTransition, assessTelemetry } = require('../domain/missionPolicy');

const valid = { aircraftId: 'UAS-7', operatorId: 'pilot-1', authorizationRef: 'AUTH-2026-001', remoteIdVerified: true,
  weatherStatus: 'accepted', batteryReservePct: 30, operatorCredentialExpiresAt: '2030-01-01T00:00:00Z',
  waypoints: [{ latitude: 40, longitude: -74, altitudeM: 30 }, { latitude: 40.1, longitude: -74.1, altitudeM: 40 }] };

test('mission plan is deterministic and bounded', () => {
  assert.equal(validateMission(valid).digest, validateMission({ ...valid }).digest);
  assert.throws(() => validateMission({ ...valid, batteryReservePct: 5 }), /battery reserve/);
});
test('prohibited geofence rejects plan', () => assert.throws(() => validateMission({ ...valid, prohibitedGeofences: [{ south: 39, north: 41, west: -75, east: -73 }] }), /prohibited/));
test('approval enforces role, separation, and signature', () => {
  assert.doesNotThrow(() => assertTransition('submitted', 'approved', { role: 'safety_officer', actorId: 2, operatorId: 1, signature: 'signed-digest-1234' }));
  assert.throws(() => assertTransition('submitted', 'approved', { role: 'operator', actorId: 2, operatorId: 1, signature: 'signed-digest-1234' }), /approval/);
});
test('telemetry emits recommendation but no command', () => assert.deepEqual(assessTelemetry({ observedAt: '2026-01-01T00:00:00Z', batteryPct: 10, linkQualityPct: 90 }, new Date('2026-01-01T00:00:10Z')).reasons, ['LOW_BATTERY']));
