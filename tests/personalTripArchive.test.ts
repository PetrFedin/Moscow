import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addManualTripItem, createPersonalTrip, parsePersonalTrip, recordTripVisit, updateTripVisitNote
} from '../src/travel/personalTrip.ts';
import type { DayReplacementAcceptanceReceipt } from '../src/travel/dayReplacementProposal.ts';
import {
  archivePersonalTrip, archivedPersonalTrip, emptyPersonalTripArchive, parsePersonalTripArchive
} from '../src/travel/personalTripArchive.ts';

function makeTrip(id: string, startDate: string) {
  return createPersonalTrip({
    id, title: 'Моя поездка в Москву', destinationId: 'moscow',
    startDate, endDate: startDate, createdAt: '2026-10-01T09:00:00.000Z'
  });
}

test('multi-trip archive preserves tickets, personal visit notes and accepted replacement receipts', () => {
  const fixed = addManualTripItem({
    trip: makeTrip('trip-autumn', '2026-10-13'),
    itemId: 'fixed-theatre', dayDate: '2026-10-13',
    title: 'Большой театр', kind: 'theatre', updatedAt: '2026-10-01T12:00:00.000Z',
    plannedStartAt: '2026-10-13T19:00:00+03:00', plannedEndAt: '2026-10-13T21:00:00+03:00',
    commitment: { kind: 'ticket', status: 'confirmed', verification: 'user-declared', reference: 'USER-TICKET' }
  });
  let withVisit = recordTripVisit({
    trip: fixed, visitId: 'visit-museum', dayDate: '2026-10-13', itemId: 'visited-museum',
    title: 'Музей', kind: 'museum', evidence: 'user-confirmed',
    visitedAt: '2026-10-13T12:00:00+03:00', updatedAt: '2026-10-13T12:00:00+03:00'
  });
  withVisit = updateTripVisitNote({
    trip: withVisit, visitId: 'visit-museum',
    note: 'Замечательная экспозиция', updatedAt: '2026-10-13T12:10:00+03:00'
  });
  const receipt: DayReplacementAcceptanceReceipt = {
    schemaVersion: 1, proposalId: 'proposal-a', disruptionId: 'closure-a',
    acceptedAt: '2026-10-13T09:00:00+03:00', baselineUpdatedAt: '2026-10-13T08:00:00+03:00',
    affectedItemId: 'old-museum',
    before: { title: 'Старый музей', kind: 'museum' },
    after: {
      title: 'Другой музей', kind: 'museum', destinationNodeId: 'replacement-museum',
      plannedStartAt: '2026-10-13T14:00:00+03:00', plannedEndAt: '2026-10-13T15:30:00+03:00'
    },
    sourceEvidenceRef: 'manual-public-proof', routeObservationIds: ['route-a'], fixedCommitmentsPreserved: true
  };
  withVisit.replacementReceipts = [receipt];

  const first = archivePersonalTrip(emptyPersonalTripArchive(), withVisit);
  const secondTrip = makeTrip('trip-winter', '2026-12-20');
  const archived = archivePersonalTrip(first, secondTrip);
  const restored = parsePersonalTripArchive(JSON.stringify(archived));

  assert.deepEqual(restored.trips.map(t => t.id), ['trip-winter', 'trip-autumn']);
  const old = archivedPersonalTrip(restored, 'trip-autumn');
  assert.ok(old);
  assert.equal(old.visits[0]?.note, 'Замечательная экспозиция');
  assert.equal(old.visits[0]?.evidence, 'user-confirmed');
  assert.equal(old.replacementReceipts?.[0]?.proposalId, 'proposal-a');
  assert.equal(old.items.find(item => item.id === 'fixed-theatre')?.commitment?.reference, 'USER-TICKET');
  assert.equal(old.items.find(item => item.id === 'fixed-theatre')?.commitment?.verification, 'user-declared');
  assert.deepEqual(parsePersonalTrip(JSON.stringify(old)), old);

  old.visits[0]!.note = 'not persisted';
  assert.equal(archivedPersonalTrip(restored, 'trip-autumn')?.visits[0]?.note, 'Замечательная экспозиция');
  assert.equal(withVisit.visits[0]?.note, 'Замечательная экспозиция');
});

test('archiving the same journey updates it without deleting older trips', () => {
  const first = makeTrip('trip-one', '2026-10-13');
  const second = makeTrip('trip-two', '2026-10-20');
  const archive = archivePersonalTrip(archivePersonalTrip(emptyPersonalTripArchive(), first), second);
  const changed = { ...first, title: 'Москва — обновлённая поездка' };
  const updated = archivePersonalTrip(archive, changed);
  assert.equal(updated.trips.length, 2);
  assert.equal(archivedPersonalTrip(updated, first.id)?.title, changed.title);
  assert.equal(archivedPersonalTrip(updated, second.id)?.title, second.title);
});

test('archive rejects invalid shape, duplicate IDs and forged replacement receipts', () => {
  assert.throws(() => parsePersonalTripArchive('{"schemaVersion":2,"trips":[]}'), /Unsupported/);
  assert.throws(() => parsePersonalTripArchive(JSON.stringify({
    schemaVersion: 1, trips: [makeTrip('repeat','2026-10-13'), makeTrip('repeat','2026-10-13')]
  })), /Duplicate archived trip identity/);
  const corrupted = makeTrip('trip-broken','2026-10-13');
  assert.throws(() => parsePersonalTripArchive(JSON.stringify({
    schemaVersion: 1, trips: [{ ...corrupted, replacementReceipts: [{ fixedCommitmentsPreserved: false }] }]
  })), /Invalid replacement acceptance receipt/);
});
