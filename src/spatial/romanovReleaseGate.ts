import type { CalibrationProfile } from './calibration';
import { isCurrentRomanovMetricBinding } from './romanovMetricAuthority';
import {
  summarizeFieldMatrix,
  type RomanovFieldSession
} from './fieldVerification';
import {
  isIndependentAnchorResolve,
  type RomanovPersistentAnchor
} from './persistentAnchor';
import {
  summarizeRomanovSurvey,
  type RomanovSurveyPacket
} from './romanovSurvey';

export type RomanovSpatialReleaseState = 'production-candidate' | 'field-verified-spatial-scene';

export type RomanovReleaseGate = {
  state: RomanovSpatialReleaseState;
  surveyComplete: boolean;
  fieldMatrixComplete: boolean;
  calibrationVerified: boolean;
  metricAuthorityCurrent: boolean;
  persistentAnchorVerified: boolean;
  independentAnchorResolveVerified: boolean;
  blockers: string[];
};

export function canVerifyCalibration(input: {
  calibration?: CalibrationProfile;
  survey: RomanovSurveyPacket;
  sessions: RomanovFieldSession[];
}) {
  return (!input.calibration || isCurrentRomanovMetricBinding(input.calibration.metricBinding))
    && summarizeRomanovSurvey(input.survey).complete
    && summarizeFieldMatrix(input.sessions).crossPlatformReady;
}

/**
 * Promote a calibration profile only after measured geometry and the complete
 * multi-device field matrix have passed. This intentionally cannot be toggled by UI alone.
 */
export function verifyCalibration(input: {
  calibration: CalibrationProfile;
  survey: RomanovSurveyPacket;
  sessions: RomanovFieldSession[];
}): CalibrationProfile {
  if (!isCurrentRomanovMetricBinding(input.calibration.metricBinding)) {
    throw new Error('Romanov calibration metric authority is stale');
  }
  if (!canVerifyCalibration(input)) {
    throw new Error('Romanov calibration cannot be verified before survey and field matrix pass');
  }

  return {
    ...input.calibration,
    verifiedAt: new Date().toISOString()
  };
}

export function summarizeRomanovReleaseGate(input: {
  calibration: CalibrationProfile;
  survey: RomanovSurveyPacket;
  sessions: RomanovFieldSession[];
  anchors: RomanovPersistentAnchor[];
}): RomanovReleaseGate {
  const surveyComplete = summarizeRomanovSurvey(input.survey).complete;
  const fieldMatrixComplete = summarizeFieldMatrix(input.sessions).crossPlatformReady;
  const calibrationVerified = Boolean(input.calibration.verifiedAt);
  const metricAuthorityCurrent = isCurrentRomanovMetricBinding(input.calibration.metricBinding);

  const anchorsForCurrentCalibration = input.anchors.filter((anchor) =>
    anchor.state !== 'retired'
    && anchor.calibrationVersion === input.calibration.version
    && isCurrentRomanovMetricBinding(anchor.calibration.metricBinding)
  );
  const persistentAnchorVerified = anchorsForCurrentCalibration.some((anchor) => anchor.state === 'verified');
  const independentAnchorResolveVerified = anchorsForCurrentCalibration.some((anchor) =>
    anchor.state === 'verified'
    && Boolean(anchor.verifiedAt)
    && isIndependentAnchorResolve(anchor)
  );

  const blockers: string[] = [];
  if (!surveyComplete) blockers.push('survey-packet-incomplete');
  if (!fieldMatrixComplete) blockers.push('cross-device-field-matrix-incomplete');
  if (!calibrationVerified) blockers.push('calibration-not-verified');
  if (!metricAuthorityCurrent) blockers.push('metric-authority-stale');
  if (!persistentAnchorVerified) blockers.push('persistent-anchor-not-verified');
  if (!independentAnchorResolveVerified) blockers.push('independent-anchor-resolve-not-verified');

  return {
    state: blockers.length === 0 ? 'field-verified-spatial-scene' : 'production-candidate',
    surveyComplete,
    fieldMatrixComplete,
    calibrationVerified,
    metricAuthorityCurrent,
    persistentAnchorVerified,
    independentAnchorResolveVerified,
    blockers
  };
}
