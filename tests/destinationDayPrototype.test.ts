import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDestinationDayPrototype } from '../src/travel/destinationDayPrototype.ts';
import { moscowVarvarkaDestinationPackage } from '../src/travel/moscowDestinationPackage.ts';
import type { DestinationDayLiveProjection } from '../src/travel/destinationDayPrototype.ts';

test('Moscow day prototype uses published heritage route and leaves live slots unresolved without provider data', () => {
  const day = buildDestinationDayPrototype({
    pkg: moscowVarvarkaDestinationPackage,
    budgetMinutes: 300,
    themes: ['история Москвы', 'архитектура']
  });

  assert.equal(day.destinationId, 'moscow-varvarka');
  assert.equal(day.slots.length, 4);
  assert.equal(day.readySlotCount, 1);
  assert.equal(day.unresolvedSlotCount, 3);

  const history = day.slots.find((slot) => slot.id === 'history');
  const food = day.slots.find((slot) => slot.id === 'food');
  const event = day.slots.find((slot) => slot.id === 'event');

  assert.equal(history?.status, 'ready');
  assert.equal(history?.routeId, 'varvarka-45');
  assert.ok((history?.heritageNodes?.length ?? 0) > 0);
  assert.equal(food?.status, 'requires-live-provider');
  assert.equal(event?.status, 'requires-live-provider');
  assert.deepEqual(day.bookingHandoffs, []);
});

test('fresh journey-eligible live entities can fill food event and activity slots', () => {
  const live: DestinationDayLiveProjection = {
    destinationId: 'moscow-varvarka',
    asOf: '2026-09-29T12:00:00.000Z',
    entities: [
      {
        id: 'food-1',
        providerEntityId: 'food-provider-1',
        providerId: 'official-food',
        providerName: 'Official Food',
        providerAttributionRu: 'Источник',
        providerAttributionEn: 'Source',
        providerAttributionZh: '来源',
        kind: 'food',
        titleRu: 'Ресторан',
        titleEn: 'Restaurant',
        titleZh: '餐厅',
        latitude: 55.75,
        longitude: 37.62,
        tags: ['еда'],
        sourceUrl: 'https://example.org/food',
        observedAt: '2026-09-29T11:50:00.000Z',
        expiresAt: '2026-09-29T13:00:00.000Z',
        freshness: 'fresh',
        operationalStatus: 'open',
        journeyEligible: true
      },
      {
        id: 'event-1',
        providerEntityId: 'event-provider-1',
        providerId: 'official-events',
        providerName: 'Official Events',
        providerAttributionRu: 'Источник',
        providerAttributionEn: 'Source',
        providerAttributionZh: '来源',
        kind: 'event',
        titleRu: 'Выставка',
        titleEn: 'Exhibition',
        titleZh: '展览',
        latitude: 55.751,
        longitude: 37.621,
        tags: ['культура'],
        sourceUrl: 'https://example.org/event',
        observedAt: '2026-09-29T11:50:00.000Z',
        expiresAt: '2026-09-29T18:00:00.000Z',
        freshness: 'fresh',
        operationalStatus: 'scheduled',
        startsAt: '2026-09-29T16:00:00.000Z',
        journeyEligible: true,
        booking: {
          mode: 'city-service',
          provider: 'Tickets',
          providerId: 'tickets',
          action: 'buy-ticket',
          url: 'https://example.org/ticket',
          verifiedAt: '2026-09-29T11:50:00.000Z',
          expiresAt: '2026-09-29T12:30:00.000Z'
        }
      },
      {
        id: 'activity-1',
        providerEntityId: 'activity-provider-1',
        providerId: 'official-activities',
        providerName: 'Official Activities',
        providerAttributionRu: 'Источник',
        providerAttributionEn: 'Source',
        providerAttributionZh: '来源',
        kind: 'activity',
        titleRu: 'Вечерняя прогулка',
        titleEn: 'Evening Walk',
        titleZh: '晚间散步',
        latitude: 55.752,
        longitude: 37.622,
        tags: ['вечер'],
        sourceUrl: 'https://example.org/activity',
        observedAt: '2026-09-29T11:50:00.000Z',
        expiresAt: '2026-09-29T20:00:00.000Z',
        freshness: 'fresh',
        operationalStatus: 'open',
        journeyEligible: true
      }
    ]
  };

  const day = buildDestinationDayPrototype({
    pkg: moscowVarvarkaDestinationPackage,
    budgetMinutes: 480,
    live
  });

  assert.equal(day.readySlotCount, 4);
  assert.equal(day.unresolvedSlotCount, 0);
  assert.equal(day.bookingHandoffs.length, 1);
  assert.equal(day.bookingHandoffs[0]?.entityId, 'event-1');
});

test('stale or non-journey-eligible live entities do not fill day slots', () => {
  const live: DestinationDayLiveProjection = {
    destinationId: 'moscow-varvarka',
    asOf: '2026-09-29T12:00:00.000Z',
    entities: [
      {
        id: 'food-stale',
        providerEntityId: 'food-stale',
        providerId: 'provider',
        providerName: 'Provider',
        providerAttributionRu: 'Источник',
        providerAttributionEn: 'Source',
        providerAttributionZh: '来源',
        kind: 'food',
        titleRu: 'Кафе',
        titleEn: 'Cafe',
        titleZh: '咖啡馆',
        latitude: 55.75,
        longitude: 37.62,
        tags: ['еда'],
        sourceUrl: 'https://example.org/food',
        observedAt: '2026-09-29T10:00:00.000Z',
        expiresAt: '2026-09-29T11:00:00.000Z',
        freshness: 'stale',
        operationalStatus: 'unknown',
        journeyEligible: false
      }
    ]
  };

  const day = buildDestinationDayPrototype({
    pkg: moscowVarvarkaDestinationPackage,
    budgetMinutes: 300,
    live
  });

  assert.equal(day.slots.find((slot) => slot.id === 'food')?.status, 'requires-live-provider');
  assert.equal(day.readySlotCount, 1);
});

test('live projection for another destination is rejected', () => {
  assert.throws(
    () => buildDestinationDayPrototype({
      pkg: moscowVarvarkaDestinationPackage,
      budgetMinutes: 300,
      live: {
        destinationId: 'other-region',
        asOf: '2026-09-29T12:00:00.000Z',
        entities: []
      }
    }),
    /does not match destination package/
  );
});
