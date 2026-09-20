import {
  isCalibrationBoundToSession,
  isCalibrationProfile,
  type CalibrationProfile
} from './calibration.ts';
import {
  isFiniteAnchorFrameTransform,
  modelWorldToAnchorFrame,
  rotationMatrixAngularDistanceDeg,
  type RomanovAnchorFrameModelTransform,
  type RomanovAnchorPose
} from './persistentAnchorFrame.ts';
import {
  isCurrentRomanovMetricBinding,
  isRomanovVerifiedScaleAuthoritative
} from './romanovMetricAuthority.ts';
import {
  summarizeFieldMatrix,
  type RomanovFieldMatrixSummary,
  type RomanovFieldSession
} from './fieldVerification.ts';

export type PersistentAnchorProvider = 'none' | 'reactvision' | 'arcore';
export type PersistentAnchorState = 'candidate' | 'hosted' | 'resolved' | 'verified' | 'retired';

export const ROMANOV_PERSISTENT_ANCHOR_PACKAGE_VERSION = 1;
export const ROMANOV_ANCHOR_HOST_CONTINUITY_TARGET_CM = 35;
export const ROMANOV_ANCHOR_HOST_CONTINUITY_TARGET_DEG = 2;

export type RomanovPersistentAnchor = {
  id: string;
  placeId: 'romanov-chambers';
  provider: Exclude<PersistentAnchorProvider, 'none'>;
  providerAnchorId: string;
  state: PersistentAnchorState;
  calibrationVersion: number;
  calibration: CalibrationProfile;
  hostSessionAnchorId: string;
  hostAnchorPose: RomanovAnchorPose;
  anchorFrameModelTransform: RomanovAnchorFrameModelTransform;
  hostedAt: string;
  hostedByDeviceLabel: string;
  hostLocalizedAt?: string;
  hostContinuityResidualCm?: number;
  hostContinuityRotationDeg?: number;
  hostContinuityPassed?: boolean;
  resolvedAt?: string;
  resolvedByDeviceLabel?: string;
  resolveSessionId?: string;
  verifiedAt?: string;
  verifiedByDeviceLabel?: string;
  retiredAt?: string;
  notes?: string;
};

export type RomanovPersistentAnchorPackage = {
  kind: 'romanov-persistent-anchor-proof';
  version: typeof ROMANOV_PERSISTENT_ANCHOR_PACKAGE_VERSION;
  anchor: RomanovPersistentAnchor;
};

export type PersistentAnchorReadiness = {
  fieldMatrix: RomanovFieldMatrixSummary;
  calibrationVerified: boolean;
  calibrationMetricCurrent: boolean;
  calibrationScaleAuthoritative: boolean;
  calibrationSessionCurrent: boolean;
  providerConfigured: boolean;
  provider: PersistentAnchorProvider;
  readyToHost: boolean;
  blockers: string[];
};

const normalizeDeviceLabel = (value?: string) => value?.trim().toLowerCase() ?? '';

function finiteTuple(value: unknown): value is [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((item) => typeof item === 'number' && Number.isFinite(item));
}


function isAnchorFrameConsistentWithHostSnapshot(anchor: RomanovPersistentAnchor) {
  if (!isFiniteAnchorFrameTransform(anchor.anchorFrameModelTransform)) return false;
  const expected = modelWorldToAnchorFrame(anchor.calibration, anchor.hostAnchorPose);
  const positionErrorMeters = Math.hypot(
    expected.position[0] - anchor.anchorFrameModelTransform.position[0],
    expected.position[1] - anchor.anchorFrameModelTransform.position[1],
    expected.position[2] - anchor.anchorFrameModelTransform.position[2]
  );
  const rotationErrorDeg = rotationMatrixAngularDistanceDeg(
    expected.rotationEulerDeg,
    anchor.anchorFrameModelTransform.rotationEulerDeg
  );
  return positionErrorMeters <= 1e-6
    && rotationErrorDeg <= 1e-5
    && Math.abs(expected.scale - anchor.anchorFrameModelTransform.scale) <= 1e-9;
}

function isPersistentAnchorState(value: unknown): value is PersistentAnchorState {
  return value === 'candidate'
    || value === 'hosted'
    || value === 'resolved'
    || value === 'verified'
    || value === 'retired';
}

function isPersistentAnchorProvider(value: unknown): value is Exclude<PersistentAnchorProvider, 'none'> {
  return value === 'reactvision' || value === 'arcore';
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isIndependentAnchorResolve(anchor: RomanovPersistentAnchor) {
  const hosted = normalizeDeviceLabel(anchor.hostedByDeviceLabel);
  const resolved = normalizeDeviceLabel(anchor.resolvedByDeviceLabel);
  return Boolean(hosted && resolved && hosted !== resolved && anchor.resolvedAt);
}

export function isPersistentAnchorFrameAuthoritative(value: unknown): value is RomanovPersistentAnchor {
  if (!value || typeof value !== 'object') return false;
  const anchor = value as Partial<RomanovPersistentAnchor>;
  if (
    !hasText(anchor.id)
    || anchor.placeId !== 'romanov-chambers'
    || !isPersistentAnchorProvider(anchor.provider)
    || !hasText(anchor.providerAnchorId)
    || !isPersistentAnchorState(anchor.state)
    || !Number.isInteger(anchor.calibrationVersion)
    || !isCalibrationProfile(anchor.calibration)
    || !hasText(anchor.hostSessionAnchorId)
    || !anchor.hostAnchorPose
    || !finiteTuple(anchor.hostAnchorPose.position)
    || !finiteTuple(anchor.hostAnchorPose.rotationEulerDeg)
    || !isFiniteAnchorFrameTransform(anchor.anchorFrameModelTransform)
    || !hasText(anchor.hostedAt)
    || !hasText(anchor.hostedByDeviceLabel)
  ) {
    return false;
  }

  const authoritative = anchor as RomanovPersistentAnchor;
  return Boolean(authoritative.calibration.verifiedAt)
    && authoritative.calibrationVersion === authoritative.calibration.version
    && authoritative.calibration.sessionAnchorId === authoritative.hostSessionAnchorId
    && isCurrentRomanovMetricBinding(authoritative.calibration.metricBinding)
    && isRomanovVerifiedScaleAuthoritative(authoritative.calibration.scale)
    && isAnchorFrameConsistentWithHostSnapshot(authoritative);
}

export function isPersistentAnchorEvidenceConsistent(anchor: RomanovPersistentAnchor) {
  const hasHostEvidence = anchor.hostLocalizedAt !== undefined
    || anchor.hostContinuityResidualCm !== undefined
    || anchor.hostContinuityRotationDeg !== undefined
    || anchor.hostContinuityPassed !== undefined;

  if (hasHostEvidence) {
    if (
      !hasText(anchor.hostLocalizedAt)
      || !finiteNonNegative(anchor.hostContinuityResidualCm)
      || !finiteNonNegative(anchor.hostContinuityRotationDeg)
      || typeof anchor.hostContinuityPassed !== 'boolean'
    ) {
      return false;
    }
    const expectedPass = anchor.hostContinuityResidualCm <= ROMANOV_ANCHOR_HOST_CONTINUITY_TARGET_CM
      && anchor.hostContinuityRotationDeg <= ROMANOV_ANCHOR_HOST_CONTINUITY_TARGET_DEG;
    if (anchor.hostContinuityPassed !== expectedPass) return false;
  }

  const hasResolveEvidence = anchor.resolvedAt !== undefined
    || anchor.resolvedByDeviceLabel !== undefined
    || anchor.resolveSessionId !== undefined;
  if (anchor.state === 'resolved' || anchor.state === 'verified') {
    if (!hasText(anchor.resolvedAt) || !hasText(anchor.resolvedByDeviceLabel)) return false;
  } else if (anchor.state !== 'retired' && hasResolveEvidence) {
    return false;
  }

  const hasVerifiedEvidence = anchor.verifiedAt !== undefined || anchor.verifiedByDeviceLabel !== undefined;
  if (anchor.state === 'verified') {
    if (
      !hasText(anchor.verifiedAt)
      || !hasText(anchor.verifiedByDeviceLabel)
      || !anchor.hostContinuityPassed
      || !hasText(anchor.hostLocalizedAt)
      || !isIndependentAnchorResolve(anchor)
      || normalizeDeviceLabel(anchor.verifiedByDeviceLabel) !== normalizeDeviceLabel(anchor.resolvedByDeviceLabel)
    ) {
      return false;
    }
  } else if (anchor.state !== 'retired' && hasVerifiedEvidence) {
    return false;
  }

  if (anchor.state === 'retired' && !hasText(anchor.retiredAt)) return false;
  return true;
}

export function getPersistentAnchorReadiness(input: {
  sessions: RomanovFieldSession[];
  calibration: CalibrationProfile;
  provider: PersistentAnchorProvider;
  providerConfigured: boolean;
  surveyPacketId: string;
  currentLocalAnchorId?: string | null;
}): PersistentAnchorReadiness {
  const fieldMatrix = summarizeFieldMatrix(input.sessions, { surveyPacketId: input.surveyPacketId });
  const calibrationVerified = Boolean(input.calibration.verifiedAt);
  const calibrationMetricCurrent = isCurrentRomanovMetricBinding(input.calibration.metricBinding);
  const calibrationScaleAuthoritative = isRomanovVerifiedScaleAuthoritative(input.calibration.scale);
  const calibrationSessionCurrent = isCalibrationBoundToSession(input.calibration, input.currentLocalAnchorId);
  const blockers: string[] = [];

  if (!fieldMatrix.eligibleForPersistentAnchor) blockers.push('field-matrix-incomplete');
  if (!calibrationVerified) blockers.push('calibration-not-verified');
  if (!calibrationMetricCurrent) blockers.push('calibration-metric-authority-stale');
  if (!calibrationScaleAuthoritative) blockers.push('calibration-metric-scale-not-authoritative');
  if (!calibrationSessionCurrent) blockers.push('calibration-not-bound-to-current-ar-session');
  if (input.provider === 'none' || !input.providerConfigured) blockers.push('persistent-anchor-provider-not-configured');

  return {
    fieldMatrix,
    calibrationVerified,
    calibrationMetricCurrent,
    calibrationScaleAuthoritative,
    calibrationSessionCurrent,
    providerConfigured: input.providerConfigured,
    provider: input.provider,
    readyToHost: blockers.length === 0,
    blockers
  };
}

export function createPersistentAnchorRecord(input: {
  provider: Exclude<PersistentAnchorProvider, 'none'>;
  providerAnchorId: string;
  calibration: CalibrationProfile;
  hostSessionAnchorId: string;
  hostAnchorPose: RomanovAnchorPose;
  anchorFrameModelTransform: RomanovAnchorFrameModelTransform;
  hostedByDeviceLabel: string;
  notes?: string;
}): RomanovPersistentAnchor {
  if (!input.providerAnchorId.trim()) throw new Error('providerAnchorId is required');
  if (!input.hostSessionAnchorId.trim()) throw new Error('hostSessionAnchorId is required');
  if (!input.hostedByDeviceLabel.trim()) throw new Error('hostedByDeviceLabel is required');
  if (!input.calibration.verifiedAt) throw new Error('calibration must be verified before hosting a persistent anchor');
  if (!isCurrentRomanovMetricBinding(input.calibration.metricBinding)) throw new Error('calibration metric authority is stale');
  if (!isRomanovVerifiedScaleAuthoritative(input.calibration.scale)) throw new Error('calibration metric scale is not authoritative');
  if (!isCalibrationBoundToSession(input.calibration, input.hostSessionAnchorId)) {
    throw new Error('calibration is not bound to the hosting AR session anchor');
  }
  if (!finiteTuple(input.hostAnchorPose.position) || !finiteTuple(input.hostAnchorPose.rotationEulerDeg)) {
    throw new Error('host anchor pose is invalid');
  }
  if (!isFiniteAnchorFrameTransform(input.anchorFrameModelTransform)) {
    throw new Error('anchor-frame model transform is invalid');
  }

  const hostedAt = new Date().toISOString();
  return {
    id: `romanov-anchor-${input.provider}-${hostedAt}`,
    placeId: 'romanov-chambers',
    provider: input.provider,
    providerAnchorId: input.providerAnchorId.trim(),
    state: 'hosted',
    calibrationVersion: input.calibration.version,
    calibration: input.calibration,
    hostSessionAnchorId: input.hostSessionAnchorId,
    hostAnchorPose: input.hostAnchorPose,
    anchorFrameModelTransform: input.anchorFrameModelTransform,
    hostedAt,
    hostedByDeviceLabel: input.hostedByDeviceLabel.trim(),
    notes: input.notes
  };
}

export function markAnchorHostLocalized(
  anchor: RomanovPersistentAnchor,
  input: { continuityResidualCm: number; continuityRotationDeg: number }
): RomanovPersistentAnchor {
  if (anchor.state === 'retired') throw new Error('retired anchor cannot be localized');
  if (!Number.isFinite(input.continuityResidualCm) || input.continuityResidualCm < 0) {
    throw new Error('continuityResidualCm must be a finite non-negative number');
  }
  if (!Number.isFinite(input.continuityRotationDeg) || input.continuityRotationDeg < 0) {
    throw new Error('continuityRotationDeg must be a finite non-negative number');
  }
  return {
    ...anchor,
    hostLocalizedAt: new Date().toISOString(),
    hostContinuityResidualCm: input.continuityResidualCm,
    hostContinuityRotationDeg: input.continuityRotationDeg,
    hostContinuityPassed:
      input.continuityResidualCm <= ROMANOV_ANCHOR_HOST_CONTINUITY_TARGET_CM
      && input.continuityRotationDeg <= ROMANOV_ANCHOR_HOST_CONTINUITY_TARGET_DEG
  };
}

export function markAnchorResolved(
  anchor: RomanovPersistentAnchor,
  input: { resolvedByDeviceLabel: string; resolveSessionId?: string }
): RomanovPersistentAnchor {
  if (anchor.state === 'retired') throw new Error('retired anchor cannot be resolved');
  if (!input.resolvedByDeviceLabel.trim()) throw new Error('resolvedByDeviceLabel is required');
  if (!isPersistentAnchorFrameAuthoritative(anchor)) throw new Error('anchor frame is not authoritative');

  return {
    ...anchor,
    state: 'resolved',
    resolvedAt: new Date().toISOString(),
    resolvedByDeviceLabel: input.resolvedByDeviceLabel.trim(),
    resolveSessionId: input.resolveSessionId?.trim() || undefined
  };
}

export function markAnchorVerified(
  anchor: RomanovPersistentAnchor,
  input: { verifiedByDeviceLabel: string }
): RomanovPersistentAnchor {
  if (anchor.state !== 'resolved') throw new Error('anchor must be resolved before verification');
  if (!input.verifiedByDeviceLabel.trim()) throw new Error('verifiedByDeviceLabel is required');
  if (!anchor.hostContinuityPassed || !anchor.hostLocalizedAt) {
    throw new Error('anchor verification requires a passing host continuity check');
  }
  if (!isIndependentAnchorResolve(anchor)) {
    throw new Error('anchor verification requires a resolve on a device different from the hosting device');
  }
  if (normalizeDeviceLabel(input.verifiedByDeviceLabel) !== normalizeDeviceLabel(anchor.resolvedByDeviceLabel)) {
    throw new Error('anchor verification must be signed off by the resolving device');
  }

  return {
    ...anchor,
    state: 'verified',
    verifiedAt: new Date().toISOString(),
    verifiedByDeviceLabel: input.verifiedByDeviceLabel.trim()
  };
}

export function retireAnchor(anchor: RomanovPersistentAnchor, notes?: string): RomanovPersistentAnchor {
  return {
    ...anchor,
    state: 'retired',
    retiredAt: new Date().toISOString(),
    notes: notes ?? anchor.notes
  };
}

export function serializePersistentAnchorPackage(anchor: RomanovPersistentAnchor) {
  if (!isPersistentAnchorFrameAuthoritative(anchor) || !isPersistentAnchorEvidenceConsistent(anchor)) {
    throw new Error('cannot export a non-authoritative anchor frame');
  }
  const payload: RomanovPersistentAnchorPackage = {
    kind: 'romanov-persistent-anchor-proof',
    version: ROMANOV_PERSISTENT_ANCHOR_PACKAGE_VERSION,
    anchor
  };
  return JSON.stringify(payload);
}

export function parsePersistentAnchorPackage(raw: string): RomanovPersistentAnchor {
  const parsed = JSON.parse(raw) as Partial<RomanovPersistentAnchorPackage>;
  if (parsed.kind !== 'romanov-persistent-anchor-proof') throw new Error('unsupported anchor proof kind');
  if (parsed.version !== ROMANOV_PERSISTENT_ANCHOR_PACKAGE_VERSION) throw new Error('unsupported anchor proof version');
  const anchor = parsed.anchor;
  if (!isPersistentAnchorFrameAuthoritative(anchor) || !isPersistentAnchorEvidenceConsistent(anchor)) {
    throw new Error('anchor proof is not authoritative');
  }
  return anchor;
}
