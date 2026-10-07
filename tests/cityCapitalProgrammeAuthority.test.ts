import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCapitalProgrammeSnapshot,
  programmeHasCapitalOvercommitment,
  reallocationCanExecute
} from '../src/marketplace/cityCapitalProgrammeAuthority.ts';
import {
  demoCapitalProgrammeCases,
  demoCapitalProgrammeSnapshot
} from '../src/marketplace/cityCapitalProgrammeDemo.ts';

test('programme snapshot aggregates committed and actual capital without overcommitment', () => {
  assert.equal(programmeHasCapitalOvercommitment(demoCapitalProgrammeSnapshot), false);
  assert.ok(
    demoCapitalProgrammeSnapshot.committedCapitalRub
      <= demoCapitalProgrammeSnapshot.authorizedEnvelopeRub
  );
});

test('underperforming committed capital is not auto-reallocated', () => {
  const blocked = demoCapitalProgrammeSnapshot.reallocationOpportunities.filter(
    (item) => item.source === 'UNDERPERFORMING_COMMITTED_CASE'
  );

  assert.ok(blocked.length > 0);
  for (const item of blocked) {
    assert.equal(item.state, 'BLOCKED_PENDING_REVIEW_AND_DECOMMITMENT');
    assert.equal(item.requiresHumanApproval, true);
    assert.equal(reallocationCanExecute(item), false);
  }
});

test('uncommitted programme envelope is visible but still requires human approval', () => {
  const available = demoCapitalProgrammeSnapshot.reallocationOpportunities.find(
    (item) => item.source === 'UNCOMMITTED_PROGRAMME_ENVELOPE'
  );
  assert.ok(available);
  assert.ok((available?.amountRub ?? 0) > 0);
  assert.equal(available?.requiresHumanApproval, true);
  assert.equal(reallocationCanExecute(available!), false);
});

test('programme control never claims investment, procurement or causal authority', () => {
  assert.equal(demoCapitalProgrammeSnapshot.claims.reallocationExecuted, false);
  assert.equal(demoCapitalProgrammeSnapshot.claims.investmentDecision, false);
  assert.equal(demoCapitalProgrammeSnapshot.claims.procurementDecision, false);
  assert.equal(demoCapitalProgrammeSnapshot.claims.causalityEstablished, false);
});

test('snapshot can be rebuilt for the same demo programme deterministically', () => {
  const rebuilt = buildCapitalProgrammeSnapshot({
    programmeId: 'demo-moscow-tourism-capital-programme',
    mode: 'demo',
    authorizedEnvelopeRub: 500000000,
    cases: demoCapitalProgrammeCases
  });

  assert.equal(rebuilt.committedCapitalRub, demoCapitalProgrammeSnapshot.committedCapitalRub);
  assert.equal(rebuilt.actualSpendRub, demoCapitalProgrammeSnapshot.actualSpendRub);
  assert.deepEqual(rebuilt.benefitsRealization, demoCapitalProgrammeSnapshot.benefitsRealization);
});
