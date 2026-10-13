import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPersonalTrip, recordTripVisit, updateTripVisitNote
} from '../src/travel/personalTrip.ts';
import { archivePersonalTrip, emptyPersonalTripArchive } from '../src/travel/personalTripArchive.ts';
import { buildMoscowTravelHistory } from '../src/travel/moscowTravelHistory.ts';

const date = '2026-10-13';
const at = '2026-10-13T12:00:00.000Z';
function make(id: string) {
  return createPersonalTrip({ id, title: id, destinationId: 'moscow',
    startDate: date, endDate: date, createdAt: at });
}
function visit(id: string, place: string, kind: 'food' | 'museum') {
  const base = make(id);
  const added = recordTripVisit({ trip: base, visitId: 'visit-' + id,
    dayDate: date, title: place, kind, evidence: 'user-confirmed',
    visitedAt: at, updatedAt: at });
  return updateTripVisitNote({ trip: added, visitId: 'visit-' + id, note: 'Личное воспоминание', updatedAt: at });
}

test('cross-trip history keeps restaurant, museum and notes independently', () => {
  const active = visit('autumn', 'Кафе', 'food');
  const previous = visit('summer', 'Музей', 'museum');
  const archive = archivePersonalTrip(emptyPersonalTripArchive(), previous);
  const result = buildMoscowTravelHistory({ activeTrip: active, archive });
  assert.equal(result.tripCount, 2);
  assert.equal(result.visitCount, 2);
  assert.equal(result.restaurantCount, 1);
  assert.equal(result.museumAndCultureCount, 1);
  assert.equal(result.entries.every(e => e.note === 'Личное воспоминание'), true);
  assert.equal(new Set(result.entries.map(e => e.key)).size, 2);
});

test('current active trip takes precedence over its archived older snapshot', () => {
  const older = make('same-id');
  const current = visit('same-id', 'Событие', 'food');
  const archive = archivePersonalTrip(emptyPersonalTripArchive(), older);
  const history = buildMoscowTravelHistory({ activeTrip: current, archive });
  assert.equal(history.tripCount, 1);
  assert.equal(history.visitCount, 1);
  assert.equal(history.entries[0]?.title, 'Событие');
});

test('history is derived only; does not mutate local trip or archive', () => {
  const trip = visit('local', 'Кафе', 'food');
  const archive = emptyPersonalTripArchive();
  const source = JSON.stringify(trip);
  buildMoscowTravelHistory({ activeTrip: trip, archive });
  assert.equal(JSON.stringify(trip), source);
  assert.equal(archive.trips.length, 0);
});
