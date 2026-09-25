import {
  isCalibrationBoundToSession,
  isSameCalibrationSnapshot,
  type CalibrationProfile
} from './calibration.ts';
import {
  isCurrentRomanovMetricBinding,
  isRomanovVerifiedScaleAuthoritative
} from './romanovMetricAuthority.ts';
import {
  hasCompleteMeasuredPlacement,
  summarizeFieldMatrix,
  type FieldPlatform,
  type RomanovFieldSession
} from './fieldVerification.ts';
import {
  isIndependentAnchorResolve,
  isPersistentAnchorEvidenceConsistent,
  isPersistentAnchorFrameAuthoritative,
  type RomanovPersistentAnchor
} from './persistentAnchor.ts';
import {
  summarizeRomanovSurvey,
  type RomanovSurveyPacket
} from './romanovSurvey.ts';

export type RomanovSpatialReleaseState = 'production-candidate' | 'field-verified-spatial-scene';

export type RomanovReleaseGate = {
  state: RomanovSpatialReleaseState;
  surveyComplete: boolean;
  fieldMatrixComplete: boolean;
  calibrationVerified: boolean;
  calibrationPlacementMeasured: boolean;
  metricAuthorityCurrent: boolean;
  metricScaleAuthoritative: boolean;
  persistentAnchorFrameVerified: boolean;
  persistentAnchorVerified: boolean;
  independentAnchorResolveVerified: boolean;
  blockers: string[];
};

export function canVerifyCalibration(input: {
  calibration: CalibrationProfile;
  survey: RomanovSurveyPacket;
  sessions: RomanovFieldSession[];
  localAnchorId: string;
  deviceLabel: string;
  devicePlatform: FieldPlatform;
}) {
  return Boolean(input.deviceLabel.trim())
    && isCurrentRomanovMetricBinding(input.calibration.metricBinding)
    && isCalibrationBoundToSession(input.calibration, input.localAnchorId)
    && summarizeRomanovSurvey(input.survey).complete
    && summarizeFieldMatrix(input.sessions, { surveyPacketId: input.survey.id }).crossPlatformReady
    && hasCompleteMeasuredPlacement({
      sessions: input.sessions,
      surveyPacketId: input.survey.id,
      calibration: input.calibration,
      deviceLabel: input.deviceLabel,
      devicePlatform: input.devicePlatform
    });
}

/**
 * Promote a calibration profile only after measured geometry and the complete
 * multi-device field matrix have passed. This intentionally cannot be toggled by UI alone.
 */
export function verifyCalibration(input: {
  calibration: CalibrationProfile;
  survey: RomanovSurveyPacket;
  sessions: RomanovFieldSession[];
  localAnchorId: string;
  deviceLabel: string;
  devicePlatform: FieldPlatform;
}): CalibrationProfile {
  if (!isCurrentRomanovMetricBinding(input.calibration.metricBinding)) {
    throw new Error('Romanov calibration metric authority is stale');
  }
  if (!isRomanovVerifiedScaleAuthoritative(input.calibration.scale)) {
    throw new Error('Romanov calibration scale must remain metric-authoritative before verification');
  }
  if (!isCalibrationBoundToSession(input.calibration, input.localAnchorId)) {
    throw new Error('Romanov calibration is not bound to the current AR session anchor');
  }
  if (!canVerifyCalibration(input)) {
    throw new Error('Romanov calibration cannot be verified before survey, cross-device matrix and this exact 5/10/15 measured placement pass');
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
  const fieldMatrixComplete = summarizeFieldMatrix(input.sessions, { surveyPacketId: input.survey.id }).crossPlatformReady;
  const calibrationPlacementMeasured = hasCompleteMeasuredPlacement({
    sessions: input.sessions,
    surveyPacketId: input.survey.id,
    calibration: input.calibration
  });
  const calibrationVerified = Boolean(input.calibration.verifiedAt) && calibrationPlacementMeasured;
  const metricAuthorityCurrent = isCurrentRomanovMetricBinding(input.calibration.metricBinding);
  const metricScaleAuthoritative = isRomanovVerifiedScaleAuthoritative(input.calibration.scale);

  const anchorsForCurrentCalibration = input.anchors.filter((anchor) =>
    anchor.state !== 'retired'
    && anchor.calibrationVersion === input.calibration.version
    && isSameCalibrationSnapshot(anchor.calibration, input.calibration)
    && isCurrentRomanovMetricBinding(anchor.calibration.metricBinding)
    && isPersistentAnchorFrameAuthoritative(anchor)
    && isPersistentAnchorEvidenceConsistent(anchor)
  );
  const persistentAnchorFrameVerified = anchorsForCurrentCalibration.some((anchor) =>
    Boolean(anchor.hostContinuityPassed && anchor.hostLocalizedAt)
  );
  const persistentAnchorVerified = anchorsForCurrentCalibration.some((anchor) =>
    anchor.state === 'verified' && Boolean(anchor.hostContinuityPassed)
  );
  const independentAnchorResolveVerified = anchorsForCurrentCalibration.some((anchor) =>
    anchor.state === 'verified'
    && Boolean(anchor.verifiedAt)
    && isIndependentAnchorResolve(anchor)
  );

  const blockers: string[] = [];
  if (!surveyComplete) blockers.push('survey-packet-incomplete');
  if (!fieldMatrixComplete) blockers.push('cross-device-field-matrix-incomplete');
  if (!calibrationPlacementMeasured) blockers.push('calibration-placement-not-measured');
  if (!calibrationVerified) blockers.push('calibration-not-verified');
  if (!metricAuthorityCurrent) blockers.push('metric-authority-stale');
  if (!metricScaleAuthoritative) blockers.push('metric-scale-not-authoritative');
  if (!persistentAnchorFrameVerified) blockers.push('persistent-anchor-frame-not-verified');
  if (!persistentAnchorVerified) blockers.push('persistent-anchor-not-verified');
  if (!independentAnchorResolveVerified) blockers.push('independent-anchor-resolve-not-verified');

  return {
    state: blockers.length === 0 ? 'field-verified-spatial-scene' : 'production-candidate',
    surveyComplete,
    fieldMatrixComplete,
    calibrationVerified,
    calibrationPlacementMeasured,
    metricAuthorityCurrent,
    metricScaleAuthoritative,
    persistentAnchorFrameVerified,
    persistentAnchorVerified,
    independentAnchorResolveVerified,
    blockers
  };
}
