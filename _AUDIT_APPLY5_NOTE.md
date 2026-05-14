# Apply Pass 5 — AIAutonomousDroneOperations

- **Date:** 2026-05-08
- **Stack:** Node.js + Express + Sequelize/Postgres (`backend/`), CRA React (`frontend/`).
- **Audit source:** `_AUDIT/reports/batch_00.md` § 33.
- **Action:** VERIFIED-PRESENT (BE) + IMPLEMENTED-1 (FE wiring).

## Audit-vs-reality

The audit reported "skeleton" with 0 AI endpoints, but the project actually
ships ~16 `aiServices.*` helpers wired into CRUD, plus pass-2 added 5 dedicated
AI endpoints (mission-planner, obstacle-avoidance, swarm-coordination,
geofence-optimize, telemetry-anomaly). Audit was a TSV false-positive.

## Verified-present

- 5 pass-2 AI endpoints in `routes/ai.js`.
- `routes/extensions.js` (~220 lines) — pass-5 backlog: vendor link, C2 queue,
  NOAA, image-analysis registry, SLAM replan.
- Server entry `backend/server.js` mounts both routers under `/api/ai`.

## Implemented this pass

| # | Item | File | Lines |
|---|------|------|-------|
| 1 | FE page surfacing the pass-5 extension endpoints | `frontend/src/pages/Extensions.js` (new) | 95 |

App route `/extensions` added (2 lines in `App.js`).

Backend pass-5 backlog (in `routes/extensions.js`):

| BE Endpoint | Backlog tag | Env vars |
|-------------|-------------|----------|
| `GET /api/ai/vendor/status`, `POST /api/ai/vendor/link-drone`, `GET /api/ai/vendor/links` | NEEDS-CREDS | `DRONE_VENDOR`, `DRONE_VENDOR_API_KEY` |
| `POST /api/ai/c2/enqueue`, `GET /api/ai/c2/queue/:drone_id` | TOO-RISKY → registry only | — |
| `GET /api/ai/weather/noaa` | NEEDS-CREDS | `NOAA_API_TOKEN` |
| `POST / GET /api/ai/image-analysis/jobs`, `POST /api/ai/image-analysis/text-advisory` | TOO-RISKY → registry + text-only | `OPENROUTER_API_KEY` |
| `POST /api/ai/slam-replan` | TOO-RISKY → text-grounded waypoint | `OPENROUTER_API_KEY` |

## 503-on-no-key

Vendor and NOAA routes return 503 when env vars missing. AI calls return 503
through `queryAIStructured` when `OPENROUTER_API_KEY` missing.

## Files written/modified

- `frontend/src/pages/Extensions.js` (new, 95 lines)
- `frontend/src/App.js` (added 2 lines: import + Route)

## Smoke test

- `node --check backend/routes/extensions.js` PASS
- `node --check backend/server.js` PASS
- All schema additions are `CREATE TABLE IF NOT EXISTS`.

## Deferred

None — every audit-listed backlog item has a corresponding endpoint.
