import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDayComposerProjection } from '../src/travel/dayComposer.ts';
import {
  CITYWIDE_ROUTING_SCHEMA_VERSION,
  projectCitywideRoutingFeed,
  type CitywideRoutingFeed
} from '../src/travel/citywideRoutingAuthority.ts';
import {
  addManualTripItem,
  createPersonalTrip,
  setTripPreferences
} from '../src/travel/personalTrip.ts';

const createdAt = '2026-10-10T06:00:00.000Z';

function baseTrip() {
  return createPersonalTrip({
    id: 'composer-trip',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-10',
    endDate: '2026-10-10',
    createdAt
  });
}

test('Day Composer projects one truth-state from PersonalTrip and scheduler authorities', () => {
  let trip = setTripPreferences({
    trip: baseTrip(),
    preferences: { dayStart: '09:00', dayEnd: '23:00' },
    updatedAt: '2026-10-10T06:05:00.000Z'
  });

  trip = addManualTripItem({
    trip,
    itemId: 'breakfast',
    dayDate: '2026-10-10',
    title: 'Завтрак',
    kind: 'food',
    plannedStartAt: '2026-10-10T09:30:00+03:00',
    plannedEndAt: '2026-10-10T10:30:00+03:00',
    updatedAt: '2026-10-10T06:10:00.000Z'
  });

  trip = addManualTripItem({
    trip,
    itemId: 'museum',
    dayDate: '2026-10-10',
    title: 'Музей',
    kind: 'museum',
    plannedStartAt: '2026-10-10T11:00:00+03:00',
    plannedEndAt: '2026-10-10T13:00:00+03:00',
    updatedAt: '2026-10-10T06:20:00.000Z',
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'user-declared',
      reference: 'ticket-1'
    }
  });

  trip = addManualTripItem({
    trip,
    itemId: 'restaurant',
    dayDate: '2026-10-10',
    title: 'Ресторан',
    kind: 'food',
    plannedStartAt: '2026-10-10T18:30:00+03:00',
    plannedEndAt: '2026-10-10T20:00:00+03:00',
    updatedAt: '2026-10-10T06:30:00.000Z',
    commitment: {
      kind: 'reservation',
      status: 'confirmed',
      verification: 'user-declared',
      partySize: 2
    }
  });

  trip = addManualTripItem({
    trip,
    itemId: 'theatre',
    dayDate: '2026-10-10',
    title: 'Театр',
    kind: 'event',
    plannedStartAt: '2026-10-10T19:45:00+03:00',
    plannedEndAt: '2026-10-10T22:00:00+03:00',
    updatedAt: '2026-10-10T06:40:00.000Z',
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'provider-confirmed',
      provider: 'ticket-provider',
      receiptEvidenceRef: 'receipt:theatre'
    }
  });

  const projection = buildDayComposerProjection({
    trip,
    dayDate: '2026-10-10',
    minimumFreeMinutes: 30
  });

  assert.equal(projection.counts.fixed, 3);
  assert.equal(projection.counts.flexible, 1);
  assert.equal(projection.counts.ticketed, 2);
  assert.equal(projection.counts.reserved, 1);
  assert.equal(projection.counts.conflict, 1);
  assert.ok(projection.counts.free >= 1);

  const museum = projection.items.find((item) => item.itemId === 'museum');
  const theatre = projection.items.find((item) => item.itemId === 'theatre');
  assert.equal(museum?.flexibility, 'fixed');
  assert.equal(museum?.commitment, 'ticketed');
  assert.equal(museum?.verification, 'user-declared');
  assert.equal(theatre?.verification, 'provider-confirmed');

  const conflict = projection.conflicts[0];
  assert.deepEqual(conflict?.itemIds, ['restaurant', 'theatre']);
  assert.equal(conflict?.minutes, 15);

  assert.ok(projection.alternativeSlots.length >= 1);
  assert.ok(projection.alternativeSlots.every((slot) =>
    slot.routingVerified === false
    && slot.openingHoursVerified === false
    && slot.availabilityVerified === false
    && slot.accessibilityVerified === false
  ));
});

test('Day Composer never upgrades external truth from schedule-only data', () => {
  let trip = addManualTripItem({
    trip: baseTrip(),
    itemId: 'flex',
    dayDate: '2026-10-10',
    title: 'Выставка',
    kind: 'event',
    plannedStartAt: '2026-10-10T15:00:00+03:00',
    plannedEndAt: '2026-10-10T17:00:00+03:00',
    updatedAt: '2026-10-10T06:10:00.000Z'
  });

  const projection = buildDayComposerProjection({ trip, dayDate: '2026-10-10' });
  assert.deepEqual(projection.externalTruth, {
    routingVerified: false,
    openingHoursVerified: false,
    availabilityVerified: false,
    accessibilityVerified: false
  });
});

test('Day Composer rejects a day outside the trip', () => {
  assert.throws(
    () => buildDayComposerProjection({ trip: baseTrip(), dayDate: '2026-10-11' }),
    /outside trip range/
  );
});


test('Day Composer projects a verified routing edge without persisting travel time into PersonalTrip', () => {
  let trip = addManualTripItem({
    trip: baseTrip(),
    itemId: 'museum-item',
    dayDate: '2026-10-10',
    title: 'Музей',
    kind: 'museum',
    plannedStartAt: '2026-10-10T11:00:00+03:00',
    plannedEndAt: '2026-10-10T13:00:00+03:00',
    updatedAt: '2026-10-10T06:10:00.000Z'
  });
  trip.items[0]!.destinationNodeId = 'museum';

  trip = addManualTripItem({
    trip,
    itemId: 'theatre-item',
    dayDate: '2026-10-10',
    title: 'Театр',
    kind: 'event',
    plannedStartAt: '2026-10-10T13:35:00+03:00',
    plannedEndAt: '2026-10-10T15:30:00+03:00',
    updatedAt: '2026-10-10T06:20:00.000Z'
  });
  trip.items.find((item) => item.id === 'theatre-item')!.destinationNodeId = 'theatre';

  const routingFeed: CitywideRoutingFeed = {
    schemaVersion: CITYWIDE_ROUTING_SCHEMA_VERSION,
    destinationId: 'moscow',
    generatedAt: '2026-10-10T09:00:00.000Z',
    providers: [{
      id: 'router',
      name: 'Test Router',
      relationship: 'routing-provider',
      sourceUrl: 'https://example.com/router'
    }],
    observations: [{
      id: 'museum-theatre',
      providerId: 'router',
      from: { id: 'museum', latitude: 55.75, longitude: 37.61 },
      to: { id: 'theatre', latitude: 55.76, longitude: 37.62 },
      mode: 'transit',
      durationMinutes: 24,
      observedAt: '2026-10-10T08:55:00.000Z',
      expiresAt: '2026-10-10T09:30:00.000Z',
      sourceUrl: 'https://example.com/router/museum-theatre'
    }]
  };

  const projection = buildDayComposerProjection({
    trip,
    dayDate: '2026-10-10',
    routingProjection: projectCitywideRoutingFeed(routingFeed, '2026-10-10T09:05:00.000Z')
  });

  assert.equal(projection.travel.length, 1);
  assert.equal(projection.travel[0]?.status, 'tight');
  assert.equal(projection.travel[0]?.requiredTravelMinutes, 24);
  assert.equal(projection.travel[0]?.bufferMinutes, 11);
  assert.equal(projection.travel[0]?.routingVerified, true);
  assert.equal(projection.externalTruth.routingVerified, true);
  assert.equal('travelDurationMinutes' in trip.items[0]!, false);
});

test('Day Composer exposes an unknown travel edge when routing evidence is absent', () => {
  let trip = addManualTripItem({
    trip: baseTrip(),
    itemId: 'a',
    dayDate: '2026-10-10',
    title: 'A',
    kind: 'activity',
    plannedStartAt: '2026-10-10T10:00:00+03:00',
    plannedEndAt: '2026-10-10T11:00:00+03:00',
    updatedAt: '2026-10-10T06:10:00.000Z'
  });
  trip.items[0]!.destinationNodeId = 'a-node';

  trip = addManualTripItem({
    trip,
    itemId: 'b',
    dayDate: '2026-10-10',
    title: 'B',
    kind: 'activity',
    plannedStartAt: '2026-10-10T12:00:00+03:00',
    plannedEndAt: '2026-10-10T13:00:00+03:00',
    updatedAt: '2026-10-10T06:20:00.000Z'
  });
  trip.items.find((item) => item.id === 'b')!.destinationNodeId = 'b-node';

  const projection = buildDayComposerProjection({ trip, dayDate: '2026-10-10' });
  assert.equal(projection.travel.length, 1);
  assert.equal(projection.travel[0]?.status, 'unknown');
  assert.equal(projection.travel[0]?.routingVerified, false);
  assert.equal(projection.externalTruth.routingVerified, false);
});
