import assert from 'node:assert/strict';
import test from 'node:test';

import { planDestinationJourney } from '../src/travel/destinationJourneyPlanner.ts';
import type { DestinationPackage } from '../src/travel/destinationPackage.ts';
import { moscowVarvarkaDestinationPackage } from '../src/travel/moscowDestinationPackage.ts';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

test('planner uses published Varvarka route authority instead of inventing geometry', () => {
  const plan = planDestinationJourney(moscowVarvarkaDestinationPackage, {
    budgetMinutes: 45,
    themes: ['история Москвы'],
    requiredNodeIds: ['romanov-chambers']
  });

  assert.equal(plan.status, 'ready');
  if (plan.status !== 'ready') return;

  assert.equal(plan.routeId, 'varvarka-45');
  assert.equal(plan.estimatedMinutes, 45);
  assert.ok(plan.nodeIds.includes('romanov-chambers'));
  assert.deepEqual(plan.bookingHandoffs, []);
});

test('planner refuses to manufacture a shorter route when published authority does not fit budget', () => {
  const plan = planDestinationJourney(moscowVarvarkaDestinationPackage, {
    budgetMinutes: 20,
    themes: ['история Москвы'],
    requiredNodeIds: ['romanov-chambers']
  });

  assert.equal(plan.status, 'needs-routing-authority');
  if (plan.status !== 'needs-routing-authority') return;

  assert.ok(plan.suggestedNodeIds.includes('romanov-chambers'));
  assert.ok(plan.explanation.includes('do-not-synthesize-travel-time-from-content-coordinates'));
});

test('planner returns booking handoffs only from nodes already included in the selected route', () => {
  const pkg: DestinationPackage = {
    schemaVersion: 1,
    id: 'region-journey-v1',
    version: 1,
    destination: {
      id: 'region-journey',
      scope: 'region',
      titleRu: 'Регион путешествия',
      countryCode: 'RU'
    },
    publisher: 'Regional DMO',
    languages: ['ru'],
    sources: [
      {
        id: 'source',
        owner: 'Regional DMO',
        title: 'Официальные данные',
        url: 'https://example.org/source',
        accessedAt: '2026-09-26',
        rights: 'official-reference'
      }
    ],
    nodes: [
      {
        id: 'museum',
        kind: 'museum',
        titleRu: 'Музей',
        latitude: 55,
        longitude: 40,
        durationMinutes: 60,
        tags: ['история'],
        sourceIds: ['source'],
        booking: {
          mode: 'city-service',
          provider: 'Regional Tickets',
          action: 'buy-ticket',
          url: 'https://example.org/ticket'
        }
      },
      {
        id: 'food',
        kind: 'food',
        titleRu: 'Обед',
        latitude: 55.001,
        longitude: 40.001,
        durationMinutes: 60,
        tags: ['гастрономия'],
        sourceIds: ['source'],
        booking: {
          mode: 'partner-deep-link',
          provider: 'Restaurant',
          action: 'reserve',
          url: 'https://example.org/reserve'
        }
      },
      {
        id: 'unused-stay',
        kind: 'stay',
        titleRu: 'Гостиница',
        latitude: 55.002,
        longitude: 40.002,
        tags: ['отель'],
        sourceIds: ['source'],
        booking: {
          mode: 'external-provider',
          provider: 'Hotel Provider',
          action: 'book',
          url: 'https://example.org/hotel'
        }
      }
    ],
    routes: [
      {
        id: 'day-route',
        titleRu: 'День в регионе',
        nodeIds: ['museum', 'food'],
        estimatedMinutes: 180,
        themes: ['история', 'гастрономия'],
        source: 'official'
      }
    ],
    commercialPlacements: [],
    offlineEligible: true
  };

  const plan = planDestinationJourney(pkg, {
    budgetMinutes: 240,
    themes: ['история', 'гастрономия'],
    preferredKinds: ['museum', 'food']
  });

  assert.equal(plan.status, 'ready');
  if (plan.status !== 'ready') return;

  assert.deepEqual(plan.bookingHandoffs.map((item) => item.nodeId), ['museum', 'food']);
  assert.equal(plan.bookingHandoffs.length, 2);
});

test('required node not present in destination is rejected rather than silently ignored', () => {
  assert.throws(
    () => planDestinationJourney(moscowVarvarkaDestinationPackage, {
      budgetMinutes: 45,
      requiredNodeIds: ['phantom-place']
    }),
    /Required destination node not found/
  );
});

test('planner ranks route that covers all required nodes and matching themes', () => {
  const pkg = clone(moscowVarvarkaDestinationPackage);
  pkg.routes.push({
    id: 'romanov-only',
    titleRu: 'Палаты Романовых',
    nodeIds: ['romanov-chambers'],
    estimatedMinutes: 15,
    themes: ['архитектура'],
    source: 'editorial'
  });

  const plan = planDestinationJourney(pkg, {
    budgetMinutes: 45,
    themes: ['архитектура'],
    requiredNodeIds: ['romanov-chambers']
  });

  assert.equal(plan.status, 'ready');
  if (plan.status !== 'ready') return;

  assert.equal(plan.routeId, 'romanov-only');
});
