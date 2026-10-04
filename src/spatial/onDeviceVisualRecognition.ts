import {
  evaluateVisualRecognitionRelease,
  type RecognitionQualityEvidence,
  type RecognitionQualityThresholds,
  type VisualDescriptorEngine,
  type VisualLandmarkReferenceSet
} from './visualLandmarkReference.ts';

export type OnDeviceVisualCandidate = {
  referenceSetId: string;
  referenceId: string;
  confidence: number;
};

export type OnDeviceVisualInferenceObservation = {
  schemaVersion: 1;
  id: string;
  capturedAt: string;
  processing: 'on-device';
  framePersisted: boolean;
  frameUploaded: boolean;
  faceRecognitionUsed: boolean;
  engine: VisualDescriptorEngine;
  modelId: string;
  modelVersion: string;
  descriptorVersion: string;
  inferenceLatencyMs: number;
  candidates: OnDeviceVisualCandidate[];
};

export type OnDeviceVisualMatchStatus =
  | 'strong-candidate'
  | 'needs-user-confirmation'
  | 'not-sure'
  | 'blocked';

export type OnDeviceVisualMatchDecision = {
  status: OnDeviceVisualMatchStatus;
  siteId?: string;
  packageId?: string;
  referenceSetId?: string;
  referenceId?: string;
  confidence?: number;
  marginToSecond?: number;
  reason:
    | 'strict-local-candidate'
    | 'ambiguous-local-candidate'
    | 'low-confidence'
    | 'no-candidates'
    | 'privacy-contract-violation'
    | 'reference-not-found'
    | 'reference-set-not-released'
    | 'descriptor-contract-mismatch'
    | 'invalid-observation';
};

export type OnDeviceVisualRecognitionInput = {
  observation: OnDeviceVisualInferenceObservation;
  referenceSets: VisualLandmarkReferenceSet[];
  fieldVerifiedSiteIds: string[];
  qualityEvidenceBySite: Record<string, RecognitionQualityEvidence | undefined>;
  qualityThresholds?: RecognitionQualityThresholds;
  strictConfidence?: number;
  reviewConfidence?: number;
  minimumMargin?: number;
};

function validIso(value: string) {
  return Number.isFinite(Date.parse(value));
}

function validRate(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function blocked(reason: OnDeviceVisualMatchDecision['reason']): OnDeviceVisualMatchDecision {
  return { status: 'blocked', reason };
}

export function validateOnDeviceVisualObservation(
  observation: OnDeviceVisualInferenceObservation
): string[] {
  const blockers: string[] = [];

  if (observation.schemaVersion !== 1) blockers.push('schema-version');
  if (!observation.id?.trim()) blockers.push('observation-id');
  if (!validIso(observation.capturedAt)) blockers.push('captured-at');
  if (observation.processing !== 'on-device') blockers.push('processing-mode');
  if (observation.framePersisted) blockers.push('frame-persisted');
  if (observation.frameUploaded) blockers.push('frame-uploaded');
  if (observation.faceRecognitionUsed) blockers.push('face-recognition');
  if (!observation.modelId?.trim()) blockers.push('model-id');
  if (!observation.modelVersion?.trim()) blockers.push('model-version');
  if (!observation.descriptorVersion?.trim()) blockers.push('descriptor-version');
  if (!Number.isFinite(observation.inferenceLatencyMs) || observation.inferenceLatencyMs <= 0) {
    blockers.push('inference-latency');
  }

  const keys = new Set<string>();
  for (const candidate of observation.candidates) {
    if (!candidate.referenceSetId?.trim()) blockers.push('candidate-reference-set-id');
    if (!candidate.referenceId?.trim()) blockers.push('candidate-reference-id');
    if (!validRate(candidate.confidence)) blockers.push('candidate-confidence');
    const key = `${candidate.referenceSetId}:${candidate.referenceId}`;
    if (keys.has(key)) blockers.push('candidate-duplicate');
    keys.add(key);
  }

  return [...new Set(blockers)];
}

function privacyViolation(blockers: string[]) {
  return blockers.some((item) =>
    item === 'processing-mode'
    || item === 'frame-persisted'
    || item === 'frame-uploaded'
    || item === 'face-recognition'
  );
}

export function decideOnDeviceVisualMatch(
  input: OnDeviceVisualRecognitionInput
): OnDeviceVisualMatchDecision {
  const strictConfidence = input.strictConfidence ?? 0.88;
  const reviewConfidence = input.reviewConfidence ?? 0.7;
  const minimumMargin = input.minimumMargin ?? 0.08;

  if (!validRate(strictConfidence)
    || !validRate(reviewConfidence)
    || !validRate(minimumMargin)
    || strictConfidence < reviewConfidence) {
    return blocked('invalid-observation');
  }

  const observationBlockers = validateOnDeviceVisualObservation(input.observation);
  if (observationBlockers.length > 0) {
    return blocked(
      privacyViolation(observationBlockers)
        ? 'privacy-contract-violation'
        : 'invalid-observation'
    );
  }

  if (input.observation.candidates.length === 0) {
    return { status: 'not-sure', reason: 'no-candidates' };
  }

  const setsById = new Map(input.referenceSets.map((set) => [set.id, set] as const));
  const releaseBySetId = new Map(
    input.referenceSets.map((set) => [
      set.id,
      evaluateVisualRecognitionRelease({
        set,
        fieldVerifiedSiteIds: input.fieldVerifiedSiteIds,
        qualityEvidence: input.qualityEvidenceBySite[set.siteId],
        thresholds: input.qualityThresholds
      })
    ] as const)
  );

  const resolved: Array<{
    siteId: string;
    packageId: string;
    referenceSetId: string;
    referenceId: string;
    confidence: number;
  }> = [];

  for (const candidate of input.observation.candidates) {
    const set = setsById.get(candidate.referenceSetId);
    if (!set) return blocked('reference-not-found');

    const reference = set.references.find((item) => item.id === candidate.referenceId);
    if (!reference) return blocked('reference-not-found');

    const release = releaseBySetId.get(set.id);
    if (!release?.releasable) return blocked('reference-set-not-released');

    if (
      reference.descriptor.engine !== input.observation.engine
      || reference.descriptor.modelId !== input.observation.modelId
      || reference.descriptor.modelVersion !== input.observation.modelVersion
      || reference.descriptor.descriptorVersion !== input.observation.descriptorVersion
    ) {
      return blocked('descriptor-contract-mismatch');
    }

    resolved.push({
      siteId: set.siteId,
      packageId: set.packageId,
      referenceSetId: set.id,
      referenceId: reference.id,
      confidence: candidate.confidence
    });
  }

  resolved.sort((a, b) =>
    b.confidence - a.confidence
    || a.siteId.localeCompare(b.siteId)
    || a.referenceId.localeCompare(b.referenceId)
  );

  const top = resolved[0]!;
  if (top.confidence < reviewConfidence) {
    return {
      status: 'not-sure',
      siteId: top.siteId,
      packageId: top.packageId,
      referenceSetId: top.referenceSetId,
      referenceId: top.referenceId,
      confidence: top.confidence,
      reason: 'low-confidence'
    };
  }

  const second = resolved[1];
  const marginToSecond = second ? top.confidence - second.confidence : 1;

  if (top.confidence >= strictConfidence && marginToSecond >= minimumMargin) {
    return {
      status: 'strong-candidate',
      siteId: top.siteId,
      packageId: top.packageId,
      referenceSetId: top.referenceSetId,
      referenceId: top.referenceId,
      confidence: top.confidence,
      marginToSecond,
      reason: 'strict-local-candidate'
    };
  }

  return {
    status: 'needs-user-confirmation',
    siteId: top.siteId,
    packageId: top.packageId,
    referenceSetId: top.referenceSetId,
    referenceId: top.referenceId,
    confidence: top.confidence,
    marginToSecond,
    reason: 'ambiguous-local-candidate'
  };
}
