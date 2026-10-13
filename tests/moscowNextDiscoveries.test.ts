import assert from 'node:assert/strict';
import test from 'node:test';
import { curatedMoscowPlaces } from '../src/travel/curatedMoscowPlaces.ts';
import { moscowVarvarkaDestinationPackage } from '../src/travel/moscowDestinationPackage.ts';
import { buildMoscowTravelHistory } from '../src/travel/moscowTravelHistory.ts';
import { buildMoscowNextDiscoveries } from '../src/travel/moscowNextDiscoveries.ts';
import {
  addCuratedMoscowPlaceToTrip,
  addManualTripItem,
  createPersonalTrip,
  getUnseenDestinationNodes,
  recordTripVisit
} from '../src/travel/personalTrip.ts';
import { archivePersonalTrip, emptyPersonalTripArchive } from '../src/travel/personalTripArchive.ts';

const at = '2026-10-13T09:00:00.000Z';
function trip(id: string, dayDate = '2026-10-13', endDate = dayDate) {
  return createPersonalTrip({
    id, destinationId: 'moscow', title: id,
    startDate: dayDate, endDate, createdAt: at
  });
}
function place(id: string) {
  const item = curatedMoscowPlaces.find((candidate) => candidate.id === id);
  assert.ok(item, 'Curated place must be present: ' + id);
  return item;
}
function addPlace(t: ReturnType<typeof trip>, id: string, dayDate: string) {
  return addCuratedMoscowPlaceToTrip({
    trip: t, place: place(id), dayDate,
    itemId: 'item-' + id, updatedAt: at
  });
}
function recordVisit(t: ReturnType<typeof trip>, id: string, dayDate: string) {
  const itemId = 'item-' + id;
  return recordTripVisit({
    trip: t, visitId: 'visit-' + id, itemId, dayDate,
    kind: 'museum', title: place(id).titleRu,
    evidence: 'user-confirmed',
    visitedAt: dayDate + 'T12:00:00+03:00',
    updatedAt: at
  });
}

test('source-backed suggestions exclude archived known visits and entire active plan', () => {
  const past = recordVisit(
    addPlace(trip('past', '2026-06-05'), 'tretyakov-lavrushinsky', '2026-06-05'),
    'tretyakov-lavrushinsky', '2026-06-05'
  );
  const current = addPlace(trip('current', '2026-10-13', '2026-10-14'), 'gorky-park', '2026-10-13');
  const archive = archivePersonalTrip(emptyPersonalTripArchive(), past);
  const result = buildMoscowNextDiscoveries({
    activeTrip: current, archive, dayDate: '2026-10-14', limit: 20
  });
  const ids = result.suggestions.map(item => item.place.id);
  assert.ok(!ids.includes('tretyakov-lavrushinsky'));
  assert.ok(!ids.includes('gorky-park'));
  assert.equal(result.hiddenAsVisited, 1);
  assert.equal(result.hiddenAsPlanned, 1);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(result.suggestions.every(item => item.place.evidenceStatus === 'official-source-directory'));
  assert.ok(result.suggestions.every(item => item.place.officialUrl.startsWith('https://')));
});

test('manual same-title visit without canonical catalog identity does not exclude a real place', () => {
  const current = addManualTripItem({
    trip: trip('current'),
    itemId: 'my-cafe', dayDate: '2026-10-13', title: 'Кафе Пушкинъ',
    kind: 'food', updatedAt: at
  });
  const visited = recordTripVisit({
    trip: current, visitId: 'manual-visit', itemId: 'my-cafe',
    dayDate: '2026-10-13', title: 'Кафе Пушкинъ',
    evidence: 'user-confirmed', kind: 'food',
    visitedAt: at, updatedAt: at
  });
  const result = buildMoscowNextDiscoveries({
    activeTrip: visited, archive: emptyPersonalTripArchive(),
    dayDate: '2026-10-13', interest: 'food'
  });
  assert.ok(result.suggestions.some(item => item.place.id === 'cafe-pushkin-tverskoy'));
  assert.equal(result.unknownIdentityVisits, 1);
  assert.equal(result.suggestions[0]?.reason, 'similar-history-category');
});

test('recommendation categories are user-selectable and do not invent preference', () => {
  const current = trip('current');
  const archive = emptyPersonalTripArchive();
  const food = buildMoscowNextDiscoveries({ activeTrip: current, archive,
    dayDate: '2026-10-13', interest: 'food' });
  const culture = buildMoscowNextDiscoveries({ activeTrip: current, archive,
    dayDate: '2026-10-13', interest: 'culture' });
  const parks = buildMoscowNextDiscoveries({ activeTrip: current, archive,
    dayDate: '2026-10-13', interest: 'parks' });
  assert.ok(food.suggestions.length > 0 && food.suggestions.every(item => item.interest === 'food'));
  assert.ok(culture.suggestions.length > 0 && culture.suggestions.every(item => item.interest === 'culture'));
  assert.ok(parks.suggestions.length > 0 && parks.suggestions.every(item => item.interest === 'parks'));
  assert.ok(food.suggestions.every(item => item.reason === 'another-category'));
  const all = buildMoscowNextDiscoveries({ activeTrip: current, archive, dayDate: '2026-10-13' });
  assert.equal(new Set(all.suggestions.map(item => item.interest)).size, 3);
});

test('adding a suggestion updates itinerary only; candidate disappears without creating a booking', () => {
  const current = trip('current');
  const archive = emptyPersonalTripArchive();
  const before = buildMoscowNextDiscoveries({
    activeTrip: current, archive, dayDate: '2026-10-13'
  });
  const candidate = before.suggestions[0]!;
  const next = addCuratedMoscowPlaceToTrip({
    trip: current, place: candidate.place, itemId: 'added-from-discovery',
    dayDate: '2026-10-13', updatedAt: at
  });
  assert.equal(next.items[0]?.catalogPlaceId, candidate.place.id);
  assert.equal(next.items[0]?.commitment, undefined);
  assert.equal(next.items[0]?.plannedStartAt, undefined);
  assert.equal(current.items.length, 0);
  const after = buildMoscowNextDiscoveries({
    activeTrip: next, archive, dayDate: '2026-10-13', limit: 20
  });
  assert.ok(after.suggestions.every(item => item.place.id !== candidate.place.id));
});

test('invalid trip day, interest or limit fails closed and never mutates input', () => {
  const current = trip('current');
  const archive = emptyPersonalTripArchive();
  assert.throws(() => buildMoscowNextDiscoveries({
    activeTrip: current, archive, dayDate: '2026-10-14'
  }), /Discovery day/);
  assert.throws(() => buildMoscowNextDiscoveries({
    activeTrip: current, archive, dayDate: '2026-10-13', limit: 21
  }), /limit/);
  assert.throws(() => buildMoscowNextDiscoveries({
    activeTrip: current, archive, dayDate: '2026-10-13',
    interest: 'invalid' as 'all'
  }), /Unsupported/);
  assert.equal(current.items.length, 0);
  assert.equal(archive.trips.length, 0);
});


test('historical canonical visit stays excluded from the Today heritage next-stop rail', () => {
  const past = recordTripVisit({
    trip: trip('past-varvarka', '2026-06-05'),
    visitId: 'visited-romanov', dayDate: '2026-06-05',
    title: 'Палаты бояр Романовых', kind: 'heritage',
    destinationNodeId: 'romanov-chambers',
    evidence: 'user-confirmed', visitedAt: '2026-06-05T12:00:00+03:00',
    updatedAt: at
  });
  const current = trip('autumn-moscow');
  const archive = archivePersonalTrip(emptyPersonalTripArchive(), past);
  const history = buildMoscowTravelHistory({ activeTrip: current, archive });
  const visitedIds = history.entries.flatMap((entry) => entry.knownPlaceId?.startsWith('destination:')
    ? [entry.knownPlaceId.slice('destination:'.length)] : []);
  const newStops = getUnseenDestinationNodes({
    pkg: moscowVarvarkaDestinationPackage,
    trip: current,
    visitedDestinationNodeIds: visitedIds
  });
  assert.ok(visitedIds.includes('romanov-chambers'));
  assert.ok(!newStops.some((node) => node.id === 'romanov-chambers'));
});
