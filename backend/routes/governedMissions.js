const express = require('express');
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const auth = require('../middleware/auth');
const { validateMission, assertTransition, assessTelemetry } = require('../domain/missionPolicy');

const router = express.Router();
router.use(auth);

const tenantFor = user => user.tenantId || `user:${user.id}`;
const fail = (res, error) => res.status(error.code === 'FORBIDDEN' ? 403 : 422).json({ error: error.code || 'VALIDATION_ERROR', message: error.message });
async function audit(tenantId, missionId, actorId, action, detail = {}) {
  await sequelize.query('INSERT INTO governed_mission_events (id, tenant_id, mission_id, actor_id, action, detail) VALUES (:id,:tenant,:mission,:actor,:action,CAST(:detail AS jsonb))',
    { replacements: { id: crypto.randomUUID(), tenant: tenantId, mission: missionId, actor: String(actorId), action, detail: JSON.stringify(detail) } });
}

router.post('/', async (req, res) => {
  try {
    const tenantId = tenantFor(req.user);
    const key = String(req.get('Idempotency-Key') || '');
    if (key.length < 12 || key.length > 128) return res.status(400).json({ error: 'valid Idempotency-Key is required' });
    const validated = validateMission(req.body);
    const id = crypto.randomUUID();
    const [rows] = await sequelize.query(
      `INSERT INTO governed_missions (id,tenant_id,idempotency_key,aircraft_id,operator_id,status,plan,plan_digest,created_by)
       VALUES (:id,:tenant,:key,:aircraft,:operator,'submitted',CAST(:plan AS jsonb),:digest,:actor)
       ON CONFLICT (tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
      { replacements: { id, tenant: tenantId, key, aircraft: validated.plan.aircraftId, operator: validated.plan.operatorId, plan: JSON.stringify(validated.plan), digest: validated.digest, actor: String(req.user.id) }, type: QueryTypes.INSERT });
    const mission = Array.isArray(rows) ? rows[0] : rows;
    await audit(tenantId, mission.id, req.user.id, 'MISSION_SUBMITTED', { digest: validated.digest });
    res.status(201).json(mission);
  } catch (error) { fail(res, error); }
});

router.post('/:id/approve', async (req, res) => {
  const tenantId = tenantFor(req.user);
  const transaction = await sequelize.transaction();
  try {
    const rows = await sequelize.query('SELECT * FROM governed_missions WHERE id=:id AND tenant_id=:tenant FOR UPDATE', { replacements: { id: req.params.id, tenant: tenantId }, type: QueryTypes.SELECT, transaction });
    if (!rows[0]) { await transaction.rollback(); return res.status(404).json({ error: 'mission not found' }); }
    assertTransition(rows[0].status, 'approved', { role: req.user.role, actorId: req.user.id, operatorId: rows[0].operator_id, signature: req.body.signature });
    const [updated] = await sequelize.query("UPDATE governed_missions SET status='approved',approved_by=:actor,approval_signature=:signature,version=version+1,updated_at=NOW() WHERE id=:id RETURNING *", { replacements: { actor: String(req.user.id), signature: req.body.signature, id: req.params.id }, type: QueryTypes.UPDATE, transaction });
    await sequelize.query('INSERT INTO governed_mission_events (id,tenant_id,mission_id,actor_id,action,detail) VALUES (:event,:tenant,:id,:actor,\'MISSION_APPROVED\',\'{}\')', { replacements: { event: crypto.randomUUID(), tenant: tenantId, id: req.params.id, actor: String(req.user.id) }, transaction });
    await transaction.commit();
    res.json(updated[0]);
  } catch (error) { await transaction.rollback(); fail(res, error); }
});

router.post('/:id/telemetry', async (req, res) => {
  try {
    const tenantId = tenantFor(req.user);
    const assessment = assessTelemetry(req.body);
    await audit(tenantId, req.params.id, req.user.id, 'TELEMETRY_ASSESSED', assessment);
    // This endpoint records a recommendation; it never sends aircraft commands.
    res.status(202).json({ ...assessment, commandDispatched: false });
  } catch (error) { fail(res, error); }
});

router.get('/:id/evidence', async (req, res) => {
  const rows = await sequelize.query('SELECT * FROM governed_mission_events WHERE tenant_id=:tenant AND mission_id=:id ORDER BY occurred_at,id', { replacements: { tenant: tenantFor(req.user), id: req.params.id }, type: QueryTypes.SELECT });
  res.json(rows);
});

module.exports = router;
