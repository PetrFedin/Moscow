import assert from 'node:assert/strict';
import test from 'node:test';

import { createPersonalTrip, parsePersonalTrip, recordTripVisit } from '../src/travel/personalTrip.ts';
import {
  archivePersonalTrip, archiveWithoutPersonalTrip, emptyPersonalTripArchive
} from '../src/travel/personalTripArchive.ts';
import { buildMoscowTravelHistory } from '../src/travel/moscowTravelHistory.ts';
import { buildMoscowFinanceHistory } from '../src/travel/moscowFinanceHistory.ts';
import {
  assessTripFinances, setTripFinanceBudget, upsertTripFinanceEntry,
  type TripFinanceEntry
} from '../src/travel/tripFinance.ts';

const time = '2026-10-23T09:00:00.000Z';
const day = '2026-10-23';

function trip(id: string) {
  return createPersonalTrip({
    id, destinationId: 'moscow', title: id,
    startDate: day, endDate: day, createdAt: time
  });
}
function expense(
  id: string, extra: Partial<TripFinanceEntry> = {}
): TripFinanceEntry {
  return {
    id,
    title: id,
    dayDate: day,
    category: 'food',
    estimateMinor: 90_000,
    createdAt: time,
    updatedAt: time,
    source: 'traveler-entered',
    ...extra
  };
}
function add(
  base: ReturnType<typeof trip>,
  entry: TripFinanceEntry
) {
  return upsertTripFinanceEntry({ trip: base, entry, updatedAt: time });
}

test('finance history separates two different journeys on the SAME day, without fabricating visits', () => {
  let first = add(trip('one'), expense('lunch', { estimateMinor: 150_000, actualMinor: 125_050 }));
  const second = add(trip('two'), expense('dinner', { estimateMinor: 180_000 }));
  first = setTripFinanceBudget({ trip: first, budgetMinor: 250_000, updatedAt: time });
  const archive = archivePersonalTrip(emptyPersonalTripArchive(), second);
  const before = JSON.stringify({ first, archive });
  const history = buildMoscowFinanceHistory({ activeTrip: first, archive });
  assert.equal(history.tripCount, 2);
  assert.equal(history.tripsWithExpenses, 2);
  assert.equal(history.entriesCount, 2);
  assert.equal(history.actualEntriesCount, 1);
  assert.equal(history.actualMinor, 125_050);
  assert.equal(history.estimatedMinor, 330_000);
  assert.equal(history.outstandingEstimatesMinor, 180_000);
  assert.equal(history.projectedMinor, 305_050);
  assert.equal(history.days.length, 2);
  assert.equal(history.days[0]?.dayDate, history.days[1]?.dayDate);
  assert.notEqual(history.days[0]?.key, history.days[1]?.key);
  assert.deepEqual(new Set(history.days.map(d => d.tripId)), new Set(['one', 'two']));
  assert.equal(buildMoscowTravelHistory({ activeTrip: first, archive }).visitCount, 0);
  assert.equal(JSON.stringify({ first, archive }), before, 'projection does not mutate stored records');
});

test('active finance snapshot overrides its obsolete archival copy rather than doubling expense', () => {
  const outdated = add(trip('autumn'), expense('outdated', { estimateMinor: 100_000 }));
  const archive = archivePersonalTrip(emptyPersonalTripArchive(), outdated);
  const actual = add(trip('autumn'), expense('new', { actualMinor: 270_000 }));
  const result = buildMoscowFinanceHistory({ activeTrip: actual, archive });
  assert.equal(result.tripCount, 1);
  assert.equal(result.entriesCount, 1);
  assert.equal(result.actualMinor, 270_000);
  assert.equal(result.projectedMinor, 270_000);
  assert.equal(result.days[0]?.entries[0]?.id, 'new');
  assert.equal(result.days.some(day => day.entries.some(e => e.id === 'outdated')), false);
});

test('finance history preserves recorded ZERO versus no actual and does not mistake estimate for spent', () => {
  let value = add(trip('zero'), expense('free-entry', { estimateMinor: 500_00, actualMinor: 0 }));
  value = add(value, expense('planned-only', { estimateMinor: 350_00 }));
  const result = buildMoscowFinanceHistory({ activeTrip: value, archive: emptyPersonalTripArchive() });
  assert.equal(result.actualEntriesCount, 1);
  assert.equal(result.actualMinor, 0);
  assert.equal(result.projectedMinor, 35_000);
  assert.equal(result.outstandingEstimatesMinor, 35_000);
  assert.deepEqual(result.days[0]?.entries.map(e => e.id), ['free-entry', 'planned-only']);
  assert.equal(assessTripFinances(value).recordedVarianceMinor, -50_000);
});

test('deleting one archive journey removes only its finances and preserves active visit truth', () => {
  const base = trip('visiting');
  const active = recordTripVisit({
    trip: base, visitId: 'visit-one', dayDate: day,
    title: 'Личный музей', kind: 'museum',
    visitedAt: time, updatedAt: time, evidence: 'user-confirmed'
  });
  const archived = add(trip('retired'), expense('retired-ticket', { actualMinor: 400_000 }));
  const archive = archivePersonalTrip(emptyPersonalTripArchive(), archived);
  const without = archiveWithoutPersonalTrip(archive, 'retired');
  assert.equal(buildMoscowFinanceHistory({ activeTrip: active, archive: without }).entriesCount, 0);
  assert.equal(buildMoscowTravelHistory({ activeTrip: active, archive: without }).visitCount, 1);
});

test('projector rejects corrupted saved finance rather than dropping it or attributing it to another trip', () => {
  const old = add(trip('safe'), expense('valid'));
  const archive = emptyPersonalTripArchive();
  const tampered = {
    ...old,
    finance: {
      currency: 'USD',
      entries: old.finance!.entries
    }
  };
  assert.throws(() => parsePersonalTrip(JSON.stringify(tampered)), /Finance/);
  assert.throws(() => buildMoscowFinanceHistory({
    activeTrip: tampered as unknown as typeof old, archive
  }), /Finance/);
  assert.equal(buildMoscowFinanceHistory({ activeTrip: old, archive }).entriesCount, 1);
});

test('history arithmetic derives both expense and visit facets from one saved trip without cross-contamination', () => {
  let source = add(trip('historical'), expense('ticket', {
    estimateMinor: 200_000, actualMinor: 150_050
  }));
  source = recordTripVisit({
    trip: source, visitId: 'visited-theatre', dayDate: day, title: 'Вечерний театр',
    kind: 'theatre', evidence: 'user-confirmed', visitedAt: time, updatedAt: time
  });
  const finance = buildMoscowFinanceHistory({ activeTrip: source, archive: emptyPersonalTripArchive() });
  const visits = buildMoscowTravelHistory({ activeTrip: source, archive: emptyPersonalTripArchive() });
  assert.equal(finance.projectedMinor, 150_050);
  assert.equal(finance.actualMinor, 150_050);
  assert.equal(visits.visitCount, 1);
  assert.equal(finance.entriesCount, 1);
  assert.equal(source.visits[0]?.evidence, 'user-confirmed');
  assert.equal(source.finance?.entries[0]?.source, 'traveler-entered');
});
