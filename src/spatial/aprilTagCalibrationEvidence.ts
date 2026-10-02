import { rotationMatrixAngularDistanceDeg } from './persistentAnchorFrame.ts';

export const APRILTAG_CALIBRATION_EVIDENCE_VERSION = 1 as const;

export type AprilTagPose = {
  frameId: string;
  positionMeters: [number, number, number];
  rotationEulerDeg: [number, number, number];
};

export type AprilTagMarkerAuthority = {
  markerSetId: string;
  markerSetVersion: number;
  tagFamily: string;
  tagId: number;
  physicalSizeMeters: number;
  surveyPacketId: string;
  expectedPose: AprilTagPose;
  sourceEvidenceRef: string;
};

export type AprilTagDetectorObservation = {
  detectorId: string;
  detectorVersion: string;
  tagFamily: string;
  tagId: number;
  physicalSizeMeters: number;
  normalizedPose: AprilTagPose;
  detectedAt: string;
  deviceLabel: string;
  appBuild?: string;
  confidence: 'high' | 'medium' | 'low';
  evidenceRef: string;
};

export type AprilTagCalibrationEvidence = {
  version: typeof APRILTAG_CALIBRATION_EVIDENCE_VERSION;
  id: string;
  siteId: 'romanov-chambers';
  markerSetId: string;
  markerSetVersion: number;
  surveyPacketId: string;
  tagFamily: string;
  tagId: number;
  physicalSizeMeters: number;
  frameId: string;
  expectedPose: AprilTagPose;
  observedPose: AprilTagPose;
  detectorId: string;
  detectorVersion: string;
  detectorConfidence: AprilTagDetectorObservation['confidence'];
  detectedAt: string;
  deviceLabel: string;
  appBuild?: string;
  markerAuthorityEvidenceRef: string;
  detectionEvidenceRef: string;
  translationErrorCm: number;
  rotationErrorDeg: number;
  reviewerStatus: 'pending' | 'accepted' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
};

export type AprilTagCalibrationValidation = {
  valid: boolean;
  blockers: string[];
};

export type AprilTagDetectorAdapter<Raw = unknown> = {
  id: string;
  version: string;
  normalize: (
    raw: Raw,
    context: {
      marker: AprilTagMarkerAuthority;
      targetFrameId: string;
      deviceLabel: string;
      appBuild?: string;
      evidenceRef: string;
    }
  ) => AprilTagDetectorObservation;
};

function finiteTuple3(value: unknown): value is [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((item) => typeof item === 'number' && Number.isFinite(item));
}

function validPose(value: AprilTagPose | undefined) {
  return Boolean(
    value
    && value.frameId.trim()
    && finiteTuple3(value.positionMeters)
    && finiteTuple3(value.rotationEulerDeg)
  );
}

function samePhysicalSize(a: number, b: number) {
  return Number.isFinite(a)
    && Number.isFinite(b)
    && a > 0
    && b > 0
    && Math.abs(a - b) <= 0.0001;
}

function translationErrorCm(a: AprilTagPose, b: AprilTagPose) {
  return Math.hypot(
    a.positionMeters[0] - b.positionMeters[0],
    a.positionMeters[1] - b.positionMeters[1],
    a.positionMeters[2] - b.positionMeters[2]
  ) * 100;
}

function validIsoDate(value: string | undefined) {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function assertMarkerAuthority(marker: AprilTagMarkerAuthority) {
  if (!marker.markerSetId.trim()) throw new Error('AprilTag marker-set ID is required');
  if (!Number.isInteger(marker.markerSetVersion) || marker.markerSetVersion < 1) {
    throw new Error('AprilTag marker-set version must be a positive integer');
  }
  if (!marker.tagFamily.trim()) throw new Error('AprilTag family is required');
  if (!Number.isInteger(marker.tagId) || marker.tagId < 0) throw new Error('AprilTag ID is invalid');
  if (!Number.isFinite(marker.physicalSizeMeters) || marker.physicalSizeMeters <= 0) {
    throw new Error('AprilTag physical size must be measured in meters');
  }
  if (!marker.surveyPacketId.trim()) throw new Error('AprilTag survey packet reference is required');
  if (!validPose(marker.expectedPose)) throw new Error('AprilTag expected pose is invalid');
  if (!marker.sourceEvidenceRef.trim()) throw new Error('AprilTag marker authority evidence reference is required');
}

function assertObservation(
  marker: AprilTagMarkerAuthority,
  observation: AprilTagDetectorObservation
) {
  if (!observation.detectorId.trim() || !observation.detectorVersion.trim()) {
    throw new Error('AprilTag detector authority is required');
  }
  if (observation.tagFamily !== marker.tagFamily || observation.tagId !== marker.tagId) {
    throw new Error('AprilTag detector observation does not match marker authority');
  }
  if (!samePhysicalSize(observation.physicalSizeMeters, marker.physicalSizeMeters)) {
    throw new Error('AprilTag detector physical size does not match marker authority');
  }
  if (!validPose(observation.normalizedPose)) throw new Error('AprilTag normalized pose is invalid');
  if (observation.normalizedPose.frameId !== marker.expectedPose.frameId) {
    throw new Error('AprilTag expected and observed poses must use the same frame');
  }
  if (!validIsoDate(observation.detectedAt)) throw new Error('AprilTag detection time is invalid');
  if (!observation.deviceLabel.trim()) throw new Error('AprilTag device label is required');
  if (!observation.evidenceRef.trim()) throw new Error('AprilTag detection evidence reference is required');
}

export function buildAprilTagCalibrationEvidence(input: {
  marker: AprilTagMarkerAuthority;
  observation: AprilTagDetectorObservation;
  id?: string;
}): AprilTagCalibrationEvidence {
  assertMarkerAuthority(input.marker);
  assertObservation(input.marker, input.observation);

  const translation = translationErrorCm(
    input.marker.expectedPose,
    input.observation.normalizedPose
  );
  const rotation = rotationMatrixAngularDistanceDeg(
    input.marker.expectedPose.rotationEulerDeg,
    input.observation.normalizedPose.rotationEulerDeg
  );

  const safeDetectedAt = new Date(input.observation.detectedAt).toISOString();
  const id = input.id?.trim()
    || `apriltag-cal-${input.marker.markerSetId}-${input.marker.tagId}-${safeDetectedAt}`;

  return {
    version: APRILTAG_CALIBRATION_EVIDENCE_VERSION,
    id,
    siteId: 'romanov-chambers',
    markerSetId: input.marker.markerSetId,
    markerSetVersion: input.marker.markerSetVersion,
    surveyPacketId: input.marker.surveyPacketId,
    tagFamily: input.marker.tagFamily,
    tagId: input.marker.tagId,
    physicalSizeMeters: input.marker.physicalSizeMeters,
    frameId: input.marker.expectedPose.frameId,
    expectedPose: input.marker.expectedPose,
    observedPose: input.observation.normalizedPose,
    detectorId: input.observation.detectorId,
    detectorVersion: input.observation.detectorVersion,
    detectorConfidence: input.observation.confidence,
    detectedAt: safeDetectedAt,
    deviceLabel: input.observation.deviceLabel.trim(),
    appBuild: input.observation.appBuild?.trim() || undefined,
    markerAuthorityEvidenceRef: input.marker.sourceEvidenceRef.trim(),
    detectionEvidenceRef: input.observation.evidenceRef.trim(),
    translationErrorCm: translation,
    rotationErrorDeg: rotation,
    reviewerStatus: 'pending'
  };
}

export function validateAprilTagCalibrationEvidence(
  evidence: AprilTagCalibrationEvidence
): AprilTagCalibrationValidation {
  const blockers: string[] = [];

  if (evidence.version !== APRILTAG_CALIBRATION_EVIDENCE_VERSION) blockers.push('apriltag-evidence-version-invalid');
  if (!evidence.id?.trim()) blockers.push('apriltag-evidence-id-missing');
  if (evidence.siteId !== 'romanov-chambers') blockers.push('apriltag-site-invalid');
  if (!evidence.markerSetId?.trim()) blockers.push('apriltag-marker-set-id-missing');
  if (!Number.isInteger(evidence.markerSetVersion) || evidence.markerSetVersion < 1) {
    blockers.push('apriltag-marker-set-version-invalid');
  }
  if (!evidence.surveyPacketId?.trim()) blockers.push('apriltag-survey-packet-ref-missing');
  if (!evidence.tagFamily?.trim()) blockers.push('apriltag-family-missing');
  if (!Number.isInteger(evidence.tagId) || evidence.tagId < 0) blockers.push('apriltag-id-invalid');
  if (!Number.isFinite(evidence.physicalSizeMeters) || evidence.physicalSizeMeters <= 0) {
    blockers.push('apriltag-physical-size-invalid');
  }
  if (!validPose(evidence.expectedPose) || !validPose(evidence.observedPose)) {
    blockers.push('apriltag-pose-invalid');
  } else {
    if (
      evidence.frameId !== evidence.expectedPose.frameId
      || evidence.frameId !== evidence.observedPose.frameId
    ) {
      blockers.push('apriltag-frame-mismatch');
    }

    const recomputedTranslation = translationErrorCm(evidence.expectedPose, evidence.observedPose);
    if (
      !Number.isFinite(evidence.translationErrorCm)
      || Math.abs(recomputedTranslation - evidence.translationErrorCm) > 0.001
    ) {
      blockers.push('apriltag-translation-error-tampered');
    }

    const recomputedRotation = rotationMatrixAngularDistanceDeg(
      evidence.expectedPose.rotationEulerDeg,
      evidence.observedPose.rotationEulerDeg
    );
    if (
      !Number.isFinite(evidence.rotationErrorDeg)
      || Math.abs(recomputedRotation - evidence.rotationErrorDeg) > 0.001
    ) {
      blockers.push('apriltag-rotation-error-tampered');
    }
  }

  if (!evidence.detectorId?.trim() || !evidence.detectorVersion?.trim()) {
    blockers.push('apriltag-detector-authority-missing');
  }
  if (
    evidence.detectorConfidence !== 'high'
    && evidence.detectorConfidence !== 'medium'
    && evidence.detectorConfidence !== 'low'
  ) {
    blockers.push('apriltag-detector-confidence-invalid');
  }
  if (!validIsoDate(evidence.detectedAt)) blockers.push('apriltag-detected-at-invalid');
  if (!evidence.deviceLabel?.trim()) blockers.push('apriltag-device-label-missing');
  if (!evidence.markerAuthorityEvidenceRef?.trim()) blockers.push('apriltag-marker-authority-ref-missing');
  if (!evidence.detectionEvidenceRef?.trim()) blockers.push('apriltag-detection-ref-missing');

  if (evidence.reviewerStatus === 'pending') {
    if (evidence.reviewedAt || evidence.reviewedBy) blockers.push('apriltag-pending-review-has-reviewer');
  } else if (evidence.reviewerStatus === 'accepted' || evidence.reviewerStatus === 'rejected') {
    if (!validIsoDate(evidence.reviewedAt)) blockers.push('apriltag-review-time-missing');
    if (!evidence.reviewedBy?.trim()) blockers.push('apriltag-reviewer-missing');
  } else {
    blockers.push('apriltag-review-status-invalid');
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)] };
}

export function reviewAprilTagCalibrationEvidence(
  evidence: AprilTagCalibrationEvidence,
  input: {
    status: 'accepted' | 'rejected';
    reviewedBy: string;
    reviewedAt?: string;
  }
): AprilTagCalibrationEvidence {
  const validation = validateAprilTagCalibrationEvidence(evidence);
  if (!validation.valid) {
    throw new Error(`Cannot review invalid AprilTag calibration evidence: ${validation.blockers.join('; ')}`);
  }
  if (!input.reviewedBy.trim()) throw new Error('AprilTag reviewer identity is required');

  const reviewedAt = input.reviewedAt ?? new Date().toISOString();
  if (!validIsoDate(reviewedAt)) throw new Error('AprilTag review timestamp is invalid');

  return {
    ...evidence,
    reviewerStatus: input.status,
    reviewedAt: new Date(reviewedAt).toISOString(),
    reviewedBy: input.reviewedBy.trim()
  };
}
