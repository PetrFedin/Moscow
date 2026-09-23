import { OLD_ENGLISH_COURT_SPATIAL_AUTHORITY } from './oldEnglishCourtSpatialAuthority.ts';
import { ROMANOV_METRIC_AUTHORITY } from './romanovMetricAuthority.ts';

export type PlaceExperienceStatus = 'ready' | 'candidate' | 'needs-asset' | 'future';
export type SpatialRuntimeKind = 'romanov-v1' | null;

export type PlaceExperienceCapabilities = {
  placeId: string;
  timeMachine: PlaceExperienceStatus;
  archiveLens: PlaceExperienceStatus;
  model3d: PlaceExperienceStatus;
  spatial: PlaceExperienceStatus;
  runtime: SpatialRuntimeKind;
  spatialAuthorityId?: string;
  modelEraMap?: Record<number, '1857' | '1859'>;
};

const registry: Record<string, PlaceExperienceCapabilities> = {
  'church-st-barbara': {
    placeId: 'church-st-barbara',
    timeMachine: 'ready',
    archiveLens: 'needs-asset',
    model3d: 'future',
    spatial: 'future',
    runtime: null
  },
  'romanov-chambers': {
    placeId: 'romanov-chambers',
    timeMachine: 'ready',
    archiveLens: 'ready',
    model3d: 'candidate',
    spatial: 'candidate',
    runtime: 'romanov-v1',
    spatialAuthorityId: ROMANOV_METRIC_AUTHORITY.id,
    modelEraMap: { 0: '1857', 1: '1859', 2: '1859' }
  },
  'old-english-court': {
    placeId: 'old-english-court',
    timeMachine: 'ready',
    archiveLens: 'needs-asset',
    model3d: 'needs-asset',
    spatial: 'needs-asset',
    runtime: null,
    spatialAuthorityId: OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.id
  },
  'znamensky-cathedral': {
    placeId: 'znamensky-cathedral',
    timeMachine: 'ready',
    archiveLens: 'needs-asset',
    model3d: 'future',
    spatial: 'future',
    runtime: null
  },
  'varvarka-gates': {
    placeId: 'varvarka-gates',
    timeMachine: 'ready',
    archiveLens: 'needs-asset',
    model3d: 'future',
    spatial: 'future',
    runtime: null
  }
};

const fallback: PlaceExperienceCapabilities = {
  placeId: 'unknown',
  timeMachine: 'future',
  archiveLens: 'needs-asset',
  model3d: 'future',
  spatial: 'future',
  runtime: null
};

export function getPlaceExperienceCapabilities(placeId: string): PlaceExperienceCapabilities {
  return registry[placeId] ?? { ...fallback, placeId };
}

export function canOpenArchiveLens(placeId: string) {
  return getPlaceExperienceCapabilities(placeId).archiveLens === 'ready';
}

export function canOpenModel3d(placeId: string) {
  const capabilities = getPlaceExperienceCapabilities(placeId);
  return capabilities.model3d === 'ready' || capabilities.model3d === 'candidate';
}

export function canOpenSpatial(placeId: string) {
  const capabilities = getPlaceExperienceCapabilities(placeId);
  return Boolean(capabilities.runtime) && (capabilities.spatial === 'ready' || capabilities.spatial === 'candidate');
}

export function modelEraFromTimeIndex(placeId: string, index: number): '1857' | '1859' | null {
  const capabilities = getPlaceExperienceCapabilities(placeId);
  if (!capabilities.modelEraMap) return null;
  const rounded = Math.max(0, Math.round(index));
  return capabilities.modelEraMap[rounded] ?? capabilities.modelEraMap[Math.max(...Object.keys(capabilities.modelEraMap).map(Number))] ?? null;
}

export const placeExperienceRegistry = registry;
