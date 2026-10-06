import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PARTNER_SHORTLIST_POLICY_V1,
  buildCityOpportunityCase,
  buildPartnerAcquisitionBrief,
  measureOpportunityOutcome,
  shortlistIsCommerciallyNeutral,
  shortlistPartnerProspects
} from '../src/marketplace/cityOpportunityAuthority.ts';
import {
  demoCityOpportunityCase,
  demoOpportunityPostCell,
  demoOpportunityProspects
} from '../src/marketplace/cityOpportunityDemo.ts';
import { demoDemandCells } from '../src/marketplace/demandControlDemo.ts';

const baseline = demoDemandCells.find(
  (cell) =>
    cell.districtId === 'varvarka-zaryadye'
    && cell.intentKind === 'food'
    && cell.timeBucket === 'evening'
    && cell.status === 'OPPORTUNITY'
)!;

test('shortlist policy excludes paid promotion budget from score', () => {
  assert.equal('paidPromotionBudgetRub' in PARTNER_SHORTLIST_POLICY_V1.weights, false);

  const brief = buildPartnerAcquisitionBrief(baseline);
  const original = shortlistPartnerProspects({ brief, prospects: demoOpportunityProspects });

  const modified = shortlistPartnerProspects({
    brief,
    prospects: demoOpportunityProspects.map((prospect) => ({
      ...prospect,
      paidPromotionBudgetRub:
        prospect.id === 'prospect-c' ? 999999999 : 0
    }))
  });

  assert.deepEqual(
    original.map((item) => item.prospect.id),
    modified.map((item) => item.prospect.id)
  );
  assert.equal(shortlistIsCommerciallyNeutral(original), true);
});

test('expected impact remains modelled and cannot be treated as observed outcome', () => {
  assert.ok(demoCityOpportunityCase.expectedImpact);
  assert.equal(demoCityOpportunityCase.expectedImpact!.impactState, 'modelled-not-observed');
  assert.equal(demoCityOpportunityCase.expectedImpact!.prohibitedClaim, 'not-actual-demand-reduction');
});

test('post-onboarding outcome requires sufficient evidence', () => {
  const insufficient = measureOpportunityOutcome({
    opportunityId: 'insufficient-case',
    baseline,
    postOnboarding: {
      ...baseline,
      key: 'demo:varvarka-zaryadye:food:evening:post-small',
      observations: 10,
      distinctDays: 2,
      unmetIntents: 1,
      unmetIntentRate: 0.1,
      averageEligibleSupply: 4,
      averageFreshAvailableSupply: 3,
      supplyCoverageRatio: 0.75
    }
  });

  assert.equal(insufficient.enoughPostEvidence, false);
  assert.equal(insufficient.outcome, 'INSUFFICIENT');
});

test('closed gap is based on observed post metrics but causality remains unproven', () => {
  assert.ok(demoOpportunityPostCell);
  const measured = measureOpportunityOutcome({
    opportunityId: 'measured-case',
    baseline,
    postOnboarding: demoOpportunityPostCell
  });

  assert.equal(measured.enoughPostEvidence, true);
  assert.equal(measured.outcome, 'GAP-CLOSED');
  assert.equal(measured.attributionCausality, 'not-established');
});

test('full opportunity case closes only after selected prospect onboarding and post evidence', () => {
  const opportunity = buildCityOpportunityCase({
    id: 'closed-loop',
    baseline,
    prospects: demoOpportunityProspects,
    selectedProspectId: 'prospect-a',
    onboardingEvidenceRef: 'ONBOARD-1',
    postOnboarding: demoOpportunityPostCell
  });

  assert.equal(opportunity.status, 'closed');
  assert.equal(opportunity.measurement?.outcome, 'GAP-CLOSED');
});
