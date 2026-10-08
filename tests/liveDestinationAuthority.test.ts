import assert from 'node:assert/strict';
import test from 'node:test';

import {
  projectLiveDestinationFeed,
  validateLiveDestinationFeed,
  type LiveDestinationFeed
} from '../src/travel/liveDestinationAuthority.ts';

function feed(): LiveDestinationFeed {
  return {
    schemaVersion: 1,
    destinationId: 'moscow-varvarka',
    generatedAt: '2026-09-28T12:00:00.000Z',
    providers: [
      {
        id: 'official-events',
        name: 'Official Events Feed',
        relationship: 'official',
        capabilities: ['inventory', 'event-schedule', 'operational-status', 'opening-hours'],
        sourceUrl: 'https://example.org/events',
        attributionRu: 'Источник: официальный календарь',
        attributionEn: 'Source: official calendar',
        attributionZh: '来源：官方活动日历'
      },
      {
        id: 'tickets',
        name: 'Ticket Provider',
        relationship: 'booking-provider',
        capabilities: ['booking-handoff'],
        sourceUrl: 'https://tickets.example.org',
        attributionRu: 'Билеты: Ticket Provider',
        attributionEn: 'Tickets: Ticket Provider',
        attributionZh: '票务：Ticket Provider'
      }
    ],
    entities: [
      {
        id: 'event-1',
        providerEntityId: 'provider-event-42',
        providerId: 'official-events',
        kind: 'event',
        titleRu: 'Вечерняя программа',
        titleEn: 'Evening Programme',
        titleZh: '晚间活动',
        latitude: 55.751,
        longitude: 37.628,
        tags: ['культура', 'вечер'],
        sourceUrl: 'https://example.org/events/42',
        observedAt: '2026-09-28T11:55:00.000Z',
        expiresAt: '2026-09-28T13:00:00.000Z',
        operationalStatus: 'scheduled',
        startsAt: '2026-09-28T18:00:00.000Z',
        endsAt: '2026-09-28T20:00:00.000Z',
        booking: {
          mode: 'external-provider',
          provider: 'Ticket Provider',
          providerId: 'tickets',
          action: 'buy-ticket',
          url: 'https://tickets.example.org/event/42',
          verifiedAt: '2026-09-28T11:50:00.000Z',
          expiresAt: '2026-09-28T12:30:00.000Z'
        }
      },
      {
        id: 'food-1',
        providerEntityId: 'restaurant-9',
        providerId: 'official-events',
        kind: 'food',
        titleRu: 'Кафе',
        titleEn: 'Cafe',
        titleZh: '咖啡馆',
        latitude: 55.752,
        longitude: 37.629,
        tags: ['еда'],
        sourceUrl: 'https://example.org/places/restaurant-9',
        observedAt: '2026-09-28T11:55:00.000Z',
        expiresAt: '2026-09-28T12:10:00.000Z',
        operationalStatus: 'open',
        openingHours: {
          timezone: 'Europe/Moscow',
          windows: [
            {
              opensAt: '2026-09-28T10:00:00.000Z',
              closesAt: '2026-09-28T12:30:00.000Z'
            },
            {
              opensAt: '2026-09-28T13:00:00.000Z',
              closesAt: '2026-09-28T18:00:00.000Z'
            }
          ]
        }
      }
    ]
  };
}

test('valid live feed preserves provider attribution and verified booking handoff', () => {
  const value = feed();
  const validation = validateLiveDestinationFeed(value);
  assert.deepEqual(validation, { valid: true, blockers: [], warnings: [] });

  const projection = projectLiveDestinationFeed(value, '2026-09-28T12:00:00.000Z');
  assert.equal(projection.freshEntityCount, 2);
  const event = projection.entities.find((item) => item.id === 'event-1');
  assert.ok(event);
  assert.equal(event.freshness, 'fresh');
  assert.equal(event.operationalStatus, 'scheduled');
  assert.equal(event.journeyEligible, true);
  assert.equal(event.booking?.providerId, 'tickets');
  assert.equal(event.providerAttributionZh, '来源：官方活动日历');
});

test('stale operational data fails closed and drops booking handoff', () => {
  const projection = projectLiveDestinationFeed(feed(), '2026-09-28T13:05:00.000Z');
  assert.equal(projection.staleEntityCount, 2);

  const event = projection.entities.find((item) => item.id === 'event-1');
  assert.ok(event);
  assert.equal(event.freshness, 'stale');
  assert.equal(event.operationalStatus, 'unknown');
  assert.equal(event.booking, undefined);
  assert.equal(event.journeyEligible, false);
});

test('future observation or validity does not masquerade as current data', () => {
  const value = feed();
  value.entities[0]!.observedAt = '2026-09-28T12:05:00.000Z';
  value.generatedAt = '2026-09-28T12:10:00.000Z';

  const projection = projectLiveDestinationFeed(value, '2026-09-28T12:00:00.000Z');
  const event = projection.entities.find((item) => item.id === 'event-1');
  assert.ok(event);
  assert.equal(event.freshness, 'not-yet-valid');
  assert.equal(event.operationalStatus, 'unknown');
  assert.equal(event.booking, undefined);
});

test('cancelled and sold-out events are fresh but not journey eligible', () => {
  for (const status of ['cancelled', 'sold-out'] as const) {
    const value = feed();
    value.entities[0]!.operationalStatus = status;
    const projection = projectLiveDestinationFeed(value, '2026-09-28T12:00:00.000Z');
    const event = projection.entities.find((item) => item.id === 'event-1');
    assert.ok(event);
    assert.equal(event.freshness, 'fresh');
    assert.equal(event.operationalStatus, status);
    assert.equal(event.journeyEligible, false);
  }
});

test('booking provider must exist and handoff freshness is independent', () => {
  const value = feed();
  value.entities[0]!.booking!.providerId = 'phantom-provider';

  const invalid = validateLiveDestinationFeed(value);
  assert.equal(invalid.valid, false);
  assert.ok(invalid.blockers.includes('booking-provider-not-found:event-1'));

  const fresh = feed();
  fresh.entities[0]!.booking!.expiresAt = '2026-09-28T11:59:00.000Z';
  const projection = projectLiveDestinationFeed(fresh, '2026-09-28T12:00:00.000Z');
  const event = projection.entities.find((item) => item.id === 'event-1');
  assert.ok(event);
  assert.equal(event.freshness, 'fresh');
  assert.equal(event.booking, undefined);
  assert.equal(event.journeyEligible, true);
});

test('live authority rejects unsupported price availability and sponsorship fields', () => {
  const value = feed() as unknown as Record<string, unknown>;
  const entities = value.entities as Array<Record<string, unknown>>;
  entities[0]!.price = 1500;
  entities[0]!.availability = '12 seats';
  entities[0]!.sponsorName = 'Paid Partner';

  const validation = validateLiveDestinationFeed(value);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('live-feed-contains-unsupported-commercial-or-price-fields'));
});

test('operational status is constrained by entity kind', () => {
  const value = feed();
  value.entities[1]!.operationalStatus = 'rescheduled';

  const validation = validateLiveDestinationFeed(value);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('live-operational-status-invalid:food-1'));
});

test('provider observation cannot be later than feed generation', () => {
  const value = feed();
  value.entities[0]!.observedAt = '2026-09-28T12:05:00.000Z';

  const validation = validateLiveDestinationFeed(value);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('live-observed-after-feed-generation:event-1'));
});


test('duplicate provider entity identity is rejected even under different local IDs', () => {
  const value = feed();
  value.entities.push({
    ...value.entities[0]!,
    id: 'event-copy'
  });

  const validation = validateLiveDestinationFeed(value);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('duplicate-provider-entity:official-events:provider-event-42'));
});


test('inventory-only provider cannot assert current open status or event schedule', () => {
  const value = feed();
  value.providers[0]!.capabilities = ['inventory'];

  const validation = validateLiveDestinationFeed(value);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('live-provider-lacks-operational-status-authority:event-1'));
  assert.ok(validation.blockers.includes('live-provider-lacks-event-schedule-authority:event-1'));
  assert.ok(validation.blockers.includes('live-provider-lacks-operational-status-authority:food-1'));
});

test('booking provider must explicitly declare booking-handoff authority', () => {
  const value = feed();
  value.providers[1]!.capabilities = ['inventory'];

  const validation = validateLiveDestinationFeed(value);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('booking-provider-lacks-handoff-authority:event-1'));
});


test('opening-hours truth projects open/closed and next change only while source is fresh', () => {
  const value = feed();

  const openProjection = projectLiveDestinationFeed(value, '2026-09-28T12:00:00.000Z');
  const openFood = openProjection.entities.find((item) => item.id === 'food-1');
  assert.ok(openFood);
  assert.equal(openFood.openingState, 'open');
  assert.equal(openFood.nextOpeningChangeAt, '2026-09-28T12:30:00.000Z');
  assert.equal(openFood.journeyEligible, true);

  const closedValue = feed();
  closedValue.entities[1]!.expiresAt = '2026-09-28T13:30:00.000Z';
  const closedProjection = projectLiveDestinationFeed(closedValue, '2026-09-28T12:45:00.000Z');
  const closedFood = closedProjection.entities.find((item) => item.id === 'food-1');
  assert.ok(closedFood);
  assert.equal(closedFood.openingState, 'closed');
  assert.equal(closedFood.nextOpeningChangeAt, '2026-09-28T13:00:00.000Z');
  assert.equal(closedFood.journeyEligible, false);

  const staleProjection = projectLiveDestinationFeed(value, '2026-09-28T12:15:00.000Z');
  const staleFood = staleProjection.entities.find((item) => item.id === 'food-1');
  assert.ok(staleFood);
  assert.equal(staleFood.freshness, 'stale');
  assert.equal(staleFood.openingState, 'unknown');
  assert.equal(staleFood.nextOpeningChangeAt, undefined);
});

test('opening-hours claims require explicit provider authority and valid windows', () => {
  const noAuthority = feed();
  noAuthority.providers[0]!.capabilities = ['inventory', 'event-schedule', 'operational-status'];
  let validation = validateLiveDestinationFeed(noAuthority);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('live-provider-lacks-opening-hours-authority:food-1'));

  const invalidWindow = feed();
  invalidWindow.entities[1]!.openingHours!.windows[0]!.closesAt =
    invalidWindow.entities[1]!.openingHours!.windows[0]!.opensAt;
  validation = validateLiveDestinationFeed(invalidWindow);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('live-opening-window-order-invalid:food-1:0'));
});

test('citywide theatre and restaurant kinds accept bounded live status semantics', () => {
  const value = feed();
  value.entities.push({
    id: 'theatre-1',
    providerEntityId: 'theatre-provider-1',
    providerId: 'official-events',
    kind: 'theatre',
    titleRu: 'Театр',
    titleEn: 'Theatre',
    titleZh: '剧院',
    latitude: 55.75,
    longitude: 37.61,
    tags: ['театр'],
    sourceUrl: 'https://example.org/theatre/1',
    observedAt: '2026-09-28T11:55:00.000Z',
    expiresAt: '2026-09-28T13:00:00.000Z',
    operationalStatus: 'open'
  });
  value.entities.push({
    id: 'restaurant-1',
    providerEntityId: 'restaurant-provider-1',
    providerId: 'official-events',
    kind: 'restaurant',
    titleRu: 'Ресторан',
    titleEn: 'Restaurant',
    titleZh: '餐厅',
    latitude: 55.751,
    longitude: 37.611,
    tags: ['еда'],
    sourceUrl: 'https://example.org/restaurant/1',
    observedAt: '2026-09-28T11:55:00.000Z',
    expiresAt: '2026-09-28T13:00:00.000Z',
    operationalStatus: 'open'
  });

  const validation = validateLiveDestinationFeed(value);
  assert.equal(validation.valid, true);
});
