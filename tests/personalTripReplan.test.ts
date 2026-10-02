import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addManualTripItem,
  createPersonalTrip,
  setTripItemStatus,
  setTripPreferences
} from '../src/travel/personalTrip.ts';
import {
  applyPersonalTripReplanProposal,
  buildPersonalTripReplanProposal
} from '../src/travel/personalTripReplan.ts';

function baseTrip() {
  let trip = createPersonalTrip({
    id: 'replan-trip',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-03',
    endDate: '2026-10-03',
    createdAt: '2026-10-03T04:00:00.000Z'
  });

  trip = setTripPreferences({
    trip,
    preferences: {
      dayStart: '09:00',
      dayEnd: '18:00',
      lunchWindow: { start: '13:00', end: '14:00' },
      pace: 'balanced',
      priorityMode: 'must-see',
      maxContinuousWalkingMinutes: 45,
      stepFreeIntent: 'preferred'
    },
    updatedAt: '2026-10-03T04:01:00.000Z'
  });

  trip = addManualTripItem({
    trip,
    itemId: 'flex-a',
    dayDate: '2026-10-03',
    title: 'Гибкий музей',
    kind: 'museum',
    plannedStartAt: '2026-10-03T10:00:00+03:00',
    plannedEndAt: '2026-10-03T11:00:00+03:00',
    updatedAt: '2026-10-03T04:02:00.000Z'
  });

  trip = addManualTripItem({
    trip,
    itemId: 'fixed-theatre',
    dayDate: '2026-10-03',
    title: 'Фиксированный театр',
    kind: 'theatre',
    plannedStartAt: '2026-10-03T11:00:00+03:00',
    plannedEndAt: '2026-10-03T12:00:00+03:00',
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'user-declared',
      reference: 'USER-TICKET'
    },
    updatedAt: '2026-10-03T04:03:00.000Z'
  });

  trip = addManualTripItem({
    trip,
    itemId: 'flex-b',
    dayDate: '2026-10-03',
    title: 'Гибкая прогулка',
    kind: 'activity',
    plannedStartAt: '2026-10-03T12:00:00+03:00',
    plannedEndAt: '2026-10-03T13:00:00+03:00',
    updatedAt: '2026-10-03T04:04:00.000Z'
  });

  return trip;
}

test('Day Replan preserves fixed booking exactly and only proposes flexible items', () => {
  const trip = baseTrip();
  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-1',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });

  assert.deepEqual(proposal.preservedFixedCommitments, [{
    itemId: 'fixed-theatre',
    startAt: '2026-10-03T11:00:00+03:00',
    endAt: '2026-10-03T12:00:00+03:00'
  }]);
  assert.deepEqual(proposal.placements.map((item) => item.itemId), ['flex-a', 'flex-b']);
  assert.ok(proposal.placements.every((item) => item.reason === 'existing-duration-fit'));
  assert.equal(proposal.source, 'schedule-only');
  assert.deepEqual(proposal.assumptions, {
    routingVerified: false,
    openingHoursVerified: false,
    accessibilityVerified: false,
    weatherVerified: false
  });
});

test('Day Replan respects lunch preference and day bounds', () => {
  let trip = baseTrip();
  trip = addManualTripItem({
    trip,
    itemId: 'flex-long',
    dayDate: '2026-10-03',
    title: 'Длинный гибкий блок',
    kind: 'other',
    plannedStartAt: '2026-10-03T14:00:00+03:00',
    plannedEndAt: '2026-10-03T16:00:00+03:00',
    updatedAt: '2026-10-03T04:05:00.000Z'
  });

  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-lunch',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });

  for (const placement of proposal.placements) {
    const start = Date.parse(placement.proposedStartAt);
    const end = Date.parse(placement.proposedEndAt);
    const lunchStart = Date.parse('2026-10-03T13:00:00+03:00');
    const lunchEnd = Date.parse('2026-10-03T14:00:00+03:00');
    assert.equal(start < lunchEnd && lunchStart < end, false);
    assert.ok(start >= Date.parse('2026-10-03T09:00:00+03:00'));
    assert.ok(end <= Date.parse('2026-10-03T18:00:00+03:00'));
  }
});

test('item without known duration stays unplaced instead of receiving invented duration', () => {
  let trip = baseTrip();
  trip = addManualTripItem({
    trip,
    itemId: 'unknown-duration',
    dayDate: '2026-10-03',
    title: 'Без длительности',
    kind: 'other',
    updatedAt: '2026-10-03T04:05:00.000Z'
  });

  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-missing-duration',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });

  assert.deepEqual(
    proposal.unplaced.find((item) => item.itemId === 'unknown-duration'),
    {
      itemId: 'unknown-duration',
      reason: 'missing-duration',
      action: 'unschedule'
    }
  );
});

test('oversized flexible item is unplaced when no contiguous schedule window exists', () => {
  let trip = baseTrip();
  trip = addManualTripItem({
    trip,
    itemId: 'too-long',
    dayDate: '2026-10-03',
    title: 'Слишком длинный блок',
    kind: 'other',
    plannedStartAt: '2026-10-03T09:00:00+03:00',
    plannedEndAt: '2026-10-03T17:00:00+03:00',
    updatedAt: '2026-10-03T04:05:00.000Z'
  });

  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-no-window',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });

  assert.equal(
    proposal.unplaced.find((item) => item.itemId === 'too-long')?.reason,
    'no-schedule-window'
  );
});

test('completed item is not rewritten by Day Replan', () => {
  let trip = baseTrip();
  trip = setTripItemStatus({
    trip,
    itemId: 'flex-a',
    status: 'completed',
    updatedAt: '2026-10-03T04:06:00.000Z'
  });

  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-completed',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });

  assert.equal(proposal.placements.some((item) => item.itemId === 'flex-a'), false);
  assert.equal(proposal.unplaced.some((item) => item.itemId === 'flex-a'), false);
});

test('applying a proposal requires explicit user acceptance', () => {
  const trip = baseTrip();
  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-accept',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });

  assert.throws(
    () => applyPersonalTripReplanProposal({
      trip,
      proposal,
      userAccepted: false,
      updatedAt: '2026-10-03T05:01:00.000Z'
    }),
    /explicit user acceptance/
  );
});

test('stale proposal cannot overwrite a newer trip', () => {
  const trip = baseTrip();
  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-stale',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });
  const changed = setTripItemStatus({
    trip,
    itemId: 'flex-b',
    status: 'skipped',
    updatedAt: '2026-10-03T05:00:30.000Z'
  });

  assert.throws(
    () => applyPersonalTripReplanProposal({
      trip: changed,
      proposal,
      userAccepted: true,
      updatedAt: '2026-10-03T05:01:00.000Z'
    }),
    /stale/
  );
});

test('forged proposal cannot move a fixed commitment', () => {
  const trip = baseTrip();
  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-forged-fixed',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });

  proposal.preservedFixedCommitments[0] = {
    itemId: 'fixed-theatre',
    startAt: '2026-10-03T12:00:00+03:00',
    endAt: '2026-10-03T13:00:00+03:00'
  };

  assert.throws(
    () => applyPersonalTripReplanProposal({
      trip,
      proposal,
      userAccepted: true,
      updatedAt: '2026-10-03T05:01:00.000Z'
    }),
    /does not preserve current fixed commitments/
  );
});

test('accepted proposal changes flexible schedule and keeps fixed time exact', () => {
  const trip = baseTrip();
  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-apply',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });

  const applied = applyPersonalTripReplanProposal({
    trip,
    proposal,
    userAccepted: true,
    updatedAt: '2026-10-03T05:01:00.000Z'
  });

  const fixed = applied.items.find((item) => item.id === 'fixed-theatre');
  assert.equal(fixed?.plannedStartAt, '2026-10-03T11:00:00+03:00');
  assert.equal(fixed?.plannedEndAt, '2026-10-03T12:00:00+03:00');

  const flexible = applied.items.filter((item) => item.id === 'flex-a' || item.id === 'flex-b');
  assert.ok(flexible.every((item) => Boolean(item.plannedStartAt && item.plannedEndAt)));
  assert.notEqual(applied.updatedAt, trip.updatedAt);
});
