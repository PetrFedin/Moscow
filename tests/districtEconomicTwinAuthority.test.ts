import test from 'node:test';
import assert from 'node:assert/strict';

import {
  baselineFromDemandCell,
  simulateDistrictTwin,
  twinScenarioCanRun,
  verifyDistrictTwinScenario
} from '../src/marketplace/districtEconomicTwinAuthority.ts';
import {
  demoFoodBaseline,
  demoTwinAssumptions,
  demoTwinScenarios
} from '../src/marketplace/districtEconomicTwinDemo.ts';
import { demoOpportunityPostCell } from '../src/marketplace/cityOpportunityDemo.ts';

test('actual scenario is blocked without measured calibration', () => {
  const actualBaseline = { ...demoFoodBaseline, mode: 'actual' as const };
  const gate = twinScenarioCanRun({
    id: 'actual-unmeasured',
    baseline: actualBaseline,
    assumptions: demoTwinAssumptions,
    interventions: [{ id:'x', type:'add-supply', label:'+1', addedFreshSupplyUnits:1 }]
  });
  assert.equal(gate.allowed, false);

  const result = simulateDistrictTwin({
    id: 'actual-unmeasured',
    baseline: actualBaseline,
    assumptions: demoTwinAssumptions,
    interventions: [{ id:'x', type:'add-supply', label:'+1', addedFreshSupplyUnits:1 }]
  });
  assert.equal(result.state, 'BLOCKED_NOT_CALIBRATED');
  assert.equal(result.expected.unmetIntentRate, null);
});

test('demo twin scenarios remain explicitly modelled', () => {
  assert.equal(demoTwinScenarios.length, 4);
  assert.ok(demoTwinScenarios.every((item) => item.state === 'MODELLED_DEMO'));
  assert.ok(demoTwinScenarios.every((item) => item.claims.actualOutcome === false));
  assert.ok(demoTwinScenarios.every((item) => item.claims.investmentDecision === false));
  assert.ok(demoTwinScenarios.every((item) => item.claims.causalityEstablished === false));
});

test('post-launch verification requires sufficient evidence and keeps causality unproven', () => {
  const scenario = demoTwinScenarios[0]!;
  const post = baselineFromDemandCell({
    id:'post',
    cell: demoOpportunityPostCell!,
    footfallIndex: 112,
    partnerGrossContributionRub: 280000
  });

  const verification = verifyDistrictTwinScenario({ scenario, postBaseline: post });
  assert.equal(verification.enoughEvidence, true);
  assert.equal(verification.causality, 'not-established');
  assert.ok(['VERIFIED_DIRECTIONALLY','MISSED_DIRECTION'].includes(verification.result));
});
