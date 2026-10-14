import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addManualTripItem,
  createPersonalTrip,
  recordTripVisit,
  updateTripVisitNote
} from '../src/travel/personalTrip.ts';
import {
  archivePersonalTrip,
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

