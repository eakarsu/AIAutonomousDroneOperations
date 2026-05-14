const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const models = require('../models');

const router = express.Router();

/**
 * Point-in-polygon using ray casting algorithm.
 * polygon: array of {lat, lng} objects
 * point: {lat, lng}
 */
function pointInPolygon(point, polygon) {
  const x = point.lng;
  const y = point.lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Haversine distance in km between two {lat, lng} points.
 */
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Nearest distance from point to any vertex of a polygon (approximation).
 */
function nearestBoundaryKm(point, polygon) {
  return Math.min(...polygon.map((v) => haversineKm(point, v)));
}

// POST /api/geofences - Create a geofence with polygon coordinates
// (This route supplements the CRUD router already mounted at /api/geofences)
// We expose the check-geofence endpoint separately per-drone.

// POST /api/drones/:id/check-geofence
router.post(
  '/check-geofence',
  authMiddleware,
  [
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const dronePoint = { lat: parseFloat(req.body.lat), lng: parseFloat(req.body.lng) };

    try {
      const geofences = await models.Geofence.findAll({ where: { status: 'active' } });

      const violations = [];
      let inBounds = false;
      let nearestBoundaryKmVal = Infinity;

      for (const gf of geofences) {
        const coords = gf.coordinates;
        // Expect coordinates to be an array of {lat, lng}
        if (!Array.isArray(coords) || coords.length < 3) continue;

        const inside = pointInPolygon(dronePoint, coords);
        const nearestKm = nearestBoundaryKm(dronePoint, coords);

        if (nearestKm < nearestBoundaryKmVal) nearestBoundaryKmVal = nearestKm;

        if (gf.type === 'operational') {
          if (inside) inBounds = true;
        } else if (['no-fly', 'restricted'].includes(gf.type)) {
          if (inside) {
            violations.push({
              geofenceId: gf.id,
              name: gf.name,
              type: gf.type,
              reason: gf.reason || 'No-fly zone breach',
            });
          }
        }
      }

      res.json({
        in_bounds: inBounds,
        nearest_boundary_km: nearestBoundaryKmVal === Infinity ? null : +nearestBoundaryKmVal.toFixed(4),
        violations,
        checked_at: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
