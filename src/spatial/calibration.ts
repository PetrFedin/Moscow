import {
  currentRomanovMetricBinding,
  isCurrentRomanovMetricBinding,
  type RomanovMetricBinding
} from './romanovMetricAuthority.ts';

export type CalibrationProfile = {
  latitude: number;
  longitude: number;
  headingDeg: number;
  pitchDeg: number;
  scale: number;
  translation: [number, number, number];
  rotationEulerDeg: [number, number, number];
  anchorStrategy: 'manual-first' | 'visual' | 'cloud';
  version: number;
  metricBinding?: RomanovMetricBinding;
  sessionAnchorId?: string;
  verifiedAt?: string;
};

export const defaultRomanovCalibration: CalibrationProfile = {
  latitude: 55.75193,
  longitude: 37.62845,
  headingDeg: 0,
  pitchDeg: 0,
  scale: 1,
  translation: [0, 0, -4],
  rotationEulerDeg: [0, 0, 0],
  anchorStrategy: 'manual-first',
  version: 1,
  metricBinding: currentRomanovMetricBinding
};

export function isCalibrationProfile(value: unknown): value is CalibrationProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<CalibrationProfile>;
  return (
    typeof profile.latitude === 'number' &&
    typeof profile.longitude === 'number' &&
    typeof profile.headingDeg === 'number' &&
    typeof profile.pitchDeg === 'number' &&
    typeof profile.scale === 'number' &&
    Array.isArray(profile.translation) && profile.translation.length === 3 &&
    Array.isArray(profile.rotationEulerDeg) && profile.rotationEulerDeg.length === 3 &&
    typeof profile.version === 'number'
  );
}

export function bindCalibrationToCurrentMetricAuthority(profile: CalibrationProfile): CalibrationProfile {
  return {
    ...profile,
    metricBinding: currentRomanovMetricBinding,
    verifiedAt: undefined
  };
}

export function invalidateCalibrationVerification(profile: CalibrationProfile): CalibrationProfile {
  if (!profile.verifiedAt && isCurrentRomanovMetricBinding(profile.metricBinding)) return profile;
  return {
    ...profile,
    verifiedAt: undefined
  };
}


export function advanceCalibrationVersionForSave(
  profile: CalibrationProfile,
  sessionAnchorId?: string
): CalibrationProfile {
  return {
    ...profile,
    version: Math.max(1, Math.floor(profile.version)) + 1,
    metricBinding: currentRomanovMetricBinding,
    sessionAnchorId: sessionAnchorId?.trim() || undefined,
    verifiedAt: undefined
  };
}

function sameNumber(a: number, b: number, tolerance = 1e-9) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
}

function sameTuple3(
  a: [number, number, number],
  b: [number, number, number],
  tolerance = 1e-9
) {
  return sameNumber(a[0], b[0], tolerance)
    && sameNumber(a[1], b[1], tolerance)
    && sameNumber(a[2], b[2], tolerance);
}

/**
 * Calibration versions are local counters, not globally unique identifiers.
 * Release authority therefore binds to the complete verified snapshot.
 */
export function isSameCalibrationSnapshot(
  a: CalibrationProfile,
  b: CalibrationProfile
) {
  return a.version === b.version
    && a.sessionAnchorId === b.sessionAnchorId
    && a.verifiedAt === b.verifiedAt
    && a.anchorStrategy === b.anchorStrategy
    && sameNumber(a.latitude, b.latitude)
    && sameNumber(a.longitude, b.longitude)
    && sameNumber(a.headingDeg, b.headingDeg)
    && sameNumber(a.pitchDeg, b.pitchDeg)
    && sameNumber(a.scale, b.scale)
    && sameTuple3(a.translation, b.translation)
    && sameTuple3(a.rotationEulerDeg, b.rotationEulerDeg)
    && a.metricBinding?.metricAuthorityId === b.metricBinding?.metricAuthorityId
    && a.metricBinding?.metricAuthorityVersion === b.metricBinding?.metricAuthorityVersion
    && a.metricBinding?.modelPackVersion === b.metricBinding?.modelPackVersion;
}

export function isCalibrationBoundToSession(
  profile: CalibrationProfile,
  sessionAnchorId?: string | null
) {
  return Boolean(
    sessionAnchorId
    && profile.sessionAnchorId
    && profile.sessionAnchorId === sessionAnchorId
  );
}
