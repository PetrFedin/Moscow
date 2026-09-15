import { romanovSources } from './romanov-sources';
import { romanovModelPack } from './romanovModelPack.native';
import {
  validatePublishedSpatialPackage,
  type PublishedSpatialPackage,
  type SpatialRightsStatus
} from './publishedSpatialPackage';

const rightsMap: Record<(typeof romanovSources)[number]['rights'], SpatialRightsStatus> = {
  'public-domain': 'public-domain',
  'official-reference': 'restricted',
  'needs-rights-review': 'review-required'
};

/**
 * Machine-readable candidate package for the first Moscow spatial heritage scene.
 * It is deliberately NOT marked field-verified until the on-site gates pass.
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
  claims: [],
  models: romanovModelPack.map((model) => ({
    id: model.id,
    format: 'glb',
    version: model.version,
    eraId: model.era,
    trustMode: model.trustMode === 'documented' ? 'documented' : 'public-research',
    runtimeModes: model.allowedRuntimeModes,
    sourceIds: model.sourceIds
  })),
  fieldVerification: {
    required: true,
    surveyVerified: false,
    multiDeviceMatrixPassed: false,
    persistentAnchorVerified: false
  },
  languages: ['ru', 'en'],
  offlineEligible: true
};

export const romanovPublishedCandidateValidation = validatePublishedSpatialPackage(romanovPublishedCandidate);
