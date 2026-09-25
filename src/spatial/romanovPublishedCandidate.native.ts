import { defaultRomanovCalibration } from './calibration';
import { buildRomanovPublishedSpatialPackage } from './romanovPublishedPackage';
import { createEmptyRomanovSurveyPacket } from './romanovSurvey';

/**
 * Runtime candidate package for the first Moscow spatial heritage scene.
 *
 * It deliberately starts with empty physical evidence. Promotion is computed by
 * the same evidence builder used for real field data, so this module cannot
 * independently toggle a scene to field-verified.
 */
const romanovCandidateBuild = buildRomanovPublishedSpatialPackage({
  calibration: defaultRomanovCalibration,
  survey: createEmptyRomanovSurveyPacket(),
  sessions: [],
  anchors: []
});

export const romanovPublishedCandidate = romanovCandidateBuild.package;
export const romanovPublishedCandidateValidation = romanovCandidateBuild.validation;
export const romanovPublishedCandidatePromotionBlockers = romanovCandidateBuild.promotionBlockers;
