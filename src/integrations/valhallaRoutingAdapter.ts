import {
  CITYWIDE_ROUTING_SCHEMA_VERSION,
  type CitywideRouteObservation,
  type CitywideRoutingFeed,
  type CitywideRoutingProvider,
  type CitywideTravelMode
} from '../travel/citywideRoutingAuthority.ts';
import type { RealProviderAdmission } from './realProviderAdmission.ts';

export const VALHALLA_ROUTING_ADAPTER_VERSION = 1 as const;
export const VALHALLA_PROVIDER_ID = 'valhalla' as const;
export const VALHALLA_ADAPTER_ID = 'valhalla-route-v1' as const;

export type ValhallaCoordinate = {
  id: string;
  latitude: number;
  longitude: number;
};

export type ValhallaRouteRequest = {
  locations: Array<{ lat: number; lon: number }>;
  costing: 'pedestrian';
  units: 'kilometers';
  directions_options: {
    units: 'kilometers';
  };
};

export type ValhallaRouteResponse = {
  trip?: {
    status?: number;
    status_message?: string;
    units?: string;
    summary?: {
      time?: number;
      length?: number;
    };
  };
};

export type NormalizeValhallaRouteInput = {
  raw: unknown;
  sourceUrl: string;
  from: ValhallaCoordinate;
  to: ValhallaCoordinate;
  fetchedAt: string;
  expiresAt: string;
  observationId: string;
};

export function buildValhallaWalkingRequest(
  from: ValhallaCoordinate,
  to: ValhallaCoordinate
): ValhallaRouteRequest {
  return {
    locations: [
      { lat: from.latitude, lon: from.longitude },
      { lat: to.latitude, lon: to.longitude }
    ],
    costing: 'pedestrian',
    units: 'kilometers',
    directions_options: {
      units: 'kilometers'
    }
  };
}

export function buildValhallaRoutingAdmission(input: {
  sourceUrl: string;
  admittedAt: string;
  evidenceRef: string;
  capabilityEvidenceRef: string;
  schemaEvidenceRef: string;
}): RealProviderAdmission {
  return {
    version: 1,
    providerId: VALHALLA_PROVIDER_ID,
    adapterId: VALHALLA_ADAPTER_ID,
    kind: 'routing',
    destinationId: 'moscow',
    sourceUrl: input.sourceUrl,
    credentials: {
      mode: 'public-api',
      admittedAt: input.admittedAt,
      evidenceRef: input.evidenceRef
    },
    discoveredCapabilities: ['routing'],
    capabilityEvidenceRef: input.capabilityEvidenceRef,
    schemaMapping: {
      providerSchemaVersion: 'valhalla-route-json',
      mappingVersion: '1',
      routeDurationPath: '$.trip.summary.time',
      routeDistancePath: '$.trip.summary.length',
      evidenceRef: input.schemaEvidenceRef
    }
  };
}

function assertIso(value: string, field: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${field}: ${value}`);
  return parsed;
}

function assertHttps(value: string, field: string) {
  if (!/^https:\/\//i.test(value)) throw new Error(`${field} must use HTTPS`);
}

function assertCoordinate(value: ValhallaCoordinate, field: string) {
  if (!value.id.trim()) throw new Error(`${field} id is required`);
  if (!Number.isFinite(value.latitude) || value.latitude < -90 || value.latitude > 90) {
    throw new Error(`${field} latitude is invalid`);
  }
  if (!Number.isFinite(value.longitude) || value.longitude < -180 || value.longitude > 180) {
    throw new Error(`${field} longitude is invalid`);
  }
}

function routeResponse(value: unknown): ValhallaRouteResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Valhalla route response must be an object');
  }
  return value as ValhallaRouteResponse;
}

export function normalizeValhallaWalkingRoute(
  input: NormalizeValhallaRouteInput
): CitywideRouteObservation {
  assertHttps(input.sourceUrl, 'Valhalla source URL');
  assertCoordinate(input.from, 'from');
  assertCoordinate(input.to, 'to');

  const fetchedAt = assertIso(input.fetchedAt, 'fetchedAt');
  const expiresAt = assertIso(input.expiresAt, 'expiresAt');
  if (expiresAt <= fetchedAt) throw new Error('Valhalla route evidence must expire after fetch time');
  if (!input.observationId.trim()) throw new Error('Valhalla observation id is required');

  const raw = routeResponse(input.raw);
  if (raw.trip?.status !== 0) {
    throw new Error(`Valhalla route failed: ${raw.trip?.status_message ?? 'unknown status'}`);
  }

  const seconds = raw.trip.summary?.time;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    throw new Error('Valhalla route summary time is missing or invalid');
  }

  const length = raw.trip.summary?.length;
  if (typeof length !== 'number' || !Number.isFinite(length) || length < 0) {
    throw new Error('Valhalla route summary length is missing or invalid');
  }

  if (raw.trip.units && raw.trip.units !== 'kilometers') {
    throw new Error(`Unsupported Valhalla units: ${raw.trip.units}`);
  }

  return {
    id: input.observationId,
    providerId: VALHALLA_PROVIDER_ID,
    from: {
      id: input.from.id,
      latitude: input.from.latitude,
      longitude: input.from.longitude
    },
    to: {
      id: input.to.id,
      latitude: input.to.latitude,
      longitude: input.to.longitude
    },
    mode: 'walk',
    durationMinutes: Math.max(1, Math.ceil(seconds / 60)),
    distanceMeters: Math.max(1, Math.round(length * 1000)),
    observedAt: input.fetchedAt,
    expiresAt: input.expiresAt,
    sourceUrl: input.sourceUrl
  };
}

export function buildValhallaRoutingFeed(input: {
  sourceUrl: string;
  generatedAt: string;
  observations: CitywideRouteObservation[];
}): CitywideRoutingFeed {
  assertHttps(input.sourceUrl, 'Valhalla provider source URL');
  assertIso(input.generatedAt, 'generatedAt');

  const provider: CitywideRoutingProvider = {
    id: VALHALLA_PROVIDER_ID,
    name: 'Valhalla',
    relationship: 'routing-provider',
    sourceUrl: input.sourceUrl
  };

  return {
    schemaVersion: CITYWIDE_ROUTING_SCHEMA_VERSION,
    destinationId: 'moscow',
    generatedAt: input.generatedAt,
    providers: [provider],
    observations: input.observations
  };
}

export function valhallaModeToCitywideMode(costing: string): CitywideTravelMode | undefined {
  if (costing === 'pedestrian') return 'walk';
  if (costing === 'auto') return 'car';
  if (costing === 'multimodal') return 'mixed';
  return undefined;
}
