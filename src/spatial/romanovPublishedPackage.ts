import { isSameCalibrationSnapshot, type CalibrationProfile } from './calibration.ts';
import { summarizeFieldMatrix, type RomanovFieldSession } from './fieldVerification.ts';
import {
  isIndependentAnchorResolve,
  isPersistentAnchorEvidenceConsistent,
  isPersistentAnchorFrameAuthoritative,
  type RomanovPersistentAnchor
} from './persistentAnchor.ts';
import {
  validatePublishedSpatialPackage,
  type PublishedSpatialPackage,
  type SpatialRightsStatus
} from './publishedSpatialPackage.ts';
import { romanovSources } from './romanov-sources.ts';
import { ROMANOV_CONTROL_POINT_SET } from './romanovControlPoints.ts';
import { ROMANOV_METRIC_AUTHORITY } from './romanovMetricAuthority.ts';
import { romanovModelCatalog } from './romanovModelCatalog.ts';
import { summarizeRomanovReleaseGate } from './romanovReleaseGate.ts';
import { summarizeRomanovSurvey, type RomanovSurveyPacket } from './romanovSurvey.ts';
import {
  isProductionAudioTrack,
  varvarkaAudioCatalog
} from '../features/audio/varvarkaAudioCatalog.ts';

const rightsMap: Record<(typeof romanovSources)[number]['rights'], SpatialRightsStatus> = {
  'public-domain': 'public-domain',
  'official-reference': 'restricted',
  'needs-rights-review': 'review-required'
};

const romanovClaims: PublishedSpatialPackage['claims'] = [
  {
    id: 'romanov-1857-pre-restoration-facade',
    summary: 'The 1857 evidence documents the chambers before the Richter restoration.',
    trust: 'documented',
    sourceIds: ['timm-1857'],
    modelIds: ['romanov-1857-documented-v1', 'romanov-1857-public-v1']
  },
  {
    id: 'romanov-richter-restoration-state',
    summary: 'The post-restoration state is reconstructed from official museum history, 1859 architectural material and early post-restoration imagery.',
    trust: 'reconstructed',
    sourceIds: ['shm-history', 'shm-1859-graphic', 'naidenov-46'],
    modelIds: ['romanov-1859-documented-v1', 'romanov-1859-public-v1']
  },
  {
    id: 'romanov-masonry-metric-reference',
    summary: 'Surviving masonry and official architectural documentation define the metric reference that must be confirmed by field survey before spatial release.',
    trust: 'documented',
    sourceIds: ['shm-history', 'mos-archaeology', 'mos-plans'],
    modelIds: romanovModelCatalog.map((model) => model.id)
  }
];

function romanovAudioAuthority() {
  const tracks = varvarkaAudioCatalog.filter((track) => track.placeId === 'romanov-chambers');
  const productionReadyTracks = tracks.filter(isProductionAudioTrack).length;
  return {
    expectedTracks: tracks.length,
    productionReadyTracks,
    complete: tracks.length > 0 && productionReadyTracks === tracks.length
  };
}

function verifiedAnchorForCalibration(
  anchors: RomanovPersistentAnchor[],
  calibration: CalibrationProfile
) {
  return anchors.find((anchor) =>
    anchor.state === 'verified'
    && anchor.calibrationVersion === calibration.version
    && isSameCalibrationSnapshot(anchor.calibration, calibration)
    && isPersistentAnchorFrameAuthoritative(anchor)
    && isPersistentAnchorEvidenceConsistent(anchor)
    && isIndependentAnchorResolve(anchor)
  );
}

function baseRomanovPackage(input: {
  calibration: CalibrationProfile;
  survey: RomanovSurveyPacket;
  sessions: RomanovFieldSession[];
  anchors: RomanovPersistentAnchor[];
}): PublishedSpatialPackage {
  const releaseGate = summarizeRomanovReleaseGate(input);
  const surveyGate = summarizeRomanovSurvey(input.survey);
  const matrix = summarizeFieldMatrix(input.sessions, { surveyPacketId: input.survey.id });
  const verifiedAnchor = verifiedAnchorForCalibration(input.anchors, input.calibration);
  const audioAuthority = romanovAudioAuthority();

  return {
    schemaVersion: 2,
    id: 'moscow-romanov-chambers-spatial-v2',
    placeId: 'romanov-chambers',
    titleRu: 'Палаты бояр Романовых',
    titleEn: 'Romanov Chambers',
    version: 2,
    releaseState: 'production-candidate',
    publisher: 'Moscow in Time',
    eras: [
      { id: '1857', yearLabel: '1857', titleRu: 'До реставрации', titleEn: 'Before restoration' },
      { id: '1859', yearLabel: '1859 / 1883', titleRu: 'Реставрация Рихтера', titleEn: 'Richter restoration' }
    ],
    sources: romanovSources.map((source) => ({
      id: source.id,
      title: source.titleRu,
      creator: source.author,
      dateLabel: source.year,
      sourceUrl: source.sourcePage,
      rights: rightsMap[source.rights],
      accessedAt: '2026-09-16'
    })),
    claims: romanovClaims,
    models: romanovModelCatalog.map((model) => ({
      id: model.id,
      format: 'glb',
      version: model.version,
      eraId: model.era,
      trustMode: model.trustMode === 'documented' ? 'documented' : 'public-research',
      runtimeModes: model.allowedRuntimeModes,
      sourceIds: model.sourceIds,
      checksum: model.sha256,
      byteSize: model.byteSize
    })),
    metricAuthority: {
      id: ROMANOV_METRIC_AUTHORITY.id,
      version: ROMANOV_METRIC_AUTHORITY.version,
      modelPackVersion: ROMANOV_METRIC_AUTHORITY.modelPackVersion,
      modelUnits: ROMANOV_METRIC_AUTHORITY.modelUnits,
      metersPerModelUnit: ROMANOV_METRIC_AUTHORITY.metersPerModelUnit,
      scaleStatus: ROMANOV_METRIC_AUTHORITY.scaleStatus,
      verifiedScaleTolerance: ROMANOV_METRIC_AUTHORITY.verifiedScaleTolerance
    },
    controlPointAuthority: {
      id: ROMANOV_CONTROL_POINT_SET.id,
      version: ROMANOV_CONTROL_POINT_SET.version,
      requiredPoints: ROMANOV_CONTROL_POINT_SET.requiredPoints,
      requiredAlignmentPoints: ROMANOV_CONTROL_POINT_SET.requiredAlignmentPoints,
      surveyPacketId: input.survey.id,
      surveyApprovedAt: input.survey.approvedAt,
      surveyApprovedBy: input.survey.approvedBy
    },
    calibrationAuthority: {
      version: input.calibration.version,
      metricAuthorityId: input.calibration.metricBinding?.metricAuthorityId ?? '',
      metricAuthorityVersion: input.calibration.metricBinding?.metricAuthorityVersion ?? 0,
      modelPackVersion: input.calibration.metricBinding?.modelPackVersion ?? '',
      verifiedAt: input.calibration.verifiedAt
    },
    fieldEvidenceAuthority: {
      surveyPacketId: matrix.surveyPacketId,
      totalSessions: matrix.sessions,
      passedSessions: matrix.passedSessions,
      completeDevices: matrix.completeDevices.length,
      iosCompleteDevices: matrix.iosCompleteDevices,
      androidCompleteDevices: matrix.androidCompleteDevices,
      crossPlatformReady: matrix.crossPlatformReady
    },
    anchorAuthority: {
      provider: verifiedAnchor?.provider,
      anchorId: verifiedAnchor?.providerAnchorId,
      calibrationVersion: verifiedAnchor?.calibrationVersion,
      hostContinuityPassed: Boolean(verifiedAnchor?.hostContinuityPassed),
      independentResolvePassed: Boolean(verifiedAnchor && isIndependentAnchorResolve(verifiedAnchor)),
      verifiedAt: verifiedAnchor?.verifiedAt
    },
    audioAuthority,
    fieldVerification: {
      required: true,
      calibrationVersion: input.calibration.version,
      surveyVerified: surveyGate.complete,
      multiDeviceMatrixPassed: matrix.crossPlatformReady,
      persistentAnchorVerified: releaseGate.persistentAnchorVerified,
      verifiedAt: releaseGate.state === 'field-verified-spatial-scene'
        ? verifiedAnchor?.verifiedAt
        : undefined
    },
    languages: ['ru', 'en'],
    offlineEligible: true
  };
}

export function buildRomanovPublishedSpatialPackage(input: {
  calibration: CalibrationProfile;
  survey: RomanovSurveyPacket;
  sessions: RomanovFieldSession[];
  anchors: RomanovPersistentAnchor[];
}) {
  const releaseGate = summarizeRomanovReleaseGate(input);
  const candidate = baseRomanovPackage(input);

  const proposedVerified: PublishedSpatialPackage = {
    ...candidate,
    releaseState: 'field-verified',
    fieldVerification: {
      ...candidate.fieldVerification,
      verifiedAt: candidate.fieldVerification.verifiedAt
        ?? input.anchors.find((anchor) => anchor.state === 'verified')?.verifiedAt
    }
  };
  const promotionValidation = validatePublishedSpatialPackage(proposedVerified);
  const promotionBlockers = [...new Set([
    ...releaseGate.blockers,
    ...promotionValidation.blockers
  ])];

  const pkg = promotionBlockers.length === 0
    ? proposedVerified
    : candidate;

  return {
    package: pkg,
    validation: validatePublishedSpatialPackage(pkg),
    releaseGate,
    promotionBlockers
  };
}

export const romanovPublishedClaims = romanovClaims;
