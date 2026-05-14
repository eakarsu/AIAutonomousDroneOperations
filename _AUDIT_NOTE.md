# Audit Apply Note — AIAutonomousDroneOperations

Source: `_AUDIT/reports/batch_00.md` § 33.

## Audit findings vs. reality
The audit reported "0 AI endpoints" but in fact the project ships ~16 `aiServices.*` functions auto-invoked from CRUD routes (flight plan, missions, surveillance, weather, etc.) plus an SSE streaming endpoint at `/api/ai/analyze/stream`. Audit appears to have only counted dedicated routers.

The five autonomous-flight items in the gap list (mission planning, obstacle avoidance, swarm coordination, geofence optimization, telemetry anomaly) had no direct REST endpoints and were missing.

## Implemented in this pass (MECHANICAL)

| # | Item | File | Endpoint |
|---|------|------|----------|
| 1 | AI mission planner | `backend/routes/ai.js` (new) | `POST /api/ai/mission-planner` |
| 2 | AI obstacle avoidance | `backend/routes/ai.js` | `POST /api/ai/obstacle-avoidance` |
| 3 | AI swarm coordination | `backend/routes/ai.js` | `POST /api/ai/swarm-coordination` |
| 4 | AI geofence optimization (extra) | `backend/routes/ai.js` | `POST /api/ai/geofence-optimize` |
| 5 | AI telemetry anomaly detection (extra) | `backend/routes/ai.js` | `POST /api/ai/telemetry-anomaly` |

(I added 3 from the audit gap list plus 2 close cousins because the same `queryAIStructured` helper made them strictly mechanical.)

All wired in `backend/server.js` under `/api/ai`. Use `queryAIStructured` from `services/openrouter.js` and the existing `authMiddleware`. Rate limiter inherited via the `/api/ai` global middleware. `node --check` passes.

## Backlog (not implemented)

| Item | Tag | Why deferred |
|------|-----|---------------|
| DJI FlightHub / Skydio / Freefly integration | NEEDS-CREDS | Vendor SDKs / API access |
| Real-time C2 (command & control) | TOO-RISKY | Realtime infra and safety considerations |
| Weather (NOAA) integration | NEEDS-CREDS | API key / SDK |
| On-board image analysis pipeline | TOO-RISKY | Image-capable model + storage |
| SLAM/CV obstacle replanning (real) | TOO-RISKY | Onboard compute integration |

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired.
- `frontend/src/pages/AIAutonomy.js` is a 5-tab UI (Mission Planner, Obstacle Avoidance, Swarm Coordination, Geofence Optimize, Telemetry Anomaly) calling `aiAutonomyService.*` from `frontend/src/services/api.js`.
- JWT Bearer header attached via Axios interceptor reading `localStorage.getItem('token')`.
- Routed in `App.js` at `/ai-autonomy`; entry visible in Sidebar.
- No files modified this pass.

## Apply pass 4 (mechanical backlog)

- **Action:** LEFT-AS-IS — pass 2 already added all 5 MECHANICAL items (mission-planner, obstacle-avoidance, swarm-coordination, geofence-optimize, telemetry-anomaly) and pass 3 confirmed the FE was already wired. No remaining MECHANICAL items in the backlog.
- All deferred items remain credentials-blocked or risky: DJI/Skydio/Freefly SDKs, real-time C2, NOAA, on-board image-analysis, real SLAM/CV obstacle replanning.
- No files modified this pass.
