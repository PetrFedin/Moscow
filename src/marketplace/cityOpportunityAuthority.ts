import type { MarketplaceIntentKind } from './demandRankingAuthority';
import {
  DEMAND_CONTROL_POLICY_V1,
  type DemandSignalEvidenceMode,
  type DistrictDemandCell
} from './demandControlAuthority';

export type OpportunityCaseStatus =
  | 'detected'
  | 'brief-ready'
  | 'shortlisted'
  | 'onboarding'
  | 'measuring'
  | 'closed'
  | 'still-open'
  | 'insufficient-post-evidence';

export type PartnerProspect = {
  id: string;
  mode: DemandSignalEvidenceMode;
  displayName: string;
  legalEntityIdentified: boolean;
  eligibleIntentKinds: MarketplaceIntentKind[];
  supportedTimeBuckets: Array<'morning' | 'day' | 'evening' | 'night'>;
  targetDistrictIds: string[];
  expectedFreshSupplyUnits: number;
  serviceQualityScore: number | null;
  authoritativeFeedReady: boolean;
  providerConfirmationReady: boolean;
  onboardingLeadDays: number | null;
  paidPromotionBudgetRub: number | null;
};

export type PartnerAcquisitionBrief = {
  id: string;
  mode: DemandSignalEvidenceMode;
  districtId: string;
  intentKind: MarketplaceIntentKind;
  timeBucket: DistrictDemandCell['timeBucket'];
  baselineCellKey: string;
  baselineObservations: number;
  baselineDistinctDays: number;
  baselineUnmetIntentRate: number | null;
  baselineSupplyCoverageRatio: number | null;
  baselineConfirmedDemandRate: number | null;
  requirement: {
    minimumFreshSupplyUnits: number;
    authoritativeAvailabilityRequired: boolean;
    providerConfirmationRequired: boolean;
  };
  prohibitedClaim: 'not-a-procurement-award-or-investment-authorization';
};

export type PartnerShortlistPolicy = {
  id: string;
  version: string;
  weights: {
    intentFit: number;
    timeCoverage: number;
    districtFit: number;
    operationalQuality: number;
    integrationReadiness: number;
    onboardingSpeed: number;
  };
  minimumScore: number;
};

export const PARTNER_SHORTLIST_POLICY_V1: PartnerShortlistPolicy = {
  id: 'moscow-opportunity-shortlist-v1',
  version: '1.0.0',
  weights: {
    intentFit: 0.3,
    timeCoverage: 0.2,
    districtFit: 0.15,
    operationalQuality: 0.15,
    integrationReadiness: 0.15,
    onboardingSpeed: 0.05
  },
  minimumScore: 0.5
};

export type PartnerShortlistResult = {
  prospect: PartnerProspect;
  score: number;
  rank: number;
  dimensions: {
    intentFit: number;
    timeCoverage: number;
    districtFit: number;
    operationalQuality: number;
    integrationReadiness: number;
    onboardingSpeed: number;
  };
  reasons: string[];
};

export type ExpectedSupplyImpact = {
  opportunityId: string;
  prospectId: string;
  mode: DemandSignalEvidenceMode;
  baselineFreshSupply: number | null;
  modelledAddedFreshSupply: number;
  modelledFreshSupplyAfter: number | null;
  baselineUnmetIntentRate: number | null;
  impactState: 'modelled-not-observed';
  prohibitedClaim: 'not-actual-demand-reduction';
};

export type OpportunityMeasurement = {
  opportunityId: string;
  mode: DemandSignalEvidenceMode;
  baseline: DistrictDemandCell;
  postOnboarding: DistrictDemandCell | null;
  enoughPostEvidence: boolean;
  observedUnmetIntentDelta: number | null;
  observedSupplyCoverageDelta: number | null;
  outcome: 'INSUFFICIENT' | 'GAP-CLOSED' | 'GAP-STILL-OPEN';
  attributionCausality: 'not-established';
};

export type CityOpportunityCase = {
  id: string;
  mode: DemandSignalEvidenceMode;
  status: OpportunityCaseStatus;
  brief: PartnerAcquisitionBrief;
  shortlist: PartnerShortlistResult[];
  expectedImpact: ExpectedSupplyImpact | null;
  selectedProspectId: string | null;
  onboardingEvidenceRef: string | null;
  measurement: OpportunityMeasurement | null;
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function validateShortlistPolicy(policy: PartnerShortlistPolicy) {
  const weights = Object.values(policy.weights);
  const sum = weights.reduce((acc, value) => acc + value, 0);
  const blockers: string[] = [];

  if (weights.some((value) => !Number.isFinite(value) || value < 0)) {
    blockers.push('invalid-weight');
  }
  if (Math.abs(sum - 1) > 0.000001) {
    blockers.push('weights-must-sum-to-one');
  }
  if (
    !Number.isFinite(policy.minimumScore)
    || policy.minimumScore < 0
    || policy.minimumScore > 1
  ) {
    blockers.push('invalid-minimum-score');
  }

  return { valid: blockers.length === 0, blockers };
}

export function buildPartnerAcquisitionBrief(
  cell: DistrictDemandCell
): PartnerAcquisitionBrief {
  if (cell.status !== 'OPPORTUNITY') {
    throw new Error('opportunity-brief-requires-opportunity-cell');
  }

  const minimumFreshSupplyUnits = Math.max(
    1,
    Math.ceil(
      Math.max(
        0,
        (cell.averageEligibleSupply ?? 1) - (cell.averageFreshAvailableSupply ?? 0)
      )
    )
  );

  return {
    id: `brief:${cell.key}`,
    mode: cell.mode,
    districtId: cell.districtId,
    intentKind: cell.intentKind,
    timeBucket: cell.timeBucket,
    baselineCellKey: cell.key,
    baselineObservations: cell.observations,
    baselineDistinctDays: cell.distinctDays,
    baselineUnmetIntentRate: cell.unmetIntentRate,
    baselineSupplyCoverageRatio: cell.supplyCoverageRatio,
    baselineConfirmedDemandRate: cell.confirmedDemandRate,
    requirement: {
      minimumFreshSupplyUnits,
      authoritativeAvailabilityRequired: true,
      providerConfirmationRequired: true
    },
    prohibitedClaim: 'not-a-procurement-award-or-investment-authorization'
  };
}

function prospectEligible(
  brief: PartnerAcquisitionBrief,
  prospect: PartnerProspect
) {
  if (!prospect.legalEntityIdentified) return false;
  if (!prospect.eligibleIntentKinds.includes(brief.intentKind)) return false;
  if (!prospect.supportedTimeBuckets.includes(brief.timeBucket)) return false;
  if (!prospect.targetDistrictIds.includes(brief.districtId)) return false;
  if (prospect.expectedFreshSupplyUnits <= 0) return false;
  return true;
}

function prospectDimensions(
  brief: PartnerAcquisitionBrief,
  prospect: PartnerProspect
): PartnerShortlistResult['dimensions'] {
  return {
    intentFit: prospect.eligibleIntentKinds.includes(brief.intentKind) ? 1 : 0,
    timeCoverage: prospect.supportedTimeBuckets.includes(brief.timeBucket) ? 1 : 0,
    districtFit: prospect.targetDistrictIds.includes(brief.districtId) ? 1 : 0,
    operationalQuality:
      prospect.serviceQualityScore === null
        ? 0.5
        : clamp01(prospect.serviceQualityScore),
    integrationReadiness:
      prospect.authoritativeFeedReady && prospect.providerConfirmationReady
        ? 1
        : prospect.authoritativeFeedReady || prospect.providerConfirmationReady
          ? 0.5
          : 0,
    onboardingSpeed:
      prospect.onboardingLeadDays === null
        ? 0.25
        : clamp01(1 - prospect.onboardingLeadDays / 90)
  };
}

export function shortlistPartnerProspects({
  brief,
  prospects,
  policy = PARTNER_SHORTLIST_POLICY_V1
}: {
  brief: PartnerAcquisitionBrief;
  prospects: PartnerProspect[];
  policy?: PartnerShortlistPolicy;
}): PartnerShortlistResult[] {
  const validation = validateShortlistPolicy(policy);
  if (!validation.valid) {
    throw new Error(`invalid-shortlist-policy:${validation.blockers.join(',')}`);
  }

  const scored = prospects
    .filter((prospect) => prospectEligible(brief, prospect))
    .map((prospect) => {
      const dimensions = prospectDimensions(brief, prospect);
      const score =
        dimensions.intentFit * policy.weights.intentFit
        + dimensions.timeCoverage * policy.weights.timeCoverage
        + dimensions.districtFit * policy.weights.districtFit
        + dimensions.operationalQuality * policy.weights.operationalQuality
        + dimensions.integrationReadiness * policy.weights.integrationReadiness
        + dimensions.onboardingSpeed * policy.weights.onboardingSpeed;

      return {
        prospect,
        score,
        dimensions,
        reasons: [
          `intentFit=${dimensions.intentFit.toFixed(3)}`,
          `timeCoverage=${dimensions.timeCoverage.toFixed(3)}`,
          `districtFit=${dimensions.districtFit.toFixed(3)}`,
          `operationalQuality=${dimensions.operationalQuality.toFixed(3)}`,
          `integrationReadiness=${dimensions.integrationReadiness.toFixed(3)}`,
          `onboardingSpeed=${dimensions.onboardingSpeed.toFixed(3)}`
        ]
      };
    })
    .filter((item) => item.score >= policy.minimumScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.prospect.id.localeCompare(b.prospect.id);
    });

  return scored.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

export function shortlistIsCommerciallyNeutral(results: PartnerShortlistResult[]) {
  const sortedWithoutPaidBudget = [...results].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.prospect.id.localeCompare(b.prospect.id);
  });

  return results.every(
    (item, index) => item.prospect.id === sortedWithoutPaidBudget[index]?.prospect.id
  );
}

export function modelExpectedSupplyImpact({
  opportunityId,
  brief,
  prospect,
  baselineCell
}: {
  opportunityId: string;
  brief: PartnerAcquisitionBrief;
  prospect: PartnerProspect;
  baselineCell: DistrictDemandCell;
}): ExpectedSupplyImpact {
  if (brief.baselineCellKey !== baselineCell.key) {
    throw new Error('baseline-cell-mismatch');
  }

  return {
    opportunityId,
    prospectId: prospect.id,
    mode: brief.mode,
    baselineFreshSupply: baselineCell.averageFreshAvailableSupply,
    modelledAddedFreshSupply: Math.max(0, prospect.expectedFreshSupplyUnits),
    modelledFreshSupplyAfter:
      baselineCell.averageFreshAvailableSupply === null
        ? null
        : baselineCell.averageFreshAvailableSupply
          + Math.max(0, prospect.expectedFreshSupplyUnits),
    baselineUnmetIntentRate: baselineCell.unmetIntentRate,
    impactState: 'modelled-not-observed',
    prohibitedClaim: 'not-actual-demand-reduction'
  };
}

function enoughPostEvidence(cell: DistrictDemandCell) {
  return (
    cell.observations >= DEMAND_CONTROL_POLICY_V1.minimumObservations
    && cell.distinctDays >= DEMAND_CONTROL_POLICY_V1.minimumDistinctDays
  );
}

export function measureOpportunityOutcome({
  opportunityId,
  baseline,
  postOnboarding
}: {
  opportunityId: string;
  baseline: DistrictDemandCell;
  postOnboarding: DistrictDemandCell | null;
}): OpportunityMeasurement {
  if (!postOnboarding || !enoughPostEvidence(postOnboarding)) {
    return {
      opportunityId,
      mode: baseline.mode,
      baseline,
      postOnboarding,
      enoughPostEvidence: false,
      observedUnmetIntentDelta: null,
      observedSupplyCoverageDelta: null,
      outcome: 'INSUFFICIENT',
      attributionCausality: 'not-established'
    };
  }

  const observedUnmetIntentDelta =
    baseline.unmetIntentRate === null || postOnboarding.unmetIntentRate === null
      ? null
      : postOnboarding.unmetIntentRate - baseline.unmetIntentRate;

  const observedSupplyCoverageDelta =
    baseline.supplyCoverageRatio === null || postOnboarding.supplyCoverageRatio === null
      ? null
      : postOnboarding.supplyCoverageRatio - baseline.supplyCoverageRatio;

  const gapClosed =
    postOnboarding.unmetIntentRate !== null
    && postOnboarding.supplyCoverageRatio !== null
    && postOnboarding.unmetIntentRate < DEMAND_CONTROL_POLICY_V1.watchUnmetIntentRate
    && postOnboarding.supplyCoverageRatio >= DEMAND_CONTROL_POLICY_V1.maximumHealthyCoverageRatio;

  return {
    opportunityId,
    mode: baseline.mode,
    baseline,
    postOnboarding,
    enoughPostEvidence: true,
    observedUnmetIntentDelta,
    observedSupplyCoverageDelta,
    outcome: gapClosed ? 'GAP-CLOSED' : 'GAP-STILL-OPEN',
    attributionCausality: 'not-established'
  };
}

export function buildCityOpportunityCase({
  id,
  baseline,
  prospects,
  selectedProspectId = null,
  onboardingEvidenceRef = null,
  postOnboarding = null
}: {
  id: string;
  baseline: DistrictDemandCell;
  prospects: PartnerProspect[];
  selectedProspectId?: string | null;
  onboardingEvidenceRef?: string | null;
  postOnboarding?: DistrictDemandCell | null;
}): CityOpportunityCase {
  const brief = buildPartnerAcquisitionBrief(baseline);
  const shortlist = shortlistPartnerProspects({ brief, prospects });

  const selected =
    selectedProspectId === null
      ? null
      : shortlist.find((item) => item.prospect.id === selectedProspectId) ?? null;

  const expectedImpact = selected
    ? modelExpectedSupplyImpact({
        opportunityId: id,
        brief,
        prospect: selected.prospect,
        baselineCell: baseline
      })
    : null;

  const measurement =
    selected && onboardingEvidenceRef
      ? measureOpportunityOutcome({
          opportunityId: id,
          baseline,
          postOnboarding
        })
      : null;

  let status: OpportunityCaseStatus = 'brief-ready';
  if (shortlist.length > 0) status = 'shortlisted';
  if (selected && !onboardingEvidenceRef) status = 'onboarding';
  if (selected && onboardingEvidenceRef && !measurement?.enoughPostEvidence) {
    status = 'insufficient-post-evidence';
  }
  if (measurement?.outcome === 'GAP-CLOSED') status = 'closed';
  if (measurement?.outcome === 'GAP-STILL-OPEN') status = 'still-open';

  return {
    id,
    mode: baseline.mode,
    status,
    brief,
    shortlist,
    expectedImpact,
    selectedProspectId,
    onboardingEvidenceRef,
    measurement
  };
}
