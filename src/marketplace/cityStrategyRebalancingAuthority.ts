import type { DemandSignalEvidenceMode } from './demandControlAuthority.ts';
import type {
  CapitalProgrammeSnapshot,
  ReallocationOpportunity,
  UnderperformingIntervention
} from './cityCapitalProgrammeAuthority.ts';

export type StrategicPriority = {
  id: string;
  label: string;
  weight: number;
  districtIds: string[];
  strategicTheme:
    | 'demand-gap'
    | 'culture-access'
    | 'evening-economy'
    | 'provider-infrastructure'
    | 'partner-quality'
    | 'regional-replication';
  evidenceRef: string | null;
};

export type UnderperformanceReview = {
  id: string;
  caseId: string;
  reason: UnderperformingIntervention['reason'];
  status: 'NOT_STARTED' | 'IN_REVIEW' | 'COMPLETE';
  evidenceRefs: string[];
  conclusion:
    | 'UNRESOLVED'
    | 'KEEP'
    | 'REMEDIATE'
    | 'DECOMMIT_PARTIAL'
    | 'DECOMMIT_FULL';
  recommendedDecommitmentRub: number;
  reviewRef: string | null;
  reviewedByRole: 'finance' | 'investment-committee' | null;
};

export type DecommitmentProposal = {
  id: string;
  caseId: string;
  amountRub: number;
  reviewRef: string;
  state: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  authorityRef: string | null;
  decidedAt: string | null;
};

export type AlternativeFundingCandidate = {
  id: string;
  mode: DemandSignalEvidenceMode;
  label: string;
  districtId: string;
  strategicTheme: StrategicPriority['strategicTheme'];
  requiredCapitalRub: number;
  evidenceConfidence: number;
  implementationDays: number;
  expectedImpactScore: number;
  evidenceRefs: string[];
};

export type StrategicCandidateScore = {
  candidate: AlternativeFundingCandidate;
  score: number;
  rank: number;
  priorityFit: number;
  capitalEfficiency: number;
  eligible: boolean;
  blockers: string[];
};

export type ReallocationFundingSource = {
  id: string;
  sourceType:
    | 'UNCOMMITTED_ENVELOPE'
    | 'APPROVED_DECOMMITMENT'
    | 'BLOCKED_COMMITTED_CAPITAL';
  caseId: string | null;
  amountRub: number;
  availableNow: boolean;
  authorityRef: string | null;
};

export type ReallocationDecisionPack = {
  id: string;
  programmeId: string;
  mode: DemandSignalEvidenceMode;
  priorities: StrategicPriority[];
  underperformanceReviews: UnderperformanceReview[];
  decommitmentProposals: DecommitmentProposal[];
  fundingSources: ReallocationFundingSource[];
  candidateShortlist: StrategicCandidateScore[];
  immediatelyAvailableCapitalRub: number;
  blockedPotentialCapitalRub: number;
  recommendedAllocations: Array<{
    candidateId: string;
    amountRub: number;
  }>;
  unallocatedAvailableRub: number;
  claims: {
    decommitmentExecuted: false;
    reallocationExecuted: false;
    nextCycleFundingApproved: false;
    investmentDecision: false;
  };
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function finitePositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function validateStrategicPriorities(priorities: StrategicPriority[]) {
  const blockers: string[] = [];
  const totalWeight = priorities.reduce((sum, item) => sum + item.weight, 0);

  if (priorities.length === 0) blockers.push('strategic-priorities-missing');
  if (
    priorities.some(
      (item) =>
        !item.id.trim()
        || !item.label.trim()
        || !Number.isFinite(item.weight)
        || item.weight < 0
        || item.weight > 1
        || !item.evidenceRef?.trim()
    )
  ) {
    blockers.push('strategic-priority-invalid');
  }
  if (Math.abs(totalWeight - 1) > 0.000001) {
    blockers.push('strategic-priority-weights-must-sum-to-one');
  }

  return { valid: blockers.length === 0, blockers };
}

export function buildUnderperformanceReviews(
  underperforming: UnderperformingIntervention[]
): UnderperformanceReview[] {
  return underperforming.map((item) => ({
    id: `review:${item.caseId}`,
    caseId: item.caseId,
    reason: item.reason,
    status: 'NOT_STARTED',
    evidenceRefs: [],
    conclusion: 'UNRESOLVED',
    recommendedDecommitmentRub: 0,
    reviewRef: null,
    reviewedByRole: null
  }));
}

export function createDecommitmentProposal(
  review: UnderperformanceReview
): DecommitmentProposal {
  if (review.status !== 'COMPLETE') {
    throw new Error('decommitment-review-not-complete');
  }
  if (
    review.conclusion !== 'DECOMMIT_PARTIAL'
    && review.conclusion !== 'DECOMMIT_FULL'
  ) {
    throw new Error('decommitment-review-does-not-support-release');
  }
  if (!finitePositive(review.recommendedDecommitmentRub)) {
    throw new Error('decommitment-amount-invalid');
  }
  if (!review.reviewRef?.trim()) {
    throw new Error('decommitment-review-ref-missing');
  }

  return {
    id: `decommit:${review.caseId}`,
    caseId: review.caseId,
    amountRub: review.recommendedDecommitmentRub,
    reviewRef: review.reviewRef,
    state: 'DRAFT',
    authorityRef: null,
    decidedAt: null
  };
}

export function decommitmentAmountAvailable(
  proposal: DecommitmentProposal
) {
  return proposal.state === 'APPROVED'
    && Boolean(proposal.authorityRef?.trim())
    && Boolean(proposal.decidedAt)
    ? proposal.amountRub
    : 0;
}

function strategicPriorityFit(
  candidate: AlternativeFundingCandidate,
  priorities: StrategicPriority[]
) {
  const matched = priorities.filter(
    (priority) =>
      priority.strategicTheme === candidate.strategicTheme
      || priority.districtIds.includes(candidate.districtId)
  );

  return clamp01(
    matched.reduce((sum, item) => sum + item.weight, 0)
  );
}

export function scoreStrategicFundingCandidate({
  candidate,
  priorities
}: {
  candidate: AlternativeFundingCandidate;
  priorities: StrategicPriority[];
}): StrategicCandidateScore {
  const blockers: string[] = [];

  if (!finitePositive(candidate.requiredCapitalRub)) blockers.push('candidate-capital-invalid');
  if (!Number.isFinite(candidate.implementationDays) || candidate.implementationDays <= 0) {
    blockers.push('candidate-implementation-invalid');
  }
  if (candidate.evidenceConfidence < 0.5 || candidate.evidenceConfidence > 1) {
    blockers.push('candidate-confidence-below-threshold');
  }
  if (candidate.evidenceRefs.length === 0) {
    blockers.push('candidate-evidence-missing');
  }

  const priorityFit = strategicPriorityFit(candidate, priorities);
  if (priorityFit <= 0) blockers.push('candidate-outside-strategic-priorities');

  const capitalEfficiency = clamp01(
    candidate.expectedImpactScore
      / Math.max(candidate.requiredCapitalRub / 100000000, 0.1)
  );
  const speed = clamp01(1 - candidate.implementationDays / 180);

  const score = clamp01(
    priorityFit * 0.35
    + clamp01(candidate.expectedImpactScore) * 0.25
    + clamp01(candidate.evidenceConfidence) * 0.2
    + capitalEfficiency * 0.15
    + speed * 0.05
  );

  return {
    candidate,
    score,
    rank: 0,
    priorityFit,
    capitalEfficiency,
    eligible: blockers.length === 0,
    blockers
  };
}

export function buildReallocationFundingSources({
  snapshot,
  proposals
}: {
  snapshot: CapitalProgrammeSnapshot;
  proposals: DecommitmentProposal[];
}): ReallocationFundingSource[] {
  const sources: ReallocationFundingSource[] = [];

  if (snapshot.uncommittedEnvelopeRub > 0) {
    sources.push({
      id: `${snapshot.programmeId}:uncommitted`,
      sourceType: 'UNCOMMITTED_ENVELOPE',
      caseId: null,
      amountRub: snapshot.uncommittedEnvelopeRub,
      availableNow: true,
      authorityRef: 'PROGRAMME-ENVELOPE'
    });
  }

  for (const opportunity of snapshot.reallocationOpportunities) {
    if (opportunity.source !== 'UNDERPERFORMING_COMMITTED_CASE') continue;

    const proposal = proposals.find(
      (item) => item.caseId === opportunity.caseId
    );

    const approvedAmount = proposal
      ? decommitmentAmountAvailable(proposal)
      : 0;

    if (approvedAmount > 0) {
      sources.push({
        id: `${snapshot.programmeId}:approved-decommit:${opportunity.caseId}`,
        sourceType: 'APPROVED_DECOMMITMENT',
        caseId: opportunity.caseId,
        amountRub: Math.min(approvedAmount, opportunity.amountRub),
        availableNow: true,
        authorityRef: proposal?.authorityRef ?? null
      });
    } else {
      sources.push({
        id: `${snapshot.programmeId}:blocked:${opportunity.caseId}`,
        sourceType: 'BLOCKED_COMMITTED_CAPITAL',
        caseId: opportunity.caseId,
        amountRub: opportunity.amountRub,
        availableNow: false,
        authorityRef: null
      });
    }
  }

  return sources;
}

export function buildReallocationDecisionPack({
  id,
  snapshot,
  priorities,
  reviews,
  proposals,
  candidates
}: {
  id: string;
  snapshot: CapitalProgrammeSnapshot;
  priorities: StrategicPriority[];
  reviews: UnderperformanceReview[];
  proposals: DecommitmentProposal[];
  candidates: AlternativeFundingCandidate[];
}): ReallocationDecisionPack {
  const priorityValidation = validateStrategicPriorities(priorities);
  if (!priorityValidation.valid) {
    throw new Error(
      `invalid-strategic-priorities:${priorityValidation.blockers.join(',')}`
    );
  }

  const fundingSources = buildReallocationFundingSources({
    snapshot,
    proposals
  });

  const immediatelyAvailableCapitalRub = fundingSources
    .filter((item) => item.availableNow)
    .reduce((sum, item) => sum + item.amountRub, 0);

  const blockedPotentialCapitalRub = fundingSources
    .filter((item) => !item.availableNow)
    .reduce((sum, item) => sum + item.amountRub, 0);

  const candidateShortlist = candidates
    .filter((item) => item.mode === snapshot.mode)
    .map((candidate) => scoreStrategicFundingCandidate({
      candidate,
      priorities
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidate.requiredCapitalRub - b.candidate.requiredCapitalRub;
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const recommendedAllocations: ReallocationDecisionPack['recommendedAllocations'] = [];
  let available = immediatelyAvailableCapitalRub;

  for (const scored of candidateShortlist) {
    if (!scored.eligible) continue;
    if (scored.candidate.requiredCapitalRub > available) continue;

    recommendedAllocations.push({
      candidateId: scored.candidate.id,
      amountRub: scored.candidate.requiredCapitalRub
    });
    available -= scored.candidate.requiredCapitalRub;
  }

  return {
    id,
    programmeId: snapshot.programmeId,
    mode: snapshot.mode,
    priorities,
    underperformanceReviews: reviews,
    decommitmentProposals: proposals,
    fundingSources,
    candidateShortlist,
    immediatelyAvailableCapitalRub,
    blockedPotentialCapitalRub,
    recommendedAllocations,
    unallocatedAvailableRub: available,
    claims: {
      decommitmentExecuted: false,
      reallocationExecuted: false,
      nextCycleFundingApproved: false,
      investmentDecision: false
    }
  };
}

export function nextCycleFundingCanExecute(
  pack: ReallocationDecisionPack
) {
  return false;
}
