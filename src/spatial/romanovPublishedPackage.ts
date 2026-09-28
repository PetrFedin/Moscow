import { isSameCalibrationSnapshot, type CalibrationProfile } from './calibration.ts';
import {
  summarizeFieldMatrix,
  type RomanovFieldSession
} from './fieldVerification.ts';
import {
  hasRestartRecoveryEvidence,
  isIndependentAnchorResolve,
  isPersistentAnchorEvidenceConsistent,
  isPersistentAnchorFrameAuthoritative,
  type RomanovPersistentAnchor
} from './persistentAnchor.ts';
import {
  validatePublishedSpatialPackage,
  type PublishedSpatialPackage
} from './publishedSpatialPackage.ts';
import { romanovPublishedCandidate } from './romanovPublishedCandidate.ts';
import { summarizeRomanovReleaseGate } from './romanovReleaseGate.ts';
import type { RomanovSurveyPacket } from './romanovSurvey.ts';

function verifiedAnchorsForCalibration(
  anchors: RomanovPersistentAnchor[],
  calibration: CalibrationProfile
) {
  return anchors.filter((anchor) =>
    anchor.state === 'verified'
    && anchor.calibrationVersion === calibration.version
    && isSameCalibrationSnapshot(anchor.calibration, calibration)
    && isPersistentAnchorFrameAuthoritative(anchor)
    && isPersistentAnchorEvidenceConsistent(anchor)
    && isIndependentAnchorResolve(anchor)
    && hasRestartRecoveryEvidence(anchor)
  );
}

function latestVerificationTimestamp(
  anchors: RomanovPersistentAnchor[],
  calibration: CalibrationProfile
) {
  const timestamps = [
    calibration.verifiedAt,
    ...verifiedAnchorsForCalibration(anchors, calibration).flatMap((anchor) => [
      anchor.verifiedAt,
      anchor.recoveryResolvedAt
    ])
  ].filter((value): value is string => Boolean(value?.trim()));

  return timestamps.sort().at(-1);
}

/**
 * The only Romanov-specific promotion path from the static production candidate
 * into a package that may declare field verification.
 *
 * Release state is derived from the existing survey/field/calibration/anchor gate.
 * Callers do not pass booleans such as "surveyVerified" or "anchorVerified".
 */
export function buildRomanovPublishedPackageFromEvidence(input: {
  survey: RomanovSurveyPacket;
  sessions: RomanovFieldSession[];
  calibration: CalibrationProfile;
  anchors: RomanovPersistentAnchor[];
  publishedAt?: string;
  publisher?: string;
}): PublishedSpatialPackage {
  const gate = summarizeRomanovReleaseGate({
    survey: input.survey,
    sessions: input.sessions,
    calibration: input.calibration,
    anchors: input.anchors
  });

  const verifiedAnchors = verifiedAnchorsForCalibration(input.anchors, input.calibration);
  const verifiedAnchorIds = verifiedAnchors.map((anchor) => anchor.id);
  const fieldMatrix = summarizeFieldMatrix(input.sessions, { surveyPacketId: input.survey.id });
  const eligibleSessionIds = [...new Set(
    fieldMatrix.completeDevices.flatMap((device) => device.sessionIds)
  )];
  const restartRecoverySessionIds = verifiedAnchors
    .map((anchor) => anchor.recoverySessionId)
    .filter((value): value is string => Boolean(value?.trim()));

  if (gate.state === 'field-verified-spatial-scene' && !input.publishedAt?.trim()) {
    throw new Error('publishedAt is required when promoting Romanov to field-verified');
  }

  const pkg: PublishedSpatialPackage = {
    ...romanovPublishedCandidate,
    releaseState: gate.state === 'field-verified-spatial-scene'
      ? 'field-verified'
      : 'production-candidate',
    publishedAt: gate.state === 'field-verified-spatial-scene'
      ? input.publishedAt
      : undefined,
    publisher: input.publisher?.trim() || romanovPublishedCandidate.publisher,
    fieldVerification: {
      required: true,
      minimumFieldSessions: 12,
      releaseGateState: gate.state,
      calibrationVersion: input.calibration.version,
      calibrationMetricBinding: input.calibration.metricBinding
        ? {
            metricAuthorityId: input.calibration.metricBinding.metricAuthorityId,
            metricAuthorityVersion: input.calibration.metricBinding.metricAuthorityVersion,
            modelPackVersion: input.calibration.metricBinding.modelPackVersion
          }
        : undefined,
      surveyVerified: gate.surveyComplete,
      surveyPacketId: input.survey.id,
      multiDeviceMatrixPassed: gate.fieldMatrixComplete,
      fieldConditionsComplete: gate.fieldConditionsComplete,
      daylightEvidence: gate.daylightEvidence,
      fieldSessionIds: eligibleSessionIds,
      persistentAnchorVerified:
        gate.persistentAnchorVerified && gate.independentAnchorResolveVerified && gate.restartRecoveryVerified,
      persistentAnchorProofIds: verifiedAnchorIds,
      restartRecoveryVerified: gate.restartRecoveryVerified,
      restartRecoverySessionIds,
      verifiedAt: gate.state === 'field-verified-spatial-scene'
        ? latestVerificationTimestamp(input.anchors, input.calibration)
        : undefined,
      releaseBlockers: [...gate.blockers]
    }
  };

  const validation = validatePublishedSpatialPackage(pkg);
  if (!validation.valid) {
    throw new Error(
      `Romanov published package failed structural validation: ${validation.blockers.join('; ')}`
    );
  }

  return pkg;
}
