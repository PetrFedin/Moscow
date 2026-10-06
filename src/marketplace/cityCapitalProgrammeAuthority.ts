import {
  executionCapitalStatus,
  investmentCommitteeWorkspaceState,
  type InvestmentCommitteeWorkspace
} from './cityInvestmentCommitteeAuthority.ts';
import type { DemandSignalEvidenceMode } from './demandControlAuthority.ts';

export type CapitalProgrammeCase = {
  id: string;
  mode: DemandSignalEvidenceMode;
  programmeId: string;
  workspace: InvestmentCommitteeWorkspace;
  districtId: string;
  priority: 'CORE' | 'HIGH' | 'STANDARD';
};

export type UnderperformingIntervention = {
  caseId: string;
  districtId: string;
  label: string;
  committedCapitalRub: number;
  actualSpendRub: number | null;
  unspentCommittedRub: number | null;
  reason:
    | 'BENEFITS_MISSED'
    | 'BENEFITS_MIXED'
    | 'FORECAST_DIRECTION_MISSED'
    | 'EXECUTION_REJECTED'
    | 'CAPITAL_OVERRUN';
  reviewRequired: true;
};

export type ReallocationOpportunity = {
  id: string;
  source:
    | 'UNCOMMITTED_PROGRAMME_ENVELOPE'
    | 'UNDERPERFORMING_COMMITTED_CASE';
  caseId: string | null;
  amountRub: number;
  state:
    | 'AVAILABLE_UNCOMMITTED'
    | 'BLOCKED_PENDING_REVIEW_AND_DECOMMITMENT';
  reason: string;
  requiresHumanApproval: true;
};

export type CapitalProgrammeSnapshot = {
  programmeId: string;
  mode: DemandSignalEvidenceMode;
  authorizedEnvelopeRub: number;
  totalCases: number;
  approvedCases: number;
  committedCases: number;
  executingCases: number;
  benefitsReviewedCases: number;
  committedCapitalRub: number;
  actualSpendRub: number | null;
  uncommittedEnvelopeRub: number;
  committedButUnspentRub: number | null;
  executionProgressRate: number | null;
  benefitsRealization: {
    supported: number;
    mixed: number;
    missed: number;
    insufficient: number;
  };
  forecastAccuracy: {
    directionallyVerified: number;
    verifiedOptions: number;
    directionalHitRate: number | null;
    casesWithVerification: number;
  };
  underperforming: UnderperformingIntervention[];
  reallocationOpportunities: ReallocationOpportunity[];
  claims: {
    reallocationExecuted: false;
    investmentDecision: false;
    procurementDecision: false;
    causalityEstablished: false;
  };
};

function finiteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function buildCapitalProgrammeSnapshot({
  programmeId,
  mode,
  authorizedEnvelopeRub,
  cases
}: {
  programmeId: string;
  mode: DemandSignalEvidenceMode;
  authorizedEnvelopeRub: number;
  cases: CapitalProgrammeCase[];
}): CapitalProgrammeSnapshot {
  if (!finiteNonNegative(authorizedEnvelopeRub)) {
    throw new Error('invalid-programme-envelope');
  }

  const relevant = cases.filter(
    (item) => item.programmeId === programmeId && item.mode === mode
  );

  const states = relevant.map((item) => ({
    item,
    state: investmentCommitteeWorkspaceState(item.workspace),
    capital: executionCapitalStatus(
      item.workspace.commitment,
      item.workspace.execution
    )
  }));

  const committedCases = states.filter(
    ({ item }) => item.workspace.commitment?.state === 'COMMITTED'
  );

  const committedCapitalRub = committedCases.reduce(
    (sum, { item }) => sum + (item.workspace.commitment?.amountRub ?? 0),
    0
  );

  const actualSpendValues = committedCases
    .map(({ capital }) => capital.actualRub)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const actualSpendRub =
    actualSpendValues.length === 0
      ? null
      : actualSpendValues.reduce((sum, value) => sum + value, 0);

  const committedButUnspentRub =
    actualSpendRub === null
      ? null
      : Math.max(0, committedCapitalRub - actualSpendRub);

  const totalMilestones = relevant.reduce(
    (sum, item) => sum + item.workspace.execution.length,
    0
  );
  const acceptedMilestones = relevant.reduce(
    (sum, item) =>
      sum + item.workspace.execution.filter((milestone) => milestone.status === 'ACCEPTED').length,
    0
  );

  const benefits = relevant.map((item) => item.workspace.benefitsReview?.outcome ?? 'INSUFFICIENT');
  const benefitsRealization = {
    supported: benefits.filter((value) => value === 'SUPPORTED_DIRECTIONALLY').length,
    mixed: benefits.filter((value) => value === 'MIXED').length,
    missed: benefits.filter((value) => value === 'MISSED').length,
    insufficient: benefits.filter((value) => value === 'INSUFFICIENT').length
  };

  const verifications = relevant
    .map((item) => item.workspace.portfolioVerification)
    .filter((item): item is NonNullable<InvestmentCommitteeWorkspace['portfolioVerification']> =>
      item !== null
    );

  const directionallyVerified = verifications.reduce(
    (sum, item) => sum + item.directionallyVerified,
    0
  );
  const verifiedOptions = verifications.reduce(
    (sum, item) => sum + item.verifiedOptions,
    0
  );

  const underperforming: UnderperformingIntervention[] = [];

  for (const { item, capital } of states) {
    const commitment = item.workspace.commitment?.amountRub ?? 0;
    const actual = capital.actualRub;
    const unspent =
      actual === null
        ? null
        : Math.max(0, commitment - actual);

    const benefitsOutcome = item.workspace.benefitsReview?.outcome;
    const verification = item.workspace.portfolioVerification;
    const rejectedExecution = item.workspace.execution.some(
      (milestone) => milestone.status === 'REJECTED'
    );
    const overrun =
      actual !== null
      && item.workspace.commitment !== null
      && actual > item.workspace.commitment.amountRub;

    let reason: UnderperformingIntervention['reason'] | null = null;
    if (overrun) reason = 'CAPITAL_OVERRUN';
    else if (rejectedExecution) reason = 'EXECUTION_REJECTED';
    else if (benefitsOutcome === 'MISSED') reason = 'BENEFITS_MISSED';
    else if (benefitsOutcome === 'MIXED') reason = 'BENEFITS_MIXED';
    else if ((verification?.missedDirection ?? 0) > 0) reason = 'FORECAST_DIRECTION_MISSED';

    if (reason) {
      underperforming.push({
        caseId: item.id,
        districtId: item.districtId,
        label: item.workspace.businessCase.title,
        committedCapitalRub: commitment,
        actualSpendRub: actual,
        unspentCommittedRub: unspent,
        reason,
        reviewRequired: true
      });
    }
  }

  const uncommittedEnvelopeRub = Math.max(
    0,
    authorizedEnvelopeRub - committedCapitalRub
  );

  const reallocationOpportunities: ReallocationOpportunity[] = [];

  if (uncommittedEnvelopeRub > 0) {
    reallocationOpportunities.push({
      id: `${programmeId}:uncommitted-envelope`,
      source: 'UNCOMMITTED_PROGRAMME_ENVELOPE',
      caseId: null,
      amountRub: uncommittedEnvelopeRub,
      state: 'AVAILABLE_UNCOMMITTED',
      reason: 'Programme envelope not yet committed to approved cases.',
      requiresHumanApproval: true
    });
  }

  for (const item of underperforming) {
    if ((item.unspentCommittedRub ?? 0) <= 0) continue;

    reallocationOpportunities.push({
      id: `${programmeId}:review:${item.caseId}`,
      source: 'UNDERPERFORMING_COMMITTED_CASE',
      caseId: item.caseId,
      amountRub: item.unspentCommittedRub ?? 0,
      state: 'BLOCKED_PENDING_REVIEW_AND_DECOMMITMENT',
      reason: `${item.reason}; capital remains committed until formally reviewed and decommitted.`,
      requiresHumanApproval: true
    });
  }

  return {
    programmeId,
    mode,
    authorizedEnvelopeRub,
    totalCases: relevant.length,
    approvedCases: states.filter(
      ({ state }) =>
        state === 'READY_TO_COMMIT'
        || state === 'CAPITAL_NOT_ACTIVE'
        || state === 'EXECUTION'
        || state === 'BENEFITS_MEASUREMENT'
        || state === 'BENEFITS_REVIEWED'
    ).length,
    committedCases: committedCases.length,
    executingCases: states.filter(
      ({ state }) => state === 'EXECUTION'
    ).length,
    benefitsReviewedCases: states.filter(
      ({ state }) => state === 'BENEFITS_REVIEWED'
    ).length,
    committedCapitalRub,
    actualSpendRub,
    uncommittedEnvelopeRub,
    committedButUnspentRub,
    executionProgressRate:
      totalMilestones === 0
        ? null
        : acceptedMilestones / totalMilestones,
    benefitsRealization,
    forecastAccuracy: {
      directionallyVerified,
      verifiedOptions,
      directionalHitRate:
        verifiedOptions === 0
          ? null
          : directionallyVerified / verifiedOptions,
      casesWithVerification: verifications.length
    },
    underperforming,
    reallocationOpportunities,
    claims: {
      reallocationExecuted: false,
      investmentDecision: false,
      procurementDecision: false,
      causalityEstablished: false
    }
  };
}

export function reallocationCanExecute(
  opportunity: ReallocationOpportunity
) {
  return false;
}

export function programmeHasCapitalOvercommitment(
  snapshot: CapitalProgrammeSnapshot
) {
  return snapshot.committedCapitalRub > snapshot.authorizedEnvelopeRub;
}
