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


export function advanceCalibrationVersionForSave(profile: CalibrationProfile): CalibrationProfile {
  return {
    ...profile,
    version: Math.max(1, Math.floor(profile.version)) + 1,
    metricBinding: currentRomanovMetricBinding,
    verifiedAt: undefined
  };
}
