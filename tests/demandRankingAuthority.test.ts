import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MARKETPLACE_RANKING_POLICY_V1,
  evaluateMarketplaceEligibility,
  marketplaceRankingIsSponsorNeutral,
  rankMarketplaceCandidates,
  type MarketplaceCandidate,
  type MarketplaceIntent
} from '../src/marketplace/demandRankingAuthority.ts';
import {
  demoMarketplaceCandidates,
  demoMarketplaceIntent,
  demoMarketplaceRanking
} from '../src/marketplace/demandRankingDemo.ts';

test('ranking policy weights sum to one and sponsorship is excluded from weights', () => {
  const weights = MARKETPLACE_RANKING_POLICY_V1.weights;
  const sum = Object.values(weights).reduce((acc, value) => acc + value, 0);
  assert.equal(sum, 1);
  assert.equal('sponsorship' in weights, false);
  assert.equal('paid' in weights, false);
});

test('sponsored candidate keeps the same organic rank as neutral organic ranking', () => {
  assert.equal(marketplaceRankingIsSponsorNeutral(demoMarketplaceRanking), true);

  const neutralCandidates = demoMarketplaceCandidates.map((candidate) => ({
    ...candidate,
    sponsor: { active: false, contractRef: null, disclosureLabel: null }
  }));

  const neutral = rankMarketplaceCandidates({
    intent: demoMarketplaceIntent,
    candidates: neutralCandidates,
    now: '2026-10-06T18:05:00+03:00'
  });

  const actualOrder = demoMarketplaceRanking.organic.map((item) => item.candidate.id);
  const neutralOrder = neutral.organic.map((item) => item.candidate.id);
  assert.deepEqual(actualOrder, neutralOrder);
});

test('stale live availability fails closed before ranking', () => {
  const stale = demoMarketplaceCandidates.find((item) => item.id === 'demo-stale-d');
  assert.ok(stale);

  const reason = evaluateMarketplaceEligibility(
    demoMarketplaceIntent,
    stale!,
    '2026-10-06T18:05:00+03:00'
  );
  assert.equal(reason, 'availability-stale');
  assert.equal(
    demoMarketplaceRanking.organic.some((item) => item.candidate.id === 'demo-stale-d'),
    false
  );
});

test('bookable-now intent rejects unknown or unauthoritative availability', () => {
  const intent: MarketplaceIntent = {
    ...demoMarketplaceIntent,
    availabilityRequirement: 'live-required'
  };

  const base = demoMarketplaceCandidates[0]!;
  const candidates: MarketplaceCandidate[] = [
    {
      ...base,
      id: 'unknown',
      availability: {
        state: 'unknown',
        checkedAt: '2026-10-06T18:00:00+03:00',
        freshnessSlaMinutes: 15,
        authoritative: true
      }
    },
    {
      ...base,
      id: 'manual',
      availability: {
        state: 'available',
        checkedAt: '2026-10-06T18:00:00+03:00',
        freshnessSlaMinutes: 15,
        authoritative: false
      }
    }
  ];

  assert.equal(
    evaluateMarketplaceEligibility(intent, candidates[0]!, '2026-10-06T18:05:00+03:00'),
    'availability-unknown'
  );
  assert.equal(
    evaluateMarketplaceEligibility(intent, candidates[1]!, '2026-10-06T18:05:00+03:00'),
    'availability-not-authoritative'
  );
});

test('sponsored layer can only contain already eligible organic candidates above threshold', () => {
  for (const sponsored of demoMarketplaceRanking.sponsored) {
    const organic = demoMarketplaceRanking.organic.find(
      (item) => item.candidate.id === sponsored.candidate.id
    );
    assert.ok(organic);
    assert.ok(organic!.organicScore >= MARKETPLACE_RANKING_POLICY_V1.minimumSponsoredOrganicScore);
    assert.equal(organic!.organicRank, sponsored.organicRank);
  }
});
