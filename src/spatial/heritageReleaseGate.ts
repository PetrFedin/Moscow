export type HeritageSpatialReleaseState =
  | 'production-candidate'
  | 'field-verified-spatial-scene';

export type HeritageSpatialReleaseEvidence = {
  surveyComplete: boolean;
  fieldMatrixComplete: boolean;
  fieldConditionsComplete: boolean;
  daylightEvidence: boolean;
  calibrationVerified: boolean;
  calibrationPlacementMeasured: boolean;
  metricAuthorityCurrent: boolean;
  metricScaleAuthoritative: boolean;
  persistentAnchorFrameVerified: boolean;
  persistentAnchorVerified: boolean;
  independentAnchorResolveVerified: boolean;
  restartRecoveryVerified: boolean;
};

export type HeritageSpatialReleaseGate = HeritageSpatialReleaseEvidence & {
  state: HeritageSpatialReleaseState;
  blockers: string[];
};

export function summarizeHeritageSpatialReleaseGate(
  evidence: HeritageSpatialReleaseEvidence
): HeritageSpatialReleaseGate {
  const blockers: string[] = [];

  if (!evidence.surveyComplete) blockers.push('survey-packet-incomplete');
  if (!evidence.fieldMatrixComplete) blockers.push('cross-device-field-matrix-incomplete');
  if (!evidence.fieldConditionsComplete) blockers.push('field-conditions-incomplete');
  if (!evidence.daylightEvidence) blockers.push('daylight-evidence-missing');
  if (!evidence.calibrationPlacementMeasured) blockers.push('calibration-placement-not-measured');
  if (!evidence.calibrationVerified) blockers.push('calibration-not-verified');
  if (!evidence.metricAuthorityCurrent) blockers.push('metric-authority-stale');
  if (!evidence.metricScaleAuthoritative) blockers.push('metric-scale-not-authoritative');
  if (!evidence.persistentAnchorFrameVerified) blockers.push('persistent-anchor-frame-not-verified');
  if (!evidence.persistentAnchorVerified) blockers.push('persistent-anchor-not-verified');
  if (!evidence.independentAnchorResolveVerified) blockers.push('independent-anchor-resolve-not-verified');
  if (!evidence.restartRecoveryVerified) blockers.push('restart-recovery-resolve-not-verified');

  return {
    ...evidence,
    state: blockers.length === 0
      ? 'field-verified-spatial-scene'
      : 'production-candidate',
    blockers
  };
}
