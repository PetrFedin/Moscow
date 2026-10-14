import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dayStopPresentation,
  displayedUpcomingCommitments,
  isActivePlannedTripStop,
  canMoveTripStopBetweenDays,
  countsAsScheduledOccupancy
} from '../src/travel/tripDayPresentation.ts';
import { createPersonalTrip, personalTripDayItems, summarizePersonalTrip, type PersonalTripItem, type PersonalTripCommitment } from '../src/travel/personalTrip.ts';

const confirmed: PersonalTripCommitment = {
  kind: 'ticket', status: 'confirmed',
  verification: 'provider-confirmed', provider: 'Recorded provider',
  reference: 'TEST-REFERENCE', receiptEvidenceRef: 'user-imported-file-reference'
};

function item(id: string, overrides: Partial<PersonalTripItem> = {}): PersonalTripItem {
  return {
    id, dayDate: '2026-10-13', title: id, kind: 'theatre',
    source: 'manual', status: 'planned', ...overrides
  };
}

test('cancelled ticket never displays as a verified upcoming booking', () => {
  const cancelled = item('cancelled', { commitment: { ...confirmed, status: 'cancelled' } });
  const cancelledStop = item('cancelled-stop', { status: 'cancelled', commitment: confirmed });
  assert.equal(dayStopPresentation(cancelled, false), 'cancelled');
  assert.equal(dayStopPresentation(cancelledStop, false), 'cancelled');
  assert.equal(dayStopPresentation(cancelled, true), 'cancelled');
  assert.deepEqual(displayedUpcomingCommitments([cancelled, cancelledStop]), []);
});

test('provider-recorded vs user-declared receipts remain separate statuses', () => {
  const user = item('manual', { commitment: { ...confirmed, verification: 'user-declared' } });
  const provider = item('provider', { commitment: confirmed });
  assert.equal(dayStopPresentation(user, false), 'user-declared-confirmation');
  assert.equal(dayStopPresentation(provider, false), 'provider-confirmation-recorded');
  assert.deepEqual(displayedUpcomingCommitments([user, provider]).map(x => x.id), ['manual', 'provider']);
});

test('held, skipped, completed and recorded visit are not misrepresented', () => {
  assert.equal(dayStopPresentation(item('held', {
    commitment: { ...confirmed, status: 'held' }
  }), false), 'reservation-held');
  assert.equal(dayStopPresentation(item('skipped', {
    status: 'skipped', commitment: confirmed
  }), false), 'skipped');
  assert.equal(dayStopPresentation(item('complete', { status: 'completed' }), false), 'completed-in-plan');
  assert.equal(dayStopPresentation(item('recorded'), true), 'visit-recorded');
  assert.equal(dayStopPresentation(item('plain'), false), 'planned');
  assert.equal(displayedUpcomingCommitments([item('skipped', {
    status: 'skipped', commitment: confirmed
  })]).length, 0);
});

test('selection never mutates ticket records or verification evidence', () => {
  const original = [
    item('confirmed', { commitment: confirmed }),
    item('cancelled', { commitment: { ...confirmed, status: 'cancelled' } }),
    item('no-commitment')
  ];
  const before = JSON.stringify(original);
  const selected = displayedUpcomingCommitments(original);
  assert.deepEqual(selected.map(x => x.id), ['confirmed']);
  assert.equal(JSON.stringify(original), before);
});

test('day timeline honors user ordering without rewriting the fixed ticket or its time', () => {
  const base = createPersonalTrip({
    id: 'ordered', destinationId: 'moscow', title: 'Путешествие',
    startDate: '2026-10-13', endDate: '2026-10-13',
    createdAt: '2026-10-13T08:00:00.000Z'
  });
  const earlyTicket = item('early-fixed-ticket', {
    plannedStartAt: '2026-10-13T10:00:00+03:00',
    plannedEndAt: '2026-10-13T12:00:00+03:00',
    commitment: confirmed,
    displayOrder: 2
  });
  const latePlace = item('user-priority-place', {
    kind: 'museum',
    plannedStartAt: '2026-10-13T16:00:00+03:00',
    displayOrder: 1
  });
  const trip = { ...base, items: [earlyTicket, latePlace] };
  const before = JSON.stringify(trip);
  const ordered = personalTripDayItems(trip, '2026-10-13');
  assert.deepEqual(ordered.map(x => x.id), ['user-priority-place', 'early-fixed-ticket']);
  assert.deepEqual(ordered[1]?.commitment, confirmed);
  assert.equal(ordered[1]?.plannedStartAt, earlyTicket.plannedStartAt);
  assert.equal(JSON.stringify(trip), before);
});

test('all consumers use the same active, movable and scheduled truth rules', () => {
  const reserved = item('ticket', { commitment: confirmed });
  const held = item('held', { commitment: { ...confirmed, status: 'held' } });
  const cancelled = item('cancelled', { commitment: { ...confirmed, status: 'cancelled' } });
  const skipped = item('skipped', { status: 'skipped' });
  const unbooked = item('walk');
  assert.equal(isActivePlannedTripStop(reserved), true);
  assert.equal(isActivePlannedTripStop(held), true);
  assert.equal(isActivePlannedTripStop(cancelled), false);
  assert.equal(isActivePlannedTripStop(skipped), false);
  assert.equal(canMoveTripStopBetweenDays(reserved), false);
  assert.equal(canMoveTripStopBetweenDays(held), false);
  assert.equal(canMoveTripStopBetweenDays(cancelled), false);
  assert.equal(canMoveTripStopBetweenDays(unbooked), true);
  assert.equal(countsAsScheduledOccupancy(cancelled), false);
  assert.equal(countsAsScheduledOccupancy(item('status-cancelled', { status: 'cancelled' })), false);
  assert.equal(countsAsScheduledOccupancy(unbooked), true);
});

test('trip summary does not count cancelled commitments as still planned', () => {
  const base = createPersonalTrip({
    id: 'cancellation-summary', destinationId: 'moscow',
    title: 'Моя поездка', startDate: '2026-10-13', endDate: '2026-10-13',
    createdAt: '2026-10-13T08:00:00.000Z'
  });
  const trip = { ...base, items: [
    item('current', { commitment: confirmed }),
    item('booking-cancelled', { commitment: { ...confirmed, status: 'cancelled' } }),
    item('stop-cancelled', { status: 'cancelled', commitment: confirmed }),
    item('flexible')
  ] };
  const before = JSON.stringify(trip);
  assert.deepEqual(summarizePersonalTrip(trip), {
    dayCount: 1, plannedCount: 2, commitmentCount: 1,
    completedCount: 0, visitedCount: 0
  });
  assert.equal(JSON.stringify(trip), before);
});
