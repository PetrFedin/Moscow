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


test('forged proposal cannot change flexible item duration', () => {
  const trip = baseTrip();
  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-forged-duration',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });
  const placement = proposal.placements.find((item) => item.itemId === 'flex-a');
  assert.ok(placement);
  placement!.proposedEndAt = new Date(Date.parse(placement!.proposedStartAt) + 30 * 60_000).toISOString();
  placement!.durationMinutes = 30;

  assert.throws(
    () => applyPersonalTripReplanProposal({
      trip,
      proposal,
      userAccepted: true,
      updatedAt: '2026-10-03T05:01:00.000Z'
    }),
    /preserve existing item duration/
  );
});

test('forged proposal cannot unschedule a completed item', () => {
  let trip = baseTrip();
  trip = setTripItemStatus({
    trip,
    itemId: 'flex-a',
    status: 'completed',
    updatedAt: '2026-10-03T04:06:00.000Z'
  });
  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-forged-completed',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });
  proposal.unplaced.push({
    itemId: 'flex-a',
    reason: 'missing-duration',
    action: 'unschedule'
  });

  assert.throws(
    () => applyPersonalTripReplanProposal({
      trip,
      proposal,
      userAccepted: true,
      updatedAt: '2026-10-03T05:01:00.000Z'
    }),
    /cannot unschedule resolved item/
  );
});

test('forged proposal cannot assert routing or accessibility verification', () => {
  const trip = baseTrip();
  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-forged-truth',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });
  (proposal.assumptions as { routingVerified: boolean }).routingVerified = true;

  assert.throws(
    () => applyPersonalTripReplanProposal({
      trip,
      proposal,
      userAccepted: true,
      updatedAt: '2026-10-03T05:01:00.000Z'
    }),
    /cannot assert verified external assumptions/
  );
});

test('forged proposal cannot rewrite the preference snapshot', () => {
  const trip = baseTrip();
  const proposal = buildPersonalTripReplanProposal({
    trip,
    proposalId: 'proposal-forged-preferences',
    dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z',
    trigger: 'manual'
  });
  proposal.inputSnapshot.dayEnd = '23:59';

  assert.throws(
    () => applyPersonalTripReplanProposal({
      trip,
      proposal,
      userAccepted: true,
      updatedAt: '2026-10-03T05:01:00.000Z'
    }),
    /preference snapshot/
  );
});

test('schedule-only replan protects held, cancelled and untimed bookings from auto-rescheduling', () => {
  let trip = baseTrip();
  trip = addManualTripItem({
    trip, itemId: 'held-dinner', dayDate: '2026-10-03',
    title: 'Столик на удержании', kind: 'food',
    plannedStartAt: '2026-10-03T14:00:00+03:00',
    plannedEndAt: '2026-10-03T15:00:00+03:00',
    commitment: { kind: 'reservation', status: 'held', verification: 'user-declared', reference: 'HOLD-REF' },
    updatedAt: '2026-10-03T04:05:00.000Z'
  });
  trip = addManualTripItem({
    trip, itemId: 'cancelled-lunch', dayDate: '2026-10-03',
    title: 'Отменённый обед', kind: 'food',
    plannedStartAt: '2026-10-03T15:00:00+03:00',
    plannedEndAt: '2026-10-03T16:00:00+03:00',
    commitment: { kind: 'reservation', status: 'cancelled', verification: 'user-declared', reference: 'CANCELLED-REF' },
    updatedAt: '2026-10-03T04:06:00.000Z'
  });
  trip = addManualTripItem({
    trip, itemId: 'untimed-ticket', dayDate: '2026-10-03',
    title: 'Билет без указанного времени', kind: 'event',
    commitment: { kind: 'ticket', status: 'confirmed', verification: 'user-declared', reference: 'UNTIMED-REF' },
    updatedAt: '2026-10-03T04:07:00.000Z'
  });

  const before = JSON.stringify(trip);
  const proposal = buildPersonalTripReplanProposal({
    trip, proposalId: 'replan-holds-cancelled', dayDate: '2026-10-03',
    nowIso: '2026-10-03T05:00:00.000Z', trigger: 'manual'
  });
  assert.deepEqual(proposal.preservedFixedCommitments.map(c => c.itemId),
    ['fixed-theatre', 'held-dinner']);
  for (const id of ['held-dinner', 'cancelled-lunch', 'untimed-ticket']) {
    assert.equal(proposal.placements.some(c => c.itemId === id), false);
    assert.equal(proposal.unplaced.some(c => c.itemId === id), false);
  }
  const accepted = applyPersonalTripReplanProposal({
    trip, proposal, userAccepted: true, updatedAt: '2026-10-03T05:01:00.000Z'
  });
  for (const id of ['fixed-theatre', 'held-dinner', 'cancelled-lunch', 'untimed-ticket']) {
    const original = trip.items.find(item => item.id === id)!;
    const saved = accepted.items.find(item => item.id === id)!;
    assert.equal(saved.dayDate, original.dayDate);
    assert.equal(saved.plannedStartAt, original.plannedStartAt);
    assert.equal(saved.plannedEndAt, original.plannedEndAt);
    assert.deepEqual(saved.commitment, original.commitment);
  }
  assert.equal(JSON.stringify(trip), before);

  const forgedHeld = structuredClone(proposal);
  forgedHeld.placements.push({
    itemId: 'held-dinner',
    previousStartAt: '2026-10-03T14:00:00+03:00',
    previousEndAt: '2026-10-03T15:00:00+03:00',
    proposedStartAt: '2026-10-03T16:00:00+03:00',
    proposedEndAt: '2026-10-03T17:00:00+03:00',
    durationMinutes: 60, reason: 'existing-duration-fit'
  });
  assert.throws(() => applyPersonalTripReplanProposal({
    trip, proposal: forgedHeld, userAccepted: true,
    updatedAt: '2026-10-03T05:01:00.000Z'
  }), /cannot move booked or cancelled commitment/);

  const forgedCancel = structuredClone(proposal);
  forgedCancel.unplaced.push({
    itemId: 'cancelled-lunch', reason: 'no-schedule-window', action: 'unschedule'
  });
  assert.throws(() => applyPersonalTripReplanProposal({
    trip, proposal: forgedCancel, userAccepted: true,
    updatedAt: '2026-10-03T05:01:00.000Z'
  }), /cannot unschedule booked or cancelled commitment/);
});
