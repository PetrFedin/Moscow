import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addCuratedMoscowPlaceToTrip, createPersonalTrip, recordTripVisit, updateTripVisitNote
} from '../src/travel/personalTrip.ts';
import { archivePersonalTrip, emptyPersonalTripArchive } from '../src/travel/personalTripArchive.ts';
import {
  buildMoscowTravelHistory, filterMoscowTravelHistory, groupMoscowHistoryByDay
} from '../src/travel/moscowTravelHistory.ts';
import { curatedMoscowPlaces } from '../src/travel/curatedMoscowPlaces.ts';

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

test('repeat visits of one catalog venue count as two visits but one identified place', () => {
  const place = curatedMoscowPlaces.find((item) => item.id === 'tretyakov-lavrushinsky');
  assert.ok(place);
  const makeVisit = (id: string, atTime: string) => {
    const base = addCuratedMoscowPlaceToTrip({
      trip: make(id), place, itemId: 'catalog-item-' + id, dayDate: date, updatedAt: at
    });
    return recordTripVisit({
      trip: base, visitId: 'visit-' + id, itemId: 'catalog-item-' + id,
      title: place.titleRu, kind: 'museum', dayDate: date, evidence: 'user-confirmed',
      visitedAt: atTime, updatedAt: at
    });
  };
  const activeTrip = makeVisit('one', '2026-10-13T11:00:00.000Z');
  const archivedTrip = makeVisit('two', '2026-10-13T15:00:00.000Z');
  const history = buildMoscowTravelHistory({
    activeTrip, archive: archivePersonalTrip(emptyPersonalTripArchive(), archivedTrip)
  });
  assert.equal(history.visitCount, 2);
  assert.equal(history.knownPlaceCount, 1);
  assert.equal(history.repeatKnownPlaceVisitCount, 1);
  assert.equal(history.unknownIdentityVisitCount, 0);
  assert.ok(history.entries.every((entry) => entry.knownPlaceId === 'catalog:tretyakov-lavrushinsky'));
});

test('same manually entered name does not invent a common place ID', () => {
  const first = visit('first', 'Кафе Пушкинъ', 'food');
  const second = visit('second', 'Кафе Пушкинъ', 'food');
  const history = buildMoscowTravelHistory({
    activeTrip: first, archive: archivePersonalTrip(emptyPersonalTripArchive(), second)
  });
  assert.equal(history.visitCount, 2);
  assert.equal(history.knownPlaceCount, 0);
  assert.equal(history.repeatKnownPlaceVisitCount, 0);
  assert.equal(history.unknownIdentityVisitCount, 2);
});

test('search considers personal notes, trip names and titles without changing originals', () => {
  const active = visit('visit-autumn', 'Кафе', 'food');
  const archived = visit('trip-summer', 'Музей', 'museum');
  const history = buildMoscowTravelHistory({
    activeTrip: active, archive: archivePersonalTrip(emptyPersonalTripArchive(), archived)
  });
  assert.equal(filterMoscowTravelHistory(history, { query: '  КАФЕ  ' }).length, 1);
  assert.equal(filterMoscowTravelHistory(history, { query: 'личное воспоминание' }).length, 2);
  assert.equal(filterMoscowTravelHistory(history, { query: 'visit-autumn' }).length, 1);
  assert.equal(filterMoscowTravelHistory(history, { category: 'ate' }).length, 1);
  assert.equal(filterMoscowTravelHistory(history, { category: 'saw' }).length, 1);
  assert.equal(filterMoscowTravelHistory(history, { category: 'all' }).length, 2);
  assert.equal(history.entries.length, 2);
});

test('date range includes boundary and rejects invalid or reversed dates', () => {
  const history = buildMoscowTravelHistory({ activeTrip: visit('visit-2026', 'Музей', 'museum'),
    archive: emptyPersonalTripArchive() });
  assert.equal(filterMoscowTravelHistory(history, { fromDate: '2026-10-13', toDate: '2026-10-13' }).length, 1);
  assert.equal(filterMoscowTravelHistory(history, { fromDate: '2026-10-14' }).length, 0);
  assert.throws(() => filterMoscowTravelHistory(history, { fromDate: '2026-02-30' }), /Invalid Moscow history/);
  assert.throws(() => filterMoscowTravelHistory(history, { fromDate: '2026-10-14', toDate: '2026-10-13' }), /Invalid Moscow history/);
  assert.throws(() => filterMoscowTravelHistory(history, { toDate: '2026-13-01' }), /Invalid Moscow history/);
});

test('day grouping sorts newest date first and preserves all visit records', () => {
  const current = visit('october', 'Кафе', 'food');
  const earlier = createPersonalTrip({ id:'january',title:'январь',destinationId:'moscow',
    startDate:'2026-01-02',endDate:'2026-01-02',createdAt:'2026-01-02T08:00:00.000Z' });
  const earlierVisited = recordTripVisit({ trip:earlier,visitId:'jan',dayDate:'2026-01-02',
    title:'Музей',kind:'museum',evidence:'user-confirmed',visitedAt:'2026-01-02T11:00:00.000Z',updatedAt:'2026-01-02T11:00:00.000Z' });
  const history = buildMoscowTravelHistory({ activeTrip:current,
    archive:archivePersonalTrip(emptyPersonalTripArchive(),earlierVisited) });
  const days = groupMoscowHistoryByDay(filterMoscowTravelHistory(history, {}));
  assert.deepEqual(days.map((day) => day.dayDate), ['2026-10-13', '2026-01-02']);
  assert.equal(days.reduce((count, day) => count + day.entries.length, 0), 2);
});

test('unrecognized destination IDs cannot certify a known place or merge visits', () => {
  const forged = (id: string) => recordTripVisit({
    trip: make(id), visitId: 'visit-' + id, dayDate: date,
    title: 'Без подтверждённого ID', kind: 'museum',
    destinationNodeId: 'unadmitted-place-not-in-package',
    evidence: 'user-confirmed', visitedAt: at, updatedAt: at
  });
  const history = buildMoscowTravelHistory({
    activeTrip: forged('trip-one'),
    archive: archivePersonalTrip(emptyPersonalTripArchive(), forged('trip-two'))
  });
  assert.equal(history.visitCount, 2);
  assert.equal(history.knownPlaceCount, 0);
  assert.equal(history.unknownIdentityVisitCount, 2);
  assert.ok(history.entries.every((entry) => entry.knownPlaceId === undefined));
});
