import { pilotRoute, places } from '../data/places.ts';
import {
  validateDestinationPackage,
  type DestinationPackage,
  type DestinationSource
} from './destinationPackage.ts';

function sourceId(placeId: string, index: number) {
  return `moscow:${placeId}:source:${index + 1}`;
}

const sources: DestinationSource[] = places.flatMap((place) =>
  place.sources.map((source, index) => ({
    id: sourceId(place.id, index),
    owner: new URL(source.url).hostname,
    title: source.label,
    url: source.url,
    accessedAt: '2026-09-26',
    rights: 'official-reference' as const
  }))
);

/**
 * Moscow is the first reference implementation of the generic DestinationPackage.
 *
 * This package deliberately exposes only source-backed heritage inventory already
 * present in the repository. Food, stays, live events, commercial partners and
 * booking providers must be added only after authoritative data/provider contracts
 * exist; the schema supports them but this reference does not invent them.
 */
export const moscowVarvarkaDestinationPackage: DestinationPackage = {
  schemaVersion: 1,
  id: 'ru-moscow-varvarka-destination-v1',
  version: 1,
  destination: {
    id: 'moscow-varvarka',
    scope: 'route-cluster',
    titleRu: 'Москва · Варварка — Зарядье',
    titleEn: 'Moscow · Varvarka — Zaryadye',
    federalSubjectCode: '77',
    countryCode: 'RU'
  },
  publisher: 'Moscow in Time',
  languages: ['ru', 'en'],
  sources,
  nodes: places.map((place) => ({
    id: place.id,
    kind: 'heritage',
    titleRu: place.title,
    latitude: place.latitude,
    longitude: place.longitude,
    durationMinutes: place.experienceMinutes,
    tags: [...place.tags],
    sourceIds: place.sources.map((_, index) => sourceId(place.id, index)),
    heritagePackageId:
      place.id === 'romanov-chambers'
        ? 'moscow-romanov-chambers-spatial-v1'
        : place.id === 'old-english-court'
          ? 'moscow-old-english-court-spatial-v1'
          : undefined
  })),
  routes: [
    {
      id: 'varvarka-45',
      titleRu: 'Варварка во времени',
      titleEn: 'Varvarka Through Time',
      nodeIds: [...pilotRoute.stopIds],
      estimatedMinutes: pilotRoute.durationMinutes,
      themes: ['история Москвы', 'архитектура', 'торговля', 'Зарядье'],
      source: 'editorial'
    }
  ],
  commercialPlacements: [],
  offlineEligible: true
};

export const moscowVarvarkaDestinationPackageValidation =
  validateDestinationPackage(moscowVarvarkaDestinationPackage);
