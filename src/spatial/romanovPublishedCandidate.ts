import { varvarkaAudioCatalog, isProductionAudioTrack } from '../features/audio/varvarkaAudioCatalog.ts';
import { romanovSources } from './romanov-sources.ts';
import { romanovHotspots } from './romanov-hotspots.ts';
import { romanovModelCatalog, ROMANOV_MODEL_PACK_VERSION } from './romanovModelCatalog.ts';
import { ROMANOV_METRIC_AUTHORITY } from './romanovMetricAuthority.ts';
import { ROMANOV_CONTROL_POINT_SET } from './romanovControlPoints.ts';
import {
  validatePublishedSpatialPackage,
  type PublishedSpatialPackage,
  type SpatialRightsStatus
} from './publishedSpatialPackage.ts';

const rightsMap: Record<(typeof romanovSources)[number]['rights'], SpatialRightsStatus> = {
  'public-domain': 'public-domain',
  'official-reference': 'restricted',
  'needs-rights-review': 'review-required'
};

function hotspotEraIds(era: (typeof romanovHotspots)[number]['era']) {
  return era === 'both' ? ['1857', '1859'] : [era];
}

function modelElementIds(
  era: (typeof romanovModelCatalog)[number]['era'],
  trustMode: (typeof romanovModelCatalog)[number]['trustMode']
) {
  return romanovHotspots
    .filter((hotspot) => {
      const eraMatches = hotspot.era === 'both' || hotspot.era === era;
      const trustMatches = trustMode === 'public' || hotspot.evidence === 'documented';
      return eraMatches && trustMatches;
    })
    .map((hotspot) => hotspot.id);
}

const romanovAudioTracks = varvarkaAudioCatalog.filter((track) => track.placeId === 'romanov-chambers');
const romanovProductionReadyAudioTracks = romanovAudioTracks.filter(isProductionAudioTrack);

/**
 * Machine-readable candidate package for the first Moscow spatial heritage scene.
 *
 * This package is structurally complete and traceable, but deliberately remains a
 * production candidate until real survey, field-session and persistent-anchor proof
 * is supplied. The candidate also exposes unresolved rights/audio work instead of
 * silently treating those dependencies as complete.
 */
export const romanovPublishedCandidate: PublishedSpatialPackage = {
  schemaVersion: 1,
  id: 'moscow-romanov-chambers-spatial-v1',
  placeId: 'romanov-chambers',
  titleRu: 'Палаты бояр Романовых',
  titleEn: 'Romanov Chambers',
  version: 1,
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
  elements: romanovHotspots.map((hotspot) => ({
    id: hotspot.id,
    titleRu: hotspot.titleRu,
    titleEn: hotspot.titleEn,
    trust: hotspot.evidence,
    eraIds: hotspotEraIds(hotspot.era),
    sourceIds: [...hotspot.sourceIds]
  })),
  claims: romanovHotspots.map((hotspot) => ({
    id: `claim-${hotspot.id}`,
    summary: hotspot.storyRu,
    trust: hotspot.evidence,
    sourceIds: [...hotspot.sourceIds],
    modelElementIds: [hotspot.id]
  })),
  models: romanovModelCatalog.map((model) => ({
    id: model.id,
    format: 'glb',
    version: model.version,
    eraId: model.era,
    trustMode: model.trustMode === 'documented' ? 'documented' : 'public-research',
    runtimeModes: [...model.allowedRuntimeModes],
    sourceIds: [...model.sourceIds],
    elementIds: modelElementIds(model.era, model.trustMode),
    assetPath: model.assetPath,
    repositoryBlobSha: model.repositoryBlobSha,
    assetSha256: model.assetSha256,
    byteSize: model.byteSize
  })),
  authority: {
    modelPackVersion: ROMANOV_MODEL_PACK_VERSION,
    metric: {
      id: ROMANOV_METRIC_AUTHORITY.id,
      version: ROMANOV_METRIC_AUTHORITY.version,
      modelPackVersion: ROMANOV_METRIC_AUTHORITY.modelPackVersion,
      modelUnits: ROMANOV_METRIC_AUTHORITY.modelUnits,
      scaleStatus: ROMANOV_METRIC_AUTHORITY.scaleStatus
    },
    controlPoints: {
      id: ROMANOV_CONTROL_POINT_SET.id,
      version: ROMANOV_CONTROL_POINT_SET.version,
      requiredPoints: ROMANOV_CONTROL_POINT_SET.requiredPoints,
      requiredAlignmentPoints: ROMANOV_CONTROL_POINT_SET.requiredAlignmentPoints
    }
  },
  fieldVerification: {
    required: true,
    minimumFieldSessions: 12,
    releaseGateState: 'production-candidate',
    surveyVerified: false,
    multiDeviceMatrixPassed: false,
    persistentAnchorVerified: false,
    releaseBlockers: [
      'survey-evidence-not-supplied',
      'field-session-evidence-not-supplied',
      'calibration-evidence-not-supplied',
      'persistent-anchor-evidence-not-supplied'
    ]
  },
  audioAuthority: {
    expectedTracks: romanovAudioTracks.length,
    productionReadyTracks: romanovProductionReadyAudioTracks.length,
    trackIds: romanovAudioTracks.map((track) => track.id),
    status: romanovProductionReadyAudioTracks.length === romanovAudioTracks.length
      ? 'production-ready'
      : 'recording-pending',
    requiredForPublication: false
  },
  languages: ['ru', 'en'],
  offlineEligible: true
};

export const romanovPublishedCandidateValidation = validatePublishedSpatialPackage(romanovPublishedCandidate);
