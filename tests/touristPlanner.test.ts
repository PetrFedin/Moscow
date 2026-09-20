import assert from 'node:assert/strict';
import test from 'node:test';

import { pilotRoute } from '../src/data/places.ts';
import {
  VARVARKA_WALK_SEGMENT_MINUTES,
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

test('30 minute trade route uses the west-to-east corridor without backtracking', () => {
  const plan = buildTouristRoutePlan(30, 'trade');
  assert.deepEqual(plan.stopIds, [
    'church-st-barbara',
    'old-english-court',
    'romanov-chambers'
  ]);
  assert.equal(plan.estimatedMinutes, 30);
});

test('45 minute highlights keeps the strongest four stops and stays within budget', () => {
  const plan = buildTouristRoutePlan(45, 'highlights');
  assert.deepEqual(plan.stopIds, [
    'old-english-court',
    'romanov-chambers',
    'znamensky-cathedral',
    'varvarka-gates'
  ]);
  assert.equal(plan.estimatedMinutes, 43);
  assert.ok(plan.estimatedMinutes <= 45);
});

test('full Varvarka pilot is a five-stop 53-minute content-and-walk experience', () => {
  assert.deepEqual(pilotRoute.stopIds, [
    'church-st-barbara',
    'old-english-court',
    'romanov-chambers',
    'znamensky-cathedral',
    'varvarka-gates'
  ]);
  assert.equal(new Set(pilotRoute.stopIds).size, 5);
  assert.deepEqual([...VARVARKA_WALK_SEGMENT_MINUTES], [4, 3, 2, 7]);
  assert.equal(estimateTouristRouteMinutes(pilotRoute.stopIds), 53);
  assert.equal(pilotRoute.durationMinutes, 55);
});

test('architecture selection is re-ordered into the physical Varvarka corridor', () => {
  const plan = buildTouristRoutePlan(45, 'architecture');
  assert.deepEqual(plan.stopIds, [
    'church-st-barbara',
    'old-english-court',
    'romanov-chambers',
    'znamensky-cathedral'
  ]);
  assert.equal(plan.estimatedMinutes, 39);
});

test('saved must-see is prioritized without breaking the time budget', () => {
  const plan = buildTouristRoutePlan(15, 'architecture', undefined, ['old-english-court']);
  assert.deepEqual(plan.stopIds, ['old-english-court']);
  assert.ok(plan.estimatedMinutes <= 15);
});

test('unknown and duplicate must-sees do not corrupt the expanded plan', () => {
  const plan = buildTouristRoutePlan(
    30,
    'trade',
    undefined,
    ['missing', 'old-english-court', 'old-english-court']
  );
  assert.deepEqual(plan.stopIds, [
    'church-st-barbara',
    'old-english-court',
    'romanov-chambers'
  ]);
});
