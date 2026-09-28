import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getLiveProviderSnapshotFreshness,
  ingestLiveProviderSnapshot,
  mergeLiveDestinationFeeds,
  validateLiveProviderRefreshPolicy,
  validateLiveProviderSnapshot,
  type LiveProviderAdapter,
  type LiveProviderSnapshot
} from '../src/travel/liveProviderIngestion.ts';
import {
  projectLiveDestinationFeed,
  type LiveDestinationEntity
} from '../src/travel/liveDestinationAuthority.ts';

type RawPayload = {
  rows: Array<{
    id: string;
    title: string;
    expiresAt: string;
  }>;
};

const inventoryAdapter: LiveProviderAdapter<RawPayload> = {
  id: 'test-inventory-adapter-v1',
  destinationId: 'moscow-varvarka',
  provider: {
    id: 'test-open-data',
    name: 'Test Open Data',
    relationship: 'official',
    capabilities: ['inventory'],
    sourceUrl: 'https://example.org/open-data',
    attributionRu: 'Источник: Test Open Data',
    attributionEn: 'Source: Test Open Data',
    attributionZh: '来源：Test Open Data'
  },
  refreshPolicy: {
    expectedRefreshSeconds: 300,
    hardMaxSnapshotAgeSeconds: 900,
    retryAfterSeconds: 60
  },
  normalize: (payload, snapshot) =>
    payload.rows.map((row): LiveDestinationEntity => ({
      id: `inventory:${row.id}`,
      providerEntityId: row.id,
      providerId: 'test-open-data',
      kind: 'food',
      titleRu: row.title,
      titleEn: row.title,
      titleZh: row.title,
      latitude: 55.75,
      longitude: 37.62,
      tags: ['inventory'],
      sourceUrl: snapshot.sourceUrl,
      observedAt: snapshot.fetchedAt,
      expiresAt: row.expiresAt,
      operationalStatus: 'unknown'
    }))
};

function snapshot(overrides: Partial<LiveProviderSnapshot<RawPayload>> = {}): LiveProviderSnapshot<RawPayload> {
  return {
    schemaVersion: 1,
    providerId: 'test-open-data',
    snapshotId: 'snapshot-001',
    sourceUrl: 'https://example.org/open-data',
    fetchedAt: '2026-09-28T12:00:00.000Z',
    payloadSha256: 'a'.repeat(64),
    payload: {
      rows: [
        {
          id: 'food-1',
          title: 'Cafe',
          expiresAt: '2026-09-28T12:20:00.000Z'
        }
      ]
    },
    ...overrides
  };
}

test('refresh policy requires a hard age at least as large as expected refresh', () => {
  assert.deepEqual(
    validateLiveProviderRefreshPolicy(inventoryAdapter.refreshPolicy),
    { valid: true, blockers: [] }
  );

  const invalid = validateLiveProviderRefreshPolicy({
    expectedRefreshSeconds: 600,
    hardMaxSnapshotAgeSeconds: 300,
    retryAfterSeconds: 30
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.blockers.includes('provider-hard-max-age-below-refresh-interval'));
});

test('snapshot authority validates provider identity and portable checksum', () => {
  assert.deepEqual(
    validateLiveProviderSnapshot(snapshot(), 'test-open-data'),
    { valid: true, blockers: [] }
  );

  const invalid = validateLiveProviderSnapshot(
    snapshot({
      providerId: 'other-provider',
      payloadSha256: 'not-a-sha'
    }),
    'test-open-data'
  );
  assert.equal(invalid.valid, false);
  assert.ok(invalid.blockers.includes('provider-snapshot-provider-id-mismatch'));
  assert.ok(invalid.blockers.includes('provider-snapshot-payload-checksum-invalid'));
});

test('snapshot freshness distinguishes current refresh-due expired and future', () => {
  assert.equal(
    getLiveProviderSnapshotFreshness(
      snapshot(),
      inventoryAdapter.refreshPolicy,
      '2026-09-28T12:04:00.000Z'
    ),
    'fresh'
  );
  assert.equal(
    getLiveProviderSnapshotFreshness(
      snapshot(),
      inventoryAdapter.refreshPolicy,
      '2026-09-28T12:06:00.000Z'
    ),
    'refresh-due'
  );
  assert.equal(
    getLiveProviderSnapshotFreshness(
      snapshot(),
      inventoryAdapter.refreshPolicy,
      '2026-09-28T12:16:00.000Z'
    ),
    'expired'
  );
  assert.equal(
    getLiveProviderSnapshotFreshness(
      snapshot(),
      inventoryAdapter.refreshPolicy,
      '2026-09-28T11:59:00.000Z'
    ),
    'future'
  );
});

test('inventory-only adapter produces unknown operational status and no journey eligibility', () => {
  const result = ingestLiveProviderSnapshot({
    adapter: inventoryAdapter,
    snapshot: snapshot(),
    normalizedAt: '2026-09-28T12:04:00.000Z'
  });

  assert.equal(result.record.snapshotFreshness, 'fresh');
  assert.equal(result.record.normalizedEntityCount, 1);
  assert.equal('payload' in result.record, false);

  const projection = projectLiveDestinationFeed(
    result.feed,
    '2026-09-28T12:04:00.000Z'
  );
  assert.equal(projection.entities[0]?.operationalStatus, 'unknown');
  assert.equal(projection.entities[0]?.journeyEligible, false);
});

test('refresh-due snapshot is auditable but does not extend entity expiry', () => {
  const result = ingestLiveProviderSnapshot({
    adapter: inventoryAdapter,
    snapshot: snapshot(),
    normalizedAt: '2026-09-28T12:06:00.000Z'
  });

  assert.equal(result.record.snapshotFreshness, 'refresh-due');
  assert.deepEqual(result.record.warnings, ['provider-snapshot-refresh-due']);
  assert.equal(result.feed.entities[0]?.expiresAt, '2026-09-28T12:20:00.000Z');

  const later = projectLiveDestinationFeed(
    result.feed,
    '2026-09-28T12:21:00.000Z'
  );
  assert.equal(later.entities[0]?.freshness, 'stale');
  assert.equal(later.entities[0]?.journeyEligible, false);
});

test('hard-expired or future snapshot cannot be normalized into a live feed', () => {
  assert.throws(
    () => ingestLiveProviderSnapshot({
      adapter: inventoryAdapter,
      snapshot: snapshot(),
      normalizedAt: '2026-09-28T12:16:00.000Z'
    }),
    /hard maximum age/
  );

  assert.throws(
    () => ingestLiveProviderSnapshot({
      adapter: inventoryAdapter,
      snapshot: snapshot(),
      normalizedAt: '2026-09-28T11:59:00.000Z'
    }),
    /from the future/
  );
});

test('provider source URL is authority-bound and cannot be swapped in the snapshot', () => {
  assert.throws(
    () => ingestLiveProviderSnapshot({
      adapter: inventoryAdapter,
      snapshot: snapshot({ sourceUrl: 'https://malicious.example.net/feed' }),
      normalizedAt: '2026-09-28T12:04:00.000Z'
    }),
    /source URL does not match/
  );
});

test('normalized entity cannot claim operational status beyond provider capability', () => {
  const badAdapter: LiveProviderAdapter<RawPayload> = {
    ...inventoryAdapter,
    id: 'bad-open-now-adapter',
    normalize: (payload, raw) =>
      inventoryAdapter.normalize(payload, raw).map((entity) => ({
        ...entity,
        operationalStatus: 'open'
      }))
  };

  assert.throws(
    () => ingestLiveProviderSnapshot({
      adapter: badAdapter,
      snapshot: snapshot(),
      normalizedAt: '2026-09-28T12:04:00.000Z'
    }),
    /lacks-operational-status-authority/
  );
});

test('multiple provider feeds merge only for one destination and preserve entity expiry', () => {
  const first = ingestLiveProviderSnapshot({
    adapter: inventoryAdapter,
    snapshot: snapshot(),
    normalizedAt: '2026-09-28T12:04:00.000Z'
  }).feed;

  const secondAdapter: LiveProviderAdapter<RawPayload> = {
    ...inventoryAdapter,
    id: 'second-adapter',
    provider: {
      ...inventoryAdapter.provider,
      id: 'second-provider',
      name: 'Second Provider',
      sourceUrl: 'https://example.org/second'
    },
    normalize: (_payload, raw) => [{
      id: 'museum-1',
      providerEntityId: 'museum-provider-1',
      providerId: 'second-provider',
      kind: 'museum',
      titleRu: 'Музей',
      titleEn: 'Museum',
      titleZh: '博物馆',
      latitude: 55.751,
      longitude: 37.621,
      tags: ['inventory'],
      sourceUrl: raw.sourceUrl,
      observedAt: raw.fetchedAt,
      expiresAt: '2026-09-28T12:30:00.000Z',
      operationalStatus: 'unknown'
    }]
  };
  const second = ingestLiveProviderSnapshot({
    adapter: secondAdapter,
    snapshot: {
      ...snapshot(),
      providerId: 'second-provider',
      snapshotId: 'snapshot-002',
      sourceUrl: 'https://example.org/second',
      payloadSha256: 'b'.repeat(64)
    },
    normalizedAt: '2026-09-28T12:04:00.000Z'
  }).feed;

  const merged = mergeLiveDestinationFeeds(
    [first, second],
    '2026-09-28T12:05:00.000Z'
  );
  assert.equal(merged.providers.length, 2);
  assert.equal(merged.entities.length, 2);
  assert.equal(
    merged.entities.find((entity) => entity.id === 'inventory:food-1')?.expiresAt,
    '2026-09-28T12:20:00.000Z'
  );
});

test('feeds from different destinations cannot be merged', () => {
  const first = ingestLiveProviderSnapshot({
    adapter: inventoryAdapter,
    snapshot: snapshot(),
    normalizedAt: '2026-09-28T12:04:00.000Z'
  }).feed;

  assert.throws(
    () => mergeLiveDestinationFeeds(
      [{ ...first, destinationId: 'other-destination' }, first],
      '2026-09-28T12:05:00.000Z'
    ),
    /different destinations/
  );
});
