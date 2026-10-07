import type { DemandSignalEvidenceMode } from './demandControlAuthority.ts';
import type {
  CalibrationProposal,
  ForecastErrorRecord,
  LearningPolicyVersion,
  LearningSegment
} from './cityStrategyLearningAuthority.ts';

export type ModelRiskTier = 'TIER_1_CRITICAL' | 'TIER_2_MATERIAL' | 'TIER_3_SUPPORTING';

export type ModelInventoryRecord = {
  id: string;
  mode: DemandSignalEvidenceMode;
  modelName: string;
  modelType: 'digital-twin' | 'ranking' | 'portfolio-optimizer' | 'learning-policy';
  riskTier: ModelRiskTier;
  ownerRole: string;
  currentProductionVersion: string | null;
  challengerVersion: string | null;
  status: 'ACTIVE' | 'WATCH' | 'RESTRICTED' | 'RETIRED';
  purpose: string;
};

export type ModelVersionLineage = {
  modelId: string;
  version: string;
  predecessorVersion: string | null;
  state: 'DRAFT' | 'ACCEPTED' | 'ACTIVE' | 'RETIRED' | 'ROLLED_BACK';
  createdAt: string;
  acceptanceRef: string | null;
  activationRef: string | null;
  rollbackRef: string | null;
  evidenceRefs: string[];
};

export type ModelDriftSignal = {
  modelId: string;
  version: string;
  segmentKey: string;
  signal:
    | 'NO_DRIFT'
    | 'ERROR_DRIFT'
    | 'DIRECTIONAL_DRIFT'
    | 'CONFIDENCE_DRIFT'
    | 'INSUFFICIENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currentDirectionalHitRate: number | null;
  baselineDirectionalHitRate: number | null;
  currentMeanAbsoluteError: number | null;
  baselineMeanAbsoluteError: number | null;
  confidenceAdjustment: number;
  reviewRequired: boolean;
};

export type ModelSegmentWeakness = {
  modelId: string;
  version: string;
  segmentKey: string;
  archetype: string;
  districtContext: string;
  weakness:
    | 'LOW_DIRECTIONAL_ACCURACY'
    | 'HIGH_ABSOLUTE_ERROR'
    | 'SYSTEMATIC_BIAS'
    | 'LOW_SAMPLE'
    | 'NONE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  evidenceSummary: string[];
};

export type ChallengerEvaluation = {
  id: string;
  modelId: string;
  incumbentVersion: string;
  challengerVersion: string;
  holdoutRef: string;
  sampleSize: number;
  incumbentDirectionalHitRate: number;
  challengerDirectionalHitRate: number;
  incumbentMeanAbsoluteError: number;
  challengerMeanAbsoluteError: number;
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  segmentRegressionCount: number;
  segmentImprovementCount: number;
  outcome: 'CHALLENGER_WINS' | 'INCUMBENT_WINS' | 'MIXED' | 'INSUFFICIENT';
};

export type ModelPromotionGate = {
  modelId: string;
  challengerVersion: string;
  challengerEvaluationId: string;
  requiredApprovals: Array<'model-owner' | 'technical-evidence' | 'model-risk' | 'investment-governance'>;
  approvalRefs: Partial<Record<'model-owner' | 'technical-evidence' | 'model-risk' | 'investment-governance', string>>;
  rollbackPlanRef: string | null;
  monitoringPlanRef: string | null;
  state: 'BLOCKED' | 'READY_FOR_DECISION' | 'APPROVED' | 'REJECTED';
  blockers: string[];
};

export type ModelRollbackProposal = {
  id: string;
  modelId: string;
  currentVersion: string;
  rollbackTargetVersion: string;
  reason:
    | 'CRITICAL_DRIFT'
    | 'MATERIAL_PERFORMANCE_DEGRADATION'
    | 'BAD_CALIBRATION'
    | 'OPERATING_INCIDENT';
  evidenceRefs: string[];
  state: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  approvalRef: string | null;
  executionRef: string | null;
};

export type ModelRiskBoardSnapshot = {
  mode: DemandSignalEvidenceMode;
  inventory: ModelInventoryRecord[];
  lineage: ModelVersionLineage[];
  driftSignals: ModelDriftSignal[];
  segmentWeaknesses: ModelSegmentWeakness[];
  challengerEvaluations: ChallengerEvaluation[];
  promotionGates: ModelPromotionGate[];
  rollbackProposals: ModelRollbackProposal[];
  summary: {
    activeModels: number;
    restrictedModels: number;
    highOrCriticalDrift: number;
    weakSegments: number;
    challengersWinning: number;
    promotionReady: number;
    rollbackUnderReview: number;
  };
  claims: {
    autoPromote: false;
    autoRollback: false;
    autoActivate: false;
  };
};

function finite(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function buildDriftSignals({
  modelId,
  version,
  segments,
  baselineBySegment
}: {
  modelId: string;
  version: string;
  segments: LearningSegment[];
  baselineBySegment: Record<string, {
    directionalHitRate: number | null;
    meanAbsoluteError: number | null;
  }>;
}): ModelDriftSignal[] {
  return segments.map((segment) => {
    const baseline = baselineBySegment[segment.key];

    if (!baseline || segment.sufficientRecords < 2) {
      return {
        modelId,
        version,
        segmentKey: segment.key,
        signal: 'INSUFFICIENT',
        severity: 'LOW',
        currentDirectionalHitRate: segment.directionalHitRate,
        baselineDirectionalHitRate: baseline?.directionalHitRate ?? null,
        currentMeanAbsoluteError: segment.meanAbsoluteError,
        baselineMeanAbsoluteError: baseline?.meanAbsoluteError ?? null,
        confidenceAdjustment: segment.confidenceAdjustment,
        reviewRequired: false
      };
    }

    const hitDrop =
      finite(segment.directionalHitRate) && finite(baseline.directionalHitRate)
        ? baseline.directionalHitRate - segment.directionalHitRate
        : 0;
    const errorIncrease =
      finite(segment.meanAbsoluteError) && finite(baseline.meanAbsoluteError)
        ? segment.meanAbsoluteError - baseline.meanAbsoluteError
        : 0;

    let signal: ModelDriftSignal['signal'] = 'NO_DRIFT';
    let severity: ModelDriftSignal['severity'] = 'LOW';

    if (hitDrop >= 0.25) {
      signal = 'DIRECTIONAL_DRIFT';
      severity = hitDrop >= 0.4 ? 'CRITICAL' : 'HIGH';
    } else if (errorIncrease >= 0.15) {
      signal = 'ERROR_DRIFT';
      severity = errorIncrease >= 0.3 ? 'CRITICAL' : 'HIGH';
    } else if (segment.confidenceAdjustment <= -0.2) {
      signal = 'CONFIDENCE_DRIFT';
      severity = 'MEDIUM';
    }

    return {
      modelId,
      version,
      segmentKey: segment.key,
      signal,
      severity,
      currentDirectionalHitRate: segment.directionalHitRate,
      baselineDirectionalHitRate: baseline.directionalHitRate,
      currentMeanAbsoluteError: segment.meanAbsoluteError,
      baselineMeanAbsoluteError: baseline.meanAbsoluteError,
      confidenceAdjustment: segment.confidenceAdjustment,
      reviewRequired: severity === 'HIGH' || severity === 'CRITICAL'
    };
  });
}

export function detectSegmentWeaknesses({
  modelId,
  version,
  segments
}: {
  modelId: string;
  version: string;
  segments: LearningSegment[];
}): ModelSegmentWeakness[] {
  return segments.map((segment) => {
    let weakness: ModelSegmentWeakness['weakness'] = 'NONE';
    let severity: ModelSegmentWeakness['severity'] = 'LOW';

    if (segment.sufficientRecords < 2) {
      weakness = 'LOW_SAMPLE';
    } else if ((segment.directionalHitRate ?? 1) < 0.5) {
      weakness = 'LOW_DIRECTIONAL_ACCURACY';
      severity = 'HIGH';
    } else if ((segment.meanAbsoluteError ?? 0) > 0.2) {
      weakness = 'HIGH_ABSOLUTE_ERROR';
      severity = 'HIGH';
    } else if (
      segment.systematicBias === 'OVER_FORECAST'
      || segment.systematicBias === 'UNDER_FORECAST'
    ) {
      weakness = 'SYSTEMATIC_BIAS';
      severity = 'MEDIUM';
    }

    return {
      modelId,
      version,
      segmentKey: segment.key,
      archetype: segment.archetype,
      districtContext: segment.districtContext,
      weakness,
      severity,
      evidenceSummary: [
        `records=${segment.sufficientRecords}`,
        `hitRate=${segment.directionalHitRate ?? 'n/a'}`,
        `mae=${segment.meanAbsoluteError ?? 'n/a'}`,
        `bias=${segment.systematicBias}`
      ]
    };
  });
}

export function evaluateChallenger({
  id,
  modelId,
  incumbentVersion,
  challengerVersion,
  holdoutRef,
  sampleSize,
  incumbentDirectionalHitRate,
  challengerDirectionalHitRate,
  incumbentMeanAbsoluteError,
  challengerMeanAbsoluteError,
  segmentRegressionCount,
  segmentImprovementCount
}: Omit<ChallengerEvaluation, 'regressionRisk' | 'outcome'>): ChallengerEvaluation {
  const regressionRisk: ChallengerEvaluation['regressionRisk'] =
    segmentRegressionCount >= 3 ? 'HIGH'
    : segmentRegressionCount > 0 ? 'MEDIUM'
    : 'LOW';

  let outcome: ChallengerEvaluation['outcome'] = 'MIXED';
  if (sampleSize < 30) {
    outcome = 'INSUFFICIENT';
  } else if (
    challengerDirectionalHitRate > incumbentDirectionalHitRate
    && challengerMeanAbsoluteError < incumbentMeanAbsoluteError
    && segmentRegressionCount === 0
  ) {
    outcome = 'CHALLENGER_WINS';
  } else if (
    incumbentDirectionalHitRate >= challengerDirectionalHitRate
    && incumbentMeanAbsoluteError <= challengerMeanAbsoluteError
  ) {
    outcome = 'INCUMBENT_WINS';
  }

  return {
    id,
    modelId,
    incumbentVersion,
    challengerVersion,
    holdoutRef,
    sampleSize,
    incumbentDirectionalHitRate: clamp01(incumbentDirectionalHitRate),
    challengerDirectionalHitRate: clamp01(challengerDirectionalHitRate),
    incumbentMeanAbsoluteError: Math.max(0, incumbentMeanAbsoluteError),
    challengerMeanAbsoluteError: Math.max(0, challengerMeanAbsoluteError),
    regressionRisk,
    segmentRegressionCount,
    segmentImprovementCount,
    outcome
  };
}

export function buildPromotionGate({
  modelId,
  evaluation,
  approvalRefs,
  rollbackPlanRef,
  monitoringPlanRef
}: {
  modelId: string;
  evaluation: ChallengerEvaluation;
  approvalRefs: ModelPromotionGate['approvalRefs'];
  rollbackPlanRef: string | null;
  monitoringPlanRef: string | null;
}): ModelPromotionGate {
  const requiredApprovals: ModelPromotionGate['requiredApprovals'] = [
    'model-owner',
    'technical-evidence',
    'model-risk',
    'investment-governance'
  ];
  const blockers: string[] = [];

  if (evaluation.outcome !== 'CHALLENGER_WINS') {
    blockers.push('challenger-not-superior');
  }
  if (evaluation.sampleSize < 30) blockers.push('holdout-sample-too-small');
  if (evaluation.regressionRisk !== 'LOW') blockers.push('segment-regression-risk');
  if (!rollbackPlanRef?.trim()) blockers.push('rollback-plan-missing');
  if (!monitoringPlanRef?.trim()) blockers.push('monitoring-plan-missing');

  for (const role of requiredApprovals) {
    if (!approvalRefs[role]?.trim()) blockers.push(`approval-missing:${role}`);
  }

  return {
    modelId,
    challengerVersion: evaluation.challengerVersion,
    challengerEvaluationId: evaluation.id,
    requiredApprovals,
    approvalRefs,
    rollbackPlanRef,
    monitoringPlanRef,
    state: blockers.length === 0 ? 'READY_FOR_DECISION' : 'BLOCKED',
    blockers
  };
}

export function approvePromotionGate(
  gate: ModelPromotionGate,
  decisionRef: string
): ModelPromotionGate {
  if (gate.state !== 'READY_FOR_DECISION') {
    throw new Error(`promotion-gate-blocked:${gate.blockers.join(',')}`);
  }
  if (!decisionRef.trim()) throw new Error('promotion-decision-ref-missing');

  return {
    ...gate,
    state: 'APPROVED',
    approvalRefs: {
      ...gate.approvalRefs,
      'investment-governance': decisionRef
    }
  };
}

export function proposeRollback({
  id,
  modelId,
  currentVersion,
  rollbackTargetVersion,
  reason,
  evidenceRefs
}: Omit<ModelRollbackProposal, 'state' | 'approvalRef' | 'executionRef'>): ModelRollbackProposal {
  if (currentVersion === rollbackTargetVersion) {
    throw new Error('rollback-target-equals-current');
  }
  if (evidenceRefs.length === 0) {
    throw new Error('rollback-evidence-missing');
  }

  return {
    id,
    modelId,
    currentVersion,
    rollbackTargetVersion,
    reason,
    evidenceRefs,
    state: 'DRAFT',
    approvalRef: null,
    executionRef: null
  };
}

export function approveRollback(
  proposal: ModelRollbackProposal,
  approvalRef: string
): ModelRollbackProposal {
  if (!approvalRef.trim()) throw new Error('rollback-approval-ref-missing');
  return { ...proposal, state: 'APPROVED', approvalRef };
}

export function executeRollback(
  proposal: ModelRollbackProposal,
  executionRef: string
): ModelRollbackProposal {
  if (proposal.state !== 'APPROVED') throw new Error('rollback-not-approved');
  if (!executionRef.trim()) throw new Error('rollback-execution-ref-missing');

  return { ...proposal, state: 'EXECUTED', executionRef };
}

export function lineageFromLearningPolicy(
  modelId: string,
  policies: LearningPolicyVersion[]
): ModelVersionLineage[] {
  return policies.map((policy) => ({
    modelId,
    version: policy.version,
    predecessorVersion: policy.predecessorVersion,
    state: policy.status,
    createdAt: policy.acceptedAt ?? policy.assumptions.calibratedAt ?? 'unknown',
    acceptanceRef: policy.acceptanceRef,
    activationRef:
      policy.status === 'ACTIVE'
        ? policy.evidenceRefs.at(-1) ?? null
        : null,
    rollbackRef: null,
    evidenceRefs: policy.evidenceRefs
  }));
}

export function calibrationLineageRisk(
  proposal: CalibrationProposal
) {
  return {
    proposalId: proposal.id,
    sourcePolicyVersion: proposal.sourcePolicyVersion,
    proposedPolicyVersion: proposal.proposedPolicyVersion,
    state: proposal.state,
    productionReady: proposal.claims.productionReady,
    autoActivated: proposal.claims.activatedAutomatically
  };
}

export function buildModelRiskBoardSnapshot({
  mode,
  inventory,
  lineage,
  driftSignals,
  segmentWeaknesses,
  challengerEvaluations,
  promotionGates,
  rollbackProposals
}: Omit<ModelRiskBoardSnapshot, 'summary' | 'claims'>): ModelRiskBoardSnapshot {
  return {
    mode,
    inventory,
    lineage,
    driftSignals,
    segmentWeaknesses,
    challengerEvaluations,
    promotionGates,
    rollbackProposals,
    summary: {
      activeModels: inventory.filter((item) => item.status === 'ACTIVE').length,
      restrictedModels: inventory.filter((item) => item.status === 'RESTRICTED').length,
      highOrCriticalDrift: driftSignals.filter(
        (item) => item.severity === 'HIGH' || item.severity === 'CRITICAL'
      ).length,
      weakSegments: segmentWeaknesses.filter((item) => item.weakness !== 'NONE').length,
      challengersWinning: challengerEvaluations.filter(
        (item) => item.outcome === 'CHALLENGER_WINS'
      ).length,
      promotionReady: promotionGates.filter(
        (item) => item.state === 'READY_FOR_DECISION' || item.state === 'APPROVED'
      ).length,
      rollbackUnderReview: rollbackProposals.filter(
        (item) => item.state === 'IN_REVIEW' || item.state === 'APPROVED'
      ).length
    },
    claims: {
      autoPromote: false,
      autoRollback: false,
      autoActivate: false
    }
  };
}

export function modelRiskCanAutoPromote() {
  return false;
}

export function modelRiskCanAutoRollback() {
  return false;
}
