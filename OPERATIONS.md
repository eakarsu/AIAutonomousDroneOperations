# Governed mission operations

`scripts/bootstrap.sh`, `scripts/migrate.sh`, and the guarded demo seed are explicit administrative actions. `start.sh` only starts this repository's two processes and only stops the PIDs it created.

The `/api/governed-missions` workflow validates bounded routes, operator credential expiry, Remote ID confirmation, weather acceptance, reserve energy, geofences, approval separation, idempotency, and immutable evidence events. Telemetry assessment returns a fail-safe recommendation but never dispatches an aircraft command. Generated gap endpoints are quarantined.

Fleet/autopilot, authoritative airspace/weather, Remote ID, map/inventory/dispatch synchronization, flight hardware, field trials, signatures acceptable to an aviation authority, and regulatory approval remain deployment integrations. Configure and contract-test approved adapters before operational use. Simulation and local tests are not evidence of airworthiness.
