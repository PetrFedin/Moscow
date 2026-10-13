import assert from 'node:assert/strict';
import test from 'node:test';
import { addManualTripItem, createPersonalTrip, recordTripVisit, updateTripVisitNote } from '../src/travel/personalTrip.ts';
import { archivePersonalTrip, emptyPersonalTripArchive } from '../src/travel/personalTripArchive.ts';
import {
  createPersonalTripBackup, parsePersonalTripBackup, previewPersonalTripBackup,
  mergePersonalTripBackup, MAX_PERSONAL_TRIP_BACKUP_CHARACTERS
} from '../src/travel/personalTripBackup.ts';

const ts = '2026-10-13T08:00:00.000Z';
function trip(id: string, date = '2026-10-13') {
  return createPersonalTrip({ id, title: 'Москва', destinationId: 'moscow', startDate: date, endDate: date, createdAt: ts });
}
function withTicketAndNote() {
  const ticket = addManualTripItem({
    trip: trip('trip-one'), itemId: 'theatre', dayDate: '2026-10-13',
    title: 'Большой театр', kind: 'theatre', updatedAt: ts,
    commitment: { kind: 'ticket', status: 'confirmed', verification: 'user-declared', reference: 'OWN-TICKET' }
  });
  const visited = recordTripVisit({
    trip: ticket, visitId: 'visit-theatre', itemId: 'theatre', dayDate: '2026-10-13',
    title: 'Большой театр', kind: 'theatre', evidence: 'user-confirmed',
    visitedAt: ts, updatedAt: ts
  });
  return updateTripVisitNote({ trip: visited, visitId: 'visit-theatre', note: 'Личный вечер', updatedAt: ts });
}

test('backup roundtrip preserves local booking truth, notes, dates and archived trips', () => {
  const activeTrip = withTicketAndNote();
  const archive = archivePersonalTrip(emptyPersonalTripArchive(), trip('trip-two', '2026-11-01'));
  const backup = createPersonalTripBackup({ activeTrip, archive, exportedAt: ts });
  const parsed = parsePersonalTripBackup(backup);
  assert.equal(parsed.activeTrip?.items[0]?.commitment?.verification, 'user-declared');
  assert.equal(parsed.activeTrip?.items[0]?.commitment?.reference, 'OWN-TICKET');
  assert.equal(parsed.activeTrip?.visits[0]?.note, 'Личный вечер');
  assert.equal(parsed.archive.trips[0]?.id, 'trip-two');
  assert.deepEqual(previewPersonalTripBackup(backup), {
    tripCount: 2, itemCount: 1, visitCount: 1, commitmentCount: 1, acceptanceReceiptCount: 0
  });
});

test('backup import archives incoming trips but keeps the active local trip unchanged', () => {
  const local = trip('my-current-trip');
  const raw = createPersonalTripBackup({
    activeTrip: withTicketAndNote(), archive: emptyPersonalTripArchive(), exportedAt: ts
  });
  const merged = mergePersonalTripBackup({
    backup: parsePersonalTripBackup(raw), activeTrip: local, archive: emptyPersonalTripArchive()
  });
  assert.equal(merged.imported, 1);
  assert.equal(local.id, 'my-current-trip');
  assert.equal(merged.archive.trips[0]?.id, 'trip-one');
  assert.equal(merged.archive.trips[0]?.visits[0]?.note, 'Личный вечер');
  const repeated = mergePersonalTripBackup({
    backup: parsePersonalTripBackup(raw), activeTrip: local, archive: merged.archive
  });
  assert.equal(repeated.imported, 0);
  assert.equal(repeated.skipped, 1);
});

test('conflicting trip identities reject entire import without mutating destination', () => {
  const local = trip('trip-one');
  const changed = { ...local, title: 'Другой маршрут' };
  const raw = createPersonalTripBackup({
    activeTrip: changed, archive: emptyPersonalTripArchive(), exportedAt: ts
  });
  const archive = emptyPersonalTripArchive();
  assert.throws(() => mergePersonalTripBackup({
    backup: parsePersonalTripBackup(raw), activeTrip: local, archive
  }), /Trip identity conflict/);
  assert.equal(archive.trips.length, 0);
});

test('backup rejects oversized payload, wrong version, duplicate active identity and forged provider booking', () => {
  assert.throws(() => parsePersonalTripBackup('x'.repeat(MAX_PERSONAL_TRIP_BACKUP_CHARACTERS + 1)), /too large/);
  const valid = createPersonalTripBackup({
    activeTrip: withTicketAndNote(), archive: emptyPersonalTripArchive(), exportedAt: ts
  });
  assert.throws(() => parsePersonalTripBackup(valid.replace('"schemaVersion": 1', '"schemaVersion": 99')), /Unsupported/);
  const duplicate = JSON.parse(valid);
  duplicate.archive.trips = [duplicate.activeTrip];
  assert.throws(() => parsePersonalTripBackup(JSON.stringify(duplicate)), /two versions/);
  const forged = JSON.parse(valid);
  forged.activeTrip.items[0].commitment.verification = 'provider-confirmed';
  assert.throws(() => parsePersonalTripBackup(JSON.stringify(forged)), /requires provider/);
  forged.activeTrip.items[0].commitment.provider = 'Unverified third party';
  assert.throws(() => parsePersonalTripBackup(JSON.stringify(forged)), /requires receipt evidence/);
});

test('export chooses the latest active snapshot over a stale archived copy', () => {
  const active = withTicketAndNote();
  const stale = trip('trip-one');
  const backup = createPersonalTripBackup({
    activeTrip: active,
    archive: archivePersonalTrip(emptyPersonalTripArchive(), stale),
    exportedAt: ts
  });
  assert.equal(parsePersonalTripBackup(backup).archive.trips.length, 0);
  assert.equal(parsePersonalTripBackup(backup).activeTrip?.visits.length, 1);
});
