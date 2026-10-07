import test from 'node:test';
import assert from 'node:assert/strict';

import { currentPilotInvestmentEvidence, getPilotDecisionReadiness } from '../src/government/pilotInvestmentDecision.ts';
import {
  getPilotDeliveryObligation,
  PILOT_DELIVERY_OBLIGATIONS,
  PILOT_PAYMENT_MILESTONES
} from '../src/government/pilotContractAuthority.ts';

test('every current investor blocker maps to one contract obligation', () => {
  const readiness = getPilotDecisionReadiness(currentPilotInvestmentEvidence);
  assert.ok(readiness.blockers.length > 0);

  for (const blocker of readiness.blockers) {
    const obligation = getPilotDeliveryObligation(blocker);
    assert.ok(obligation, `missing obligation for ${blocker}`);
    assert.ok(obligation?.responsibleRole);
    assert.ok(obligation?.evidenceCode);
    assert.ok(obligation?.acceptanceClauseId);
    assert.ok(obligation?.paymentMilestone);
  }
});

test('contract obligation mapping is unique by blocker', () => {
  const blockers = PILOT_DELIVERY_OBLIGATIONS.map((item) => item.blocker);
  assert.equal(new Set(blockers).size, blockers.length);
});

test('evidence-gated payment milestones remain evidence-gated', () => {
  const gated = PILOT_DELIVERY_OBLIGATIONS.filter(
    (item) => item.paymentMilestone !== 'mobilization'
  );
  assert.ok(gated.length > 0);

  for (const obligation of gated) {
    assert.equal(
      PILOT_PAYMENT_MILESTONES[obligation.paymentMilestone].requiresAcceptedEvidence,
      true,
      `${obligation.paymentMilestone} must require accepted evidence`
    );
  }
});
