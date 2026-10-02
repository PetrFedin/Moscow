import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addManualTripItem,
  createPersonalTrip,
  personalTripDayItems,
  recordTripVisit
} from '../src/travel/personalTrip.ts';
import {
  deriveTripFreeWindows,
  detectTripScheduleConflicts,
  moveTripItem,
  reorderTripDayItems
} from '../src/travel/tripScheduler.ts';

const createdAt = '2026-10-02T06:00:00.000Z';

function trip() {
  return createPersonalTrip({
    id: 'trip-scheduler',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    createdAt
  });
}

function addFixed(
  base: ReturnType<typeof trip>,
  id: string,
  start: string,
  end: string,
  title = id
) {
  return addManualTripItem({
    trip: base,
    itemId: id,
    dayDate: '2026-10-02',
    title,
    kind: 'event',
    plannedStartAt: start,
    plannedEndAt: end,
    updatedAt: createdAt,
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'user-declared',
      reference: `ticket:${id}`
    }
  });
}

test('detects overlap only between fixed confirmed commitments', () => {
  let value = trip();
  value = addFixed(value, 'museum', '2026-10-02T10:00:00+03:00', '2026-10-02T12:00:00+03:00');
  value = addFixed(value, 'theatre', '2026-10-02T11:30:00+03:00', '2026-10-02T13:00:00+03:00');
  value = addManualTripItem({
    trip: value,
    itemId: 'flexible-lunch',
    dayDate: '2026-10-02',
    title: 'Обед без брони',
    kind: 'food',
    plannedStartAt: '2026-10-02T11:00:00+03:00',
    plannedEndAt: '2026-10-02T12:30:00+03:00',
    updatedAt: createdAt
  });

  const conflicts = detectTripScheduleConflicts(value);
  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0]?.itemIds, ['museum', 'theatre']);
});

test('derives free windows from fixed commitments without claiming routing feasibility', () => {
  let value = trip();
  value = addFixed(value, 'museum', '2026-10-02T10:00:00+03:00', '2026-10-02T12:00:00+03:00');
  value = addFixed(value, 'theatre', '2026-10-02T18:00:00+03:00', '2026-10-02T20:00:00+03:00');

  const windows = deriveTripFreeWindows({
    trip: value,
    dayDate: '2026-10-02',
    dayStartsAt: '2026-10-02T09:00:00+03:00',
    dayEndsAt: '2026-10-02T23:00:00+03:00',
    minimumMinutes: 30
  });

  assert.deepEqual(windows.map((window) => window.minutes), [60, 360, 180]);
  assert.ok(windows.every((window) => window.routingVerified === false));
});

test('moving a planned ticket to another day preserves truth class and local clock time', () => {
  let value = trip();
  value = addFixed(value, 'ticket', '2026-10-02T19:00:00+03:00', '2026-10-02T21:00:00+03:00');

  value = moveTripItem({
    trip: value,
    itemId: 'ticket',
    targetDayDate: '2026-10-03',
    updatedAt: '2026-10-02T07:00:00.000Z'
  });

  const item = value.items.find((candidate) => candidate.id === 'ticket');
  assert.equal(item?.dayDate, '2026-10-03');
  assert.equal(item?.plannedStartAt, '2026-10-03T19:00:00+03:00');
  assert.equal(item?.plannedEndAt, '2026-10-03T21:00:00+03:00');
  assert.equal(item?.commitment?.verification, 'user-declared');
});

test('historical visited item cannot be moved to rewrite where the visit happened', () => {
  let value = addManualTripItem({
    trip: trip(),
    itemId: 'visited',
    dayDate: '2026-10-02',
    title: 'Посещённое место',
    kind: 'museum',
    updatedAt: createdAt
  });
  value = recordTripVisit({
    trip: value,
    visitId: 'visit',
    itemId: 'visited',
    dayDate: '2026-10-02',
    visitedAt: '2026-10-02T12:00:00+03:00',
    title: 'Посещённое место',
    evidence: 'user-confirmed',
    updatedAt: '2026-10-02T12:00:00+03:00'
  });

  assert.throws(
    () => moveTripItem({
      trip: value,
      itemId: 'visited',
      targetDayDate: '2026-10-03',
      updatedAt: '2026-10-02T13:00:00+03:00'
    }),
    /Visited trip item cannot move/
  );
});

test('explicit reorder changes display order without mutating supplied timestamps', () => {
  let value = trip();
  value = addManualTripItem({
    trip: value,
    itemId: 'a',
    dayDate: '2026-10-02',
    title: 'A',
    kind: 'activity',
    plannedStartAt: '2026-10-02T10:00:00+03:00',
    updatedAt: createdAt
  });
  value = addManualTripItem({
    trip: value,
    itemId: 'b',
    dayDate: '2026-10-02',
    title: 'B',
    kind: 'activity',
    plannedStartAt: '2026-10-02T11:00:00+03:00',
    updatedAt: createdAt
  });

  value = reorderTripDayItems({
    trip: value,
    dayDate: '2026-10-02',
    orderedItemIds: ['b', 'a'],
    updatedAt: '2026-10-02T08:00:00.000Z'
  });

  assert.deepEqual(personalTripDayItems(value, '2026-10-02').map((item) => item.id), ['b', 'a']);
  assert.equal(value.items.find((item) => item.id === 'a')?.plannedStartAt, '2026-10-02T10:00:00+03:00');
  assert.equal(value.items.find((item) => item.id === 'b')?.plannedStartAt, '2026-10-02T11:00:00+03:00');
});

test('reorder rejects partial day lists instead of silently dropping items', () => {
  let value = trip();
  for (const id of ['a', 'b']) {
    value = addManualTripItem({
      trip: value,
      itemId: id,
      dayDate: '2026-10-02',
      title: id,
      kind: 'other',
      updatedAt: createdAt
    });
  }

  assert.throws(
    () => reorderTripDayItems({
      trip: value,
      dayDate: '2026-10-02',
      orderedItemIds: ['a'],
      updatedAt: createdAt
    }),
    /each day item exactly once/
  );
});
