import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReallocationDecisionPack,
  buildReallocationFundingSources,
  createDecommitmentProposal,
  decommitmentAmountAvailable,
  nextCycleFundingCanExecute,
  scoreStrategicFundingCandidate,
  validateStrategicPriorities
} from '../src/marketplace/cityStrategyRebalancingAuthority.ts';
import {
  demoAlternativeFundingCandidates,
  demoRebalancingDecisionPack,
  demoStrategicPriorities,
  demoUnderperformanceReview
} from '../src/marketplace/cityStrategyRebalancingDemo.ts';
import { demoCapitalProgrammeSnapshot } from '../src/marketplace/cityCapitalProgrammeDemo.ts';

test('strategic priorities are evidence-backed and weights sum to one', () => {
  const validation = validateStrategicPriorities(demoStrategicPriorities);
  assert.equal(validation.valid, true);
});

test('draft decommitment does not become available capital', () => {
  const draft = createDecommitmentProposal(demoUnderperformanceReview);
  assert.equal(decommitmentAmountAvailable(draft), 0);

  const sources = buildReallocationFundingSources({
    snapshot: demoCapitalProgrammeSnapshot,
    proposals: [draft]
  });

  const committedSource = sources.find(
    (item) => item.caseId === demoUnderperformanceReview.caseId
  );
  assert.ok(committedSource);
  assert.equal(committedSource?.availableNow, false);
});

test('approved decommitment with authority can enter available envelope', () => {
  const approved = {
    ...createDecommitmentProposal(demoUnderperformanceReview),
    state: 'APPROVED' as const,
    authorityRef: 'AUTH-1',
    decidedAt: '2026-10-06T14:00:00+03:00'
  };

  assert.ok(decommitmentAmountAvailable(approved) > 0);

  const sources = buildReallocationFundingSources({
    snapshot: demoCapitalProgrammeSnapshot,
    proposals: [approved]
  });

  const released = sources.find(
    (item) => item.sourceType === 'APPROVED_DECOMMITMENT'
  );
  assert.ok(released);
  assert.equal(released?.availableNow, true);
});

test('low-evidence next-cycle candidate is blocked', () => {
  const candidate = demoAlternativeFundingCandidates.find(
    (item) => item.id === 'next-cycle-low-evidence'
  )!;
  const scored = scoreStrategicFundingCandidate({
    candidate,
    priorities: demoStrategicPriorities
  });

  assert.equal(scored.eligible, false);
  assert.ok(scored.blockers.includes('candidate-confidence-below-threshold'));
});

test('recommended next-cycle allocations never exceed immediately available capital', () => {
  const allocated = demoRebalancingDecisionPack.recommendedAllocations
    .reduce((sum, item) => sum + item.amountRub, 0);

  assert.ok(allocated <= demoRebalancingDecisionPack.immediatelyAvailableCapitalRub);
  assert.equal(
    demoRebalancingDecisionPack.unallocatedAvailableRub,
    demoRebalancingDecisionPack.immediatelyAvailableCapitalRub - allocated
  );
});

test('rebalancing decision pack cannot auto execute', () => {
  assert.equal(nextCycleFundingCanExecute(demoRebalancingDecisionPack), false);
  assert.equal(demoRebalancingDecisionPack.claims.decommitmentExecuted, false);
  assert.equal(demoRebalancingDecisionPack.claims.reallocationExecuted, false);
  assert.equal(demoRebalancingDecisionPack.claims.nextCycleFundingApproved, false);
  assert.equal(demoRebalancingDecisionPack.claims.investmentDecision, false);
});

test('decision pack is deterministic for the same inputs', () => {
  const rebuilt = buildReallocationDecisionPack({
    id: demoRebalancingDecisionPack.id,
    snapshot: demoCapitalProgrammeSnapshot,
    priorities: demoStrategicPriorities,
    reviews: [demoUnderperformanceReview],
    proposals: demoRebalancingDecisionPack.decommitmentProposals,
    candidates: demoAlternativeFundingCandidates
  });

  assert.equal(
    rebuilt.immediatelyAvailableCapitalRub,
    demoRebalancingDecisionPack.immediatelyAvailableCapitalRub
  );
  assert.deepEqual(
    rebuilt.recommendedAllocations,
    demoRebalancingDecisionPack.recommendedAllocations
  );
});
