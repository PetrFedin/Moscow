import type { CalibrationProfile } from './calibration';
import {
  summarizeFieldMatrix,
  type RomanovFieldMatrixSummary,
  type RomanovFieldSession
} from './fieldVerification';

export type PersistentAnchorProvider = 'none' | 'reactvision' | 'arcore';
export type PersistentAnchorState = 'candidate' | 'hosted' | 'resolved' | 'verified' | 'retired';

export type RomanovPersistentAnchor = {
  id: string;
  placeId: 'romanov-chambers';
  provider: Exclude<PersistentAnchorProvider, 'none'>;
  providerAnchorId: string;
  state: PersistentAnchorState;
  calibrationVersion: number;
  calibration: CalibrationProfile;
  hostedAt: string;
  hostedByDeviceLabel: string;
  resolvedAt?: string;
  resolvedByDeviceLabel?: string;
  resolveSessionId?: string;
  verifiedAt?: string;
  verifiedByDeviceLabel?: string;
  retiredAt?: string;
  notes?: string;
};

export type PersistentAnchorReadiness = {
  fieldMatrix: RomanovFieldMatrixSummary;
  calibrationVerified: boolean;
  providerConfigured: boolean;
  provider: PersistentAnchorProvider;
  readyToHost: boolean;
  blockers: string[];
};

const normalizeDeviceLabel = (value?: string) => value?.trim().toLowerCase() ?? '';

export function isIndependentAnchorResolve(anchor: RomanovPersistentAnchor) {
  const hosted = normalizeDeviceLabel(anchor.hostedByDeviceLabel);
  const resolved = normalizeDeviceLabel(anchor.resolvedByDeviceLabel);
  return Boolean(hosted && resolved && hosted !== resolved && anchor.resolvedAt);
}

export function getPersistentAnchorReadiness(input: {
  sessions: RomanovFieldSession[];
  calibration: CalibrationProfile;
  provider: PersistentAnchorProvider;
  providerConfigured: boolean;
}): PersistentAnchorReadiness {
  const fieldMatrix = summarizeFieldMatrix(input.sessions);
  const calibrationVerified = Boolean(input.calibration.verifiedAt);
  const blockers: string[] = [];

  if (!fieldMatrix.eligibleForPersistentAnchor) {
    blockers.push('field-matrix-incomplete');
  }
  if (!calibrationVerified) {
    blockers.push('calibration-not-verified');
  }
  if (input.provider === 'none' || !input.providerConfigured) {
    blockers.push('persistent-anchor-provider-not-configured');
  }

  return {
    fieldMatrix,
    calibrationVerified,
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
  hostedByDeviceLabel: string;
  notes?: string;
}): RomanovPersistentAnchor {
  if (!input.providerAnchorId.trim()) throw new Error('providerAnchorId is required');
  if (!input.hostedByDeviceLabel.trim()) throw new Error('hostedByDeviceLabel is required');
  if (!input.calibration.verifiedAt) throw new Error('calibration must be verified before hosting a persistent anchor');

  const hostedAt = new Date().toISOString();
  return {
    id: `romanov-anchor-${input.provider}-${hostedAt}`,
    placeId: 'romanov-chambers',
    provider: input.provider,
    providerAnchorId: input.providerAnchorId.trim(),
    state: 'hosted',
    calibrationVersion: input.calibration.version,
    calibration: input.calibration,
    hostedAt,
    hostedByDeviceLabel: input.hostedByDeviceLabel.trim(),
    notes: input.notes
  };
}

export function markAnchorResolved(
  anchor: RomanovPersistentAnchor,
  input: { resolvedByDeviceLabel: string; resolveSessionId?: string }
): RomanovPersistentAnchor {
  if (anchor.state === 'retired') throw new Error('retired anchor cannot be resolved');
  if (!input.resolvedByDeviceLabel.trim()) throw new Error('resolvedByDeviceLabel is required');

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
  if (!isIndependentAnchorResolve(anchor)) {
    throw new Error('anchor verification requires a resolve on a device different from the hosting device');
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
