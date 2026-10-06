import type { DemandSignalEvidenceMode } from './demandControlAuthority.ts';
import type {
  DistrictTwinAssumptionSet,
  DistrictTwinIntervention,
  DistrictTwinScenarioResult,
  DistrictTwinVerification
} from './districtEconomicTwinAuthority.ts';

export type InterventionArchetype = DistrictTwinIntervention['type'];

export type DistrictContextClass =
  | 'heritage-core'
  | 'museum-quarter'
  | 'evening-corridor'
  | 'mixed-tourism'
  | 'other';

export type ForecastLearningRecord = {
  id: string;
  mode: DemandSignalEvidenceMode;
  scenarioId: string;
  policyId: string;
  policyVersion: string;
  assumptionSetId: string;
  assumptionVersion: string;
  archetype: InterventionArchetype;
  districtId: string;
  districtContext: DistrictContextClass;
  forecastAt: string;
  expected: {
    unmetIntentDelta: number | null;
    supplyCoverageDelta: number | null;
    providerConfirmationDelta: number | null;
    confirmedDemandDelta: number | null;
    footfallIndexDelta: number | null;
  };
};

export type ActualOutcomeRecord = {
  id: string;
  forecastRecordId: string;
  mode: DemandSignalEvidenceMode;
  verifiedAt: string;
  evidenceRefs: string[];
  sufficientEvidence: boolean;
  observed: {
    unmetIntentDelta: number | null;
    supplyCoverageDelta: number | null;
    providerConfirmationDelta: number | null;
    confirmedDemandDelta: number | null;
    footfallIndexDelta: number | null;
  };
};

export type ForecastErrorRecord = {
  forecastRecordId: string;
  mode: DemandSignalEvidenceMode;
  archetype: InterventionArchetype;
  districtContext: DistrictContextClass;
  sufficientEvidence: boolean;
  metricErrors: {
    unmetIntentDelta: number | null;
    supplyCoverageDelta: number | null;
    providerConfirmationDelta: number | null;
    confirmedDemandDelta: number | null;
    footfallIndexDelta: number | null;
  };
  absoluteErrorMean: number | null;
  directionChecks: number;
  directionHits: number;
  directionalHitRate: number | null;
};

export type LearningSegment = {
  key: string;
  mode: DemandSignalEvidenceMode;
  archetype: InterventionArchetype;
  districtContext: DistrictContextClass;
  records: number;
  sufficientRecords: number;
  directionalHitRate: number | null;
  meanAbsoluteError: number | null;
  systematicBias: 'NONE' | 'OVER_FORECAST' | 'UNDER_FORECAST' | 'MIXED' | 'INSUFFICIENT';
  confidenceAdjustment: number;
};

export type CalibrationProposal = {
  id: string;
  mode: DemandSignalEvidenceMode;
  sourcePolicyVersion: string;
  proposedPolicyVersion: string;
  sourceAssumptions: DistrictTwinAssumptionSet;
  proposedAssumptions: DistrictTwinAssumptionSet;
  supportingRecordIds: string[];
  supportingSegments: string[];
  state: 'DRAFT' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED';
  reviewRef: string | null;
  acceptanceRef: string | null;
  holdoutEvaluationRef: string | null;
  holdoutDirectionalHitRate: number | null;
  createdAt: string;
  claims: {
    activatedAutomatically: false;
    productionReady: boolean;
    causalityEstablished: false;
  };
};

export type LearningPolicyVersion = {
  id: string;
  version: string;
  status: 'DRAFT' | 'ACCEPTED' | 'ACTIVE' | 'RETIRED';
  assumptions: DistrictTwinAssumptionSet;
  evidenceRefs: string[];
  acceptedAt: string | null;
  acceptanceRef: string | null;
  predecessorVersion: string | null;
};

export type LearningAcceptancePolicy = {
  minimumSupportingRecords: number;
  minimumDistinctSegments: number;
  minimumHoldoutDirectionalHitRate: number;
  maximumAbsoluteCoefficientChange: number;
};

export const LEARNING_ACCEPTANCE_POLICY_V1: LearningAcceptancePolicy = {
  minimumSupportingRecords: 6,
  minimumDistinctSegments: 2,
  minimumHoldoutDirectionalHitRate: 0.6,
  maximumAbsoluteCoefficientChange: 0.25
};

function finite(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function mean(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sameDirection(expected: number | null, observed: number | null) {
  if (!finite(expected) || !finite(observed)) return null;
  if (Math.abs(expected) < 0.000001) return Math.abs(observed) < 0.000001;
  return Math.sign(expected) === Math.sign(observed);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function forecastRecordFromScenario({
  id,
  scenario,
  policyId,
  policyVersion,
  districtContext
}: {
  id: string;
  scenario: DistrictTwinScenarioResult;
  policyId: string;
  policyVersion: string;
  districtContext: DistrictContextClass;
}): ForecastLearningRecord {
  const archetype = scenario.interventions[0]?.type;
  if (!archetype) {
    throw new Error('learning-forecast-intervention-missing');
  }

  return {
    id,
    mode: scenario.baseline.mode,
    scenarioId: scenario.id,
    policyId,
    policyVersion,
    assumptionSetId: scenario.assumptions.id,
    assumptionVersion: scenario.assumptions.version,
    archetype,
    districtId: scenario.baseline.districtId,
    districtContext,
    forecastAt: scenario.assumptions.calibratedAt ?? scenario.baseline.id,
    expected: {
      unmetIntentDelta: scenario.deltas.unmetIntentRate,
      supplyCoverageDelta: scenario.deltas.supplyCoverageRatio,
      providerConfirmationDelta: scenario.deltas.providerConfirmationRate,
      confirmedDemandDelta: scenario.deltas.confirmedDemandRate,
      footfallIndexDelta: scenario.deltas.footfallIndex
    }
  };
}

export function outcomeRecordFromVerification({
  id,
  forecast,
  verification,
  baseline,
  evidenceRefs
}: {
  id: string;
  forecast: ForecastLearningRecord;
  verification: DistrictTwinVerification;
  baseline: DistrictTwinScenarioResult['baseline'];
  evidenceRefs: string[];
}): ActualOutcomeRecord {
  const post = verification.postBaseline;

  return {
    id,
    forecastRecordId: forecast.id,
    mode: forecast.mode,
    verifiedAt: post?.id ?? forecast.forecastAt,
    evidenceRefs,
    sufficientEvidence: verification.enoughEvidence && evidenceRefs.length > 0,
    observed: {
      unmetIntentDelta:
        post?.unmetIntentRate === null || post?.unmetIntentRate === undefined || baseline.unmetIntentRate === null
          ? null
          : post.unmetIntentRate - baseline.unmetIntentRate,
      supplyCoverageDelta:
        post?.supplyCoverageRatio === null || post?.supplyCoverageRatio === undefined || baseline.supplyCoverageRatio === null
          ? null
          : post.supplyCoverageRatio - baseline.supplyCoverageRatio,
      providerConfirmationDelta:
        post?.providerConfirmationRate === null || post?.providerConfirmationRate === undefined || baseline.providerConfirmationRate === null
          ? null
          : post.providerConfirmationRate - baseline.providerConfirmationRate,
      confirmedDemandDelta:
        post?.confirmedDemandRate === null || post?.confirmedDemandRate === undefined || baseline.confirmedDemandRate === null
          ? null
          : post.confirmedDemandRate - baseline.confirmedDemandRate,
      footfallIndexDelta:
        post?.footfallIndex === null || post?.footfallIndex === undefined || baseline.footfallIndex === null
          ? null
          : post.footfallIndex - baseline.footfallIndex
    }
  };
}

export function analyzeForecastError({
  forecast,
  outcome
}: {
  forecast: ForecastLearningRecord;
  outcome: ActualOutcomeRecord;
}): ForecastErrorRecord {
  if (forecast.id !== outcome.forecastRecordId) {
    throw new Error('learning-record-mismatch');
  }
  if (forecast.mode !== outcome.mode) {
    throw new Error('learning-mode-mismatch');
  }

  const keys = [
    'unmetIntentDelta',
    'supplyCoverageDelta',
    'providerConfirmationDelta',
    'confirmedDemandDelta',
    'footfallIndexDelta'
  ] as const;

  const metricErrors = {
    unmetIntentDelta: null as number | null,
    supplyCoverageDelta: null as number | null,
    providerConfirmationDelta: null as number | null,
    confirmedDemandDelta: null as number | null,
    footfallIndexDelta: null as number | null
  };

  const absoluteErrors: number[] = [];
  let directionChecks = 0;
  let directionHits = 0;

  for (const key of keys) {
    const expected = forecast.expected[key];
    const observed = outcome.observed[key];

    if (finite(expected) && finite(observed)) {
      const error = observed - expected;
      metricErrors[key] = error;
      absoluteErrors.push(Math.abs(error));
    }

    const direction = sameDirection(expected, observed);
    if (direction !== null) {
      directionChecks += 1;
      if (direction) directionHits += 1;
    }
  }

  return {
    forecastRecordId: forecast.id,
    mode: forecast.mode,
    archetype: forecast.archetype,
    districtContext: forecast.districtContext,
    sufficientEvidence: outcome.sufficientEvidence,
    metricErrors,
    absoluteErrorMean: outcome.sufficientEvidence ? mean(absoluteErrors) : null,
    directionChecks: outcome.sufficientEvidence ? directionChecks : 0,
    directionHits: outcome.sufficientEvidence ? directionHits : 0,
    directionalHitRate:
      outcome.sufficientEvidence && directionChecks > 0
        ? directionHits / directionChecks
        : null
  };
}

export function buildLearningSegments(
  errors: ForecastErrorRecord[],
  mode: DemandSignalEvidenceMode
): LearningSegment[] {
  const groups = new Map<string, ForecastErrorRecord[]>();

  for (const error of errors.filter((item) => item.mode === mode)) {
    const key = `${error.archetype}:${error.districtContext}`;
    const group = groups.get(key) ?? [];
    group.push(error);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, items]) => {
    const sufficient = items.filter((item) => item.sufficientEvidence);
    const totalChecks = sufficient.reduce((sum, item) => sum + item.directionChecks, 0);
    const totalHits = sufficient.reduce((sum, item) => sum + item.directionHits, 0);
    const meanAbsoluteError = mean(
      sufficient
        .map((item) => item.absoluteErrorMean)
        .filter((item): item is number => finite(item))
    );

    const signedErrors = sufficient
      .flatMap((item) => Object.values(item.metricErrors))
      .filter((item): item is number => finite(item));

    const signedMean = mean(signedErrors);

    let systematicBias: LearningSegment['systematicBias'] = 'INSUFFICIENT';
    if (sufficient.length >= 2 && signedMean !== null) {
      const positiveShare = signedErrors.filter((value) => value > 0).length / Math.max(1, signedErrors.length);
      const negativeShare = signedErrors.filter((value) => value < 0).length / Math.max(1, signedErrors.length);

      if (Math.abs(signedMean) < 0.02) systematicBias = 'NONE';
      else if (positiveShare >= 0.7) systematicBias = 'UNDER_FORECAST';
      else if (negativeShare >= 0.7) systematicBias = 'OVER_FORECAST';
      else systematicBias = 'MIXED';
    }

    const hitRate = totalChecks > 0 ? totalHits / totalChecks : null;
    const errorPenalty = meanAbsoluteError === null ? 0.2 : clamp(meanAbsoluteError, 0, 0.4);
    const hitAdjustment = hitRate === null ? -0.15 : (hitRate - 0.7) * 0.5;
    const sampleAdjustment = sufficient.length >= 3 ? 0.05 : -0.1;

    return {
      key,
      mode,
      archetype: items[0]!.archetype,
      districtContext: items[0]!.districtContext,
      records: items.length,
      sufficientRecords: sufficient.length,
      directionalHitRate: hitRate,
      meanAbsoluteError,
      systematicBias,
      confidenceAdjustment: clamp(
        hitAdjustment + sampleAdjustment - errorPenalty,
        -0.4,
        0.2
      )
    };
  });
}

export function nextCycleConfidence({
  baseConfidence,
  archetype,
  districtContext,
  segments
}: {
  baseConfidence: number;
  archetype: InterventionArchetype;
  districtContext: DistrictContextClass;
  segments: LearningSegment[];
}) {
  const segment = segments.find(
    (item) => item.archetype === archetype && item.districtContext === districtContext
  );

  if (!segment) return clamp(baseConfidence * 0.8, 0, 1);

  return clamp(baseConfidence + segment.confidenceAdjustment, 0, 1);
}

export function proposeCalibrationUpdate({
  id,
  mode,
  sourcePolicyVersion,
  proposedPolicyVersion,
  sourceAssumptions,
  errors,
  segments,
  createdAt
}: {
  id: string;
  mode: DemandSignalEvidenceMode;
  sourcePolicyVersion: string;
  proposedPolicyVersion: string;
  sourceAssumptions: DistrictTwinAssumptionSet;
  errors: ForecastErrorRecord[];
  segments: LearningSegment[];
  createdAt: string;
}): CalibrationProposal {
  const sufficient = errors.filter(
    (item) => item.mode === mode && item.sufficientEvidence
  );

  const coverageErrors = sufficient
    .map((item) => item.metricErrors.unmetIntentDelta)
    .filter((item): item is number => finite(item));
  const providerErrors = sufficient
    .map((item) => item.metricErrors.confirmedDemandDelta)
    .filter((item): item is number => finite(item));

  const coverageMean = mean(coverageErrors) ?? 0;
  const providerMean = mean(providerErrors) ?? 0;

  const proposedUnmet = clamp(
    sourceAssumptions.unmetReductionPerCoveragePoint - coverageMean * 0.25,
    0,
    sourceAssumptions.unmetReductionPerCoveragePoint
      + LEARNING_ACCEPTANCE_POLICY_V1.maximumAbsoluteCoefficientChange
  );
  const proposedConfirmed = clamp(
    sourceAssumptions.confirmedDemandLiftPerProviderConfirmationPoint - providerMean * 0.25,
    0,
    sourceAssumptions.confirmedDemandLiftPerProviderConfirmationPoint
      + LEARNING_ACCEPTANCE_POLICY_V1.maximumAbsoluteCoefficientChange
  );

  return {
    id,
    mode,
    sourcePolicyVersion,
    proposedPolicyVersion,
    sourceAssumptions,
    proposedAssumptions: {
      ...sourceAssumptions,
      id: `${sourceAssumptions.id}:proposal:${proposedPolicyVersion}`,
      version: proposedPolicyVersion,
      provenance: 'measured',
      calibratedAt: createdAt,
      evidenceRefs: sufficient.map((item) => item.forecastRecordId),
      unmetReductionPerCoveragePoint: proposedUnmet,
      confirmedDemandLiftPerProviderConfirmationPoint: proposedConfirmed
    },
    supportingRecordIds: sufficient.map((item) => item.forecastRecordId),
    supportingSegments: segments
      .filter((item) => item.mode === mode && item.sufficientRecords > 0)
      .map((item) => item.key),
    state: 'DRAFT',
    reviewRef: null,
    acceptanceRef: null,
    holdoutEvaluationRef: null,
    holdoutDirectionalHitRate: null,
    createdAt,
    claims: {
      activatedAutomatically: false,
      productionReady: false,
      causalityEstablished: false
    }
  };
}

export function calibrationAcceptanceReadiness(
  proposal: CalibrationProposal,
  policy: LearningAcceptancePolicy = LEARNING_ACCEPTANCE_POLICY_V1
) {
  const blockers: string[] = [];

  if (proposal.supportingRecordIds.length < policy.minimumSupportingRecords) {
    blockers.push('insufficient-supporting-records');
  }
  if (new Set(proposal.supportingSegments).size < policy.minimumDistinctSegments) {
    blockers.push('insufficient-segment-diversity');
  }
  if (!proposal.reviewRef?.trim()) blockers.push('model-review-ref-missing');
  if (!proposal.acceptanceRef?.trim()) blockers.push('model-acceptance-ref-missing');
  if (!proposal.holdoutEvaluationRef?.trim()) blockers.push('holdout-evaluation-ref-missing');
  if (
    proposal.holdoutDirectionalHitRate === null
    || proposal.holdoutDirectionalHitRate < policy.minimumHoldoutDirectionalHitRate
  ) {
    blockers.push('holdout-performance-below-threshold');
  }

  const unmetChange = Math.abs(
    proposal.proposedAssumptions.unmetReductionPerCoveragePoint
      - proposal.sourceAssumptions.unmetReductionPerCoveragePoint
  );
  const confirmedChange = Math.abs(
    proposal.proposedAssumptions.confirmedDemandLiftPerProviderConfirmationPoint
      - proposal.sourceAssumptions.confirmedDemandLiftPerProviderConfirmationPoint
  );

  if (
    unmetChange > policy.maximumAbsoluteCoefficientChange
    || confirmedChange > policy.maximumAbsoluteCoefficientChange
  ) {
    blockers.push('coefficient-change-too-large');
  }

  return {
    ready: blockers.length === 0,
    blockers
  };
}

export function acceptCalibrationProposal({
  proposal,
  reviewRef,
  acceptanceRef,
  holdoutEvaluationRef,
  holdoutDirectionalHitRate
}: {
  proposal: CalibrationProposal;
  reviewRef: string;
  acceptanceRef: string;
  holdoutEvaluationRef: string;
  holdoutDirectionalHitRate: number;
}): CalibrationProposal {
  const reviewed: CalibrationProposal = {
    ...proposal,
    state: 'IN_REVIEW',
    reviewRef,
    acceptanceRef,
    holdoutEvaluationRef,
    holdoutDirectionalHitRate
  };

  const readiness = calibrationAcceptanceReadiness(reviewed);
  if (!readiness.ready) {
    throw new Error(`calibration-acceptance-blocked:${readiness.blockers.join(',')}`);
  }

  return {
    ...reviewed,
    state: 'ACCEPTED',
    claims: {
      ...reviewed.claims,
      productionReady: true
    }
  };
}

export function learningPolicyFromAcceptedCalibration({
  id,
  proposal,
  acceptedAt
}: {
  id: string;
  proposal: CalibrationProposal;
  acceptedAt: string;
}): LearningPolicyVersion {
  if (proposal.state !== 'ACCEPTED' || !proposal.claims.productionReady) {
    throw new Error('learning-policy-calibration-not-accepted');
  }

  return {
    id,
    version: proposal.proposedPolicyVersion,
    status: 'ACCEPTED',
    assumptions: proposal.proposedAssumptions,
    evidenceRefs: [
      ...proposal.supportingRecordIds,
      proposal.reviewRef!,
      proposal.acceptanceRef!,
      proposal.holdoutEvaluationRef!
    ],
    acceptedAt,
    acceptanceRef: proposal.acceptanceRef,
    predecessorVersion: proposal.sourcePolicyVersion
  };
}

export function activateLearningPolicy({
  acceptedPolicy,
  activationRef
}: {
  acceptedPolicy: LearningPolicyVersion;
  activationRef: string;
}): LearningPolicyVersion {
  if (acceptedPolicy.status !== 'ACCEPTED') {
    throw new Error('learning-policy-not-accepted');
  }
  if (!activationRef.trim()) {
    throw new Error('learning-policy-activation-ref-missing');
  }

  return {
    ...acceptedPolicy,
    status: 'ACTIVE',
    evidenceRefs: [...acceptedPolicy.evidenceRefs, activationRef]
  };
}

export function learningCanAutoActivate() {
  return false;
}
