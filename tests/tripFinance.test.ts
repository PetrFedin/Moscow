import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addManualTripItem,
  createPersonalTrip,
  parsePersonalTrip,
  type PersonalTrip
} from '../src/travel/personalTrip.ts';
import {
  assessTripFinances,
  formatTripMoneyMinor,
  parseTripMoneyInput,
  removeTripFinanceEntry,
  setTripFinanceBudget,
  tripMoneyInputValue,
  upsertTripFinanceEntry,
  type TripFinanceEntry
} from '../src/travel/tripFinance.ts';

const at = '2026-10-22T08:00:00.000Z';
const update = '2026-10-22T09:00:00.000Z';
const day = '2026-10-23';
const day2 = '2026-10-24';

function trip() {
  return createPersonalTrip({
    id: 'financial-journey', destinationId: 'moscow', title: 'Личная поездка',
    startDate: day, endDate: day2, createdAt: at
  });
}

function expense(id: string, overrides: Partial<TripFinanceEntry> = {}): TripFinanceEntry {
  return {
    id,
    dayDate: day,
    title: id,
    category: 'tickets',
    source: 'traveler-entered',
    createdAt: at,
    updatedAt: update,
    estimateMinor: 200_000,
    ...overrides
  };
}
function add(input: PersonalTrip, record: TripFinanceEntry) {
  return upsertTripFinanceEntry({ trip: input, entry: record, updatedAt: update });
}

test('old local trips remain schema-compatible and empty budget has no fictitious expense', () => {
  const original = trip();
  const parsed = parsePersonalTrip(JSON.stringify(original));
  assert.deepEqual(parsed, original);
  const report = assessTripFinances(parsed);
  assert.equal(report.entriesCount, 0);
  assert.equal(report.projectedMinor, 0);
  assert.equal(report.actualMinor, 0);
  assert.equal(report.budgetMinor, undefined);
  assert.equal(report.projectedBudgetRemainingMinor, undefined);
  assert.equal(report.overBudget, false);
});

test('RUB input supports kopecks and rejects silently rounded or ambiguous amounts', () => {
  assert.equal(parseTripMoneyInput('1 250,50'), 125_050);
  assert.equal(parseTripMoneyInput('0,01'), 1);
  assert.equal(parseTripMoneyInput('0'), 0);
  assert.equal(parseTripMoneyInput('  '), undefined);
  assert.equal(tripMoneyInputValue(125_050), '1250,50');
  assert.match(formatTripMoneyMinor(-1, 'ru'), /−0,01 ₽/);
  for (const unsafe of ['-100', '1.999', '1,234,50', '1e9', 'NaN', '1_500']) {
    assert.throws(() => parseTripMoneyInput(unsafe), /amount|integer/i, unsafe);
  }
});

test('the forecast REPLACES estimate with traveler actual and reports only paired variance', () => {
  let result = trip();
  result = setTripFinanceBudget({ trip: result, budgetMinor: 600_000, updatedAt: update });
  result = add(result, expense('museum', { estimateMinor: 200_000, actualMinor: 150_050 }));
  result = add(result, expense('dinner', { category: 'food', estimateMinor: 300_000 }));
  const beforeRead = JSON.stringify(result);
  const report = assessTripFinances(result);
  assert.equal(report.estimatedMinor, 500_000);
  assert.equal(report.actualMinor, 150_050);
  assert.equal(report.outstandingEstimatesMinor, 300_000);
  assert.equal(report.projectedMinor, 450_050);
  assert.equal(report.recordedVarianceMinor, -49_950);
  assert.equal(report.projectedBudgetRemainingMinor, 149_950);
  assert.equal(report.overBudget, false);
  assert.deepEqual(report.byCategory.map(c => [c.category, c.projectedMinor]), [
    ['tickets', 150_050], ['food', 300_000]
  ]);
  assert.equal(JSON.stringify(result), beforeRead, 'aggregations are read-only');
  assert.deepEqual(parsePersonalTrip(JSON.stringify(result)), result);
});

test('day scope never allocates entire-trip budget to one day', () => {
  let result = add(trip(), expense('day-one', { actualMinor: 110_000 }));
  result = add(result, expense('day-two', {
    dayDate: day2, actualMinor: 90_000, estimateMinor: undefined
  }));
  result = setTripFinanceBudget({ trip: result, budgetMinor: 170_000, updatedAt: update });
  const first = assessTripFinances(result, day);
  const second = assessTripFinances(result, day2);
  assert.equal(first.projectedMinor, 110_000);
  assert.equal(second.projectedMinor, 90_000);
  assert.equal(first.budgetMinor, undefined);
  assert.equal(second.budgetMinor, undefined);
  assert.equal(assessTripFinances(result).projectedBudgetRemainingMinor, -30_000);
  assert.equal(assessTripFinances(result).overBudget, true);
  assert.throws(() => assessTripFinances(result, '2026-10-25'), /belong/);
});

test('editing amounts is copy-on-write, preserves first createdAt and permits zero actual', () => {
  const initial = add(trip(), expense('museum'));
  const snapshot = JSON.stringify(initial);
  const edited = add(initial, expense('museum', {
    updatedAt: '2026-10-22T11:00:00.000Z', actualMinor: 0
  }));
  assert.equal(initial.finance?.entries[0]?.actualMinor, undefined);
  assert.equal(JSON.stringify(initial), snapshot);
  assert.equal(edited.finance?.entries[0]?.actualMinor, 0);
  assert.equal(assessTripFinances(edited).projectedMinor, 0);
  assert.throws(() => add(initial, expense('museum', { createdAt: '2026-10-01T00:00:00Z' })),
    /immutable/);
  assert.deepEqual(parsePersonalTrip(JSON.stringify(edited)), edited);
});

test('links are coverage only; they cannot be used as supplier payment proof', () => {
  const base = addManualTripItem({
    trip: trip(), itemId: 'theatre-stop', dayDate: day,
    title: 'Театр', kind: 'theatre', updatedAt: update,
    commitment: { kind: 'ticket', status: 'confirmed', verification: 'user-declared' }
  });
  const linked = add(base, expense('theatre-bill', { itemId: 'theatre-stop', actualMinor: 250_000 }));
  const report = assessTripFinances(linked);
  assert.equal(report.activeStopCount, 1);
  assert.equal(report.coveredStopCount, 1);
  assert.equal(linked.items[0]?.commitment?.verification, 'user-declared');
  assert.equal(linked.items[0]?.commitment?.receiptEvidenceRef, undefined);
  assert.throws(() => add(base, expense('unknown-link', { itemId: 'unrecognized-stop' })),
    /unknown itinerary stop/);

  // Deleting an itinerary stop must not erase old traveler spending records.
  const deletedStop = { ...linked, items: [] };
  assert.equal(parsePersonalTrip(JSON.stringify(deletedStop)).finance?.entries[0]?.itemId, 'theatre-stop');
  assert.equal(assessTripFinances(deletedStop).coveredStopCount, 0);
  assert.equal(assessTripFinances(deletedStop).actualMinor, 250_000);
});

test('finance identity, source, chronology, currency and amounts fail closed on corrupt storage', () => {
  const original = add(trip(), expense('valid'));
  const originalJSON = JSON.stringify(original);
  const invalid = [
    { ...original, finance: { ...original.finance!, currency: 'USD' } },
    { ...original, finance: { ...original.finance!, entries: [...original.finance!.entries, original.finance!.entries[0]] } },
    { ...original, finance: { ...original.finance!, entries: [{ ...original.finance!.entries[0], actualMinor: -1 }] } },
    { ...original, finance: { ...original.finance!, entries: [{ ...original.finance!.entries[0], source: 'provider-confirmed' }] } },
    { ...original, finance: { ...original.finance!, entries: [{ ...original.finance!.entries[0], dayDate: '2026-10-25' }] } },
    { ...original, finance: { ...original.finance!, entries: [{ ...original.finance!.entries[0], estimateMinor: undefined, actualMinor: undefined }] } },
    { ...original, finance: { ...original.finance!, entries: [{ ...original.finance!.entries[0], title: '' }] } },
    { ...original, finance: { ...original.finance!, entries: [{ ...original.finance!.entries[0], actualMinor: 1.5 }] } }
  ];
  for (const candidate of invalid) {
    assert.throws(() => parsePersonalTrip(JSON.stringify(candidate)), /Finance|amount|integer|date|expense/i);
  }
  assert.equal(JSON.stringify(original), originalJSON);
});

test('finance deletes only selected row, and budget can be explicitly cleared', () => {
  let result = add(trip(), expense('a'));
  result = add(result, expense('b', { category: 'food' }));
  assert.throws(() => removeTripFinanceEntry({
    trip: result, entryId: 'missing', updatedAt: update
  }), /not found/);
  result = removeTripFinanceEntry({
    trip: result, entryId: 'a', updatedAt: update
  });
  assert.deepEqual(result.finance?.entries.map(e => e.id), ['b']);
  result = setTripFinanceBudget({ trip: result, budgetMinor: 100_000, updatedAt: update });
  assert.equal(result.finance?.budgetMinor, 100_000);
  result = setTripFinanceBudget({ trip: result, updatedAt: update });
  assert.equal(result.finance?.budgetMinor, undefined);
  assert.deepEqual(parsePersonalTrip(JSON.stringify(result)), result);
});
