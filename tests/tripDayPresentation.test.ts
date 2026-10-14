import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dayStopPresentation,
  displayedUpcomingCommitments
} from '../src/travel/tripDayPresentation.ts';
import type { PersonalTripItem, PersonalTripCommitment } from '../src/travel/personalTrip.ts';

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
