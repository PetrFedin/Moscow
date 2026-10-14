import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addManualTripItem,
  createPersonalTrip,
  parsePersonalTrip
} from '../src/travel/personalTrip.ts';
import {
  beginBookingResolution,
  noteBookingContact,
  noteBookingResponse,
  archiveBookingResolution,
  latestBookingResolution,
  bookingResolutionIsOpen,
  validateBookingResolutions
} from '../src/travel/bookingResolution.ts';
import {
  createPersonalTripBackup,
  parsePersonalTripBackup
} from '../src/travel/personalTripBackup.ts';
import { emptyPersonalTripArchive } from '../src/travel/personalTripArchive.ts';

const at0 = '2026-10-15T08:00:00.000Z';
const at1 = '2026-10-15T08:01:00.000Z';
const at2 = '2026-10-15T08:02:00.000Z';
const at3 = '2026-10-15T08:03:00.000Z';
const at4 = '2026-10-15T08:04:00.000Z';

function ticketTrip() {
  const base = createPersonalTrip({
    id: 'trip-with-booking', destinationId: 'moscow', title: 'Моя Москва',
    startDate: '2026-10-15', endDate: '2026-10-16', createdAt: at0
  });
  return addManualTripItem({
    trip: base, itemId: 'booked-theatre', dayDate: '2026-10-15',
    title: 'Театр', kind: 'theatre', updatedAt: at0,
    plannedStartAt: '2026-10-15T19:00:00+03:00',
    plannedEndAt: '2026-10-15T21:00:00+03:00',
    commitment: {
      kind: 'ticket', status: 'confirmed', verification: 'user-declared',
      provider: 'Введено путешественником', reference: 'MY-TICKET-REFERENCE'
    }
  });
}

function opened() {
  return beginBookingResolution({
    trip: ticketTrip(), itemId: 'booked-theatre',
    topic: 'change-date', caseId: 'case-1', eventId: 'open-1', at: at1
  });
}

test('new request is local only: original provider claims, booked time and ticket are immutable', () => {
  const original = ticketTrip();
  const before = JSON.stringify(original);
  const started = beginBookingResolution({
    trip: original, itemId: 'booked-theatre',
    topic: 'change-date', caseId: 'case-1', eventId: 'open-1', at: at1
  });
  assert.equal(JSON.stringify(original), before);
  assert.deepEqual(started.items, original.items);
  assert.equal(started.items[0]?.commitment?.verification, 'user-declared');
  assert.equal(started.items[0]?.plannedStartAt, '2026-10-15T19:00:00+03:00');
  assert.equal(started.bookingResolutions?.[0]?.topic, 'change-date');
  assert.deepEqual(started.bookingResolutions?.[0]?.events, [
    { id: 'open-1', at: at1, kind: 'opened' }
  ]);
});

test('contact / self-reported reply / archive are append-only and survive backup export', () => {
  const original = opened();
  const contacted = noteBookingContact({
    trip: original, caseId: 'case-1', eventId: 'contact-1', at: at2
  });
  const replied = noteBookingResponse({
    trip: contacted, caseId: 'case-1', eventId: 'reply-1', at: at3,
    note: 'Мне по телефону предложили обратиться с оригинальным билетом.'
  });
  const archived = archiveBookingResolution({
    trip: replied, caseId: 'case-1', eventId: 'close-1', at: at4
  });
  assert.equal(original.bookingResolutions?.[0]?.events.length, 1);
  assert.equal(contacted.bookingResolutions?.[0]?.events.length, 2);
  assert.equal(replied.bookingResolutions?.[0]?.events.length, 3);
  assert.equal(archived.bookingResolutions?.[0]?.events.length, 4);
  assert.equal(latestBookingResolution(archived, 'booked-theatre')?.id, 'case-1');
  assert.equal(bookingResolutionIsOpen(archived.bookingResolutions![0]!), false);
  assert.deepEqual(archived.items, original.items);

  const recovered = parsePersonalTrip(JSON.stringify(archived));
  assert.deepEqual(recovered.bookingResolutions, archived.bookingResolutions);
  const raw = createPersonalTripBackup({
    activeTrip: archived, archive: emptyPersonalTripArchive(), exportedAt: at4
  });
  const imported = parsePersonalTripBackup(raw).activeTrip!;
  assert.deepEqual(imported.bookingResolutions, archived.bookingResolutions);
  assert.deepEqual(imported.items, original.items);
});

test('opening another live case for one ticket and appending after archive are refused', () => {
  const initial = opened();
  assert.throws(() => beginBookingResolution({
    trip: initial, itemId: 'booked-theatre', topic: 'cancel-refund',
    caseId: 'case-2', eventId: 'open-2', at: at2
  }), /archive the existing local booking case/);
  const archived = archiveBookingResolution({
    trip: initial, caseId: 'case-1', eventId: 'close-1', at: at2
  });
  assert.throws(() => noteBookingContact({
    trip: archived, caseId: 'case-1', eventId: 'late-contact', at: at3
  }), /already archived/);
  const newCase = beginBookingResolution({
    trip: archived, itemId: 'booked-theatre', topic: 'cancel-refund',
    caseId: 'case-2', eventId: 'open-2', at: at3
  });
  assert.equal(newCase.bookingResolutions?.length, 2);
  assert.equal(latestBookingResolution(newCase, 'booked-theatre')?.id, 'case-2');
  assert.deepEqual(newCase.items, initial.items);
});

test('forged provider evidence, empty replies, duplicate events and illegal chronology fail closed', () => {
  const base = opened();
  assert.throws(() => noteBookingResponse({
    trip: base, caseId: 'case-1', eventId: 'blank', at: at2, note: '  '
  }), /User reply note is required/);
  assert.throws(() => noteBookingResponse({
    trip: base, caseId: 'case-1', eventId: 'huge', at: at2, note: 'x'.repeat(1201)
  }), /User reply note is required/);
  assert.throws(() => noteBookingContact({
    trip: base, caseId: 'case-1', eventId: 'earlier', at: at0
  }), /not chronological/);
  assert.throws(() => noteBookingContact({
    trip: base, caseId: 'case-1', eventId: 'open-1', at: at2
  }), /Invalid booking resolution event/);

  for (const malformed of [
    { ...base.bookingResolutions![0], itemId: 'unknown-ticket' },
    { ...base.bookingResolutions![0], topic: 'supplier-confirmed-refund' },
    { ...base.bookingResolutions![0], externalVerifiedRefund: true },
    { ...base.bookingResolutions![0], events: [
      { id: 'open-1', at: at1, kind: 'opened' },
      { id: 'claim-1', at: at2, kind: 'provider-verified' }
    ] },
    { ...base.bookingResolutions![0], events: [
      { id: 'open-1', at: at1, kind: 'opened', providerVerified: true }
    ] }
  ]) {
    const forged = { ...base, bookingResolutions: [malformed] };
    assert.throws(() => validateBookingResolutions(forged as typeof base));
    assert.throws(() => parsePersonalTrip(JSON.stringify(forged)));
  }
});

test('legacy trip without contact records remains readable and can still be exported', () => {
  const trip = ticketTrip();
  assert.equal(trip.bookingResolutions, undefined);
  assert.equal(parsePersonalTrip(JSON.stringify(trip)).bookingResolutions, undefined);
  const backup = createPersonalTripBackup({
    activeTrip: trip, archive: emptyPersonalTripArchive(), exportedAt: at1
  });
  assert.equal(parsePersonalTripBackup(backup).activeTrip?.bookingResolutions, undefined);
});

test('non-booking stop cannot open a supplier request', () => {
  const base = createPersonalTrip({
    id: 'empty', destinationId: 'moscow', title: 'Поездка',
    startDate: '2026-10-15', endDate: '2026-10-15', createdAt: at0
  });
  assert.throws(() => beginBookingResolution({
    trip: base, itemId: 'nonexistent', topic: 'change-date',
    caseId: 'case-1', eventId: 'open-1', at: at1
  }), /existing ticket or reservation/);
});
