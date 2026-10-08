export const CITYWIDE_ROUTING_SCHEMA_VERSION = 1 as const;

export type CitywideTravelMode = 'walk' | 'transit' | 'car' | 'taxi' | 'mixed';

export type CitywideRoutingProviderRelationship =
  | 'official'
  | 'city-service'
  | 'routing-provider'
  | 'partner';

export type CitywideRoutingProvider = {
  id: string;
  name: string;
  relationship: CitywideRoutingProviderRelationship;
  sourceUrl: string;
};

export type CitywideRouteEndpoint = {
  id: string;
  latitude: number;
  longitude: number;
};

export type CitywideRouteObservation = {
  id: string;
  providerId: string;
  from: CitywideRouteEndpoint;
  to: CitywideRouteEndpoint;
  mode: CitywideTravelMode;
  durationMinutes: number;
  distanceMeters?: number;
  observedAt: string;
  validFrom?: string;
  expiresAt: string;
  sourceUrl: string;
};

export type CitywideRoutingFeed = {
  schemaVersion: typeof CITYWIDE_ROUTING_SCHEMA_VERSION;
  destinationId: string;
  generatedAt: string;
  providers: CitywideRoutingProvider[];
  observations: CitywideRouteObservation[];
};

export type CitywideRoutingValidation = {
  valid: boolean;
  blockers: string[];
};

export type CitywideRouteFreshness = 'fresh' | 'stale' | 'not-yet-valid';

export type CitywideRouteProjection = CitywideRouteObservation & {
  providerName: string;
  freshness: CitywideRouteFreshness;
  verified: boolean;
};

export type CitywideRouteFeasibility =
  | 'safe'
  | 'tight'
  | 'impossible'
  | 'unknown';

export type CitywideRouteFeasibilityDecision = {
  status: CitywideRouteFeasibility;
  fromId: string;
  toId: string;
  departureAt: string;
  mustArriveBy: string;
  availableMinutes: number;
  requiredTravelMinutes?: number;
  bufferMinutes?: number;
  routeObservationId?: string;
  mode?: CitywideTravelMode;
  reason:
    | 'fresh-route-with-buffer'
    | 'fresh-route-tight-buffer'
    | 'fresh-route-exceeds-window'
    | 'no-fresh-route';
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttps(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\//i.test(value);
}

function isoMillis(value: unknown) {
  if (!isText(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function coordinate(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function positiveInteger(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function mode(value: unknown): value is CitywideTravelMode {
  return value === 'walk'
    || value === 'transit'
    || value === 'car'
    || value === 'taxi'
    || value === 'mixed';
}

function providerRelationship(value: unknown): value is CitywideRoutingProviderRelationship {
  return value === 'official'
    || value === 'city-service'
    || value === 'routing-provider'
    || value === 'partner';
}

export function validateCitywideRoutingFeed(value: unknown): CitywideRoutingValidation {
  const blockers: string[] = [];
  if (!isRecord(value)) return { valid: false, blockers: ['routing-feed-not-object'] };

  if (value.schemaVersion !== CITYWIDE_ROUTING_SCHEMA_VERSION) blockers.push('routing-schema-version-invalid');
  if (!isText(value.destinationId)) blockers.push('routing-destination-id-missing');
  const generatedAt = isoMillis(value.generatedAt);
  if (generatedAt === null) blockers.push('routing-generated-at-invalid');

  const providers = Array.isArray(value.providers) ? value.providers : [];
  const observations = Array.isArray(value.observations) ? value.observations : [];
  if (providers.length === 0) blockers.push('routing-providers-missing');
  if (!Array.isArray(value.observations)) blockers.push('routing-observations-invalid');

  const providerIds = new Set<string>();
  for (const [index, raw] of providers.entries()) {
    if (!isRecord(raw)) {
      blockers.push(`routing-provider-invalid:${index}`);
      continue;
    }
    if (!isText(raw.id)) blockers.push(`routing-provider-id-missing:${index}`);
    else {
      if (providerIds.has(raw.id)) blockers.push(`routing-provider-id-duplicate:${raw.id}`);
      providerIds.add(raw.id);
    }
    if (!isText(raw.name)) blockers.push(`routing-provider-name-missing:${index}`);
    if (!providerRelationship(raw.relationship)) blockers.push(`routing-provider-relationship-invalid:${index}`);
    if (!isHttps(raw.sourceUrl)) blockers.push(`routing-provider-source-invalid:${index}`);
  }

  const observationIds = new Set<string>();
  for (const [index, raw] of observations.entries()) {
    if (!isRecord(raw)) {
      blockers.push(`routing-observation-invalid:${index}`);
      continue;
    }
    const id = isText(raw.id) ? raw.id : `index-${index}`;
    if (!isText(raw.id)) blockers.push(`routing-observation-id-missing:${index}`);
    else {
      if (observationIds.has(raw.id)) blockers.push(`routing-observation-id-duplicate:${raw.id}`);
      observationIds.add(raw.id);
    }

    if (!isText(raw.providerId) || !providerIds.has(String(raw.providerId))) {
      blockers.push(`routing-provider-not-found:${id}`);
    }
    if (!mode(raw.mode)) blockers.push(`routing-mode-invalid:${id}`);
    if (!positiveInteger(raw.durationMinutes)) blockers.push(`routing-duration-invalid:${id}`);
    if (raw.distanceMeters !== undefined && !positiveInteger(raw.distanceMeters)) {
      blockers.push(`routing-distance-invalid:${id}`);
    }
    if (!isHttps(raw.sourceUrl)) blockers.push(`routing-observation-source-invalid:${id}`);

    for (const endpointName of ['from', 'to'] as const) {
      const endpoint = raw[endpointName];
      if (!isRecord(endpoint)) {
        blockers.push(`routing-${endpointName}-invalid:${id}`);
        continue;
      }
      if (!isText(endpoint.id)) blockers.push(`routing-${endpointName}-id-missing:${id}`);
      if (!coordinate(endpoint.latitude, -90, 90)) blockers.push(`routing-${endpointName}-latitude-invalid:${id}`);
      if (!coordinate(endpoint.longitude, -180, 180)) blockers.push(`routing-${endpointName}-longitude-invalid:${id}`);
    }

    const observedAt = isoMillis(raw.observedAt);
    const validFrom = raw.validFrom === undefined ? null : isoMillis(raw.validFrom);
    const expiresAt = isoMillis(raw.expiresAt);
    if (observedAt === null) blockers.push(`routing-observed-at-invalid:${id}`);
    if (raw.validFrom !== undefined && validFrom === null) blockers.push(`routing-valid-from-invalid:${id}`);
    if (expiresAt === null) blockers.push(`routing-expires-at-invalid:${id}`);
    if (observedAt !== null && generatedAt !== null && observedAt > generatedAt) {
      blockers.push(`routing-observed-after-feed-generation:${id}`);
    }
    if (observedAt !== null && expiresAt !== null && expiresAt <= observedAt) {
      blockers.push(`routing-validity-window-invalid:${id}`);
    }
    if (validFrom !== null && expiresAt !== null && expiresAt <= validFrom) {
      blockers.push(`routing-valid-from-window-invalid:${id}`);
    }
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)] };
}

export function assertCitywideRoutingFeed(value: unknown): CitywideRoutingFeed {
  const validation = validateCitywideRoutingFeed(value);
  if (!validation.valid) {
    throw new Error(`Invalid citywide routing feed: ${validation.blockers.join('; ')}`);
  }
  return value as CitywideRoutingFeed;
}

function freshness(observation: CitywideRouteObservation, nowMs: number): CitywideRouteFreshness {
  const observedAt = Date.parse(observation.observedAt);
  const validFrom = observation.validFrom ? Date.parse(observation.validFrom) : null;
  if (nowMs < observedAt) return 'not-yet-valid';
  if (validFrom !== null && nowMs < validFrom) return 'not-yet-valid';
  if (nowMs >= Date.parse(observation.expiresAt)) return 'stale';
  return 'fresh';
}

export function projectCitywideRoutingFeed(value: unknown, nowIso: string) {
  const feed = assertCitywideRoutingFeed(value);
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(nowMs)) throw new Error('Routing projection requires a valid ISO timestamp');
  const providers = new Map(feed.providers.map((provider) => [provider.id, provider]));

  const observations = feed.observations.map((observation): CitywideRouteProjection => {
    const state = freshness(observation, nowMs);
    return {
      ...observation,
      providerName: providers.get(observation.providerId)!.name,
      freshness: state,
      verified: state === 'fresh'
    };
  });

  return {
    destinationId: feed.destinationId,
    asOf: nowIso,
    observations
  };
}

export function decideCitywideRouteFeasibility(input: {
  projection: ReturnType<typeof projectCitywideRoutingFeed>;
  fromId: string;
  toId: string;
  departureAt: string;
  mustArriveBy: string;
  preferredModes?: CitywideTravelMode[];
  safeBufferMinutes?: number;
}): CitywideRouteFeasibilityDecision {
  const departure = Date.parse(input.departureAt);
  const arrival = Date.parse(input.mustArriveBy);
  if (!Number.isFinite(departure) || !Number.isFinite(arrival) || arrival <= departure) {
    throw new Error('Feasibility window must be a valid positive interval');
  }

  const availableMinutes = Math.floor((arrival - departure) / 60_000);
  const preferred = new Set(input.preferredModes ?? []);
  const candidates = input.projection.observations
    .filter((observation) =>
      observation.verified
      && observation.from.id === input.fromId
      && observation.to.id === input.toId
      && (preferred.size === 0 || preferred.has(observation.mode))
    )
    .sort((a, b) => a.durationMinutes - b.durationMinutes || a.id.localeCompare(b.id));

  const route = candidates[0];
  if (!route) {
    return {
      status: 'unknown',
      fromId: input.fromId,
      toId: input.toId,
      departureAt: input.departureAt,
      mustArriveBy: input.mustArriveBy,
      availableMinutes,
      reason: 'no-fresh-route'
    };
  }

  const bufferMinutes = availableMinutes - route.durationMinutes;
  const safeBuffer = input.safeBufferMinutes ?? 15;

  if (bufferMinutes < 0) {
    return {
      status: 'impossible',
      fromId: input.fromId,
      toId: input.toId,
      departureAt: input.departureAt,
      mustArriveBy: input.mustArriveBy,
      availableMinutes,
      requiredTravelMinutes: route.durationMinutes,
      bufferMinutes,
      routeObservationId: route.id,
      mode: route.mode,
      reason: 'fresh-route-exceeds-window'
    };
  }

  if (bufferMinutes < safeBuffer) {
    return {
      status: 'tight',
      fromId: input.fromId,
      toId: input.toId,
      departureAt: input.departureAt,
      mustArriveBy: input.mustArriveBy,
      availableMinutes,
      requiredTravelMinutes: route.durationMinutes,
      bufferMinutes,
      routeObservationId: route.id,
      mode: route.mode,
      reason: 'fresh-route-tight-buffer'
    };
  }

  return {
    status: 'safe',
    fromId: input.fromId,
    toId: input.toId,
    departureAt: input.departureAt,
    mustArriveBy: input.mustArriveBy,
    availableMinutes,
    requiredTravelMinutes: route.durationMinutes,
    bufferMinutes,
    routeObservationId: route.id,
    mode: route.mode,
    reason: 'fresh-route-with-buffer'
  };
}
