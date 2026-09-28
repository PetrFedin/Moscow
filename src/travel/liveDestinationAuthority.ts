import type { BookingHandoff, ExperienceNodeKind } from './destinationPackage.ts';

export const LIVE_DESTINATION_SCHEMA_VERSION = 1 as const;

export type LiveProviderRelationship =
  | 'official'
  | 'city-service'
  | 'partner'
  | 'booking-provider';

export type LiveDestinationProvider = {
  id: string;
  name: string;
  relationship: LiveProviderRelationship;
  sourceUrl: string;
  attributionRu: string;
  attributionEn: string;
  attributionZh: string;
};

export type LiveOperationalStatus =
  | 'open'
  | 'closed'
  | 'temporarily-closed'
  | 'scheduled'
  | 'cancelled'
  | 'rescheduled'
  | 'sold-out'
  | 'finished'
  | 'unknown';

export type LiveBookingHandoff = BookingHandoff & {
  providerId: string;
  verifiedAt: string;
  expiresAt: string;
};

export type LiveDestinationEntity = {
  id: string;
  providerEntityId: string;
  providerId: string;
  kind: Exclude<ExperienceNodeKind, 'heritage'>;
  titleRu: string;
  titleEn: string;
  titleZh: string;
  latitude: number;
  longitude: number;
  tags: string[];
  sourceUrl: string;
  observedAt: string;
  validFrom?: string;
  expiresAt: string;
  operationalStatus: LiveOperationalStatus;
  startsAt?: string;
  endsAt?: string;
  booking?: LiveBookingHandoff;
};

export type LiveDestinationFeed = {
  schemaVersion: typeof LIVE_DESTINATION_SCHEMA_VERSION;
  destinationId: string;
  generatedAt: string;
  providers: LiveDestinationProvider[];
  entities: LiveDestinationEntity[];
};

export type LiveDestinationValidation = {
  valid: boolean;
  blockers: string[];
  warnings: string[];
};

export type LiveFreshness = 'fresh' | 'stale' | 'not-yet-valid';

export type LiveDestinationProjectionEntity = {
  id: string;
  providerEntityId: string;
  providerId: string;
  providerName: string;
  providerAttributionRu: string;
  providerAttributionEn: string;
  providerAttributionZh: string;
  kind: LiveDestinationEntity['kind'];
  titleRu: string;
  titleEn: string;
  titleZh: string;
  latitude: number;
  longitude: number;
  tags: string[];
  sourceUrl: string;
  observedAt: string;
  expiresAt: string;
  freshness: LiveFreshness;
  operationalStatus: LiveOperationalStatus;
  startsAt?: string;
  endsAt?: string;
  booking?: LiveBookingHandoff;
  journeyEligible: boolean;
};

const FORBIDDEN_LIVE_KEYS = new Set([
  'price',
  'priceamount',
  'pricefrom',
  'pricecurrency',
  'availability',
  'availabilitycount',
  'remainingtickets',
  'remainingseats',
  'sponsor',
  'sponsorname',
  'paidplacement',
  'rankboost',
  'commercialscore'
]);

const STATUS_BY_KIND: Record<LiveDestinationEntity['kind'], Set<LiveOperationalStatus>> = {
  museum: new Set(['open', 'closed', 'temporarily-closed', 'unknown']),
  food: new Set(['open', 'closed', 'temporarily-closed', 'unknown']),
  event: new Set(['scheduled', 'cancelled', 'rescheduled', 'sold-out', 'finished', 'unknown']),
  activity: new Set(['open', 'closed', 'temporarily-closed', 'scheduled', 'cancelled', 'sold-out', 'unknown']),
  nature: new Set(['open', 'closed', 'temporarily-closed', 'unknown']),
  stay: new Set(['open', 'closed', 'temporarily-closed', 'unknown']),
  transport: new Set(['open', 'closed', 'temporarily-closed', 'scheduled', 'cancelled', 'unknown']),
  viewpoint: new Set(['open', 'closed', 'temporarily-closed', 'unknown'])
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

function nonEmptyUniqueStrings(value: unknown) {
  return Array.isArray(value)
    && value.length > 0
    && value.every((item) => isText(item))
    && new Set(value).size === value.length;
}

function duplicateIds(values: unknown[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (!isRecord(value) || !isText(value.id)) continue;
    if (seen.has(value.id)) duplicates.add(value.id);
    seen.add(value.id);
  }
  return [...duplicates];
}

function findForbiddenLiveKeys(value: unknown, path = '$'): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenLiveKeys(item, `${path}[${index}]`));
  }
  const found: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.replace(/[_-]/g, '').toLowerCase();
    const next = `${path}.${key}`;
    if (FORBIDDEN_LIVE_KEYS.has(normalized)) found.push(next);
    found.push(...findForbiddenLiveKeys(nested, next));
  }
  return found;
}

function validateBooking(
  raw: unknown,
  providerIds: Set<string>,
  entityId: string
) {
  const blockers: string[] = [];
  if (!isRecord(raw)) return [`booking-invalid:${entityId}`];

  if (
    raw.mode !== 'external-provider'
    && raw.mode !== 'partner-deep-link'
    && raw.mode !== 'city-service'
  ) {
    blockers.push(`booking-mode-invalid:${entityId}`);
  }
  if (!isText(raw.provider)) blockers.push(`booking-provider-label-missing:${entityId}`);
  if (!isText(raw.providerId) || !providerIds.has(String(raw.providerId))) {
    blockers.push(`booking-provider-not-found:${entityId}`);
  }
  if (
    raw.action !== 'book'
    && raw.action !== 'reserve'
    && raw.action !== 'buy-ticket'
    && raw.action !== 'request'
  ) {
    blockers.push(`booking-action-invalid:${entityId}`);
  }
  if (!isHttps(raw.url)) blockers.push(`booking-url-not-https:${entityId}`);

  const verifiedAt = isoMillis(raw.verifiedAt);
  const expiresAt = isoMillis(raw.expiresAt);
  if (verifiedAt === null) blockers.push(`booking-verified-at-invalid:${entityId}`);
  if (expiresAt === null) blockers.push(`booking-expires-at-invalid:${entityId}`);
  if (verifiedAt !== null && expiresAt !== null && expiresAt <= verifiedAt) {
    blockers.push(`booking-validity-window-invalid:${entityId}`);
  }
  return blockers;
}

export function validateLiveDestinationFeed(value: unknown): LiveDestinationValidation {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(value)) return { valid: false, blockers: ['live-feed-not-object'], warnings };

  const forbidden = findForbiddenLiveKeys(value);
  if (forbidden.length > 0) blockers.push('live-feed-contains-unsupported-commercial-or-price-fields');

  if (value.schemaVersion !== LIVE_DESTINATION_SCHEMA_VERSION) blockers.push('live-schema-version-invalid');
  if (!isText(value.destinationId)) blockers.push('live-destination-id-missing');
  const generatedAt = isoMillis(value.generatedAt);
  if (generatedAt === null) blockers.push('live-generated-at-invalid');
  if (!Array.isArray(value.providers) || value.providers.length === 0) blockers.push('live-providers-missing');
  if (!Array.isArray(value.entities)) blockers.push('live-entities-invalid');

  const providers = Array.isArray(value.providers) ? value.providers : [];
  const entities = Array.isArray(value.entities) ? value.entities : [];

  for (const duplicate of duplicateIds(providers)) blockers.push(`duplicate-live-provider:${duplicate}`);
  for (const duplicate of duplicateIds(entities)) blockers.push(`duplicate-live-entity:${duplicate}`);

  const providerIds = new Set<string>();
  for (const [index, raw] of providers.entries()) {
    if (!isRecord(raw)) {
      blockers.push(`live-provider-invalid:${index}`);
      continue;
    }
    if (!isText(raw.id)) blockers.push(`live-provider-id-missing:${index}`);
    else providerIds.add(raw.id);
    if (!isText(raw.name)) blockers.push(`live-provider-name-missing:${index}`);
    if (
      raw.relationship !== 'official'
      && raw.relationship !== 'city-service'
      && raw.relationship !== 'partner'
      && raw.relationship !== 'booking-provider'
    ) {
      blockers.push(`live-provider-relationship-invalid:${index}`);
    }
    if (!isHttps(raw.sourceUrl)) blockers.push(`live-provider-source-url-invalid:${index}`);
    if (!isText(raw.attributionRu)) blockers.push(`live-provider-attribution-ru-missing:${index}`);
    if (!isText(raw.attributionEn)) blockers.push(`live-provider-attribution-en-missing:${index}`);
    if (!isText(raw.attributionZh)) blockers.push(`live-provider-attribution-zh-missing:${index}`);
  }

  const providerEntityKeys = new Set<string>();
  for (const [index, raw] of entities.entries()) {
    if (!isRecord(raw)) {
      blockers.push(`live-entity-invalid:${index}`);
      continue;
    }
    const id = isText(raw.id) ? raw.id : `index-${index}`;
    if (!isText(raw.id)) blockers.push(`live-entity-id-missing:${index}`);
    if (!isText(raw.providerEntityId)) blockers.push(`live-provider-entity-id-missing:${id}`);
    if (!isText(raw.providerId) || !providerIds.has(String(raw.providerId))) {
      blockers.push(`live-provider-not-found:${id}`);
    } else if (isText(raw.providerEntityId)) {
      const providerEntityKey = `${raw.providerId}:${raw.providerEntityId}`;
      if (providerEntityKeys.has(providerEntityKey)) {
        blockers.push(`duplicate-provider-entity:${providerEntityKey}`);
      }
      providerEntityKeys.add(providerEntityKey);
    }

    const kind = raw.kind as LiveDestinationEntity['kind'];
    if (!Object.prototype.hasOwnProperty.call(STATUS_BY_KIND, kind)) blockers.push(`live-kind-invalid:${id}`);
    if (!isText(raw.titleRu)) blockers.push(`live-title-ru-missing:${id}`);
    if (!isText(raw.titleEn)) blockers.push(`live-title-en-missing:${id}`);
    if (!isText(raw.titleZh)) blockers.push(`live-title-zh-missing:${id}`);
    if (!coordinate(raw.latitude, -90, 90)) blockers.push(`live-latitude-invalid:${id}`);
    if (!coordinate(raw.longitude, -180, 180)) blockers.push(`live-longitude-invalid:${id}`);
    if (!nonEmptyUniqueStrings(raw.tags)) blockers.push(`live-tags-invalid:${id}`);
    if (!isHttps(raw.sourceUrl)) blockers.push(`live-source-url-invalid:${id}`);

    const observedAt = isoMillis(raw.observedAt);
    const validFrom = raw.validFrom === undefined ? null : isoMillis(raw.validFrom);
    const expiresAt = isoMillis(raw.expiresAt);
    if (observedAt === null) blockers.push(`live-observed-at-invalid:${id}`);
    if (observedAt !== null && generatedAt !== null && observedAt > generatedAt) {
      blockers.push(`live-observed-after-feed-generation:${id}`);
    }
    if (raw.validFrom !== undefined && validFrom === null) blockers.push(`live-valid-from-invalid:${id}`);
    if (expiresAt === null) blockers.push(`live-expires-at-invalid:${id}`);
    if (observedAt !== null && expiresAt !== null && expiresAt <= observedAt) {
      blockers.push(`live-validity-window-invalid:${id}`);
    }
    if (validFrom !== null && expiresAt !== null && expiresAt <= validFrom) {
      blockers.push(`live-valid-from-window-invalid:${id}`);
    }

    if (
      !Object.prototype.hasOwnProperty.call(STATUS_BY_KIND, kind)
      || !STATUS_BY_KIND[kind]?.has(raw.operationalStatus as LiveOperationalStatus)
    ) {
      blockers.push(`live-operational-status-invalid:${id}`);
    }

    if (kind === 'event') {
      const startsAt = isoMillis(raw.startsAt);
      if (startsAt === null) blockers.push(`live-event-start-invalid:${id}`);
      if (raw.endsAt !== undefined) {
        const endsAt = isoMillis(raw.endsAt);
        if (endsAt === null) blockers.push(`live-event-end-invalid:${id}`);
        else if (startsAt !== null && endsAt <= startsAt) blockers.push(`live-event-window-invalid:${id}`);
      }
    } else if (raw.startsAt !== undefined || raw.endsAt !== undefined) {
      warnings.push(`live-non-event-has-time-window:${id}`);
    }

    if (raw.booking !== undefined) {
      blockers.push(...validateBooking(raw.booking, providerIds, id));
    }
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)], warnings: [...new Set(warnings)] };
}

export function assertLiveDestinationFeed(value: unknown): LiveDestinationFeed {
  const validation = validateLiveDestinationFeed(value);
  if (!validation.valid) {
    throw new Error(`Invalid live destination feed: ${validation.blockers.join('; ')}`);
  }
  return value as LiveDestinationFeed;
}

function freshness(entity: LiveDestinationEntity, nowMs: number): LiveFreshness {
  const observedAt = Date.parse(entity.observedAt);
  const validFrom = entity.validFrom ? Date.parse(entity.validFrom) : null;
  if (nowMs < observedAt) return 'not-yet-valid';
  if (validFrom !== null && nowMs < validFrom) return 'not-yet-valid';
  if (nowMs >= Date.parse(entity.expiresAt)) return 'stale';
  return 'fresh';
}

function bookingIsFresh(booking: LiveBookingHandoff, nowMs: number) {
  return nowMs >= Date.parse(booking.verifiedAt)
    && nowMs < Date.parse(booking.expiresAt);
}

function operationalForJourney(status: LiveOperationalStatus) {
  return status === 'open' || status === 'scheduled' || status === 'rescheduled';
}

export function projectLiveDestinationFeed(
  value: unknown,
  now: string
): {
  destinationId: string;
  asOf: string;
  freshEntityCount: number;
  staleEntityCount: number;
  notYetValidEntityCount: number;
  entities: LiveDestinationProjectionEntity[];
} {
  const feed = assertLiveDestinationFeed(value);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error('Live destination projection requires a valid ISO timestamp');

  const providers = new Map(feed.providers.map((provider) => [provider.id, provider]));
  const entities = feed.entities.map((entity): LiveDestinationProjectionEntity => {
    const provider = providers.get(entity.providerId)!;
    const state = freshness(entity, nowMs);
    const liveStatus = state === 'fresh' ? entity.operationalStatus : 'unknown';
    const booking = state === 'fresh'
      && entity.booking
      && bookingIsFresh(entity.booking, nowMs)
      ? { ...entity.booking }
      : undefined;

    return {
      id: entity.id,
      providerEntityId: entity.providerEntityId,
      providerId: entity.providerId,
      providerName: provider.name,
      providerAttributionRu: provider.attributionRu,
      providerAttributionEn: provider.attributionEn,
      providerAttributionZh: provider.attributionZh,
      kind: entity.kind,
      titleRu: entity.titleRu,
      titleEn: entity.titleEn,
      titleZh: entity.titleZh,
      latitude: entity.latitude,
      longitude: entity.longitude,
      tags: [...entity.tags],
      sourceUrl: entity.sourceUrl,
      observedAt: entity.observedAt,
      expiresAt: entity.expiresAt,
      freshness: state,
      operationalStatus: liveStatus,
      ...(entity.startsAt ? { startsAt: entity.startsAt } : {}),
      ...(entity.endsAt ? { endsAt: entity.endsAt } : {}),
      ...(booking ? { booking } : {}),
      journeyEligible: state === 'fresh' && operationalForJourney(entity.operationalStatus)
    };
  });

  return {
    destinationId: feed.destinationId,
    asOf: now,
    freshEntityCount: entities.filter((entity) => entity.freshness === 'fresh').length,
    staleEntityCount: entities.filter((entity) => entity.freshness === 'stale').length,
    notYetValidEntityCount: entities.filter((entity) => entity.freshness === 'not-yet-valid').length,
    entities
  };
}
