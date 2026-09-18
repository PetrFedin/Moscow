import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTouristRoutePlan,
  estimateTouristRouteMinutes
} from '../src/features/planning/touristPlanner.ts';

test('15 minute tourist route keeps one meaningful stop and respects interest', () => {
  const trade = buildTouristRoutePlan(15, 'trade');
  const architecture = buildTouristRoutePlan(15, 'architecture');

  assert.deepEqual(trade.stopIds, ['old-english-court']);
  assert.deepEqual(architecture.stopIds, ['romanov-chambers']);
  assert.ok(trade.estimatedMinutes <= 15);
  assert.ok(architecture.estimatedMinutes <= 15);
});

test('30 minute trade route contains two stops without exceeding budget', () => {
  const plan = buildTouristRoutePlan(30, 'trade');
  assert.deepEqual(plan.stopIds, ['old-english-court', 'romanov-chambers']);
  assert.equal(plan.estimatedMinutes, 21);
});

test('45 minute highlights route preserves full pilot route', () => {
  const plan = buildTouristRoutePlan(45, 'highlights');
  assert.deepEqual(plan.stopIds, ['romanov-chambers', 'old-english-court', 'varvarka-gates']);
  assert.equal(plan.estimatedMinutes, estimateTouristRouteMinutes(plan.stopIds));
  assert.equal(plan.estimatedMinutes, 32);
});
