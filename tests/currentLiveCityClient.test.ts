import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadCurrentLiveCityProjection,
  parseCurrentLiveCitySnapshot
} from '../src/travel/currentLiveCityClient.ts';

const snapshot = {
  schemaVersion: 1,
  kind: 'live-city-current-snapshot',
  destinationId: 'moscow',
  refreshedAt: '2026-10-08T15:30:00.000Z',
  mergedFeed: {
    schemaVersion: 1,
    destinationId: 'moscow',
    generatedAt: '2026-10-08T15:30:00.000Z',
    providers: [{
      id: 'official',
      name: 'Official',
      relationship: 'official',
      capabilities: ['inventory', 'operational-status'],
      sourceUrl: 'https://example.org/live',
      attributionRu: 'Источник',
      attributionEn: 'Source',
      attributionZh: '来源'
    }],
    entities: [{
      id: 'museum-1',
      providerEntityId: 'museum-1',
      providerId: 'official',
      canonicalDestinationNodeId: 'museum-1',
      kind: 'museum',
      titleRu: 'Музей',
      titleEn: 'Museum',
      titleZh: '博物馆',
      tags: ['museum'],
      sourceUrl: 'https://example.org/live/museum-1',
      observedAt: '2026-10-08T15:25:00.000Z',
      expiresAt: '2026-10-08T16:00:00.000Z',
      operationalStatus: 'open'
    }]
  }
} as const;

test('current live snapshot validates and projects fresh provider truth', async () => {
  const parsed = parseCurrentLiveCitySnapshot(snapshot);
  assert.equal(parsed.destinationId, 'moscow');

  const result = await loadCurrentLiveCityProjection({
    url: 'https://example.org/current.json',
    nowIso: '2026-10-08T15:40:00.000Z',
    fetchImpl: async () => new Response(JSON.stringify(snapshot), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  });

  assert.equal(result.projection.entities[0]?.freshness, 'fresh');
  assert.equal(result.projection.entities[0]?.operationalStatus, 'open');
  assert.equal(result.projection.entities[0]?.journeyEligible, true);
});

test('the same current snapshot degrades to stale unknown after entity expiry', async () => {
  const result = await loadCurrentLiveCityProjection({
    url: 'https://example.org/current.json',
    nowIso: '2026-10-08T16:05:00.000Z',
    fetchImpl: async () => new Response(JSON.stringify(snapshot), { status: 200 })
  });

  assert.equal(result.projection.entities[0]?.freshness, 'stale');
  assert.equal(result.projection.entities[0]?.operationalStatus, 'unknown');
  assert.equal(result.projection.entities[0]?.journeyEligible, false);
});

test('current live loader fails closed for insecure URL and invalid snapshot', async () => {
  await assert.rejects(
    () => loadCurrentLiveCityProjection({
      url: 'http://example.org/current.json',
      nowIso: '2026-10-08T15:40:00.000Z',
      fetchImpl: async () => new Response('{}', { status: 200 })
    }),
    /must use HTTPS/
  );

  await assert.rejects(
    () => loadCurrentLiveCityProjection({
      url: 'https://example.org/current.json',
      nowIso: '2026-10-08T15:40:00.000Z',
      fetchImpl: async () => new Response(JSON.stringify({
        ...snapshot,
        destinationId: 'other'
      }), { status: 200 })
    }),
    /destination mismatch/
  );
});
