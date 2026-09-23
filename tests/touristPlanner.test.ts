import assert from 'node:assert/strict';
import test from 'node:test';

import { pilotRoute, places } from '../src/data/places.ts';
import {
  TOURIST_ESTIMATED_WALK_METERS_PER_MINUTE,
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

test('30 minute trade route follows the west-to-east corridor without backtracking', () => {
  const plan = buildTouristRoutePlan(30, 'trade');
  assert.deepEqual(plan.stopIds, [
    'church-st-barbara',
    'old-english-court',
    'romanov-chambers'
  ]);
  assert.equal(plan.estimatedMinutes, 26);
});

test('45 minute highlights route is the full five-stop Varvarka pilot', () => {
  const plan = buildTouristRoutePlan(45, 'highlights');
  assert.deepEqual(plan.stopIds, pilotRoute.stopIds);
  assert.equal(plan.estimatedMinutes, 45);
});

test('full Varvarka pilot has five source-backed stops and fits the 45 minute budget', () => {
  assert.deepEqual(pilotRoute.stopIds, [
    'church-st-barbara',
    'old-english-court',
    'romanov-chambers',
    'znamensky-cathedral',
    'varvarka-gates'
  ]);
  assert.equal(new Set(pilotRoute.stopIds).size, 5);
  assert.equal(TOURIST_ESTIMATED_WALK_METERS_PER_MINUTE, 75);
  assert.equal(estimateTouristRouteMinutes(pilotRoute.stopIds), 45);
  assert.equal(pilotRoute.durationMinutes, 45);
  assert.equal(pilotRoute.distanceKm, 0.7);

  const byId = new Map(places.map((place) => [place.id, place]));
  for (const id of pilotRoute.stopIds) {
    const place = byId.get(id);
    assert.ok(place, `missing pilot place: ${id}`);
    assert.ok(place.sources.length > 0, `pilot place has no source: ${id}`);
    assert.ok(place.experienceMinutes > 0, `pilot place has no content duration: ${id}`);
  }
});

test('45 minute architecture selection remains a coherent physical corridor', () => {
  const plan = buildTouristRoutePlan(45, 'architecture');
  assert.deepEqual(plan.stopIds, pilotRoute.stopIds);
  assert.equal(plan.estimatedMinutes, 45);
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
  assert.equal(plan.estimatedMinutes, 26);
});
