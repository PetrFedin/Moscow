import assert from 'node:assert/strict';
import test from 'node:test';
import { curatedMoscowPlace, curatedMoscowPlaces } from '../src/travel/curatedMoscowPlaces.ts';
import { addCuratedMoscowPlaceToTrip, createPersonalTrip, parsePersonalTrip, recordTripVisit } from '../src/travel/personalTrip.ts';
import {
  officialVenueServiceHandoff,
  saveVenueServiceToTrip,
  venueServiceCapability,
  VENUE_SERVICE_CAPABILITIES
} from '../src/travel/serviceBookingBridge.ts';
import { detectTripScheduleConflicts } from '../src/travel/tripScheduler.ts';

const now = '2026-10-19T09:00:00.000Z';
function trip() {
  return createPersonalTrip({
    id: 'venue-services', destinationId: 'moscow', title: 'Moscow',
    startDate: '2026-10-20', endDate: '2026-10-22', createdAt: now
  });
}
function venue(id: string) {
  const found = curatedMoscowPlace(id);
  assert.ok(found, 'Known curated venue required: ' + id);
  return found;
}
function insert(input: Partial<Parameters<typeof saveVenueServiceToTrip>[0]> = {}) {
  return saveVenueServiceToTrip({
    trip: trip(), venue: venue('cafe-pushkin-tverskoy'),
    itemId: 'dinner-1', dayDate: '2026-10-20',
    startTime: '19:00', endTime: '21:00', mode: 'self-reported',
    updatedAt: now, ...input
  });
}

test('capability matrix covers restaurant, museum, cinema, theatre, gallery, event and studio without implying supplier access', () => {
  for (const category of [
    'restaurant', 'cafe', 'bar', 'museum', 'gallery', 'exhibition',
    'theatre', 'cinema', 'concert', 'event', 'activity', 'studio', 'park'
  ] as const) {
    const capability = venueServiceCapability(category);
    assert.equal(capability.realSupplierApiConnected, false);
    assert.equal(capability.liveAvailabilityVerified, false);
    assert.equal(capability.inAppCheckoutEnabled, false);
    assert.ok(['dining', 'tickets', 'appointments', 'visit'].includes(capability.vertical));
  }
  assert.equal(VENUE_SERVICE_CAPABILITIES.restaurant.adapterCandidate, 'restodirect');
  assert.equal(VENUE_SERVICE_CAPABILITIES.studio.adapterCandidate, 'studiobook');
  assert.equal(VENUE_SERVICE_CAPABILITIES.cinema.commitmentKind, 'ticket');
  assert.equal(VENUE_SERVICE_CAPABILITIES.park.commitmentKind, null);
  assert.throws(() => venueServiceCapability('airline' as never), /Unsupported/);
});

test('official handoff only returns an approved HTTPS source; never supplier state or customer data', () => {
  const place = venue('tretyakov-lavrushinsky');
  const handoff = officialVenueServiceHandoff(place);
  assert.equal(handoff.url, place.officialUrl);
  assert.equal(handoff.supplierBookingVerified, false);
  assert.equal(handoff.customerDataTransmitted, false);
  assert.equal(handoff.kind, 'official-website-only');
  assert.throws(() => officialVenueServiceHandoff({
    ...place, officialUrl: 'https://not-a-museum.example/'
  }), /approved/);
  assert.throws(() => officialVenueServiceHandoff({
    ...place, kind: 'restaurant'
  }), /approved/);
});

test('venue-only plan preserves its time, participant count and verified catalog identity with no booking record', () => {
  const plan = insert({
    venue: venue('tretyakov-lavrushinsky'),
    mode: 'plan', partySize: 4, itemId: 'museum-visit',
    startTime: '10:00', endTime: '12:30'
  });
  assert.equal(plan.items[0]?.catalogPlaceId, 'tretyakov-lavrushinsky');
  assert.equal(plan.items[0]?.kind, 'museum');
  assert.equal(plan.items[0]?.plannedPartySize, 4);
  assert.equal(plan.items[0]?.commitment, undefined);
  assert.equal(plan.items[0]?.plannedStartAt, '2026-10-20T10:00:00+03:00');
  assert.deepEqual(parsePersonalTrip(JSON.stringify(plan)), plan);
  const corrupt = structuredClone(plan);
  corrupt.items[0]!.plannedPartySize = 501;
  assert.throws(() => parsePersonalTrip(JSON.stringify(corrupt)), /Invalid planned participant count/);
});

test('restaurant reservation is self-reported, joins the existing trip wallet model, and preserves private order reference', () => {
  const saved = insert({ partySize: 3, reference: 'PRIVATE-ORDER-42' });
  const item = saved.items[0]!;
  assert.equal(item.kind, 'food');
  assert.equal(item.catalogPlaceId, 'cafe-pushkin-tverskoy');
  assert.equal(item.commitment?.kind, 'reservation');
  assert.equal(item.commitment?.verification, 'user-declared');
  assert.equal(item.commitment?.status, 'confirmed');
  assert.equal(item.commitment?.partySize, 3);
  assert.equal(item.commitment?.reference, 'PRIVATE-ORDER-42');
  assert.equal(item.commitment?.receiptEvidenceRef, undefined);
  assert.equal(item.commitment?.provider, undefined);
  assert.equal(item.plannedPartySize, undefined);
  assert.equal(parsePersonalTrip(JSON.stringify(saved)).items[0]?.catalogPlaceId, item.catalogPlaceId);
});

test('museum and theatre ticket categories are admitted with user-declared truth only', () => {
  const ticket = insert({ venue: venue('bolshoi-theatre'), itemId: 'theatre-1' });
  assert.equal(ticket.items[0]?.commitment?.kind, 'ticket');
  assert.equal(ticket.items[0]?.kind, 'theatre');
  assert.equal(ticket.items[0]?.commitment?.verification, 'user-declared');
});

test('duplicated venue and exact slot fail, independent second show at same venue is allowed', () => {
  const first = insert({ itemId: 'first' });
  assert.throws(() => insert({ trip: first, itemId: 'duplicate' }), /already in the trip/);
  const next = insert({ trip: first, itemId: 'second', startTime: '21:30', endTime: '23:00' });
  assert.equal(next.items.length, 2);
  assert.equal(detectTripScheduleConflicts(next).length, 0);
});

test('overlapping same-day or overnight self-declared bookings are surfaced as conflicts, never silently moved', () => {
  const first = insert({ itemId: 'dinner', startTime: '23:30', endTime: '01:00' });
  const second = insert({
    trip: first, venue: venue('bolshoi-theatre'), itemId: 'concert',
    dayDate: '2026-10-21', startTime: '00:30', endTime: '02:00'
  });
  assert.equal(second.items[0]?.dayDate, '2026-10-20');
  const conflicts = detectTripScheduleConflicts(second);
  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0]?.itemIds, ['dinner', 'concert']);
});

test('invalid suppliers, guest counts, unsupported park tickets and forged booking references fail closed', () => {
  assert.throws(() => insert({ partySize: 0 }), /Participants/);
  assert.throws(() => insert({ partySize: 51 }), /Participants/);
  assert.throws(() => insert({ partySize: 1.2 }), /Participants/);
  assert.throws(() => insert({ mode: 'plan', reference: 'PAID-ALREADY' }), /cannot carry/);
  assert.throws(() => insert({ reference: 'FORGED\nSUPPLIER' }), /Invalid private/);
  assert.throws(() => insert({
    venue: venue('zaryadye-park'), mode: 'self-reported'
  }), /does not admit/);
  assert.throws(() => insert({
    venue: { ...venue('bolshoi-theatre'), officialUrl: 'https://fake-ticket.example' }
  }), /approved/);
  assert.throws(() => insert({
    venue: venue('bolshoi-theatre'), trip: { ...trip(), destinationId: 'paris' }
  }), /not admitted/);
});

test('untrusted venue display fields cannot impersonate the source-controlled canonical venue', () => {
  const altered = {
    ...venue('bolshoi-theatre'), titleRu: 'Подмена', addressRu: 'Подмена адреса'
  };
  const saved = insert({ venue: altered, itemId: 'ticket-integrity' });
  assert.equal(saved.items[0]?.title, 'Большой театр');
  assert.equal(saved.items[0]?.commitment?.address, 'Театральная пл., 1');
  assert.equal(saved.items[0]?.note, 'Театральная пл., 1');
});

test('the venue booking survives a visit and user-confirmed Passport check-in without a forged provider receipt', () => {
  const saved = insert({ itemId: 'booked-dinner' });
  const visit = recordTripVisit({
    trip: saved, visitId: 'visit-dinner', itemId: 'booked-dinner',
    dayDate: '2026-10-20', title: saved.items[0]!.title, kind: 'food',
    visitedAt: '2026-10-20T19:40:00+03:00', evidence: 'user-confirmed',
    updatedAt: '2026-10-20T19:40:00+03:00'
  });
  assert.equal(visit.visits.length, 1);
  assert.equal(visit.visits[0]?.evidence, 'user-confirmed');
  assert.equal(visit.items[0]?.status, 'completed');
  assert.equal(visit.items[0]?.commitment?.verification, 'user-declared');
});

test('catalog includes only evidence-controlled concrete POIs; categories without source-backed entries are not fabricated', () => {
  assert.equal(curatedMoscowPlaces.length, 7);
  assert.equal(curatedMoscowPlaces.some(p => p.kind === 'cinema'), false);
  assert.equal(curatedMoscowPlaces.some(p => p.kind === 'concert'), false);
  assert.equal(curatedMoscowPlaces.some(p => p.kind === 'studio'), false);
});

test('an unscheduled catalog selection upgrades in place to a booking without duplicating Passport route identity', () => {
  const original = addCuratedMoscowPlaceToTrip({
    trip: trip(), place: venue('cafe-pushkin-tverskoy'),
    itemId: 'directory-original', dayDate: '2026-10-20', updatedAt: now
  });
  assert.equal(original.items.length, 1);
  assert.equal(original.items[0]?.plannedStartAt, undefined);
  const scheduled = insert({
    trip: original, itemId: 'should-not-create-second-id',
    reference: 'MY-BOOKED-TABLE', partySize: 2
  });
  assert.equal(scheduled.items.length, 1);
  assert.equal(scheduled.items[0]?.id, 'directory-original');
  assert.equal(scheduled.items[0]?.commitment?.reference, 'MY-BOOKED-TABLE');
  assert.equal(scheduled.items[0]?.plannedStartAt, '2026-10-20T19:00:00+03:00');
  assert.deepEqual(parsePersonalTrip(JSON.stringify(scheduled)), scheduled);
});

test('an already-visited curated stop is not silently rewritten into a new supplier commitment', () => {
  const original = addCuratedMoscowPlaceToTrip({
    trip: trip(), place: venue('cafe-pushkin-tverskoy'),
    itemId: 'visited-original', dayDate: '2026-10-20', updatedAt: now
  });
  const completed = recordTripVisit({
    trip: original, visitId: 'visited-original-visit',
    itemId: 'visited-original', dayDate: '2026-10-20',
    title: 'Кафе Пушкинъ', kind: 'food',
    visitedAt: '2026-10-20T12:00:00+03:00',
    evidence: 'user-confirmed', updatedAt: '2026-10-20T12:00:00+03:00'
  });
  const later = insert({
    trip: completed, itemId: 'second-independent-visit',
    startTime: '20:00', endTime: '22:00'
  });
  assert.equal(later.items.length, 2);
  assert.equal(later.items[0]?.status, 'completed');
  assert.equal(later.items[0]?.commitment, undefined);
  assert.equal(later.items[1]?.commitment?.verification, 'user-declared');
});


test('timed personal plan upgrades to user-reported booking in place without duplicate participant counts', () => {
  const planned = insert({ mode: 'plan', itemId: 'timed-original', partySize: 5 });
  assert.equal(planned.items[0]?.plannedPartySize, 5);
  const booked = insert({
    trip: planned, itemId: 'should-not-create',
    mode: 'self-reported', partySize: 2, reference: 'RESERVATION-FROM-MY-EMAIL'
  });
  assert.equal(booked.items.length, 1);
  assert.equal(booked.items[0]?.id, 'timed-original');
  assert.equal(booked.items[0]?.plannedPartySize, undefined);
  assert.equal(booked.items[0]?.commitment?.partySize, 2);
  assert.equal(booked.items[0]?.commitment?.verification, 'user-declared');
  assert.deepEqual(parsePersonalTrip(JSON.stringify(booked)), booked);
});
