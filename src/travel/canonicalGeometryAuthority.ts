import type {
  CitywideRouteEndpoint
} from './citywideRoutingAuthority.ts';
import type {
  LiveDestinationProjectionEntity
} from './liveDestinationAuthority.ts';

export const CANONICAL_GEOMETRY_SCHEMA_VERSION = 1 as const;

export type CanonicalGeometryEvidence = {
  schemaVersion: typeof CANONICAL_GEOMETRY_SCHEMA_VERSION;
  canonicalNodeId: string;
  latitude: number;
  longitude: number;
  source: {
    kind: 'current-live' | 'official-address+geocoder';
    officialAddressSource: string;
    geocoderSource?: string;
    providerId?: string;
    evidenceRef: string;
  };
};

const STATIC_GEOMETRY: ReadonlyArray<CanonicalGeometryEvidence> = [
  {
    schemaVersion: CANONICAL_GEOMETRY_SCHEMA_VERSION,
    canonicalNodeId: 'tretyakov-aleksey-bogolyubov-neva-bosporus',
    latitude: 55.7413613,
    longitude: 37.6202196,
    source: {
      kind: 'official-address+geocoder',
      officialAddressSource:
        'https://www.tretyakovgallery.ru/exhibitions/o/aleksey-bogolyubov-ot-nevy-do-bosfora/',
      geocoderSource:
        'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=ru&q=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%9B%D0%B0%D0%B2%D1%80%D1%83%D1%88%D0%B8%D0%BD%D1%81%D0%BA%D0%B8%D0%B9%20%D0%BF%D0%B5%D1%80%D0%B5%D1%83%D0%BB%D0%BE%D0%BA%2C%2010',
      providerId: 'openstreetmap-nominatim',
      evidenceRef: 'evidence/geometry/replacement-geometry-v1.json#tretyakov-aleksey-bogolyubov-neva-bosporus'
    }
  },
  {
    schemaVersion: CANONICAL_GEOMETRY_SCHEMA_VERSION,
    canonicalNodeId: 'bolshoi-theatre',
    latitude: 55.7601296,
    longitude: 37.6186118,
    source: {
      kind: 'official-address+geocoder',
      officialAddressSource:
        'https://bolshoi.ru/media/about/files/%D0%9F%D0%95%D0%A0%D0%95%D0%9E%D0%A4%D0%9E%D0%A0%D0%9C%D0%9B%D0%95%D0%9D%D0%98%D0%95%20%D0%9A%D0%9E%D0%A0%D0%A0%D0%95%D0%9A%D0%A2%D0%9D%D0%9E%D0%95.pdf',
      geocoderSource:
        'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=ru&q=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%91%D0%BE%D0%BB%D1%8C%D1%88%D0%BE%D0%B9%20%D1%82%D0%B5%D0%B0%D1%82%D1%80',
      providerId: 'openstreetmap-nominatim',
      evidenceRef: 'evidence/geometry/replacement-geometry-v1.json#bolshoi-theatre'
    }
  }
];

function validCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function assertEvidence(value: CanonicalGeometryEvidence) {
  if (!value.canonicalNodeId.trim()) {
    throw new Error('Canonical geometry node id is required');
  }
  if (!validCoordinate(value.latitude, -90, 90)) {
    throw new Error(`Canonical geometry latitude invalid: ${value.canonicalNodeId}`);
  }
  if (!validCoordinate(value.longitude, -180, 180)) {
    throw new Error(`Canonical geometry longitude invalid: ${value.canonicalNodeId}`);
  }
  if (!/^https:\/\//i.test(value.source.officialAddressSource)) {
    throw new Error(`Canonical geometry official source must use HTTPS: ${value.canonicalNodeId}`);
  }
  if (
    value.source.geocoderSource
    && !/^https:\/\//i.test(value.source.geocoderSource)
  ) {
    throw new Error(`Canonical geometry geocoder source must use HTTPS: ${value.canonicalNodeId}`);
  }
  if (!value.source.evidenceRef.trim()) {
    throw new Error(`Canonical geometry evidenceRef is required: ${value.canonicalNodeId}`);
  }
  return value;
}

for (const fact of STATIC_GEOMETRY) assertEvidence(fact);

function liveGeometry(
  nodeId: string,
  entities: ReadonlyArray<LiveDestinationProjectionEntity>
): CanonicalGeometryEvidence | undefined {
  const entity = entities.find((candidate) =>
    candidate.freshness === 'fresh'
    && candidate.canonicalDestinationNodeId === nodeId
    && candidate.latitude !== undefined
    && candidate.longitude !== undefined
  );
  if (!entity || entity.latitude === undefined || entity.longitude === undefined) {
    return undefined;
  }

  return assertEvidence({
    schemaVersion: CANONICAL_GEOMETRY_SCHEMA_VERSION,
    canonicalNodeId: nodeId,
    latitude: entity.latitude,
    longitude: entity.longitude,
    source: {
      kind: 'current-live',
      officialAddressSource: entity.sourceUrl,
      providerId: entity.providerId,
      evidenceRef:
        entity.evidenceRef
        ?? `current-live-geometry:${encodeURIComponent(entity.providerId)}:${encodeURIComponent(entity.observedAt)}:${encodeURIComponent(entity.sourceUrl)}`
    }
  });
}

export function resolveCanonicalGeometry(input: {
  canonicalNodeId: string;
  liveEntities?: ReadonlyArray<LiveDestinationProjectionEntity>;
}): CanonicalGeometryEvidence | undefined {
  if (!input.canonicalNodeId.trim()) return undefined;

  const live = liveGeometry(
    input.canonicalNodeId,
    input.liveEntities ?? []
  );
  if (live) return live;

  return STATIC_GEOMETRY.find(
    (fact) => fact.canonicalNodeId === input.canonicalNodeId
  );
}

export function geometryEvidenceToRouteEndpoint(
  geometry: CanonicalGeometryEvidence
): CitywideRouteEndpoint {
  return {
    id: geometry.canonicalNodeId,
    latitude: geometry.latitude,
    longitude: geometry.longitude
  };
}

export function listCanonicalGeometryEvidence() {
  return STATIC_GEOMETRY.map((fact) => ({
    ...fact,
    source: { ...fact.source }
  }));
}
