import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCurrentWalkingRouteUrl,
  loadCurrentWalkingRoute
} from '../src/travel/currentRoutingClient.ts';

const from = {
  id: 'from',
  latitude: 55.75,
  longitude: 37.60
};
const to = {
  id: 'to',
  latitude: 55.76,
  longitude: 37.62
};

function responseSnapshot() {
  return {
    schemaVersion: 1,
    kind: 'citywide-routing-current-snapshot',
    destinationId: 'moscow',
    fetchedAt: '2026-10-10T09:00:00.000Z',
    rawResponseSha256: 'b'.repeat(64),
    request: {
      mode: 'walk',
      from,
      to
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
        from,
        to,
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

test('current routing client builds bounded HTTPS query for the requested pair', () => {
  const url = buildCurrentWalkingRouteUrl({
    authorityUrl: 'https://example.org/routing/walk',
    from,
    to
  });

  assert.match(url, /^https:\/\/example\.org\/routing\/walk\?/);
  assert.match(url, /fromId=from/);
  assert.match(url, /toId=to/);
  assert.match(url, /fromLat=55\.75/);
  assert.match(url, /toLon=37\.62/);
});

test('current routing client projects verified fresh route from authority response', async () => {
  const result = await loadCurrentWalkingRoute({
    authorityUrl: 'https://example.org/routing/walk',
    from,
    to,
    nowIso: '2026-10-10T09:05:00.000Z',
    fetchImpl: async () => new Response(
      JSON.stringify(responseSnapshot()),
      {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }
    )
  });

  assert.equal(result.projection.observations.length, 1);
  assert.equal(result.projection.observations[0]?.verified, true);
  assert.equal(result.projection.observations[0]?.durationMinutes, 18);
});

test('current routing client rejects insecure authority URL and mismatched pair', async () => {
  assert.throws(() => buildCurrentWalkingRouteUrl({
    authorityUrl: 'http://example.org/routing/walk',
    from,
    to
  }), /must use HTTPS/);

  const wrong = responseSnapshot();
  wrong.request.to.id = 'different';
  wrong.feed.observations[0]!.to.id = 'different';

  await assert.rejects(
    () => loadCurrentWalkingRoute({
      authorityUrl: 'https://example.org/routing/walk',
      from,
      to,
      nowIso: '2026-10-10T09:05:00.000Z',
      fetchImpl: async () => new Response(JSON.stringify(wrong), { status: 200 })
    }),
    /different route request/
  );
});
