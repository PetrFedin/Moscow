export type VisualDescriptorEngine = 'mediapipe' | 'opencv' | 'custom';

export type VisualLandmarkReference = {
  id: string;
  viewpointId: string;
  sourceImageRef: string;
  sourceImageVersion: string;
  captureDate: string;
  rightsRef: string;
  headingDeg?: number;
  headingToleranceDeg?: number;
  descriptor: {
    engine: VisualDescriptorEngine;
    modelId: string;
    modelVersion: string;
    descriptorVersion: string;
    checksumSha256?: string;
  };
};

export type VisualLandmarkReferenceSet = {
  schemaVersion: 1;
  id: string;
  siteId: string;
  packageId: string;
  version: number;
  references: VisualLandmarkReference[];
  createdAt: string;
};

export type VisualLandmarkCandidate = {
  referenceSetId: string;
  referenceId: string;
  siteId: string;
  confidence: number;
  geoCompatible: boolean;
  headingCompatible: boolean | 'unknown';
};

export type VisualLandmarkDecisionStatus =
  | 'matched'
  | 'needs-user-confirmation'
  | 'not-sure'
  | 'blocked-unverified-site';

export type VisualLandmarkDecision = {
  status: VisualLandmarkDecisionStatus;
  siteId?: string;
  referenceId?: string;
  confidence?: number;
  marginToSecond?: number;
  reason:
    | 'strict-match'
    | 'ambiguous-or-review-band'
    | 'no-eligible-candidate'
    | 'candidate-site-not-field-verified';
};

export type RecognitionQualityEvidence = {
  siteId: string;
  evidenceRef: string;
  measuredAt: string;
  buildId: string;
  sampleCount: number;
  trueMatchRate: number;
  falsePositiveRate: number;
  unknownRate: number;
  viewpointCoverage: number;
  lightingCoverage: number;
  deviceClassCount: number;
  p95LatencyMs: number;
};

export type RecognitionQualityThresholds = {
  minimumSampleCount: number;
  minimumTrueMatchRate: number;
  maximumFalsePositiveRate: number;
  maximumUnknownRate: number;
  minimumViewpointCoverage: number;
  minimumLightingCoverage: number;
  minimumDeviceClassCount: number;
  maximumP95LatencyMs: number;
};

export type RecognitionQualityDecision = {
  status: 'pass' | 'blocked';
  reasons: string[];
};

export const DEFAULT_VISUAL_RECOGNITION_THRESHOLDS: RecognitionQualityThresholds = {
  minimumSampleCount: 50,
  minimumTrueMatchRate: 0.9,
  maximumFalsePositiveRate: 0.02,
  maximumUnknownRate: 0.15,
  minimumViewpointCoverage: 0.7,
  minimumLightingCoverage: 0.6,
  minimumDeviceClassCount: 2,
  maximumP95LatencyMs: 1200
};

function assertNonEmpty(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} is required`);
}

function assertIso(value: string, field: string) {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`Invalid ${field}: ${value}`);
}

function assertDateOnly(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid ${field}: ${value}`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
}

function assertRate(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${field} must be between 0 and 1`);
  }
}

function assertSha256(value: string, field: string) {
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error(`${field} must be a SHA-256 hex digest`);
}

export function validateVisualLandmarkReference(reference: VisualLandmarkReference) {
  assertNonEmpty(reference.id, 'Visual landmark reference id');
  assertNonEmpty(reference.viewpointId, 'Visual landmark viewpoint id');
  assertNonEmpty(reference.sourceImageRef, 'Visual landmark source image ref');
  assertNonEmpty(reference.sourceImageVersion, 'Visual landmark source image version');
  assertDateOnly(reference.captureDate, 'Visual landmark capture date');
  assertNonEmpty(reference.rightsRef, 'Visual landmark rights ref');

  if (reference.headingDeg !== undefined
    && (!Number.isFinite(reference.headingDeg) || reference.headingDeg < 0 || reference.headingDeg >= 360)) {
    throw new Error('Visual landmark heading must be in [0, 360)');
  }
  if (reference.headingToleranceDeg !== undefined
    && (!Number.isFinite(reference.headingToleranceDeg)
      || reference.headingToleranceDeg <= 0
      || reference.headingToleranceDeg > 180)) {
    throw new Error('Visual landmark heading tolerance must be in (0, 180]');
  }
  if (reference.headingToleranceDeg !== undefined && reference.headingDeg === undefined) {
    throw new Error('Visual landmark heading tolerance requires heading');
  }

  assertNonEmpty(reference.descriptor.modelId, 'Visual landmark model id');
  assertNonEmpty(reference.descriptor.modelVersion, 'Visual landmark model version');
  assertNonEmpty(reference.descriptor.descriptorVersion, 'Visual landmark descriptor version');
  if (reference.descriptor.checksumSha256) {
    assertSha256(reference.descriptor.checksumSha256, 'Visual landmark descriptor checksum');
  }
}

export function validateVisualLandmarkReferenceSet(set: VisualLandmarkReferenceSet) {
  if (set.schemaVersion !== 1) throw new Error('Unsupported visual landmark reference-set schema');
  assertNonEmpty(set.id, 'Visual landmark reference-set id');
  assertNonEmpty(set.siteId, 'Visual landmark site id');
  assertNonEmpty(set.packageId, 'Visual landmark package id');
  if (!Number.isInteger(set.version) || set.version < 1) {
    throw new Error('Visual landmark reference-set version must be a positive integer');
  }
  assertIso(set.createdAt, 'visual landmark reference-set createdAt');
  if (set.references.length === 0) throw new Error('Visual landmark reference set requires at least one reference');

  const ids = new Set<string>();
  const viewpoints = new Set<string>();
  for (const reference of set.references) {
    validateVisualLandmarkReference(reference);
    if (ids.has(reference.id)) throw new Error(`Duplicate visual landmark reference id: ${reference.id}`);
    ids.add(reference.id);
    if (viewpoints.has(reference.viewpointId)) {
      throw new Error(`Duplicate visual landmark viewpoint id: ${reference.viewpointId}`);
    }
    viewpoints.add(reference.viewpointId);
  }
}

export function admitVisualLandmarkReferenceSet(input: {
  set: VisualLandmarkReferenceSet;
  fieldVerifiedSiteIds: string[];
}) {
  validateVisualLandmarkReferenceSet(input.set);
  const admitted = new Set(input.fieldVerifiedSiteIds).has(input.set.siteId);
  return {
    admitted,
    reason: admitted ? 'field-verified-site' as const : 'site-not-field-verified' as const
  };
}

function validateCandidate(
  candidate: VisualLandmarkCandidate,
  setsById: Map<string, VisualLandmarkReferenceSet>
) {
  assertRate(candidate.confidence, 'Visual landmark candidate confidence');
  const set = setsById.get(candidate.referenceSetId);
  if (!set) throw new Error(`Unknown visual landmark reference set: ${candidate.referenceSetId}`);
  if (set.siteId !== candidate.siteId) {
    throw new Error(`Candidate site does not match reference set: ${candidate.siteId}`);
  }
  if (!set.references.some((reference) => reference.id === candidate.referenceId)) {
    throw new Error(`Unknown visual landmark reference: ${candidate.referenceId}`);
  }
}

export function decideVisualLandmarkCandidate(input: {
  referenceSets: VisualLandmarkReferenceSet[];
  candidates: VisualLandmarkCandidate[];
  fieldVerifiedSiteIds: string[];
  strictConfidence?: number;
  reviewConfidence?: number;
  minimumMargin?: number;
}): VisualLandmarkDecision {
  const strictConfidence = input.strictConfidence ?? 0.88;
  const reviewConfidence = input.reviewConfidence ?? 0.7;
  const minimumMargin = input.minimumMargin ?? 0.08;

  assertRate(strictConfidence, 'Visual landmark strict confidence');
  assertRate(reviewConfidence, 'Visual landmark review confidence');
  assertRate(minimumMargin, 'Visual landmark minimum margin');
  if (strictConfidence < reviewConfidence) {
    throw new Error('Visual landmark strict confidence cannot be below review confidence');
  }

  const setsById = new Map<string, VisualLandmarkReferenceSet>();
  for (const set of input.referenceSets) {
    validateVisualLandmarkReferenceSet(set);
    if (setsById.has(set.id)) throw new Error(`Duplicate visual landmark reference-set id: ${set.id}`);
    setsById.set(set.id, set);
  }

  for (const candidate of input.candidates) validateCandidate(candidate, setsById);

  const fieldVerified = new Set(input.fieldVerifiedSiteIds);
  const reviewBandUnverified = input.candidates
    .filter((candidate) => candidate.confidence >= reviewConfidence)
    .filter((candidate) => !fieldVerified.has(candidate.siteId))
    .sort((a, b) => b.confidence - a.confidence);

  const eligible = input.candidates
    .filter((candidate) => fieldVerified.has(candidate.siteId))
    .filter((candidate) => candidate.geoCompatible)
    .filter((candidate) => candidate.headingCompatible !== false)
    .sort((a, b) => b.confidence - a.confidence || a.referenceId.localeCompare(b.referenceId));

  const top = eligible[0];
  if (!top || top.confidence < reviewConfidence) {
    const blocked = reviewBandUnverified[0];
    if (blocked) {
      return {
        status: 'blocked-unverified-site',
        siteId: blocked.siteId,
        referenceId: blocked.referenceId,
        confidence: blocked.confidence,
        reason: 'candidate-site-not-field-verified'
      };
    }
    return {
      status: 'not-sure',
      reason: 'no-eligible-candidate'
    };
  }

  const second = eligible[1];
  const marginToSecond = second ? top.confidence - second.confidence : 1;

  if (top.confidence >= strictConfidence && marginToSecond >= minimumMargin) {
    return {
      status: 'matched',
      siteId: top.siteId,
      referenceId: top.referenceId,
      confidence: top.confidence,
      marginToSecond,
      reason: 'strict-match'
    };
  }

  return {
    status: 'needs-user-confirmation',
    siteId: top.siteId,
    referenceId: top.referenceId,
    confidence: top.confidence,
    marginToSecond,
    reason: 'ambiguous-or-review-band'
  };
}

export function validateRecognitionQualityEvidence(evidence: RecognitionQualityEvidence) {
  assertNonEmpty(evidence.siteId, 'Recognition quality site id');
  assertNonEmpty(evidence.evidenceRef, 'Recognition quality evidence ref');
  assertNonEmpty(evidence.buildId, 'Recognition quality build id');
  assertIso(evidence.measuredAt, 'recognition quality measuredAt');
  if (!Number.isInteger(evidence.sampleCount) || evidence.sampleCount < 1) {
    throw new Error('Recognition quality sample count must be a positive integer');
  }
  assertRate(evidence.trueMatchRate, 'Recognition quality true-match rate');
  assertRate(evidence.falsePositiveRate, 'Recognition quality false-positive rate');
  assertRate(evidence.unknownRate, 'Recognition quality unknown rate');
  assertRate(evidence.viewpointCoverage, 'Recognition quality viewpoint coverage');
  assertRate(evidence.lightingCoverage, 'Recognition quality lighting coverage');
  if (!Number.isInteger(evidence.deviceClassCount) || evidence.deviceClassCount < 1) {
    throw new Error('Recognition quality device-class count must be a positive integer');
  }
  if (!Number.isFinite(evidence.p95LatencyMs) || evidence.p95LatencyMs <= 0) {
    throw new Error('Recognition quality p95 latency must be positive');
  }
}

export function evaluateRecognitionQuality(input: {
  evidence?: RecognitionQualityEvidence;
  thresholds?: RecognitionQualityThresholds;
}): RecognitionQualityDecision {
  if (!input.evidence) return { status: 'blocked', reasons: ['missing-evidence'] };
  validateRecognitionQualityEvidence(input.evidence);
  const t = input.thresholds ?? DEFAULT_VISUAL_RECOGNITION_THRESHOLDS;

  const reasons: string[] = [];
  if (input.evidence.sampleCount < t.minimumSampleCount) reasons.push('insufficient-samples');
  if (input.evidence.trueMatchRate < t.minimumTrueMatchRate) reasons.push('true-match-rate-below-threshold');
  if (input.evidence.falsePositiveRate > t.maximumFalsePositiveRate) reasons.push('false-positive-rate-above-threshold');
  if (input.evidence.unknownRate > t.maximumUnknownRate) reasons.push('unknown-rate-above-threshold');
  if (input.evidence.viewpointCoverage < t.minimumViewpointCoverage) reasons.push('viewpoint-coverage-below-threshold');
  if (input.evidence.lightingCoverage < t.minimumLightingCoverage) reasons.push('lighting-coverage-below-threshold');
  if (input.evidence.deviceClassCount < t.minimumDeviceClassCount) reasons.push('device-coverage-below-threshold');
  if (input.evidence.p95LatencyMs > t.maximumP95LatencyMs) reasons.push('latency-above-threshold');

  return {
    status: reasons.length === 0 ? 'pass' : 'blocked',
    reasons
  };
}

export function evaluateVisualRecognitionRelease(input: {
  set: VisualLandmarkReferenceSet;
  fieldVerifiedSiteIds: string[];
  qualityEvidence?: RecognitionQualityEvidence;
  thresholds?: RecognitionQualityThresholds;
}) {
  const admission = admitVisualLandmarkReferenceSet({
    set: input.set,
    fieldVerifiedSiteIds: input.fieldVerifiedSiteIds
  });
  const quality = evaluateRecognitionQuality({
    evidence: input.qualityEvidence,
    thresholds: input.thresholds
  });

  const reasons: string[] = [];
  if (!admission.admitted) reasons.push('site-not-field-verified');
  if (input.qualityEvidence && input.qualityEvidence.siteId !== input.set.siteId) {
    reasons.push('quality-evidence-site-mismatch');
  }
  reasons.push(...quality.reasons);

  return {
    siteId: input.set.siteId,
    releasable: admission.admitted
      && quality.status === 'pass'
      && !reasons.includes('quality-evidence-site-mismatch'),
    reasons
  };
}
