import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addDestinationNodeToTrip,
  addManualTripItem,
  attachTripCommitment,
  createPersonalTrip,
  getUnseenDestinationNodes,
  parsePersonalTrip,
  personalTripDayItems,
  recordTripVisit,
  summarizePersonalTrip,
  syncRouteCompletedVisits
} from '../src/travel/personalTrip.ts';
import { moscowVarvarkaDestinationPackage } from '../src/travel/moscowDestinationPackage.ts';

const now = '2026-10-02T09:00:00.000Z';

function baseTrip() {
  return createPersonalTrip({
    id: 'trip-1',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    createdAt: now
  });
}

test('creates a bounded multi-day trip calendar', () => {
  const trip = baseTrip();
  assert.deepEqual(trip.days, ['2026-10-02', '2026-10-03', '2026-10-04']);
  assert.equal(summarizePersonalTrip(trip).dayCount, 3);
});

test('adds source-backed Moscow place to a chosen trip day', () => {
  const node = moscowVarvarkaDestinationPackage.nodes.find((item) => item.id === 'romanov-chambers');
  assert.ok(node);

  const trip = addDestinationNodeToTrip({
    trip: baseTrip(),
    node,
    itemId: 'item-romanov',
    dayDate: '2026-10-03',
    updatedAt: now
  });

  assert.equal(personalTripDayItems(trip, '2026-10-03')[0]?.destinationNodeId, 'romanov-chambers');
  assert.equal(personalTripDayItems(trip, '2026-10-03')[0]?.source, 'destination-package');
});

test('manual ticket stays user-declared rather than becoming provider proof', () => {
  const trip = addManualTripItem({
    trip: baseTrip(),
    itemId: 'item-theatre',
    dayDate: '2026-10-02',
    title: 'Вечерний спектакль',
    kind: 'theatre',
    plannedStartAt: '2026-10-02T16:00:00.000Z',
    updatedAt: now,
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'user-declared',
      provider: 'Введено пользователем',
      reference: 'заказ сохранён'
    }
  });

  const item = trip.items[0];
  assert.equal(item?.commitment?.verification, 'user-declared');
  assert.equal(item?.commitment?.receiptEvidenceRef, undefined);
});

test('provider-confirmed commitment requires receipt evidence', () => {
  const trip = addManualTripItem({
    trip: baseTrip(),
    itemId: 'item-museum',
    dayDate: '2026-10-02',
    title: 'Музей',
    kind: 'museum',
    updatedAt: now
  });

  assert.throws(
    () => attachTripCommitment({
      trip,
      itemId: 'item-museum',
      commitment: {
        kind: 'ticket',
        status: 'confirmed',
        verification: 'provider-confirmed',
        provider: 'tickets'
      },
      updatedAt: now
    }),
    /receipt evidence/
  );
});

test('recorded visit completes the matching plan item and enters history', () => {
  const node = moscowVarvarkaDestinationPackage.nodes[0]!;
  let trip = addDestinationNodeToTrip({
    trip: baseTrip(),
    node,
    itemId: 'item-1',
    dayDate: '2026-10-02',
    updatedAt: now
  });

  trip = recordTripVisit({
    trip,
    visitId: 'visit-1',
    itemId: 'item-1',
    destinationNodeId: node.id,
    dayDate: '2026-10-02',
    visitedAt: '2026-10-02T10:30:00.000Z',
    title: node.titleRu,
    evidence: 'user-confirmed',
    updatedAt: '2026-10-02T10:30:00.000Z'
  });

  assert.equal(trip.items[0]?.status, 'completed');
  assert.equal(trip.visits[0]?.destinationNodeId, node.id);
  assert.equal(summarizePersonalTrip(trip).visitedCount, 1);
});

test('route completion sync is idempotent and does not fabricate coordinates', () => {
  const trip = syncRouteCompletedVisits({
    trip: baseTrip(),
    pkg: moscowVarvarkaDestinationPackage,
    destinationNodeIds: ['romanov-chambers', 'romanov-chambers'],
    dayDate: '2026-10-02',
    at: '2026-10-02T11:00:00.000Z',
    idForNode: (nodeId) => `visit:${nodeId}`
  });

  assert.equal(trip.visits.length, 1);
  assert.equal(trip.visits[0]?.evidence, 'route-completed');
  assert.equal('latitude' in (trip.visits[0] as object), false);
  assert.equal('longitude' in (trip.visits[0] as object), false);
});

test('what-next candidates exclude already planned and already visited places', () => {
  const romanov = moscowVarvarkaDestinationPackage.nodes.find((item) => item.id === 'romanov-chambers')!;
  let trip = addDestinationNodeToTrip({
    trip: baseTrip(),
    node: romanov,
    itemId: 'romanov',
    dayDate: '2026-10-02',
    updatedAt: now
  });

  trip = recordTripVisit({
    trip,
    visitId: 'visit-oec',
    destinationNodeId: 'old-english-court',
    dayDate: '2026-10-02',
    visitedAt: '2026-10-02T12:00:00.000Z',
    title: 'Старый Английский двор',
    evidence: 'user-confirmed',
    updatedAt: '2026-10-02T12:00:00.000Z'
  });

  const ids = getUnseenDestinationNodes({
    pkg: moscowVarvarkaDestinationPackage,
    trip
  }).map((node) => node.id);

  assert.equal(ids.includes('romanov-chambers'), false);
  assert.equal(ids.includes('old-english-court'), false);
});

test('serialized trip can be parsed without upgrading manual evidence', () => {
  const trip = addManualTripItem({
    trip: baseTrip(),
    itemId: 'restaurant',
    dayDate: '2026-10-04',
    title: 'Ужин',
    kind: 'food',
    updatedAt: now,
    commitment: {
      kind: 'reservation',
      status: 'confirmed',
      verification: 'user-declared',
      reference: 'бронь из другого сервиса'
    }
  });

  const restored = parsePersonalTrip(JSON.stringify(trip));
  assert.equal(restored.items[0]?.commitment?.verification, 'user-declared');
});
