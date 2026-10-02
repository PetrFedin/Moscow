import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addManualTripItem,
  createPersonalTrip,
  parsePersonalTrip
} from '../src/travel/personalTrip.ts';

function trip() {
  return createPersonalTrip({
    id: 'booking-wallet-trip',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    createdAt: '2026-10-02T08:00:00.000Z'
  });
}

test('booking wallet details survive Personal Trip serialization', () => {
  const value = addManualTripItem({
    trip: trip(),
    itemId: 'theatre-ticket',
    dayDate: '2026-10-02',
    title: 'Большой театр',
    kind: 'theatre',
    plannedStartAt: '2026-10-02T19:00:00+03:00',
    plannedEndAt: '2026-10-02T22:00:00+03:00',
    updatedAt: '2026-10-02T08:30:00.000Z',
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'user-declared',
      provider: 'Введено пользователем',
      reference: 'ORDER-42',
      partySize: 2,
      seats: 'Партер, ряд 5, места 11–12',
      address: 'Театральная площадь, 1',
      sourceRef: 'email:ticket-42',
      externalUrl: 'https://example.com/ticket/42'
    }
  });

  const restored = parsePersonalTrip(JSON.stringify(value));
  const commitment = restored.items[0]?.commitment;
  assert.equal(commitment?.partySize, 2);
  assert.equal(commitment?.seats, 'Партер, ряд 5, места 11–12');
  assert.equal(commitment?.address, 'Театральная площадь, 1');
  assert.equal(commitment?.sourceRef, 'email:ticket-42');
  assert.equal(commitment?.verification, 'user-declared');
  assert.equal(commitment?.receiptEvidenceRef, undefined);
});

for (const invalid of [0, -1, 1.5, 51]) {
  test(`booking wallet rejects invalid party size ${invalid}`, () => {
    assert.throws(
      () => addManualTripItem({
        trip: trip(),
        itemId: 'invalid-party-' + String(invalid),
        dayDate: '2026-10-02',
        title: 'Бронь',
        kind: 'food',
        updatedAt: '2026-10-02T08:30:00.000Z',
        commitment: {
          kind: 'reservation',
          status: 'confirmed',
          verification: 'user-declared',
          partySize: invalid
        }
      }),
      /party size/
    );
  });
}

test('booking detail fields cannot promote a manual commitment to provider-confirmed', () => {
  const value = addManualTripItem({
    trip: trip(),
    itemId: 'restaurant',
    dayDate: '2026-10-02',
    title: 'Ресторан',
    kind: 'food',
    updatedAt: '2026-10-02T08:30:00.000Z',
    commitment: {
      kind: 'reservation',
      status: 'confirmed',
      verification: 'user-declared',
      provider: 'Restaurant site',
      reference: 'R-1',
      partySize: 4,
      seats: 'Стол у окна',
      address: 'Москва',
      externalUrl: 'https://example.com/reservation'
    }
  });

  assert.equal(value.items[0]?.commitment?.verification, 'user-declared');
  assert.equal(value.items[0]?.commitment?.receiptEvidenceRef, undefined);
});

test('provider-confirmed booking still requires provider receipt evidence', () => {
  assert.throws(
    () => addManualTripItem({
      trip: trip(),
      itemId: 'fake-provider',
      dayDate: '2026-10-02',
      title: 'Театр',
      kind: 'theatre',
      updatedAt: '2026-10-02T08:30:00.000Z',
      commitment: {
        kind: 'ticket',
        status: 'confirmed',
        verification: 'provider-confirmed',
        provider: 'Provider',
        reference: 'ABC',
        partySize: 2,
        seats: 'A1, A2'
      }
    }),
    /receipt evidence/
  );
});
