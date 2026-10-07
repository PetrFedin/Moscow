import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CITYWIDE_ROUTING_SCHEMA_VERSION,
  decideCitywideRouteFeasibility,
  projectCitywideRoutingFeed,
  validateCitywideRoutingFeed,
  type CitywideRoutingFeed
} from '../src/travel/citywideRoutingAuthority.ts';

const feed: CitywideRoutingFeed = {
  schemaVersion: CITYWIDE_ROUTING_SCHEMA_VERSION,
  destinationId: 'moscow',
  generatedAt: '2026-10-10T09:00:00.000Z',
  providers: [
    {
      id: 'router',
      name: 'Test Router',
      relationship: 'routing-provider',
      sourceUrl: 'https://example.com/router'
    }
  ],
  observations: [
    {
      id: 'museum-to-theatre',
      providerId: 'router',
      from: { id: 'museum', latitude: 55.75, longitude: 37.61 },
      to: { id: 'theatre', latitude: 55.76, longitude: 37.62 },
      mode: 'transit',
      durationMinutes: 24,
      distanceMeters: 4100,
      observedAt: '2026-10-10T08:55:00.000Z',
      expiresAt: '2026-10-10T09:30:00.000Z',
      sourceUrl: 'https://example.com/router/museum-to-theatre'
    }
  ]
};

test('routing feed validates bounded source-backed travel observations', () => {
  const validation = validateCitywideRoutingFeed(feed);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.blockers, []);
});

test('fresh route produces safe/tight/impossible decisions from the actual time window', () => {
  const projection = projectCitywideRoutingFeed(feed, '2026-10-10T09:05:00.000Z');

  const safe = decideCitywideRouteFeasibility({
    projection,
    fromId: 'museum',
    toId: 'theatre',
    departureAt: '2026-10-10T18:30:00+03:00',
    mustArriveBy: '2026-10-10T19:20:00+03:00'
  });
  assert.equal(safe.status, 'safe');
  assert.equal(safe.requiredTravelMinutes, 24);
  assert.equal(safe.bufferMinutes, 26);

  const tight = decideCitywideRouteFeasibility({
    projection,
    fromId: 'museum',
    toId: 'theatre',
    departureAt: '2026-10-10T18:30:00+03:00',
    mustArriveBy: '2026-10-10T18:59:00+03:00'
  });
  assert.equal(tight.status, 'tight');
  assert.equal(tight.bufferMinutes, 5);

  const impossible = decideCitywideRouteFeasibility({
    projection,
    fromId: 'museum',
    toId: 'theatre',
    departureAt: '2026-10-10T18:30:00+03:00',
    mustArriveBy: '2026-10-10T18:50:00+03:00'
  });
  assert.equal(impossible.status, 'impossible');
  assert.equal(impossible.bufferMinutes, -4);
});

test('stale or missing route evidence degrades to unknown instead of inventing travel time', () => {
  const staleProjection = projectCitywideRoutingFeed(feed, '2026-10-10T10:00:00.000Z');
  const decision = decideCitywideRouteFeasibility({
    projection: staleProjection,
    fromId: 'museum',
    toId: 'theatre',
    departureAt: '2026-10-10T18:30:00+03:00',
    mustArriveBy: '2026-10-10T19:30:00+03:00'
  });

  assert.equal(decision.status, 'unknown');
  assert.equal(decision.requiredTravelMinutes, undefined);
  assert.equal(decision.routeObservationId, undefined);
});

test('routing validation rejects invalid duration and non-https evidence source', () => {
  const invalid = structuredClone(feed) as unknown as {
    observations: Array<Record<string, unknown>>;
  };
  invalid.observations[0]!.durationMinutes = 0;
  invalid.observations[0]!.sourceUrl = 'http://example.com/router';

  const validation = validateCitywideRoutingFeed(invalid);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('routing-duration-invalid:museum-to-theatre'));
  assert.ok(validation.blockers.includes('routing-observation-source-invalid:museum-to-theatre'));
});
