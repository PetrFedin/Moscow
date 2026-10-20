import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addManualTripItem,
  createPersonalTrip,
  recordTripVisit,
  setTripItemStatus,
  type PersonalTrip
} from '../src/travel/personalTrip.ts';
import { beginBookingResolution, archiveBookingResolution } from '../src/travel/bookingResolution.ts';
import { assessTripReadiness } from '../src/travel/tripReadiness.ts';

const date = '2026-10-20';
const now = '2026-10-19T08:00:00.000Z';

function trip(): PersonalTrip {
  return createPersonalTrip({
    id: 'review-scenario', destinationId: 'moscow', title: 'Моя Москва',
    startDate: '2026-10-20', endDate: '2026-10-21', createdAt: now
  });
}
function add(input: {
  trip: PersonalTrip;
  id: string;
  dayDate?: string;
  start?: string;
  end?: string;
  status?: 'held' | 'confirmed';
  verification?: 'user-declared' | 'provider-confirmed';
}) {
  return addManualTripItem({
    trip: input.trip,
    itemId: input.id,
    title: input.id,
    kind: 'theatre',
    dayDate: input.dayDate ?? date,
    updatedAt: now,
    ...(input.start ? { plannedStartAt: input.start } : {}),
    ...(input.end ? { plannedEndAt: input.end } : {}),
    ...(input.status ? { commitment: {
      kind: 'ticket' as const,
      status: input.status,
      verification: input.verification ?? 'user-declared',
      ...(input.verification === 'provider-confirmed' ? {
        provider: 'Provider recorded in user data', receiptEvidenceRef: 'supplier:receipt:100'
      } : {})
    }} : {})
  });
}

test('readiness stays local-only even when the trip is empty', () => {
  const original = trip();
  const before = JSON.stringify(original);
  const report = assessTripReadiness(original, date);
  assert.equal(report.level, 'clear-local');
  assert.equal(report.issueCount, 0);
  assert.equal(report.providerAvailabilityChecked, false);
  assert.equal(report.onlineBookingCompleted, false);
  assert.equal(report.travelRoutingVerified, false);
  assert.equal(JSON.stringify(original), before);
});

test('a user-declared booking calls for independent original confirmation, without claiming purchase', () => {
  const itinerary = add({
    trip: trip(), id: 'manual-ticket', status: 'confirmed',
    start: '2026-10-20T19:00:00+03:00',
    end: '2026-10-20T21:00:00+03:00'
  });
  const report = assessTripReadiness(itinerary);
  assert.equal(report.level, 'check');
  assert.equal(report.checkCount, 1);
  assert.deepEqual(report.issues.map(x => x.code), ['user-declared-booking']);
});

test('held reservation and unresolved local contact are different independent checks', () => {
  let itinerary = add({
    trip: trip(), id: 'provisional', status: 'held',
    start: '2026-10-20T19:00:00+03:00',
    end: '2026-10-20T20:00:00+03:00'
  });
  itinerary = beginBookingResolution({
    trip: itinerary,
    itemId: 'provisional', topic: 'change-date',
    caseId: 'case-1', eventId: 'event-1', at: '2026-10-19T09:00:00.000Z'
  });
  let report = assessTripReadiness(itinerary, date);
  assert.equal(report.checkCount, 2);
  assert.deepEqual(report.issues.map(x => x.code).sort(),
    ['provisional-hold', 'unresolved-provider-question']);

  itinerary = archiveBookingResolution({
    trip: itinerary, caseId: 'case-1', eventId: 'event-2', at: '2026-10-19T09:10:00.000Z'
  });
  report = assessTripReadiness(itinerary);
  assert.equal(report.checkCount, 1);
  assert.equal(report.issues[0]?.code, 'provisional-hold');
});

test('booked tickets overlapping over Moscow midnight are blocking review conflicts on either origin day', () => {
  let itinerary = add({
    trip: trip(), id: 'night-museum', status: 'confirmed',
    start: '2026-10-20T23:20:00+03:00',
    end: '2026-10-21T01:10:00+03:00'
  });
  itinerary = add({
    trip: itinerary, id: 'next-day-dinner', dayDate: '2026-10-21', status: 'confirmed',
    start: '2026-10-21T00:30:00+03:00',
    end: '2026-10-21T02:00:00+03:00'
  });
  for (const scope of [undefined, '2026-10-20', '2026-10-21'] as const) {
    const report = assessTripReadiness(itinerary, scope);
    assert.equal(report.conflictCount, 1);
    assert.equal(report.issues[0]?.code, 'fixed-overlap');
    assert.deepEqual([...report.issues[0]!.itemIds].sort(), ['next-day-dinner', 'night-museum'].sort());
  }
});

test('overlapping personal plan never creates a provider-confirmed ticket', () => {
  let itinerary = add({
    trip: trip(), id: 'planned-visit',
    start: '2026-10-20T16:00:00+03:00',
    end: '2026-10-20T18:00:00+03:00'
  });
  itinerary = add({
    trip: itinerary, id: 'planned-gallery',
    start: '2026-10-20T17:00:00+03:00',
    end: '2026-10-20T19:00:00+03:00'
  });
  const report = assessTripReadiness(itinerary, date);
  assert.equal(report.conflictCount, 0);
  assert.equal(report.checkCount, 1);
  assert.equal(report.issues[0]?.code, 'planned-overlap');
});

test('missing time is informational; one-sided time is a review warning', () => {
  let itinerary = add({ trip: trip(), id: 'no-time' });
  itinerary = add({
    trip: itinerary, id: 'start-only', start: '2026-10-20T15:00:00+03:00'
  });
  const report = assessTripReadiness(itinerary, date);
  assert.equal(report.checkCount, 1);
  assert.equal(report.informationCount, 1);
  assert.deepEqual(report.issues.map(x => x.code), ['incomplete-time', 'missing-time']);
});

test('cancelled, skipped and personally visited stops do not show as upcoming warnings', () => {
  let itinerary = add({ trip: trip(), id: 'cancelled', status: 'confirmed' });
  itinerary = add({ trip: itinerary, id: 'skipped' });
  itinerary = add({ trip: itinerary, id: 'visited', status: 'confirmed' });
  itinerary = setTripItemStatus({
    trip: itinerary, itemId: 'cancelled', status: 'cancelled', updatedAt: now
  });
  itinerary = setTripItemStatus({
    trip: itinerary, itemId: 'skipped', status: 'skipped', updatedAt: now
  });
  itinerary = recordTripVisit({
    trip: itinerary, visitId: 'user-visit',
    itemId: 'visited', title: 'visited', dayDate: date,
    visitedAt: '2026-10-20T17:00:00+03:00', updatedAt: '2026-10-20T17:00:00+03:00',
    evidence: 'user-confirmed'
  });
  assert.equal(assessTripReadiness(itinerary).issueCount, 0);
  assert.equal(itinerary.items.length, 3);
  assert.equal(itinerary.visits.length, 1);
});

test('recorded supplier verification is never reported as a live check', () => {
  const itinerary = add({
    trip: trip(), id: 'provider-label', status: 'confirmed', verification: 'provider-confirmed',
    start: '2026-10-20T19:00:00+03:00', end: '2026-10-20T20:30:00+03:00'
  });
  const report = assessTripReadiness(itinerary);
  assert.equal(report.issues[0]?.code, 'provider-recorded-check-original');
  assert.equal(report.level, 'clear-local');
  assert.equal(report.providerAvailabilityChecked, false);
});

test('readiness rejects malformed persisted plans and unknown days without changing storage', () => {
  const itinerary = trip();
  assert.throws(() => assessTripReadiness(itinerary, '2026-10-22'), /belong/);
  const corrupt = { ...itinerary, items: [{ id: '', title: '', dayDate: date }] } as never;
  assert.throws(() => assessTripReadiness(corrupt), /Invalid/);
  assert.equal(itinerary.items.length, 0);
});
