import {
  assertCitywideRoutingFeed,
  projectCitywideRoutingFeed,
  type CitywideRouteEndpoint,
  type CitywideRoutingFeed
} from './citywideRoutingAuthority.ts';

export const CURRENT_ROUTING_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type CurrentRoutingSnapshot = {
  schemaVersion: typeof CURRENT_ROUTING_SNAPSHOT_SCHEMA_VERSION;
  kind: 'citywide-routing-current-snapshot';
  destinationId: string;
  fetchedAt: string;
  rawResponseSha256: string;
  request: {
    mode: 'walk';
    from: CitywideRouteEndpoint;
    to: CitywideRouteEndpoint;
  };
  feed: CitywideRoutingFeed;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function iso(value: unknown, field: string) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new Error(`Current routing snapshot ${field} is invalid`);
  }
  return value;
}

function coordinate(value: unknown, min: number, max: number, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Current routing snapshot ${field} is invalid`);
  }
  return value;
}

function endpoint(value: unknown, field: string): CitywideRouteEndpoint {
  if (!isRecord(value)) throw new Error(`Current routing snapshot ${field} is invalid`);
  if (typeof value.id !== 'string' || !value.id.trim()) {
    throw new Error(`Current routing snapshot ${field}.id is required`);
  }
  return {
    id: value.id,
    latitude: coordinate(value.latitude, -90, 90, `${field}.latitude`),
    longitude: coordinate(value.longitude, -180, 180, `${field}.longitude`)
  };
}

function sameCoordinate(a: CitywideRouteEndpoint, b: CitywideRouteEndpoint) {
  return a.id === b.id
    && Math.abs(a.latitude - b.latitude) < 1e-9
    && Math.abs(a.longitude - b.longitude) < 1e-9;
}

export function parseCurrentRoutingSnapshot(value: unknown): CurrentRoutingSnapshot {
  if (!isRecord(value)) throw new Error('Current routing snapshot must be an object');
  if (value.schemaVersion !== CURRENT_ROUTING_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error('Unsupported current routing snapshot version');
  }
  if (value.kind !== 'citywide-routing-current-snapshot') {
    throw new Error('Invalid current routing snapshot kind');
  }
  if (typeof value.destinationId !== 'string' || !value.destinationId.trim()) {
    throw new Error('Current routing snapshot destinationId is required');
  }

  const fetchedAt = iso(value.fetchedAt, 'fetchedAt');
  if (
    typeof value.rawResponseSha256 !== 'string'
    || !/^[a-f0-9]{64}$/i.test(value.rawResponseSha256)
  ) {
    throw new Error('Current routing snapshot rawResponseSha256 is invalid');
  }

  if (!isRecord(value.request) || value.request.mode !== 'walk') {
    throw new Error('Current routing snapshot request is invalid');
  }
  const from = endpoint(value.request.from, 'request.from');
  const to = endpoint(value.request.to, 'request.to');
  if (from.id === to.id) throw new Error('Current routing snapshot endpoints must differ');

  const feed = assertCitywideRoutingFeed(value.feed);
  if (feed.destinationId !== value.destinationId) {
    throw new Error('Current routing snapshot destination mismatch');
  }
  if (feed.observations.length !== 1) {
    throw new Error('Current routing snapshot must contain exactly one observation');
  }

  const observation = feed.observations[0]!;
  if (observation.mode !== 'walk') {
    throw new Error('Current routing snapshot observation mode mismatch');
  }
  if (!sameCoordinate(observation.from, from) || !sameCoordinate(observation.to, to)) {
    throw new Error('Current routing snapshot observation endpoints mismatch request');
  }
  if (observation.observedAt !== fetchedAt) {
    throw new Error('Current routing snapshot observedAt mismatch');
  }

  return {
    schemaVersion: CURRENT_ROUTING_SNAPSHOT_SCHEMA_VERSION,
    kind: 'citywide-routing-current-snapshot',
    destinationId: value.destinationId,
    fetchedAt,
    rawResponseSha256: value.rawResponseSha256,
    request: {
      mode: 'walk',
      from,
      to
    },
    feed
  };
}

export function projectCurrentRoutingSnapshot(value: unknown, nowIso: string) {
  const snapshot = parseCurrentRoutingSnapshot(value);
  return {
    snapshot,
    projection: projectCitywideRoutingFeed(snapshot.feed, nowIso)
  };
}
