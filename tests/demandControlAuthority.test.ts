import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEMAND_CONTROL_POLICY_V1,
  buildCityDevelopmentSignal,
  buildDemandControlCells,
  demandControlHasEnoughEvidenceForOpportunity
} from '../src/marketplace/demandControlAuthority.ts';
import {
  actualDemandObservations,
  demoDemandCells,
  demoDemandObservations
} from '../src/marketplace/demandControlDemo.ts';

test('actual control tower stays empty without actual demand evidence', () => {
  const cells = buildDemandControlCells({
    observations: actualDemandObservations,
    mode: 'actual'
  });
  assert.deepEqual(cells, []);
});

test('demo evidence can show opportunity but cannot qualify as actual opportunity', () => {
  const opportunity = demoDemandCells.find((cell) => cell.status === 'OPPORTUNITY');
  assert.ok(opportunity);
  assert.equal(opportunity!.mode, 'demo');
  assert.equal(demandControlHasEnoughEvidenceForOpportunity(opportunity!), false);

  const signal = buildCityDevelopmentSignal(opportunity!);
  assert.equal(signal.nextAction, 'partner-acquisition');
  assert.equal(signal.prohibitedClaim, 'does-not-authorize-investment-or-construction');
});

test('opportunity requires minimum observations and distinct days', () => {
  const sample = demoDemandObservations.slice(0, 10).map((item) => ({
    ...item,
    mode: 'actual' as const
  }));
  const cells = buildDemandControlCells({
    observations: sample,
    mode: 'actual'
  });

  assert.ok(cells.length > 0);
  assert.ok(cells.every((cell) => cell.status === 'INSUFFICIENT'));
});

test('control policy requires persistent unmet demand, weak coverage and confirmed demand', () => {
  assert.ok(DEMAND_CONTROL_POLICY_V1.minimumObservations >= 30);
  assert.ok(DEMAND_CONTROL_POLICY_V1.minimumDistinctDays >= 3);
  assert.ok(
    DEMAND_CONTROL_POLICY_V1.opportunityUnmetIntentRate
      > DEMAND_CONTROL_POLICY_V1.watchUnmetIntentRate
  );
  assert.ok(DEMAND_CONTROL_POLICY_V1.minimumConfirmedDemandRate > 0);
});
