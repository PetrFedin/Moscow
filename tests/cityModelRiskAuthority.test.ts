import test from 'node:test';
import assert from 'node:assert/strict';

import {
  approvePromotionGate,
  approveRollback,
  buildPromotionGate,
  evaluateChallenger,
  executeRollback,
  modelRiskCanAutoPromote,
  modelRiskCanAutoRollback,
  proposeRollback
} from '../src/marketplace/cityModelRiskAuthority.ts';
import {
  demoChallengerEvaluation,
  demoModelRiskBoard,
  demoPromotionGate,
  demoRollbackProposal
} from '../src/marketplace/cityModelRiskDemo.ts';

test('challenger promotion requires superiority and full governance package', () => {
  assert.equal(demoChallengerEvaluation.outcome, 'CHALLENGER_WINS');
  assert.equal(demoPromotionGate.state, 'READY_FOR_DECISION');

  const blocked = buildPromotionGate({
    modelId: demoChallengerEvaluation.modelId,
    evaluation: demoChallengerEvaluation,
    approvalRefs: {},
    rollbackPlanRef: null,
    monitoringPlanRef: null
  });

  assert.equal(blocked.state, 'BLOCKED');
  assert.ok(blocked.blockers.includes('rollback-plan-missing'));
  assert.ok(blocked.blockers.includes('monitoring-plan-missing'));
});

test('promotion approval is explicit and referenced', () => {
  const approved = approvePromotionGate(
    demoPromotionGate,
    'PROMOTION-DECISION-001'
  );
  assert.equal(approved.state, 'APPROVED');
  assert.equal(
    approved.approvalRefs['investment-governance'],
    'PROMOTION-DECISION-001'
  );
});

test('challenger with insufficient holdout cannot win', () => {
  const insufficient = evaluateChallenger({
    id: 'small',
    modelId: 'district-economic-twin',
    incumbentVersion: '1.1.0',
    challengerVersion: '1.2.0-rc2',
    holdoutRef: 'HOLDOUT',
    sampleSize: 10,
    incumbentDirectionalHitRate: 0.6,
    challengerDirectionalHitRate: 0.9,
    incumbentMeanAbsoluteError: 0.2,
    challengerMeanAbsoluteError: 0.05,
    segmentRegressionCount: 0,
    segmentImprovementCount: 4
  });
  assert.equal(insufficient.outcome, 'INSUFFICIENT');
});

test('rollback cannot execute without approval', () => {
  assert.throws(
    () => executeRollback(demoRollbackProposal, 'EXEC-1'),
    /rollback-not-approved/
  );

  const approved = approveRollback(demoRollbackProposal, 'ROLLBACK-APPROVAL-1');
  const executed = executeRollback(approved, 'ROLLBACK-EXEC-1');
  assert.equal(executed.state, 'EXECUTED');
  assert.equal(executed.executionRef, 'ROLLBACK-EXEC-1');
});

test('rollback proposal requires evidence and distinct target', () => {
  assert.throws(
    () => proposeRollback({
      id: 'bad',
      modelId: 'district-economic-twin',
      currentVersion: '1.1.0',
      rollbackTargetVersion: '1.1.0',
      reason: 'BAD_CALIBRATION',
      evidenceRefs: ['E1']
    }),
    /rollback-target-equals-current/
  );
});

test('model risk board never auto-promotes or auto-rolls back', () => {
  assert.equal(modelRiskCanAutoPromote(), false);
  assert.equal(modelRiskCanAutoRollback(), false);
  assert.equal(demoModelRiskBoard.claims.autoPromote, false);
  assert.equal(demoModelRiskBoard.claims.autoRollback, false);
  assert.equal(demoModelRiskBoard.claims.autoActivate, false);
});
