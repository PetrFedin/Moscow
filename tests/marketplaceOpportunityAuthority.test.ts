import test from 'node:test';
import assert from 'node:assert/strict';

import { demoMarketplaceRanking } from '../src/marketplace/demandRankingDemo.ts';
import {
  buildMarketplaceOpportunity,
  marketplaceOpportunityIsAuditable
} from '../src/marketplace/marketplaceOpportunityAuthority.ts';

test('selected marketplace opportunity preserves organic rank and policy context', () => {
  const opportunity = buildMarketplaceOpportunity({
    opportunityId: 'opp-1',
    intentId: 'demo-intent-evening-food',
    candidateId: 'demo-sponsored-b',
    selectedAt: '2026-10-06T18:06:00+03:00',
    ranking: demoMarketplaceRanking
  });

  assert.equal(opportunity.organicRank, 2);
  assert.equal(opportunity.sponsored, true);
  assert.equal(opportunity.policyId, 'moscow-marketplace-neutral-v1');
  assert.equal(opportunity.sponsorContractRef, 'DEMO-SPONSOR-CONTRACT-001');
  assert.equal(marketplaceOpportunityIsAuditable(opportunity), true);
});

test('non-ranked candidate cannot produce marketplace opportunity', () => {
  assert.throws(
    () => buildMarketplaceOpportunity({
      opportunityId: 'opp-stale',
      intentId: 'demo-intent-evening-food',
      candidateId: 'demo-stale-d',
      selectedAt: '2026-10-06T18:06:00+03:00',
      ranking: demoMarketplaceRanking
    }),
    /marketplace-candidate-not-organically-ranked/
  );
});
