import assert from 'node:assert/strict';
import test from 'node:test';

import { moscowVarvarkaDestinationPackage } from '../src/travel/moscowDestinationPackage.ts';
import {
  addManualTripItem,
  createPersonalTrip,
  recordTripVisit,
  syncRouteCompletedVisits
} from '../src/travel/personalTrip.ts';
import {
  buildMoscowPassport,
  passportCategoryForKind,
  resolveVisitKind
} from '../src/travel/moscowPassport.ts';

const at = '2026-10-02T08:00:00.000Z';

function trip() {
  return createPersonalTrip({
    id: 'passport-trip',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    createdAt: at
  });
}

test('semantic categories distinguish where the tourist ate, saw and went out', () => {
  assert.equal(passportCategoryForKind('food'), 'ate');
  assert.equal(passportCategoryForKind('bar'), 'nightlife');
  assert.equal(passportCategoryForKind('museum'), 'saw');
  assert.equal(passportCategoryForKind('heritage'), 'saw');
  assert.equal(passportCategoryForKind('theatre'), 'culture');
  assert.equal(passportCategoryForKind('event'), 'culture');
  assert.equal(passportCategoryForKind('stay'), 'stay');
  assert.equal(passportCategoryForKind('transport'), 'transport');
});

test('manual restaurant visit carries food kind into the passport without changing evidence', () => {
  let value = addManualTripItem({
    trip: trip(),
    itemId: 'dinner',
    dayDate: '2026-10-02',
    title: 'Ужин на Пятницкой',
    kind: 'food',
    updatedAt: at
  });
  value = recordTripVisit({
    trip: value,
    visitId: 'visit-dinner',
    itemId: 'dinner',
    dayDate: '2026-10-02',
    visitedAt: '2026-10-02T18:00:00+03:00',
    title: 'Ужин на Пятницкой',
    kind: 'food',
    evidence: 'user-confirmed',
    updatedAt: '2026-10-02T18:00:00+03:00'
  });

  const passport = buildMoscowPassport({ trip: value });
  assert.equal(passport.categoryCounts.ate, 1);
  assert.equal(passport.evidenceCounts['user-confirmed'], 1);
});

test('route-completed destination visit preserves source-backed node kind', () => {
  const value = syncRouteCompletedVisits({
    trip: trip(),
    pkg: moscowVarvarkaDestinationPackage,
    destinationNodeIds: ['romanov-chambers'],
    dayDate: '2026-10-02',
    at: '2026-10-02T12:00:00+03:00',
    idForNode: (nodeId) => 'visit:' + nodeId
  });

  const passport = buildMoscowPassport({
    trip: value,
    pkg: moscowVarvarkaDestinationPackage
  });
  assert.equal(passport.categoryCounts.saw, 1);
  assert.equal(passport.evidenceCounts['route-completed'], 1);
});

test('legacy v1 visit without kind resolves from its linked plan item', () => {
  let value = addManualTripItem({
    trip: trip(),
    itemId: 'bar',
    dayDate: '2026-10-02',
    title: 'Бар',
    kind: 'bar',
    updatedAt: at
  });

  value = {
    ...value,
    visits: [{
      id: 'legacy',
      itemId: 'bar',
      dayDate: '2026-10-02',
      visitedAt: '2026-10-02T21:00:00+03:00',
      title: 'Бар',
      evidence: 'user-confirmed'
    }]
  };

  assert.equal(resolveVisitKind({ trip: value, visit: value.visits[0]! }), 'bar');
  assert.equal(buildMoscowPassport({ trip: value }).categoryCounts.nightlife, 1);
});

test('legacy destination visit can resolve kind from DestinationPackage node', () => {
  const value = {
    ...trip(),
    visits: [{
      id: 'legacy-node',
      destinationNodeId: 'romanov-chambers',
      dayDate: '2026-10-02',
      visitedAt: '2026-10-02T12:00:00+03:00',
      title: 'Палаты бояр Романовых',
      evidence: 'route-completed' as const
    }]
  };

  assert.equal(
    resolveVisitKind({
      trip: value,
      visit: value.visits[0]!,
      pkg: moscowVarvarkaDestinationPackage
    }),
    'heritage'
  );
});

test('passport groups visits by trip day and totals evidence independently of category', () => {
  let value = addManualTripItem({
    trip: trip(),
    itemId: 'museum',
    dayDate: '2026-10-02',
    title: 'Музей',
    kind: 'museum',
    updatedAt: at
  });
  value = recordTripVisit({
    trip: value,
    visitId: 'museum-visit',
    itemId: 'museum',
    dayDate: '2026-10-02',
    visitedAt: '2026-10-02T11:00:00+03:00',
    title: 'Музей',
    kind: 'museum',
    evidence: 'user-confirmed',
    updatedAt: '2026-10-02T11:00:00+03:00'
  });
  value = addManualTripItem({
    trip: value,
    itemId: 'hotel',
    dayDate: '2026-10-03',
    title: 'Отель',
    kind: 'stay',
    updatedAt: at
  });
  value = recordTripVisit({
    trip: value,
    visitId: 'hotel-visit',
    itemId: 'hotel',
    dayDate: '2026-10-03',
    visitedAt: '2026-10-03T20:00:00+03:00',
    title: 'Отель',
    kind: 'stay',
    evidence: 'provider-receipt',
    evidenceRef: 'provider-receipt:hotel',
    updatedAt: '2026-10-03T20:00:00+03:00'
  });

  const passport = buildMoscowPassport({ trip: value });
  assert.equal(passport.visitedCount, 2);
  assert.equal(passport.daysVisited, 2);
  assert.equal(passport.categoryCounts.saw, 1);
  assert.equal(passport.categoryCounts.stay, 1);
  assert.equal(passport.evidenceCounts['user-confirmed'], 1);
  assert.equal(passport.evidenceCounts['provider-receipt'], 1);
  assert.deepEqual(passport.days.map((day) => day.dayDate), ['2026-10-02', '2026-10-03']);
});
