import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addManualTripItem,
  createPersonalTrip,
  recordTripVisit,
  setTripPreferences,
  type PersonalTrip
} from '../src/travel/personalTrip.ts';
import {
  answerCityConcierge,
  askCityConcierge,
  routeCityConciergePrompt
} from '../src/travel/cityConcierge.ts';

function baseTrip() {
  let trip = createPersonalTrip({
    id: 'concierge-trip',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-05',
    endDate: '2026-10-06',
    createdAt: '2026-10-04T18:00:00.000Z'
  });

  trip = setTripPreferences({
    trip,
    preferences: {
      pace: 'relaxed',
      dayStart: '09:00',
      dayEnd: '21:00',
      maxContinuousWalkingMinutes: 40,
      lunchWindow: { start: '13:00', end: '14:00' },
      priorityMode: 'must-see',
      stepFreeIntent: 'preferred'
    },
    updatedAt: '2026-10-04T18:01:00.000Z'
  });

  trip = addManualTripItem({
    trip,
    itemId: 'museum',
    dayDate: '2026-10-05',
    title: 'Музей',
    kind: 'museum',
    plannedStartAt: '2026-10-05T10:00:00+03:00',
    plannedEndAt: '2026-10-05T11:00:00+03:00',
    updatedAt: '2026-10-04T18:02:00.000Z'
  });

  trip = addManualTripItem({
    trip,
    itemId: 'user-ticket',
    dayDate: '2026-10-05',
    title: 'Театр пользователя',
    kind: 'theatre',
    plannedStartAt: '2026-10-05T19:00:00+03:00',
    plannedEndAt: '2026-10-05T21:00:00+03:00',
    commitment: {
      kind: 'ticket',
      status: 'confirmed',
      verification: 'user-declared',
      reference: 'USER-1'
    },
    updatedAt: '2026-10-04T18:03:00.000Z'
  });

  trip = addManualTripItem({
    trip,
    itemId: 'provider-booking',
    dayDate: '2026-10-06',
    title: 'Подтверждённый ужин',
    kind: 'food',
    plannedStartAt: '2026-10-06T18:00:00+03:00',
    plannedEndAt: '2026-10-06T19:30:00+03:00',
    commitment: {
      kind: 'reservation',
      status: 'confirmed',
      verification: 'provider-confirmed',
      provider: 'provider-a',
      receiptEvidenceRef: 'receipt:provider-a:123'
    },
    updatedAt: '2026-10-04T18:04:00.000Z'
  });

  return trip;
}

function withVisit(trip: PersonalTrip) {
  return recordTripVisit({
    trip,
    visitId: 'visit-1',
    dayDate: '2026-10-05',
    visitedAt: '2026-10-05T08:30:00.000Z',
    title: 'Палаты бояр Романовых',
    evidence: 'route-completed',
    destinationNodeId: 'romanov-chambers',
    updatedAt: '2026-10-05T08:30:00.000Z'
  });
}

test('phrase router supports bounded RU/EN/ZH read-only intents', () => {
  assert.equal(routeCityConciergePrompt('Что у меня сегодня?'), 'today');
  assert.equal(routeCityConciergePrompt('Where is my next reservation?'), 'next-commitment');
  assert.equal(routeCityConciergePrompt('空闲时间'), 'free-time');
  assert.equal(routeCityConciergePrompt('Что я уже видел?'), 'visited-history');
  assert.equal(routeCityConciergePrompt('Show my pace and constraints'), 'preferences');
  assert.equal(routeCityConciergePrompt('Покажи сводку поездки'), 'trip-overview');
});

test('externally changing live-fact question fails closed before generic today intent', () => {
  assert.equal(
    routeCityConciergePrompt('Что сегодня открыто и сколько стоит билет?'),
    'unsupported-live-fact'
  );

  const result = askCityConcierge({
    trip: baseTrip(),
    nowIso: '2026-10-05T09:00:00+03:00',
    prompt: 'What is open today and what is available?'
  });

  assert.equal(result.status, 'unsupported');
  assert.equal(result.reason, 'external-live-fact-not-authorized');
  assert.deepEqual(result.facts, []);
  assert.equal(result.boundaries.liveAvailabilityVerified, false);
  assert.equal(result.boundaries.openingHoursVerified, false);
});

test('trip overview is derived from Personal Trip without mutating it', () => {
  const trip = withVisit(baseTrip());
  const before = JSON.stringify(trip);
  const result = answerCityConcierge({
    trip,
    nowIso: '2026-10-05T09:00:00+03:00',
    intent: 'trip-overview'
  });

  assert.equal(result.status, 'answered');
  assert.equal(result.facts.find((fact) => fact.kind === 'trip-day-count')?.value, 2);
  assert.equal(result.facts.find((fact) => fact.kind === 'commitment-count')?.value, 2);
  assert.equal(result.facts.find((fact) => fact.kind === 'visited-count')?.value, 1);
  assert.equal(JSON.stringify(trip), before);
  assert.ok(result.facts.every((fact) => fact.grounding.authority === 'personal-trip'));
});

test('today answer exposes schedule derivation and keeps external assumptions false', () => {
  const result = answerCityConcierge({
    trip: baseTrip(),
    nowIso: '2026-10-05T11:30:00+03:00',
    intent: 'today'
  });

  assert.equal(result.status, 'answered');
  const free = result.facts.find((fact) => fact.kind === 'free-window');
  assert.ok(free);
  assert.equal(free?.grounding.authority, 'local-schedule');
  assert.equal(free?.grounding.verification, 'derived-local');
  assert.deepEqual(result.boundaries, {
    readOnly: true,
    providerActionAllowed: false,
    routingVerified: false,
    openingHoursVerified: false,
    accessibilityVerified: false,
    weatherVerified: false,
    liveAvailabilityVerified: false
  });
});

test('next user-declared commitment is never presented as provider-confirmed', () => {
  const result = answerCityConcierge({
    trip: baseTrip(),
    nowIso: '2026-10-05T12:00:00+03:00',
    intent: 'next-commitment'
  });

  const commitment = result.facts.find((fact) => fact.kind === 'next-commitment');
  assert.equal(commitment?.value, 'Театр пользователя');
  assert.deepEqual(commitment?.grounding, {
    authority: 'personal-trip',
    verification: 'user-declared'
  });
});

test('provider-confirmed commitment carries provider receipt evidence', () => {
  const result = answerCityConcierge({
    trip: baseTrip(),
    nowIso: '2026-10-05T22:00:00+03:00',
    intent: 'next-commitment'
  });

  const commitment = result.facts.find((fact) => fact.kind === 'next-commitment');
  assert.equal(commitment?.value, 'Подтверждённый ужин');
  assert.deepEqual(commitment?.grounding, {
    authority: 'provider-receipt',
    verification: 'provider-confirmed',
    sourceRef: 'receipt:provider-a:123'
  });
});

test('free time is explicitly schedule-derived and cannot imply routing feasibility', () => {
  const result = answerCityConcierge({
    trip: baseTrip(),
    nowIso: '2026-10-05T11:30:00+03:00',
    intent: 'free-time'
  });

  assert.equal(result.status, 'answered');
  assert.equal(result.facts.length, 1);
  assert.equal(result.facts[0]?.kind, 'free-window');
  assert.equal(result.facts[0]?.grounding.verification, 'derived-local');
  assert.equal(result.boundaries.routingVerified, false);
  assert.equal(result.boundaries.openingHoursVerified, false);
  assert.equal(result.boundaries.accessibilityVerified, false);
  assert.equal(result.boundaries.weatherVerified, false);
});

test('visited history preserves each visit evidence class', () => {
  const result = answerCityConcierge({
    trip: withVisit(baseTrip()),
    nowIso: '2026-10-05T12:00:00+03:00',
    intent: 'visited-history'
  });

  assert.equal(result.status, 'answered');
  const visit = result.facts.find((fact) => fact.kind === 'visit');
  assert.equal(visit?.value, 'Палаты бояр Романовых');
  assert.equal(visit?.grounding.authority, 'visit-evidence');
  assert.equal(visit?.grounding.verification, 'route-completed');
});

test('preferences are visible user intent, not route/opening/accessibility proof', () => {
  const result = answerCityConcierge({
    trip: baseTrip(),
    nowIso: '2026-10-05T12:00:00+03:00',
    intent: 'preferences'
  });

  assert.equal(result.status, 'answered');
  assert.equal(result.facts.find((fact) => fact.kind === 'pace')?.value, 'relaxed');
  assert.equal(result.facts.find((fact) => fact.kind === 'step-free-intent')?.value, 'preferred');
  assert.ok(result.facts.every((fact) => fact.grounding.authority === 'user-preference'));
  assert.equal(result.boundaries.accessibilityVerified, false);
});

test('default preferences are labeled as system defaults, not user-approved preferences', () => {
  const trip = createPersonalTrip({
    id: 'defaults',
    destinationId: 'moscow',
    title: 'Москва',
    startDate: '2026-10-05',
    endDate: '2026-10-05',
    createdAt: '2026-10-04T18:00:00.000Z'
  });

  const result = answerCityConcierge({
    trip,
    nowIso: '2026-10-05T12:00:00+03:00',
    intent: 'preferences'
  });

  assert.ok(result.facts.every((fact) => fact.grounding.authority === 'system-default'));
  assert.ok(result.facts.every((fact) => fact.grounding.verification === 'default'));
});

test('outside trip dates the concierge returns unknown rather than inventing today plan', () => {
  const result = answerCityConcierge({
    trip: baseTrip(),
    nowIso: '2026-10-10T12:00:00+03:00',
    intent: 'today'
  });

  assert.deepEqual(result, {
    intent: 'today',
    status: 'unknown',
    reason: 'trip-not-active-today',
    facts: [],
    boundaries: {
      readOnly: true,
      providerActionAllowed: false,
      routingVerified: false,
      openingHoursVerified: false,
      accessibilityVerified: false,
      weatherVerified: false,
      liveAvailabilityVerified: false
    }
  });
});

test('unsupported question remains unsupported and produces no hidden mutation or invented fact', () => {
  const trip = baseTrip();
  const before = JSON.stringify(trip);
  const result = askCityConcierge({
    trip,
    nowIso: '2026-10-05T12:00:00+03:00',
    prompt: 'Расскажи что-нибудь неожиданное'
  });

  assert.equal(result.status, 'unsupported');
  assert.equal(result.reason, 'unsupported-read-only-intent');
  assert.deepEqual(result.facts, []);
  assert.equal(JSON.stringify(trip), before);
});
