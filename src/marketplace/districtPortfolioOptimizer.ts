import type { DemandSignalEvidenceMode } from './demandControlAuthority.ts';
import type { DistrictTwinScenarioResult } from './districtEconomicTwinAuthority.ts';

export type CapitalOption = {
  id: string;
  mode: DemandSignalEvidenceMode;
  scenario: DistrictTwinScenarioResult;
  requiredCapitalRub: number;
  implementationDays: number;
  evidenceConfidence: number;
  riskPenalty: number;
  mutuallyExclusiveGroup: string | null;
};

export type CapitalAllocationPolicy = {
  id: string;
  version: string;
  weights: {
    unmetDemandReduction: number;
    footfallImpact: number;
    confirmedDemandImpact: number;
    partnerEconomicsImpact: number;
    speed: number;
    evidenceConfidence: number;
    capitalEfficiency: number;
  };
  minimumConfidence: number;
  maximumRiskPenalty: number;
};

export const CAPITAL_ALLOCATION_POLICY_V1: CapitalAllocationPolicy = {
  id: 'moscow-district-capital-allocation-v1',
  version: '1.0.0',
  weights: {
    unmetDemandReduction: 0.25,
    footfallImpact: 0.15,
    confirmedDemandImpact: 0.15,
    partnerEconomicsImpact: 0.1,
    speed: 0.1,
    evidenceConfidence: 0.15,
    capitalEfficiency: 0.1
  },
  minimumConfidence: 0.5,
  maximumRiskPenalty: 0.5
};

export type CapitalOptionScore = {
  option: CapitalOption;
  score: number;
  rank: number;
  eligible: boolean;
  blockers: string[];
  dimensions: {
    unmetDemandReduction: number;
    footfallImpact: number;
    confirmedDemandImpact: number;
    partnerEconomicsImpact: number;
    speed: number;
    evidenceConfidence: number;
    capitalEfficiency: number;
  };
};

export type CapitalAllocationPortfolio = {
  id: string;
  mode: DemandSignalEvidenceMode;
  budgetRub: number;
  selected: CapitalOptionScore[];
  rejected: CapitalOptionScore[];
  totalCapitalRub: number;
  budgetRemainingRub: number;
  expectedImpact: {
    unmetIntentDelta: number | null;
    footfallIndexDelta: number | null;
    confirmedDemandDelta: number | null;
    partnerGrossContributionDeltaRub: number | null;
  };
  claims: {
    recommendationOnly: true;
    procurementDecision: false;
    investmentDecision: false;
    causalityEstablished: false;
  };
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function positiveMagnitude(value: number | null, scale: number) {
  if (value === null) return 0;
  return clamp01(Math.max(0, value) / Math.max(scale, 0.000001));
}

function reductionMagnitude(value: number | null, scale: number) {
  if (value === null) return 0;
  return clamp01(Math.max(0, -value) / Math.max(scale, 0.000001));
}

export function validateCapitalAllocationPolicy(policy: CapitalAllocationPolicy) {
  const weights = Object.values(policy.weights);
  const sum = weights.reduce((acc, value) => acc + value, 0);
  const blockers: string[] = [];

  if (weights.some((value) => !Number.isFinite(value) || value < 0)) {
    blockers.push('invalid-weight');
  }
  if (Math.abs(sum - 1) > 0.000001) {
    blockers.push('weights-must-sum-to-one');
  }
  if (policy.minimumConfidence < 0 || policy.minimumConfidence > 1) {
    blockers.push('invalid-minimum-confidence');
  }
  if (policy.maximumRiskPenalty < 0 || policy.maximumRiskPenalty > 1) {
    blockers.push('invalid-maximum-risk-penalty');
  }

  return { valid: blockers.length === 0, blockers };
}

export function scoreCapitalOption(
  option: CapitalOption,
  policy: CapitalAllocationPolicy = CAPITAL_ALLOCATION_POLICY_V1
): CapitalOptionScore {
  const blockers: string[] = [];

  if (!Number.isFinite(option.requiredCapitalRub) || option.requiredCapitalRub <= 0) {
    blockers.push('invalid-capital');
  }
  if (!Number.isFinite(option.implementationDays) || option.implementationDays <= 0) {
    blockers.push('invalid-implementation-days');
  }
  if (option.evidenceConfidence < policy.minimumConfidence) {
    blockers.push('confidence-below-threshold');
  }
  if (option.riskPenalty > policy.maximumRiskPenalty) {
    blockers.push('risk-above-threshold');
  }
  if (option.scenario.state === 'BLOCKED_NOT_CALIBRATED') {
    blockers.push('scenario-not-calibrated');
  }

  const d = option.scenario.deltas;
  const dimensions = {
    unmetDemandReduction: reductionMagnitude(d.unmetIntentRate, 0.25),
    footfallImpact: positiveMagnitude(d.footfallIndex, 25),
    confirmedDemandImpact: positiveMagnitude(d.confirmedDemandRate, 0.2),
    partnerEconomicsImpact: positiveMagnitude(d.partnerGrossContributionRub, 500000),
    speed: clamp01(1 - option.implementationDays / 180),
    evidenceConfidence: clamp01(option.evidenceConfidence),
    capitalEfficiency: clamp01(
      option.requiredCapitalRub <= 0
        ? 0
        : (
            reductionMagnitude(d.unmetIntentRate, 0.25)
            + positiveMagnitude(d.confirmedDemandRate, 0.2)
            + positiveMagnitude(d.footfallIndex, 25)
          ) / 3 / Math.max(option.requiredCapitalRub / 100000000, 0.1)
    )
  };

  const weighted =
    dimensions.unmetDemandReduction * policy.weights.unmetDemandReduction
    + dimensions.footfallImpact * policy.weights.footfallImpact
    + dimensions.confirmedDemandImpact * policy.weights.confirmedDemandImpact
    + dimensions.partnerEconomicsImpact * policy.weights.partnerEconomicsImpact
    + dimensions.speed * policy.weights.speed
    + dimensions.evidenceConfidence * policy.weights.evidenceConfidence
    + dimensions.capitalEfficiency * policy.weights.capitalEfficiency;

  const score = clamp01(weighted * (1 - clamp01(option.riskPenalty)));

  return {
    option,
    score,
    rank: 0,
    eligible: blockers.length === 0,
    blockers,
    dimensions
  };
}

function conflicts(
  selected: CapitalOptionScore[],
  candidate: CapitalOptionScore
) {
  const group = candidate.option.mutuallyExclusiveGroup;
  if (!group) return false;
  return selected.some(
    (item) => item.option.mutuallyExclusiveGroup === group
  );
}

export function optimizeDistrictPortfolio({
  id,
  mode,
  budgetRub,
  options,
  policy = CAPITAL_ALLOCATION_POLICY_V1
}: {
  id: string;
  mode: DemandSignalEvidenceMode;
  budgetRub: number;
  options: CapitalOption[];
  policy?: CapitalAllocationPolicy;
}): CapitalAllocationPortfolio {
  const policyValidation = validateCapitalAllocationPolicy(policy);
  if (!policyValidation.valid) {
    throw new Error(`invalid-capital-policy:${policyValidation.blockers.join(',')}`);
  }
  if (!Number.isFinite(budgetRub) || budgetRub < 0) {
    throw new Error('invalid-budget');
  }

  const scored = options
    .filter((item) => item.mode === mode)
    .map((item) => scoreCapitalOption(item, policy))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.option.requiredCapitalRub - b.option.requiredCapitalRub;
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const selected: CapitalOptionScore[] = [];
  let used = 0;

  for (const item of scored) {
    if (!item.eligible) continue;
    if (conflicts(selected, item)) continue;
    if (used + item.option.requiredCapitalRub > budgetRub) continue;

    selected.push(item);
    used += item.option.requiredCapitalRub;
  }

  const selectedIds = new Set(selected.map((item) => item.option.id));
  const rejected = scored.filter((item) => !selectedIds.has(item.option.id));

  const aggregate = <K extends keyof CapitalOption['scenario']['deltas']>(
    key: K
  ) => {
    const values = selected
      .map((item) => item.option.scenario.deltas[key])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0);
  };

  return {
    id,
    mode,
    budgetRub,
    selected,
    rejected,
    totalCapitalRub: used,
    budgetRemainingRub: budgetRub - used,
    expectedImpact: {
      unmetIntentDelta: aggregate('unmetIntentRate'),
      footfallIndexDelta: aggregate('footfallIndex'),
      confirmedDemandDelta: aggregate('confirmedDemandRate'),
      partnerGrossContributionDeltaRub: aggregate('partnerGrossContributionRub')
    },
    claims: {
      recommendationOnly: true,
      procurementDecision: false,
      investmentDecision: false,
      causalityEstablished: false
    }
  };
}

export type PortfolioVerification = {
  portfolioId: string;
  verifiedOptions: number;
  insufficientOptions: number;
  directionallyVerified: number;
  missedDirection: number;
  totalActualCapitalRub: number | null;
  conclusion:
    | 'INSUFFICIENT'
    | 'MIXED'
    | 'DIRECTIONALLY_SUPPORTED'
    | 'DIRECTIONALLY_MISSED';
  causality: 'not-established';
};

export function verifyCapitalPortfolio({
  portfolio,
  optionVerification
}: {
  portfolio: CapitalAllocationPortfolio;
  optionVerification: Array<{
    optionId: string;
    result: 'INSUFFICIENT' | 'VERIFIED_DIRECTIONALLY' | 'MISSED_DIRECTION';
    actualCapitalRub: number | null;
  }>;
}): PortfolioVerification {
  const selectedIds = new Set(portfolio.selected.map((item) => item.option.id));
  const relevant = optionVerification.filter((item) => selectedIds.has(item.optionId));

  const verified = relevant.filter((item) => item.result !== 'INSUFFICIENT');
  const supported = verified.filter((item) => item.result === 'VERIFIED_DIRECTIONALLY').length;
  const missed = verified.filter((item) => item.result === 'MISSED_DIRECTION').length;
  const insufficient = relevant.filter((item) => item.result === 'INSUFFICIENT').length;
  const actualCosts = relevant
    .map((item) => item.actualCapitalRub)
    .filter((item): item is number => typeof item === 'number' && Number.isFinite(item));

  let conclusion: PortfolioVerification['conclusion'] = 'INSUFFICIENT';
  if (verified.length > 0) {
    if (supported > 0 && missed > 0) conclusion = 'MIXED';
    else if (supported > 0) conclusion = 'DIRECTIONALLY_SUPPORTED';
    else conclusion = 'DIRECTIONALLY_MISSED';
  }

  return {
    portfolioId: portfolio.id,
    verifiedOptions: verified.length,
    insufficientOptions: insufficient,
    directionallyVerified: supported,
    missedDirection: missed,
    totalActualCapitalRub:
      actualCosts.length === 0
        ? null
        : actualCosts.reduce((sum, value) => sum + value, 0),
    conclusion,
    causality: 'not-established'
  };
}
