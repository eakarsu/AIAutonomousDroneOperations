CREATE TABLE IF NOT EXISTS governed_missions (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
  aircraft_id TEXT NOT NULL, operator_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted','approved','rejected','active','contingency','cancelled','closed')),
  plan JSONB NOT NULL, plan_digest CHAR(64) NOT NULL, created_by TEXT NOT NULL,
  approved_by TEXT, approval_signature TEXT, version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS governed_mission_events (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, mission_id TEXT NOT NULL REFERENCES governed_missions(id),
  actor_id TEXT NOT NULL, action TEXT NOT NULL, detail JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS governed_mission_events_lookup ON governed_mission_events(tenant_id,mission_id,occurred_at);
CREATE OR REPLACE FUNCTION reject_governed_mission_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'governed mission events are append-only'; END $$;
DROP TRIGGER IF EXISTS governed_mission_events_append_only ON governed_mission_events;
CREATE TRIGGER governed_mission_events_append_only BEFORE UPDATE OR DELETE ON governed_mission_events FOR EACH ROW EXECUTE FUNCTION reject_governed_mission_event_mutation();
