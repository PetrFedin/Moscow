import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDayComposerProjection } from '../src/travel/dayComposer.ts';
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
