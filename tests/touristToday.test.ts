import assert from 'node:assert/strict';
import test from 'node:test';

import { addManualTripItem, createPersonalTrip, recordTripVisit } from '../src/travel/personalTrip.ts';
import { deriveTouristTodayState, minutesUntilItem, todayProgress } from '../src/travel/touristToday.ts';

function trip() {
  return createPersonalTrip({
    id: 'today-trip',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    createdAt: '2026-10-01T12:00:00.000Z'
  });
}

test('today derives current, next and next confirmed commitment from Moscow trip clock', () => {
  let value = trip();
  value = addManualTripItem({
    trip: value,
    itemId: 'museum',
    dayDate: '2026-10-02',
    title: 'Музей',
    kind: 'museum',
    plannedStartAt: '2026-10-02T10:00:00+03:00',
    plannedEndAt: '2026-10-02T12:00:00+03:00',
    updatedAt: '2026-10-02T07:00:00.000Z'
  });
  value = addManualTripItem({
    trip: value,
    itemId: 'theatre',
    dayDate: '2026-10-02',
    title: 'Театр',
    kind: 'theatre',
    plannedStartAt: '2026-10-02T19:00:00+03:00',
    plannedEndAt: '2026-10-02T21:00:00+03:00',
    updatedAt: '2026-10-02T07:00:00.000Z',
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'user-declared',
      reference: 'мой билет'
    }
  });

  const state = deriveTouristTodayState({
    trip: value,
    nowIso: '2026-10-02T08:30:00.000Z'
  });

  assert.equal(state.tripActive, true);
  assert.deepEqual(state.currentItems.map((item) => item.id), ['museum']);
  assert.equal(state.nextItem?.id, 'theatre');
  assert.equal(state.nextCommitment?.id, 'theatre');
  assert.equal(minutesUntilItem('2026-10-02T08:30:00.000Z', state.nextCommitment), 450);
});

test('today never claims routing verification for a schedule-only free window', () => {
  let value = trip();
  value = addManualTripItem({
    trip: value,
    itemId: 'lunch',
    dayDate: '2026-10-02',
    title: 'Обед',
    kind: 'food',
    plannedStartAt: '2026-10-02T14:00:00+03:00',
    plannedEndAt: '2026-10-02T15:00:00+03:00',
    updatedAt: '2026-10-02T08:00:00.000Z'
  });

  const state = deriveTouristTodayState({
    trip: value,
    nowIso: '2026-10-02T08:30:00.000Z',
    dayStartsAt: '2026-10-02T09:00:00+03:00',
    dayEndsAt: '2026-10-02T18:00:00+03:00'
  });

  assert.ok(state.nextFreeWindow);
  assert.equal(state.nextFreeWindow?.routingVerified, false);
});

test('completed visit contributes to today history and progress', () => {
  let value = addManualTripItem({
    trip: trip(),
    itemId: 'visited',
    dayDate: '2026-10-02',
    title: 'Утренний музей',
    kind: 'museum',
    plannedStartAt: '2026-10-02T09:00:00+03:00',
    plannedEndAt: '2026-10-02T10:00:00+03:00',
    updatedAt: '2026-10-02T06:00:00.000Z'
  });
  value = recordTripVisit({
    trip: value,
    visitId: 'visit-1',
    itemId: 'visited',
    dayDate: '2026-10-02',
    visitedAt: '2026-10-02T07:00:00.000Z',
    title: 'Утренний музей',
    evidence: 'user-confirmed',
    updatedAt: '2026-10-02T07:00:00.000Z'
  });

  const state = deriveTouristTodayState({
    trip: value,
    nowIso: '2026-10-02T08:00:00.000Z'
  });

  assert.deepEqual(state.visitsToday.map((visit) => visit.title), ['Утренний музей']);
  assert.deepEqual(todayProgress(state), { completed: 1, remaining: 0, total: 1, ratio: 1 });
});

test('today becomes inactive outside the trip instead of inventing a current day', () => {
  const state = deriveTouristTodayState({
    trip: trip(),
    nowIso: '2026-10-05T09:00:00.000Z'
  });

  assert.equal(state.tripActive, false);
  assert.equal(state.currentItems.length, 0);
  assert.equal(state.remainingItems.length, 0);
  assert.equal(state.nextCommitment, undefined);
});

test('next commitment stays user-declared when that is all the trip knows', () => {
  let value = trip();
  value = addManualTripItem({
    trip: value,
    itemId: 'dinner',
    dayDate: '2026-10-02',
    title: 'Ужин',
    kind: 'food',
    plannedStartAt: '2026-10-02T20:00:00+03:00',
    plannedEndAt: '2026-10-02T22:00:00+03:00',
    updatedAt: '2026-10-02T08:00:00.000Z',
    commitment: {
      kind: 'reservation',
      status: 'confirmed',
      verification: 'user-declared',
      provider: 'введено туристом'
    }
  });

  const state = deriveTouristTodayState({
    trip: value,
    nowIso: '2026-10-02T09:00:00.000Z'
  });

  assert.equal(state.nextCommitment?.commitment?.verification, 'user-declared');
});
