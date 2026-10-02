import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPersonalTrip,
  parsePersonalTrip,
  resolvePersonalTripPreferences,
  setTripPreferences
} from '../src/travel/personalTrip.ts';
import { deriveTouristTodayState } from '../src/travel/touristToday.ts';

function trip() {
  return createPersonalTrip({
    id: 'preferences-trip',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    createdAt: '2026-10-02T06:00:00.000Z'
  });
}

test('old trips resolve stable product defaults', () => {
  assert.deepEqual(resolvePersonalTripPreferences(trip()), {
    stepFreeIntent: 'none',
    pace: 'balanced',
    dayStart: '09:00',
    dayEnd: '23:00',
    maxContinuousWalkingMinutes: 60,
    priorityMode: 'balanced'
  });
});

test('trip preferences persist pace, day bounds, walking, lunch and accessibility intent', () => {
  const updated = setTripPreferences({
    trip: trip(),
    preferences: {
      pace: 'relaxed',
      dayStart: '10:00',
      dayEnd: '20:30',
      maxContinuousWalkingMinutes: 35,
      lunchWindow: { start: '13:00', end: '14:30' },
      priorityMode: 'must-see',
      stepFreeIntent: 'required'
    },
    updatedAt: '2026-10-02T07:00:00.000Z'
  });

  const restored = parsePersonalTrip(JSON.stringify(updated));
  assert.deepEqual(resolvePersonalTripPreferences(restored), {
    stepFreeIntent: 'required',
    pace: 'relaxed',
    dayStart: '10:00',
    dayEnd: '20:30',
    maxContinuousWalkingMinutes: 35,
    lunchWindow: { start: '13:00', end: '14:30' },
    priorityMode: 'must-see'
  });
  assert.equal('accessibilityVerified' in restored, false);
});

test('trip preferences reject impossible day bounds', () => {
  assert.throws(
    () => setTripPreferences({
      trip: trip(),
      preferences: { dayStart: '20:00', dayEnd: '09:00' },
      updatedAt: '2026-10-02T07:00:00.000Z'
    }),
    /day end must be after day start/
  );
});

test('trip preferences reject malformed time and walking limits', () => {
  assert.throws(
    () => setTripPreferences({
      trip: trip(),
      preferences: { dayStart: '9am' },
      updatedAt: '2026-10-02T07:00:00.000Z'
    }),
    /Invalid Personal Trip day start/
  );
  assert.throws(
    () => setTripPreferences({
      trip: trip(),
      preferences: { maxContinuousWalkingMinutes: 241 },
      updatedAt: '2026-10-02T07:00:00.000Z'
    }),
    /max walking/
  );
});

test('lunch window must stay inside configured day bounds and can be removed', () => {
  const withLunch = setTripPreferences({
    trip: trip(),
    preferences: {
      dayStart: '10:00',
      dayEnd: '20:00',
      lunchWindow: { start: '13:00', end: '14:00' }
    },
    updatedAt: '2026-10-02T07:00:00.000Z'
  });

  assert.throws(
    () => setTripPreferences({
      trip: withLunch,
      preferences: { lunchWindow: { start: '09:30', end: '10:30' } },
      updatedAt: '2026-10-02T07:10:00.000Z'
    }),
    /inside day bounds/
  );

  const cleared = setTripPreferences({
    trip: withLunch,
    preferences: { lunchWindow: null },
    updatedAt: '2026-10-02T07:20:00.000Z'
  });
  assert.equal(resolvePersonalTripPreferences(cleared).lunchWindow, undefined);
});

test('Tourist Today uses configured day bounds for schedule-only free windows', () => {
  const updated = setTripPreferences({
    trip: trip(),
    preferences: { dayStart: '10:00', dayEnd: '18:00' },
    updatedAt: '2026-10-02T07:00:00.000Z'
  });

  const state = deriveTouristTodayState({
    trip: updated,
    nowIso: '2026-10-02T06:00:00.000Z'
  });

  assert.ok(state.nextFreeWindow);
  assert.equal(state.nextFreeWindow?.minutes, 480);
  assert.equal(state.nextFreeWindow?.routingVerified, false);
});

test('parser rejects unsupported pace and priority instead of guessing', () => {
  const raw = JSON.parse(JSON.stringify(trip()));
  raw.preferences = { pace: 'extreme', priorityMode: 'everything' };

  assert.throws(
    () => parsePersonalTrip(JSON.stringify(raw)),
    /Invalid Personal Trip pace/
  );
});


test('Tourist Today excludes lunch preference from free-time window', () => {
  const updated = setTripPreferences({
    trip: trip(),
    preferences: {
      dayStart: '10:00',
      dayEnd: '18:00',
      lunchWindow: { start: '13:00', end: '14:00' }
    },
    updatedAt: '2026-10-02T07:00:00.000Z'
  });

  const state = deriveTouristTodayState({
    trip: updated,
    nowIso: '2026-10-02T08:00:00.000Z'
  });

  assert.ok(state.currentFreeWindow);
  assert.equal(state.currentFreeWindow?.minutes, 180);
  assert.ok(state.nextFreeWindow);
  assert.equal(state.nextFreeWindow?.minutes, 240);
  assert.ok([state.currentFreeWindow, state.nextFreeWindow].every((window) => window?.routingVerified === false));
});
