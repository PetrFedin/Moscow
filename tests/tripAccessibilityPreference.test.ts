import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPersonalTrip,
  parsePersonalTrip,
  setTripStepFreeIntent,
  tripStepFreeIntent
} from '../src/travel/personalTrip.ts';

function trip() {
  return createPersonalTrip({
    id: 'trip-accessibility',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-02',
    endDate: '2026-10-03',
    createdAt: '2026-10-02T08:00:00.000Z'
  });
}

test('existing trips default to no step-free requirement', () => {
  assert.equal(tripStepFreeIntent(trip()), 'none');
});

test('personal trip persists required step-free intent without asserting route accessibility', () => {
  const updated = setTripStepFreeIntent({
    trip: trip(),
    intent: 'required',
    updatedAt: '2026-10-02T09:00:00.000Z'
  });

  assert.equal(tripStepFreeIntent(updated), 'required');
  assert.equal('accessibilityVerified' in updated, false);
});

test('step-free intent survives Personal Trip serialization', () => {
  const updated = setTripStepFreeIntent({
    trip: trip(),
    intent: 'preferred',
    updatedAt: '2026-10-02T09:00:00.000Z'
  });

  const restored = parsePersonalTrip(JSON.stringify(updated));
  assert.equal(tripStepFreeIntent(restored), 'preferred');
});

test('parser rejects unsupported step-free intent instead of silently interpreting it', () => {
  const raw = JSON.parse(JSON.stringify(trip()));
  raw.preferences = { stepFreeIntent: 'guaranteed' };

  assert.throws(
    () => parsePersonalTrip(JSON.stringify(raw)),
    /Invalid Personal Trip step-free intent/
  );
});
