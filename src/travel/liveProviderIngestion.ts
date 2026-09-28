import {
  assertLiveDestinationFeed,
  validateLiveDestinationFeed,
  type LiveDestinationEntity,
  type LiveDestinationFeed,
  type LiveDestinationProvider
} from './liveDestinationAuthority.ts';

export const LIVE_PROVIDER_SNAPSHOT_VERSION = 1 as const;

export type LiveProviderRefreshPolicy = {
  expectedRefreshSeconds: number;
  hardMaxSnapshotAgeSeconds: number;
  retryAfterSeconds: number;
};

export type LiveProviderSnapshot<TPayload = unknown> = {
  schemaVersion: typeof LIVE_PROVIDER_SNAPSHOT_VERSION;
  providerId: string;
  snapshotId: string;
  sourceUrl: string;
  fetchedAt: string;
  sourceUpdatedAt?: string;
  payloadSha256: string;
  payload: TPayload;
};

export type LiveProviderSnapshotFreshness =
  | 'fresh'
  | 'refresh-due'
  | 'expired'
  | 'future';

export type LiveProviderAdapter<TPayload = unknown> = {
  id: string;
  destinationId: string;
  provider: LiveDestinationProvider;
  refreshPolicy: LiveProviderRefreshPolicy;
  normalize: (
    payload: TPayload,
    snapshot: LiveProviderSnapshot<TPayload>
  ) => LiveDestinationEntity[];
};

export type LiveProviderIngestionRecord = {
  schemaVersion: 1;
  adapterId: string;
  destinationId: string;
  providerId: string;
  snapshotId: string;
  sourceUrl: string;
  payloadSha256: string;
  fetchedAt: string;
  sourceUpdatedAt?: string;
  normalizedAt: string;
  snapshotFreshness: Exclude<LiveProviderSnapshotFreshness, 'expired' | 'future'>;
  normalizedEntityCount: number;
  warnings: string[];
};

export type LiveProviderIngestionResult = {
  record: LiveProviderIngestionRecord;
  feed: LiveDestinationFeed;
};

const SHA256_HEX = /^[a-f0-9]{64}$/i;

function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function https(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\//i.test(value);
}

function millis(value: unknown) {
  if (!text(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateLiveProviderRefreshPolicy(
  policy: LiveProviderRefreshPolicy
) {
  const blockers: string[] = [];
  if (
    !Number.isFinite(policy.expectedRefreshSeconds)
    || policy.expectedRefreshSeconds <= 0
  ) {
    blockers.push('provider-refresh-interval-invalid');
  }
  if (
    !Number.isFinite(policy.hardMaxSnapshotAgeSeconds)
    || policy.hardMaxSnapshotAgeSeconds <= 0
  ) {
    blockers.push('provider-hard-max-age-invalid');
  }
  if (
    Number.isFinite(policy.expectedRefreshSeconds)
    && Number.isFinite(policy.hardMaxSnapshotAgeSeconds)
    && policy.hardMaxSnapshotAgeSeconds < policy.expectedRefreshSeconds
  ) {
    blockers.push('provider-hard-max-age-below-refresh-interval');
  }
  if (
    !Number.isFinite(policy.retryAfterSeconds)
    || policy.retryAfterSeconds <= 0
  ) {
    blockers.push('provider-retry-interval-invalid');
  }
  return { valid: blockers.length === 0, blockers };
}

export function validateLiveProviderSnapshot(
  value: unknown,
  expectedProviderId?: string
) {
  const blockers: string[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, blockers: ['provider-snapshot-not-object'] };
  }
  const snapshot = value as Record<string, unknown>;
  if (snapshot.schemaVersion !== LIVE_PROVIDER_SNAPSHOT_VERSION) {
    blockers.push('provider-snapshot-version-invalid');
  }
  if (!text(snapshot.providerId)) blockers.push('provider-snapshot-provider-id-missing');
  if (
    expectedProviderId
    && snapshot.providerId !== expectedProviderId
  ) {
    blockers.push('provider-snapshot-provider-id-mismatch');
  }
  if (!text(snapshot.snapshotId)) blockers.push('provider-snapshot-id-missing');
  if (!https(snapshot.sourceUrl)) blockers.push('provider-snapshot-source-url-invalid');
  if (millis(snapshot.fetchedAt) === null) blockers.push('provider-snapshot-fetched-at-invalid');
  if (
    snapshot.sourceUpdatedAt !== undefined
    && millis(snapshot.sourceUpdatedAt) === null
  ) {
    blockers.push('provider-snapshot-source-updated-at-invalid');
  }
  if (
    !text(snapshot.payloadSha256)
    || !SHA256_HEX.test(String(snapshot.payloadSha256))
  ) {
    blockers.push('provider-snapshot-payload-checksum-invalid');
  }
  if (!('payload' in snapshot)) blockers.push('provider-snapshot-payload-missing');
  return { valid: blockers.length === 0, blockers };
}

export function getLiveProviderSnapshotFreshness(
  snapshot: Pick<LiveProviderSnapshot, 'fetchedAt'>,
  policy: LiveProviderRefreshPolicy,
  now: string
): LiveProviderSnapshotFreshness {
  const nowMs = Date.parse(now);
  const fetchedAtMs = Date.parse(snapshot.fetchedAt);
  if (!Number.isFinite(nowMs) || !Number.isFinite(fetchedAtMs)) {
    throw new Error('Snapshot freshness requires valid ISO timestamps');
  }
  if (fetchedAtMs > nowMs) return 'future';

  const ageSeconds = (nowMs - fetchedAtMs) / 1000;
  if (ageSeconds > policy.hardMaxSnapshotAgeSeconds) return 'expired';
  if (ageSeconds > policy.expectedRefreshSeconds) return 'refresh-due';
  return 'fresh';
}

export function ingestLiveProviderSnapshot<TPayload>(input: {
  adapter: LiveProviderAdapter<TPayload>;
  snapshot: LiveProviderSnapshot<TPayload>;
  normalizedAt: string;
}): LiveProviderIngestionResult {
  const { adapter, snapshot, normalizedAt } = input;

  const policyValidation = validateLiveProviderRefreshPolicy(adapter.refreshPolicy);
  if (!policyValidation.valid) {
    throw new Error(
      `Invalid live provider refresh policy: ${policyValidation.blockers.join('; ')}`
    );
  }

  const snapshotValidation = validateLiveProviderSnapshot(
    snapshot,
    adapter.provider.id
  );
  if (!snapshotValidation.valid) {
    throw new Error(
      `Invalid live provider snapshot: ${snapshotValidation.blockers.join('; ')}`
    );
  }

  if (!adapter.id.trim()) throw new Error('Live provider adapter ID is required');
  if (!adapter.destinationId.trim()) throw new Error('Live provider destination ID is required');
  if (adapter.provider.sourceUrl !== snapshot.sourceUrl) {
    throw new Error('Live provider snapshot source URL does not match provider authority');
  }

  const freshness = getLiveProviderSnapshotFreshness(
    snapshot,
    adapter.refreshPolicy,
    normalizedAt
  );
  if (freshness === 'future') {
    throw new Error('Live provider snapshot is from the future');
  }
  if (freshness === 'expired') {
    throw new Error('Live provider snapshot exceeded hard maximum age');
  }

  const entities = adapter.normalize(snapshot.payload, snapshot);
  const feed: LiveDestinationFeed = {
    schemaVersion: 1,
    destinationId: adapter.destinationId,
    generatedAt: normalizedAt,
    providers: [{ ...adapter.provider, capabilities: [...adapter.provider.capabilities] }],
    entities
  };

  const feedValidation = validateLiveDestinationFeed(feed);
  if (!feedValidation.valid) {
    throw new Error(
      `Normalized live provider feed is invalid: ${feedValidation.blockers.join('; ')}`
    );
  }
  assertLiveDestinationFeed(feed);

  const warnings = [...feedValidation.warnings];
  if (freshness === 'refresh-due') warnings.push('provider-snapshot-refresh-due');

  return {
    record: {
      schemaVersion: 1,
      adapterId: adapter.id,
      destinationId: adapter.destinationId,
      providerId: adapter.provider.id,
      snapshotId: snapshot.snapshotId,
      sourceUrl: snapshot.sourceUrl,
      payloadSha256: snapshot.payloadSha256.toLowerCase(),
      fetchedAt: snapshot.fetchedAt,
      ...(snapshot.sourceUpdatedAt
        ? { sourceUpdatedAt: snapshot.sourceUpdatedAt }
        : {}),
      normalizedAt,
      snapshotFreshness: freshness,
      normalizedEntityCount: entities.length,
      warnings
    },
    feed
  };
}

export function mergeLiveDestinationFeeds(
  feeds: LiveDestinationFeed[],
  generatedAt: string
): LiveDestinationFeed {
  if (feeds.length === 0) throw new Error('At least one live destination feed is required');
  if (!Number.isFinite(Date.parse(generatedAt))) {
    throw new Error('Merged live destination feed requires a valid generatedAt timestamp');
  }

  const destinationId = feeds[0]!.destinationId;
  for (const feed of feeds) {
    assertLiveDestinationFeed(feed);
    if (feed.destinationId !== destinationId) {
      throw new Error('Cannot merge live feeds from different destinations');
    }
  }

  const providerIds = new Set<string>();
  for (const feed of feeds) {
    for (const provider of feed.providers) {
      if (providerIds.has(provider.id)) {
        throw new Error(`Duplicate provider across live feeds: ${provider.id}`);
      }
      providerIds.add(provider.id);
    }
  }

  const merged: LiveDestinationFeed = {
    schemaVersion: 1,
    destinationId,
    generatedAt,
    providers: feeds.flatMap((feed) =>
      feed.providers.map((provider) => ({
        ...provider,
        capabilities: [...provider.capabilities]
      }))
    ),
    entities: feeds.flatMap((feed) =>
      feed.entities.map((entity) => ({
        ...entity,
        tags: [...entity.tags],
        ...(entity.booking ? { booking: { ...entity.booking } } : {})
      }))
    )
  };

  const validation = validateLiveDestinationFeed(merged);
  if (!validation.valid) {
    throw new Error(
      `Merged live destination feed is invalid: ${validation.blockers.join('; ')}`
    );
  }
  return merged;
}
