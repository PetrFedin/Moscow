import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addManualTripItem,
  createPersonalTrip,
  recordTripVisit,
  updateTripVisitNote
} from '../src/travel/personalTrip.ts';
import { assessTripFinances, upsertTripFinanceEntry, type TripFinanceEntry } from '../src/travel/tripFinance.ts';
import {
  archivePersonalTrip,
  archiveWithoutPersonalTrip,
  archivedPersonalTrip,
  emptyPersonalTripArchive
} from '../src/travel/personalTripArchive.ts';
import {
  PERSONAL_TRIP_ACTIVE_STORAGE_KEY as ACTIVE,
  PERSONAL_TRIP_TRANSACTION_STORAGE_KEY as JOURNAL,
  readRecoveredTripStorage,
  transactTripStorage,
  type TripStorageAdapter,
  type TripStorageState
} from '../src/travel/personalTripTransaction.ts';

const ARCHIVE = 'moscow:v1:personal-trip-archive';
const at = '2026-10-13T10:00:00.000Z';

function base(id: string) {
  return createPersonalTrip({
    id, destinationId: 'moscow', title: id,
    startDate: '2026-10-13', endDate: '2026-10-13', createdAt: at
  });
}

function historicalJourney() {
  const ticket = addManualTripItem({
    trip: base('autumn'), itemId: 'theatre-ticket', dayDate: '2026-10-13',
    title: 'Большой театр', kind: 'theatre', updatedAt: at,
    commitment: {
      kind: 'ticket', status: 'confirmed', verification: 'user-declared',
      reference: 'CUSTOMER-ORDER-42'
    }
  });
  const visited = recordTripVisit({
    trip: ticket, visitId: 'visited-theatre', itemId: 'theatre-ticket',
    dayDate: '2026-10-13', visitedAt: at, title: 'Большой театр',
    kind: 'theatre', evidence: 'user-confirmed', updatedAt: at
  });
  return updateTripVisitNote({
    trip: visited, visitId: 'visited-theatre', updatedAt: at,
    note: 'Билет был куплен заранее'
  });
}

type Fault = {
  key: string;
  operation: 'set' | 'remove';
  when: 'before' | 'after';
};

class MemoryTripStorage implements TripStorageAdapter {
  readonly data = new Map<string, string>();
  fault: Fault | null = null;
  calls = 0;

  async getItem(key: string) { return this.data.get(key) ?? null; }

  async setItem(key: string, value: string) {
    this.maybeFail(key, 'set', 'before');
    this.data.set(key, value);
    this.maybeFail(key, 'set', 'after');
  }

  async removeItem(key: string) {
    this.maybeFail(key, 'remove', 'before');
    this.data.delete(key);
    this.maybeFail(key, 'remove', 'after');
  }

  private maybeFail(key: string, operation: Fault['operation'], when: Fault['when']) {
    this.calls++;
    if (!this.fault || this.fault.key !== key
      || this.fault.operation !== operation || this.fault.when !== when) return;
    this.fault = null;
    throw new Error('Injected storage crash: ' + key);
  }
}

function seeded() {
  const storage = new MemoryTripStorage();
  const active = historicalJourney();
  const old = archivePersonalTrip(emptyPersonalTripArchive(), base('summer'));
  storage.data.set(ACTIVE, JSON.stringify(active));
  storage.data.set(ARCHIVE, JSON.stringify(old));
  return { storage, active, old };
}

function archiveOperation(storage: MemoryTripStorage, active: ReturnType<typeof historicalJourney>) {
  return transactTripStorage({
    storage, expectedActiveTrip: active, operation: 'archive' as const, id: 'archive-test',
    transform: ({ activeTrip, archive }: TripStorageState) => {
      assert.ok(activeTrip);
      return { activeTrip: null, archive: archivePersonalTrip(archive, activeTrip), result: activeTrip.id };
    }
  });
}

test('journaled archive commits, verifies read-back and retains ticket and private visit note', async () => {
  const { storage, active } = seeded();
  const outcome = await archiveOperation(storage, active);
  assert.equal(outcome.changed, true);
  assert.equal(outcome.result, 'autumn');
  assert.equal(await storage.getItem(ACTIVE), null);
  assert.equal(await storage.getItem(JOURNAL), null);
  const saved = archivedPersonalTrip(outcome.archive, 'autumn');
  assert.equal(saved?.items[0]?.commitment?.reference, 'CUSTOMER-ORDER-42');
  assert.equal(saved?.items[0]?.commitment?.verification, 'user-declared');
  assert.equal(saved?.visits[0]?.note, 'Билет был куплен заранее');
  const loaded = await readRecoveredTripStorage(storage);
  assert.equal(loaded.recovered, false);
  assert.equal(loaded.archive.trips.length, 2);
});

for (const fault of [
  { key: ARCHIVE, operation: 'set', when: 'before' },
  { key: ARCHIVE, operation: 'set', when: 'after' },
  { key: ACTIVE, operation: 'remove', when: 'before' },
  { key: ACTIVE, operation: 'remove', when: 'after' },
  { key: JOURNAL, operation: 'remove', when: 'before' },
  { key: JOURNAL, operation: 'remove', when: 'after' }
] as const) {
  test('recovery completes interrupted archive ' + fault.key + '/' + fault.operation + '/' + fault.when, async () => {
    const { storage, active } = seeded();
    storage.fault = fault;
    await assert.rejects(archiveOperation(storage, active), /Injected storage crash/);
    const alreadyClean = fault.key === JOURNAL && fault.operation === 'remove' && fault.when === 'after';
    if (alreadyClean) assert.equal(await storage.getItem(JOURNAL), null);
    else assert.ok(await storage.getItem(JOURNAL));
    const recovered = await readRecoveredTripStorage(storage);
    assert.equal(recovered.recovered, !alreadyClean);
    assert.equal(recovered.activeTrip, null);
    assert.equal(recovered.archive.trips.length, 2);
    assert.equal(archivedPersonalTrip(recovered.archive, 'autumn')?.visits[0]?.note,
      'Билет был куплен заранее');
    assert.equal(await storage.getItem(JOURNAL), null);
    assert.equal((await readRecoveredTripStorage(storage)).recovered, false);
  });
}

test('failed journal write leaves original active and archive unchanged', async () => {
  const { storage, active } = seeded();
  const archiveBefore = await storage.getItem(ARCHIVE);
  storage.fault = { key: JOURNAL, operation: 'set', when: 'before' };
  await assert.rejects(archiveOperation(storage, active), /Injected/);
  assert.equal(await storage.getItem(ACTIVE), JSON.stringify(active));
  assert.equal(await storage.getItem(ARCHIVE), archiveBefore);
  assert.equal(await storage.getItem(JOURNAL), null);
});

test('an interrupted switch activates a previous trip only after recoverable archive write', async () => {
  const { storage, active } = seeded();
  storage.fault = { key: ACTIVE, operation: 'set', when: 'before' };
  await assert.rejects(transactTripStorage({
    storage, operation: 'switch', id: 'select-summer', expectedActiveTrip: active,
    transform: ({ activeTrip, archive }) => ({
      activeTrip: archivedPersonalTrip(archive, 'summer')!,
      archive: archivePersonalTrip(archive, activeTrip!),
      result: 'summer'
    })
  }), /Injected/);
  const restored = await readRecoveredTripStorage(storage);
  assert.equal(restored.activeTrip?.id, 'summer');
  assert.equal(archivedPersonalTrip(restored.archive, 'autumn')?.items[0]?.commitment?.reference,
    'CUSTOMER-ORDER-42');
});

test('import transaction never overwrites an active trip, including interrupted archive write', async () => {
  const { storage, active } = seeded();
  const imported = base('imported');
  storage.fault = { key: ARCHIVE, operation: 'set', when: 'after' };
  await assert.rejects(transactTripStorage({
    storage, expectedActiveTrip: active, id: 'import-1', operation: 'import',
    transform: ({ activeTrip, archive }) => ({
      activeTrip, archive: archivePersonalTrip(archive, imported), result: 1
    })
  }), /Injected/);
  const recovered = await readRecoveredTripStorage(storage);
  assert.deepEqual(recovered.activeTrip, active);
  assert.ok(archivedPersonalTrip(recovered.archive, 'imported'));
  assert.equal(await storage.getItem(JOURNAL), null);
});

test('foreign edits while the journal is pending block recovery without clobbering any key', async () => {
  const { storage, active } = seeded();
  storage.fault = { key: ACTIVE, operation: 'remove', when: 'before' };
  await assert.rejects(archiveOperation(storage, active), /Injected/);
  const external = JSON.stringify(archivePersonalTrip(emptyPersonalTripArchive(), base('from-another-tab')));
  storage.data.set(ARCHIVE, external);
  await assert.rejects(readRecoveredTripStorage(storage), /recovery conflict: archive/);
  assert.equal(await storage.getItem(ARCHIVE), external);
  assert.equal(await storage.getItem(ACTIVE), JSON.stringify(active));
  assert.ok(await storage.getItem(JOURNAL));
});

test('corrupt journal fails closed; never reset or silently discard the active trip', async () => {
  const { storage, active } = seeded();
  storage.data.set(JOURNAL, '{not json');
  await assert.rejects(readRecoveredTripStorage(storage));
  assert.equal(await storage.getItem(ACTIVE), JSON.stringify(active));
  assert.ok(await storage.getItem(JOURNAL));
});

test('stale in-memory active snapshot cannot switch and overwrite more recent saved changes', async () => {
  const { storage, active } = seeded();
  const newer = { ...active, title: 'Новое сохранённое название' };
  storage.data.set(ACTIVE, JSON.stringify(newer));
  await assert.rejects(archiveOperation(storage, active), /changed or is not durably saved/);
  assert.equal((await readRecoveredTripStorage(storage)).activeTrip?.title, newer.title);
  assert.equal(await storage.getItem(JOURNAL), null);
});

test('concurrent archive-only imports serialize and do not lose unrelated trip IDs', async () => {
  const { storage, active } = seeded();
  const commit = (id: string) => transactTripStorage({
    storage, id, operation: 'import' as const, expectedActiveTrip: active,
    transform: ({ activeTrip, archive }: TripStorageState) => ({
      activeTrip, archive: archivePersonalTrip(archive, base(id)), result: id
    })
  });
  const results = await Promise.all([commit('first-import'), commit('second-import')]);
  assert.equal(results.every((result) => result.changed), true);
  const recovered = await readRecoveredTripStorage(storage);
  assert.deepEqual(recovered.archive.trips.map(t => t.id).sort(),
    ['first-import', 'second-import', 'summer']);
  assert.equal(recovered.activeTrip?.id, 'autumn');
  assert.equal(await storage.getItem(JOURNAL), null);
});


test('archive-only import never rewrites an unchanged active trip', async () => {
  const { storage, active } = seeded();
  storage.fault = { key: ACTIVE, operation: 'set', when: 'before' };
  const result = await transactTripStorage({
    storage, expectedActiveTrip: active, operation: 'import', id: 'no-active-touch',
    transform: ({ activeTrip, archive }) => ({
      activeTrip,
      archive: archivePersonalTrip(archive, base('extra')),
      result: true
    })
  });
  assert.equal(result.changed, true);
  assert.deepEqual(result.activeTrip, active);
  assert.ok(archivedPersonalTrip(result.archive, 'extra'));
  assert.equal(storage.fault?.key, ACTIVE, 'Active write fault must remain unused');
});



test('journaled edit rejects a stale concurrent revision instead of erasing updated user notes', async () => {
  const { storage, active } = seeded();
  const firstEdit = { ...active, title: 'Новая редакция маршрута',
    updatedAt: '2026-10-13T10:01:00.000Z' };
  const result = await transactTripStorage({
    storage, operation: 'edit', id: 'edit:first', expectedActiveTrip: active,
    transform: ({ archive }) => ({ activeTrip: firstEdit, archive, result: true })
  });
  assert.equal(result.activeTrip?.title, firstEdit.title);
  await assert.rejects(transactTripStorage({
    storage, operation: 'edit', id: 'edit:stale', expectedActiveTrip: active,
    transform: ({ archive }) => ({
      activeTrip: { ...active, title: 'Устаревшая редакция', updatedAt: '2026-10-13T10:02:00.000Z' },
      archive,
      result: true
    })
  }), /changed or is not durably saved/);
  assert.equal((await readRecoveredTripStorage(storage)).activeTrip?.title, firstEdit.title);
  assert.equal(await storage.getItem(JOURNAL), null);
});

test('interrupted journaled active edit recovers user visit notes without editing archive', async () => {
  const { storage, active, old } = seeded();
  const updated = { ...active, title: 'После исправления', updatedAt: '2026-10-13T10:03:00.000Z' };
  storage.fault = { key: ACTIVE, operation: 'set', when: 'after' };
  await assert.rejects(transactTripStorage({
    storage, operation: 'edit', id: 'edit:interrupt',
    expectedActiveTrip: active,
    transform: ({ archive }) => ({ activeTrip: updated, archive, result: true })
  }), /Injected storage crash/);
  const replayed = await readRecoveredTripStorage(storage);
  assert.equal(replayed.recovered, true);
  assert.equal(replayed.activeTrip?.title, updated.title);
  assert.equal(replayed.activeTrip?.visits[0]?.note, 'Билет был куплен заранее');
  assert.deepEqual(replayed.archive, old);
  assert.equal(await storage.getItem(JOURNAL), null);
});

test('creating a trip is refused if another tab has already created an active one', async () => {
  const { storage, active } = seeded();
  await assert.rejects(transactTripStorage({
    storage, operation: 'edit', id: 'create:wrong',
    expectedActiveTrip: null,
    transform: ({ archive }) => ({ activeTrip: base('overwritten'), archive, result: true })
  }), /changed or is not durably saved/);
  assert.deepEqual((await readRecoveredTripStorage(storage)).activeTrip, active);
  assert.equal(await storage.getItem(JOURNAL), null);
});

test('journaled erase removes only active and matching archived trip, not unrelated history', async () => {
  const { storage, active, old } = seeded();
  const withDuplicate = archivePersonalTrip(old, active);
  storage.data.set(ARCHIVE, JSON.stringify(withDuplicate));
  const result = await transactTripStorage({
    storage, operation: 'delete', id: 'erase-all:autumn',
    expectedActiveTrip: active,
    transform: ({ archive }) => ({
      activeTrip: null, archive: archiveWithoutPersonalTrip(archive, active.id), result: true
    })
  });
  assert.equal(result.activeTrip, null);
  assert.equal(result.archive.trips.length, 1);
  assert.equal(result.archive.trips[0]?.id, 'summer');
  assert.equal(await storage.getItem(ACTIVE), null);
  assert.equal(await storage.getItem(JOURNAL), null);
  assert.equal(archivedPersonalTrip(result.archive, 'autumn'), undefined);
  assert.equal(archivedPersonalTrip(result.archive, 'summer')?.id, 'summer');
});

test('crash during full erase recovers to complete deletion without erasing another trip', async () => {
  const { storage, active, old } = seeded();
  storage.data.set(ARCHIVE, JSON.stringify(archivePersonalTrip(old, active)));
  storage.fault = { key: ACTIVE, operation: 'remove', when: 'before' };
  await assert.rejects(transactTripStorage({
    storage, operation: 'delete', id: 'erase-full-crash',
    expectedActiveTrip: active,
    transform: ({ archive }) => ({
      activeTrip: null, archive: archiveWithoutPersonalTrip(archive, active.id), result: true
    })
  }), /Injected storage crash/);
  const recovered = await readRecoveredTripStorage(storage);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.activeTrip, null);
  assert.deepEqual(recovered.archive.trips.map(t => t.id), ['summer']);
  assert.equal(await storage.getItem(JOURNAL), null);
});

test('calendar import journal failure does not report durable success or erase a previous ticket', async () => {
  const { storage, active } = seeded();
  const imported = addManualTripItem({
    trip: active, itemId: 'calendar-added', dayDate: '2026-10-13',
    title: 'Calendar theatre', kind: 'theatre', updatedAt: '2026-10-13T11:00:00.000Z',
    commitment: { kind: 'ticket', status: 'confirmed', verification: 'user-declared' }
  });
  const commit = () => transactTripStorage({
    storage, operation: 'edit' as const, id: 'calendar-import-retry',
    expectedActiveTrip: active,
    transform: ({archive}) => ({activeTrip: imported, archive, result: true})
  });
  storage.fault = { key: JOURNAL, operation: 'set', when: 'before' };
  await assert.rejects(commit(), /Injected storage crash/);
  assert.equal(await storage.getItem(JOURNAL), null);
  assert.equal((await readRecoveredTripStorage(storage)).activeTrip?.items.length, active.items.length);
  const successful = await commit();
  assert.equal(successful.activeTrip?.items.length, active.items.length + 1);
  assert.equal(successful.activeTrip?.items.at(-1)?.commitment?.verification, 'user-declared');
  assert.equal((await readRecoveredTripStorage(storage)).activeTrip?.items.length, active.items.length + 1);
});

test('interrupted calendar import replays the committed event exactly once after restart', async () => {
  const { storage, active } = seeded();
  const imported = addManualTripItem({
    trip: active, itemId: 'calendar-night', dayDate: '2026-10-13',
    title: 'Evening performance', kind: 'theatre', updatedAt: '2026-10-13T12:00:00.000Z'
  });
  storage.fault = { key: ACTIVE, operation: 'set', when: 'after' };
  await assert.rejects(transactTripStorage({
    storage, operation: 'edit', id: 'calendar-interrupted', expectedActiveTrip: active,
    transform: ({archive}) => ({activeTrip: imported, archive, result: true})
  }), /Injected storage crash/);
  const restarted = await readRecoveredTripStorage(storage);
  assert.equal(restarted.recovered, true);
  assert.equal(restarted.activeTrip?.items.filter(item => item.id === 'calendar-night').length, 1);
  assert.equal(await storage.getItem(JOURNAL), null);
  const secondRestart = await readRecoveredTripStorage(storage);
  assert.equal(secondRestart.recovered, false);
  assert.equal(secondRestart.activeTrip?.items.filter(item => item.id === 'calendar-night').length, 1);
});



function oneExpense(): TripFinanceEntry {
  return {
    id: 'stable-draft-20261023', dayDate: '2026-10-13',
    title: 'Билет · со слов туриста', category: 'tickets',
    estimateMinor: 250_000, actualMinor: 225_050,
    source: 'traveler-entered', createdAt: at, updatedAt: at
  };
}

function financeEdit(storage: MemoryTripStorage, expectedActiveTrip: ReturnType<typeof historicalJourney>) {
  const entry = oneExpense();
  return transactTripStorage({
    storage, id: 'finance:' + entry.id, operation: 'edit',
    expectedActiveTrip,
    transform: ({ activeTrip, archive }) => ({
      activeTrip: upsertTripFinanceEntry({
        trip: activeTrip!, entry, updatedAt: at
      }),
      archive,
      result: entry.id
    })
  });
}

for (const fault of [
  { key: JOURNAL, operation: 'set', when: 'before' },
  { key: JOURNAL, operation: 'set', when: 'after' },
  { key: ACTIVE, operation: 'set', when: 'before' },
  { key: ACTIVE, operation: 'set', when: 'after' },
  { key: JOURNAL, operation: 'remove', when: 'before' },
  { key: JOURNAL, operation: 'remove', when: 'after' }
] as const) {
  test('finance journal recovery is exactly one expense after interrupted '
    + fault.key + '/' + fault.operation + '/' + fault.when, async () => {
    const { storage, active, old } = seeded();
    const originalArchive = await storage.getItem(ARCHIVE);
    storage.fault = fault;
    await assert.rejects(financeEdit(storage, active), /Injected storage crash/);
    const recovered = await readRecoveredTripStorage(storage);
    assert.ok(recovered.activeTrip);
    if (fault.key === JOURNAL && fault.operation === 'set' && fault.when === 'before') {
      assert.equal(recovered.activeTrip.finance, undefined, 'no accepted journal means no expense');
    } else {
      assert.equal(recovered.activeTrip.finance?.entries.length, 1);
      assert.equal(recovered.activeTrip.finance?.entries[0]?.id, 'stable-draft-20261023');
      assert.equal(assessTripFinances(recovered.activeTrip).projectedMinor, 225_050);
    }
    assert.equal(await storage.getItem(JOURNAL), null);
    assert.equal(await storage.getItem(ARCHIVE), originalArchive, 'other archived trip not rewritten');
    assert.equal(recovered.activeTrip.items[0]?.commitment?.verification, 'user-declared');
    assert.equal(recovered.activeTrip.visits[0]?.evidence, 'user-confirmed');
    assert.ok(archivedPersonalTrip(old, 'summer'));

    // The form's stable draft ID gives one idempotent retry even if the first
    // journal was committed but its final confirmation threw.
    const retried = await financeEdit(storage, recovered.activeTrip);
    assert.equal(retried.activeTrip?.finance?.entries.length, 1);
    assert.equal(assessTripFinances(retried.activeTrip!).projectedMinor, 225_050);
    assert.equal(await storage.getItem(JOURNAL), null);
  });
}

test('stale Finance editor cannot clobber another tab; verified refresh followed by new ID preserves both', async () => {
  const { storage, active } = seeded();
  const otherEntry: TripFinanceEntry = {
    ...oneExpense(), id: 'other-tab-expense', title: 'Расход из соседней вкладки',
    estimateMinor: 130_000, actualMinor: undefined
  };
  const otherTrip = upsertTripFinanceEntry({ trip: active, entry: otherEntry, updatedAt: at });
  storage.data.set(ACTIVE, JSON.stringify(otherTrip));
  await assert.rejects(financeEdit(storage, active), /changed or is not durably saved/);
  assert.deepEqual((await readRecoveredTripStorage(storage)).activeTrip?.finance?.entries.map(e => e.id),
    ['other-tab-expense']);
  const refreshed = await readRecoveredTripStorage(storage);
  const retry = await financeEdit(storage, refreshed.activeTrip!);
  assert.deepEqual(retry.activeTrip!.finance?.entries.map(e => e.id),
    ['other-tab-expense', 'stable-draft-20261023']);
  assert.equal(assessTripFinances(retry.activeTrip!).projectedMinor, 355_050);
  assert.equal(retry.activeTrip!.items[0]?.commitment?.verification, 'user-declared');
  assert.equal(await storage.getItem(JOURNAL), null);
});
