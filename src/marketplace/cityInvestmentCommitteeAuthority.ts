import type { DemandSignalEvidenceMode } from './demandControlAuthority.ts';
import type {
  CapitalAllocationPortfolio,
  PortfolioVerification
} from './districtPortfolioOptimizer.ts';

export type InvestmentCommitteeRole =
  | 'executive-sponsor'
  | 'business-owner'
  | 'finance'
  | 'procurement-legal'
  | 'technical-evidence'
  | 'investment-committee';

export type ApprovalStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONDITIONAL';

export type BudgetSourceType =
  | 'city-budget'
  | 'institution-budget'
  | 'partner-capex'
  | 'grant'
  | 'mixed'
  | 'other'
  | 'unresolved';

export type CommitteeEvidenceItem = {
  id: string;
  evidenceClass:
    | 'demand-baseline'
    | 'digital-twin'
    | 'portfolio-comparison'
    | 'cost-basis'
    | 'rights'
    | 'security'
    | 'procurement-review'
    | 'operations'
    | 'benefits-measurement';
  required: boolean;
  evidenceRef: string | null;
  accepted: boolean;
};

export type ProcurementPath = {
  status: 'UNRESOLVED' | 'LEGAL_REVIEW' | 'CONFIRMED';
  routeLabel: string | null;
  reviewRef: string | null;
  approvedByRole: InvestmentCommitteeRole | null;
  confirmedAt: string | null;
};

export type BudgetSource = {
  type: BudgetSourceType;
  amountRub: number | null;
  authorityRef: string | null;
};

export type InvestmentBusinessCase = {
  id: string;
  mode: DemandSignalEvidenceMode;
  portfolioId: string;
  title: string;
  districtId: string;
  executiveSponsor: string | null;
  businessOwner: string | null;
  requestedCapitalRub: number;
  budgetSources: BudgetSource[];
  procurementPath: ProcurementPath;
  evidencePackage: CommitteeEvidenceItem[];
  expectedBenefits: {
    unmetIntentDelta: number | null;
    footfallIndexDelta: number | null;
    confirmedDemandDelta: number | null;
    partnerGrossContributionDeltaRub: number | null;
  };
  claims: {
    procurementAward: false;
    investmentApproval: false;
    causalityEstablished: false;
  };
};

export type CommitteeApprovalStage = {
  id: string;
  order: number;
  role: InvestmentCommitteeRole;
  label: string;
  required: boolean;
  status: ApprovalStatus;
  decisionRef: string | null;
  decidedAt: string | null;
  conditions: string[];
};

export type CapitalCommitment = {
  businessCaseId: string;
  amountRub: number;
  committedAt: string;
  authorityRef: string;
  state: 'COMMITTED' | 'RELEASED' | 'CANCELLED';
};

export type ExecutionMilestone = {
  id: string;
  label: string;
  plannedCapitalRub: number;
  actualCapitalRub: number | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'READY_FOR_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED';
  evidenceRefs: string[];
  acceptanceRef: string | null;
};

export type BenefitsRealizationReview = {
  businessCaseId: string;
  evidenceRefs: string[];
  observed: {
    unmetIntentDelta: number | null;
    footfallIndexDelta: number | null;
    confirmedDemandDelta: number | null;
    partnerGrossContributionDeltaRub: number | null;
  };
  comparison: {
    unmetIntentForecastError: number | null;
    footfallForecastError: number | null;
    confirmedDemandForecastError: number | null;
    partnerEconomicsForecastErrorRub: number | null;
  };
  outcome: 'INSUFFICIENT' | 'SUPPORTED_DIRECTIONALLY' | 'MIXED' | 'MISSED';
  causality: 'not-established';
};

export type InvestmentCommitteeWorkspace = {
  businessCase: InvestmentBusinessCase;
  approvals: CommitteeApprovalStage[];
  commitment: CapitalCommitment | null;
  execution: ExecutionMilestone[];
  portfolioVerification: PortfolioVerification | null;
  benefitsReview: BenefitsRealizationReview | null;
};

function finitePositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

function finiteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function buildBusinessCaseFromPortfolio({
  id,
  title,
  districtId,
  portfolio,
  executiveSponsor,
  businessOwner,
  budgetSources,
  procurementPath,
  evidencePackage
}: {
  id: string;
  title: string;
  districtId: string;
  portfolio: CapitalAllocationPortfolio;
  executiveSponsor: string | null;
  businessOwner: string | null;
  budgetSources: BudgetSource[];
  procurementPath: ProcurementPath;
  evidencePackage: CommitteeEvidenceItem[];
}): InvestmentBusinessCase {
  return {
    id,
    mode: portfolio.mode,
    portfolioId: portfolio.id,
    title,
    districtId,
    executiveSponsor,
    businessOwner,
    requestedCapitalRub: portfolio.totalCapitalRub,
    budgetSources,
    procurementPath,
    evidencePackage,
    expectedBenefits: { ...portfolio.expectedImpact },
    claims: {
      procurementAward: false,
      investmentApproval: false,
      causalityEstablished: false
    }
  };
}

export function validateInvestmentBusinessCase(
  businessCase: InvestmentBusinessCase
) {
  const blockers: string[] = [];

  if (!businessCase.executiveSponsor?.trim()) blockers.push('executive-sponsor-missing');
  if (!businessCase.businessOwner?.trim()) blockers.push('business-owner-missing');
  if (!finitePositive(businessCase.requestedCapitalRub)) blockers.push('requested-capital-invalid');

  const funded = businessCase.budgetSources
    .filter((source) => source.type !== 'unresolved')
    .reduce((sum, source) => sum + (source.amountRub ?? 0), 0);

  if (
    businessCase.budgetSources.length === 0
    || businessCase.budgetSources.some(
      (source) =>
        source.type === 'unresolved'
        || source.amountRub === null
        || !finiteNonNegative(source.amountRub)
        || !source.authorityRef?.trim()
    )
  ) {
    blockers.push('budget-source-unresolved');
  } else if (funded < businessCase.requestedCapitalRub) {
    blockers.push('budget-source-insufficient');
  }

  if (businessCase.procurementPath.status !== 'CONFIRMED') {
    blockers.push('procurement-path-not-confirmed');
  } else {
    if (!businessCase.procurementPath.routeLabel?.trim()) {
      blockers.push('procurement-route-label-missing');
    }
    if (!businessCase.procurementPath.reviewRef?.trim()) {
      blockers.push('procurement-review-ref-missing');
    }
    if (!businessCase.procurementPath.approvedByRole) {
      blockers.push('procurement-approval-role-missing');
    }
    if (!businessCase.procurementPath.confirmedAt) {
      blockers.push('procurement-confirmed-at-missing');
    }
  }

  const missingEvidence = businessCase.evidencePackage.filter(
    (item) => item.required && (!item.evidenceRef?.trim() || !item.accepted)
  );
  if (missingEvidence.length > 0) blockers.push('required-evidence-incomplete');

  return {
    valid: blockers.length === 0,
    blockers,
    fundedCapitalRub: funded,
    missingEvidenceIds: missingEvidence.map((item) => item.id)
  };
}

export function committeeApprovalReadiness(
  businessCase: InvestmentBusinessCase,
  approvals: CommitteeApprovalStage[]
) {
  const businessCaseValidation = validateInvestmentBusinessCase(businessCase);
  const blockers = [...businessCaseValidation.blockers];

  const requiredStages = approvals
    .filter((stage) => stage.required)
    .sort((a, b) => a.order - b.order);

  const rejected = requiredStages.find((stage) => stage.status === 'REJECTED');
  if (rejected) blockers.push(`approval-rejected:${rejected.id}`);

  const conditional = requiredStages.find((stage) => stage.status === 'CONDITIONAL');
  if (conditional) blockers.push(`approval-conditional:${conditional.id}`);

  const incomplete = requiredStages.filter((stage) => stage.status !== 'APPROVED');
  if (incomplete.length > 0) blockers.push('required-approvals-incomplete');

  const malformedApproved = requiredStages.filter(
    (stage) =>
      stage.status === 'APPROVED'
      && (!stage.decisionRef?.trim() || !stage.decidedAt)
  );
  if (malformedApproved.length > 0) blockers.push('approved-stage-evidence-missing');

  return {
    readyToCommit: blockers.length === 0,
    blockers,
    requiredApprovalIds: requiredStages.map((stage) => stage.id),
    incompleteApprovalIds: incomplete.map((stage) => stage.id)
  };
}

export function approvalStageCanStart(
  stageId: string,
  approvals: CommitteeApprovalStage[]
) {
  const ordered = [...approvals].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((stage) => stage.id === stageId);
  if (index < 0) return false;

  const stage = ordered[index]!;
  if (stage.status === 'APPROVED' || stage.status === 'REJECTED') return false;

  const earlierRequired = ordered
    .slice(0, index)
    .filter((item) => item.required);

  return earlierRequired.every((item) => item.status === 'APPROVED');
}

export function createCapitalCommitment({
  businessCase,
  approvals,
  amountRub,
  committedAt,
  authorityRef
}: {
  businessCase: InvestmentBusinessCase;
  approvals: CommitteeApprovalStage[];
  amountRub: number;
  committedAt: string;
  authorityRef: string;
}): CapitalCommitment {
  const readiness = committeeApprovalReadiness(businessCase, approvals);
  if (!readiness.readyToCommit) {
    throw new Error(`capital-commitment-blocked:${readiness.blockers.join(',')}`);
  }
  if (!finitePositive(amountRub)) throw new Error('capital-commitment-invalid-amount');
  if (amountRub > businessCase.requestedCapitalRub) {
    throw new Error('capital-commitment-exceeds-approved-request');
  }
  if (!authorityRef.trim()) throw new Error('capital-commitment-authority-ref-missing');

  return {
    businessCaseId: businessCase.id,
    amountRub,
    committedAt,
    authorityRef,
    state: 'COMMITTED'
  };
}

export function executionCanStart(
  commitment: CapitalCommitment | null
) {
  return Boolean(commitment && commitment.state === 'COMMITTED');
}

export function executionCapitalStatus(
  commitment: CapitalCommitment | null,
  milestones: ExecutionMilestone[]
) {
  const committed = commitment?.state === 'COMMITTED' ? commitment.amountRub : 0;
  const planned = milestones.reduce(
    (sum, item) => sum + Math.max(0, item.plannedCapitalRub),
    0
  );
  const actualValues = milestones
    .map((item) => item.actualCapitalRub)
    .filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
  const actual = actualValues.reduce((sum, value) => sum + value, 0);

  return {
    committedRub: committed,
    plannedRub: planned,
    actualRub: actualValues.length > 0 ? actual : null,
    planWithinCommitment: planned <= committed,
    actualWithinCommitment: actualValues.length === 0 ? null : actual <= committed
  };
}

function error(actual: number | null, expected: number | null) {
  if (actual === null || expected === null) return null;
  return actual - expected;
}

export function buildBenefitsRealizationReview({
  businessCase,
  evidenceRefs,
  observed,
  portfolioVerification
}: {
  businessCase: InvestmentBusinessCase;
  evidenceRefs: string[];
  observed: BenefitsRealizationReview['observed'];
  portfolioVerification: PortfolioVerification | null;
}): BenefitsRealizationReview {
  const enoughEvidence =
    evidenceRefs.length > 0
    && portfolioVerification !== null
    && portfolioVerification.conclusion !== 'INSUFFICIENT';

  let outcome: BenefitsRealizationReview['outcome'] = 'INSUFFICIENT';
  if (enoughEvidence && portfolioVerification) {
    if (portfolioVerification.conclusion === 'DIRECTIONALLY_SUPPORTED') {
      outcome = 'SUPPORTED_DIRECTIONALLY';
    } else if (portfolioVerification.conclusion === 'MIXED') {
      outcome = 'MIXED';
    } else if (portfolioVerification.conclusion === 'DIRECTIONALLY_MISSED') {
      outcome = 'MISSED';
    }
  }

  return {
    businessCaseId: businessCase.id,
    evidenceRefs,
    observed,
    comparison: {
      unmetIntentForecastError: error(
        observed.unmetIntentDelta,
        businessCase.expectedBenefits.unmetIntentDelta
      ),
      footfallForecastError: error(
        observed.footfallIndexDelta,
        businessCase.expectedBenefits.footfallIndexDelta
      ),
      confirmedDemandForecastError: error(
        observed.confirmedDemandDelta,
        businessCase.expectedBenefits.confirmedDemandDelta
      ),
      partnerEconomicsForecastErrorRub: error(
        observed.partnerGrossContributionDeltaRub,
        businessCase.expectedBenefits.partnerGrossContributionDeltaRub
      )
    },
    outcome,
    causality: 'not-established'
  };
}

export function investmentCommitteeWorkspaceState(
  workspace: InvestmentCommitteeWorkspace
) {
  const validation = validateInvestmentBusinessCase(workspace.businessCase);
  const approval = committeeApprovalReadiness(
    workspace.businessCase,
    workspace.approvals
  );

  if (!validation.valid) return 'BUSINESS_CASE_BLOCKED' as const;
  if (!approval.readyToCommit) return 'APPROVALS_PENDING' as const;
  if (!workspace.commitment) return 'READY_TO_COMMIT' as const;
  if (!executionCanStart(workspace.commitment)) return 'CAPITAL_NOT_ACTIVE' as const;

  const executionAccepted =
    workspace.execution.length > 0
    && workspace.execution.every((item) => item.status === 'ACCEPTED');

  if (!executionAccepted) return 'EXECUTION' as const;
  if (!workspace.benefitsReview || workspace.benefitsReview.outcome === 'INSUFFICIENT') {
    return 'BENEFITS_MEASUREMENT' as const;
  }

  return 'BENEFITS_REVIEWED' as const;
}
