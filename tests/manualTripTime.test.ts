import assert from 'node:assert/strict';
import test from 'node:test';
import { manualMoscowInterval, moscowCalendarDay } from '../src/travel/manualTripTime.ts';
import { addManualTripItem, createPersonalTrip } from '../src/travel/personalTrip.ts';
import { detectTripScheduleConflicts } from '../src/travel/tripScheduler.ts';

test('Moscow day is independent of client timezone around midnight', () => {
  assert.equal(moscowCalendarDay(new Date('2026-10-18T21:30:00Z')), '2026-10-19');
  assert.equal(moscowCalendarDay(new Date('2026-10-19T20:30:00Z')), '2026-10-19');
  assert.equal(moscowCalendarDay(new Date('2026-10-19T21:00:00Z')), '2026-10-20');
});

test('manual events may end after Moscow midnight without altering start day', () => {
  assert.deepEqual(manualMoscowInterval('2026-10-19', '23:30', '01:15'), {
    plannedStartAt: '2026-10-19T23:30:00+03:00',
    plannedEndAt: '2026-10-20T01:15:00+03:00',
    overnight: true
  });
  assert.equal(manualMoscowInterval('2026-10-19', '18:00', '21:00').overnight, false);
});

test('invalid clocks, same-time ambiguity, and impossible days fail closed', () => {
  for (const [day, start, end] of [
    ['2026-10-19', '24:00', '02:00'],
    ['2026-10-19', '22:61', '23:00'],
    ['2026-10-19', '9:00', '10:00'],
    ['2026-10-19', '22:00', '22:00'],
    ['2026-02-30', '22:00', '23:00']
  ]) assert.throws(() => manualMoscowInterval(day, start, end));
});

test('overnight manual ticket conflicts with a following-day reservation', () => {
  let trip = createPersonalTrip({
    id: 'overnight-manual', destinationId: 'moscow', title: 'Moscow',
    startDate: '2026-10-19', endDate: '2026-10-20', createdAt: '2026-10-18T12:00:00Z'
  });
  const add = (id: string, dayDate: string, start: string, end: string) => {
    const range = manualMoscowInterval(dayDate, start, end);
    trip = addManualTripItem({
      trip, itemId: id, dayDate, title: id, kind: 'event',
      updatedAt: '2026-10-18T12:00:00Z',
      ...range,
      commitment: { kind: 'ticket', status: 'confirmed', verification: 'user-declared' }
    });
  };
  add('night', '2026-10-19', '23:30', '01:15');
  add('morning', '2026-10-20', '00:45', '02:00');
  assert.equal(trip.items[0]?.dayDate, '2026-10-19');
  assert.equal(trip.items[0]?.commitment?.verification, 'user-declared');
  const conflicts = detectTripScheduleConflicts(trip);
  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0]?.itemIds, ['night', 'morning']);
});
