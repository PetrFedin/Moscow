import assert from 'node:assert/strict';
import test from 'node:test';

import { places } from '../src/data/places.ts';
import {
  buildNearbyWalkPlan,
  rankNearbyPlaces
} from '../src/features/nearby/nearbyContract.ts';

test('nearby ranking is distance-first and deterministic', () => {
  const romanov = places.find((place) => place.id === 'romanov-chambers');
  assert.ok(romanov);
  const ranked = rankNearbyPlaces({ latitude: romanov.latitude, longitude: romanov.longitude });
  assert.equal(ranked[0]?.place.id, 'romanov-chambers');
  assert.ok((ranked[0]?.distanceMeters ?? 1) < 1);
});

test('free walk starts from a nearby unvisited stop and stays inside budget', () => {
  const romanov = places.find((place) => place.id === 'romanov-chambers');
  assert.ok(romanov);
  const plan = buildNearbyWalkPlan(
    { latitude: romanov.latitude, longitude: romanov.longitude },
    places,
    ['romanov-chambers'],
    30
  );
  assert.ok(plan.stopIds.length > 0);
  assert.equal(plan.interest, 'nearby');
  assert.ok(plan.estimatedMinutes <= 30);
});

test('if tourist is standing on a visited stop, free walk can start there instead of forcing a detour', () => {
  const romanov = places.find((place) => place.id === 'romanov-chambers');
  assert.ok(romanov);
  const plan = buildNearbyWalkPlan(
    { latitude: romanov.latitude, longitude: romanov.longitude },
    places,
    ['romanov-chambers'],
    45
  );
  assert.equal(plan.stopIds[0], 'romanov-chambers');
});
