import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseCurrentRoutingSnapshot,
  projectCurrentRoutingSnapshot
} from '../src/travel/currentRoutingAuthority.ts';

function snapshot() {
  return {
    schemaVersion: 1,
    kind: 'citywide-routing-current-snapshot',
    destinationId: 'moscow',
    fetchedAt: '2026-10-10T09:00:00.000Z',
    rawResponseSha256: 'a'.repeat(64),
    request: {
      mode: 'walk',
      from: {
        id: 'from',
        latitude: 55.75,
        longitude: 37.60
      },
      to: {
        id: 'to',
        latitude: 55.76,
        longitude: 37.62
      }
    },
    feed: {
      schemaVersion: 1,
      destinationId: 'moscow',
      generatedAt: '2026-10-10T09:00:01.000Z',
      providers: [{
        id: 'valhalla',
        name: 'Valhalla',
        relationship: 'routing-provider',
        sourceUrl: 'https://valhalla1.openstreetmap.de'
      }],
      observations: [{
        id: 'route-1',
        providerId: 'valhalla',
        from: {
          id: 'from',
          latitude: 55.75,
          longitude: 37.60
        },
        to: {
          id: 'to',
          latitude: 55.76,
          longitude: 37.62
        },
        mode: 'walk',
        durationMinutes: 18,
        distanceMeters: 1400,
        observedAt: '2026-10-10T09:00:00.000Z',
        expiresAt: '2026-10-10T09:15:00.000Z',
        sourceUrl: 'https://valhalla1.openstreetmap.de/route'
      }]
    }
  };
}

test('current routing snapshot binds raw evidence to the exact requested pair', () => {
  const parsed = parseCurrentRoutingSnapshot(snapshot());
  assert.equal(parsed.request.from.id, 'from');
  assert.equal(parsed.request.to.id, 'to');
  assert.equal(parsed.rawResponseSha256, 'a'.repeat(64));
  assert.equal(parsed.feed.observations[0]?.durationMinutes, 18);
});

test('current routing snapshot rejects observation for another endpoint pair', () => {
  const value = snapshot();
  value.feed.observations[0]!.to.id = 'other';

  assert.throws(
    () => parseCurrentRoutingSnapshot(value),
    /endpoints mismatch/
  );
});

test('current routing snapshot becomes stale after route expiry', () => {
  const fresh = projectCurrentRoutingSnapshot(
    snapshot(),
    '2026-10-10T09:05:00.000Z'
  );
  assert.equal(fresh.projection.observations[0]?.freshness, 'fresh');
  assert.equal(fresh.projection.observations[0]?.verified, true);

  const stale = projectCurrentRoutingSnapshot(
    snapshot(),
    '2026-10-10T09:16:00.000Z'
  );
  assert.equal(stale.projection.observations[0]?.freshness, 'stale');
  assert.equal(stale.projection.observations[0]?.verified, false);
});
