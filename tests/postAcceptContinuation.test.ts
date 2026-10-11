import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPostAcceptContinuation } from '../src/travel/postAcceptContinuation.ts';
import { parsePersonalTrip, type PersonalTrip } from '../src/travel/personalTrip.ts';
import type { DayReplacementAcceptanceReceipt } from '../src/travel/dayReplacementProposal.ts';

const acceptedAt = '2026-10-10T10:00:00.000Z';
const trip: PersonalTrip = {
  schemaVersion: 1, id: 'trip', destinationId: 'moscow', title: 'Day in Moscow',
  startDate: '2026-10-10', endDate: '2026-10-10', days: ['2026-10-10'],
  createdAt: acceptedAt, updatedAt: acceptedAt, visits: [],
  items: [
    { id: 'museum', dayDate: '2026-10-10', title: 'Replacement gallery', kind: 'museum', source: 'provider', destinationNodeId: 'gallery', plannedStartAt: '2026-10-10T11:00:00+03:00', plannedEndAt: '2026-10-10T12:00:00+03:00', status: 'planned' },
    { id: 'theatre', dayDate: '2026-10-10', title: 'Bolshoi', kind: 'theatre', source: 'manual', plannedStartAt: '2026-10-10T19:00:00+03:00', plannedEndAt: '2026-10-10T21:00:00+03:00', status: 'planned', commitment: { kind: 'ticket', status: 'confirmed', verification: 'user-declared', reference: 'user-ticket' } }
  ]
};
const receipt: DayReplacementAcceptanceReceipt = {
  schemaVersion: 1, proposalId: 'proposal', disruptionId: 'disruption',
  acceptedAt, baselineUpdatedAt: '2026-10-10T09:59:00.000Z', affectedItemId: 'museum',
  before: { title: 'Closed gallery', kind: 'museum', destinationNodeId: 'closed', plannedStartAt: '2026-10-10T11:00:00+03:00', plannedEndAt: '2026-10-10T12:00:00+03:00' },
  after: { title: 'Replacement gallery', kind: 'museum', destinationNodeId: 'gallery', plannedStartAt: '2026-10-10T11:00:00+03:00', plannedEndAt: '2026-10-10T12:00:00+03:00' },
  sourceEvidenceRef: 'source-proof', routeObservationIds: ['route-proof'], fixedCommitmentsPreserved: true
};
describe('post-accept continuation', () => {
  it('identifies the next fixed commitment without mutation', () => {
    const original = JSON.stringify(trip);
    const result = buildPostAcceptContinuation({ trip, receipt });
    assert.equal(result.nextItem?.id, 'theatre');
    assert.deepEqual(result.remainingItemIds, ['museum', 'theatre']);
    assert.deepEqual(result.preservedCommitmentItemIds, ['theatre']);
    assert.equal(JSON.stringify(trip), original);
  });
  it('fails closed on a changed trip revision', () => {
    assert.throws(() => buildPostAcceptContinuation({trip: {...trip, updatedAt: '2026-10-10T10:05:00.000Z'}, receipt}), /exact accepted trip revision/);
  });
  it('fails closed if the accepted item changed', () => {
    assert.throws(() => buildPostAcceptContinuation({trip: {...trip, items: [{...trip.items[0]!, destinationNodeId: 'unverified'}, trip.items[1]!]}, receipt}), /no longer matches/);
  });
});

describe('replacement receipt persistence', () => {
  it('round-trips accepted history with fixed theatre commitment untouched', () => {
    const record = { ...trip, replacementReceipts: [receipt] };
    const restored = parsePersonalTrip(JSON.stringify(record));
    assert.deepEqual(restored.replacementReceipts, [receipt]);
    assert.deepEqual(restored.items.find(item => item.id === 'theatre'), trip.items.find(item => item.id === 'theatre'));
    restored.replacementReceipts![0]!.routeObservationIds.push('mutated');
    assert.deepEqual(receipt.routeObservationIds, ['route-proof']);
  });
  it('loads legacy trip snapshots without acceptance history', () => {
    const restored = parsePersonalTrip(JSON.stringify(trip));
    assert.equal(restored.replacementReceipts, undefined);
  });
  it('rejects duplicate, malformed or forged receipt history', () => {
    assert.throws(() => parsePersonalTrip(JSON.stringify({ ...trip, replacementReceipts: [receipt, receipt] })), /Duplicate replacement acceptance receipt/);
    assert.throws(() => parsePersonalTrip(JSON.stringify({ ...trip, replacementReceipts: [{ ...receipt, fixedCommitmentsPreserved: false }] })), /Invalid replacement acceptance receipt/);
    assert.throws(() => parsePersonalTrip(JSON.stringify({ ...trip, replacementReceipts: 'corrupt' })), /Invalid replacement receipt collection/);
  });
});
