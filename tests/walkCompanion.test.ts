import assert from 'node:assert/strict';
import test from 'node:test';

import { places } from '../src/data/places.ts';
import {
  buildPlaceWalkNarration,
  distanceMeters,
  getObservationMission
} from '../src/features/walk/walkCompanionContract.ts';

test('walk narration stays grounded in the localized place content', () => {
  const romanov = places.find((place) => place.id === 'romanov-chambers');
  assert.ok(romanov);
  const narration = buildPlaceWalkNarration(romanov, 'ru');
  assert.match(narration, /Палаты бояр Романовых/);
  assert.ok(narration.includes(romanov.shortStory));
  assert.ok(narration.includes(romanov.highlights[0] ?? ''));
});

test('observation mission id is stable and tied to the place', () => {
  const place = places.find((item) => item.id === 'old-english-court');
  assert.ok(place);
  const mission = getObservationMission(place, 'ru');
  assert.equal(mission.id, 'observation:old-english-court:v1');
  assert.match(mission.prompt, /Найдите глазами/);
});

test('proximity distance is deterministic enough for a location trigger', () => {
  const a = { latitude: 55.75193, longitude: 37.62845 };
  const near = { latitude: 55.752, longitude: 37.62845 };
  const far = { latitude: 55.7541, longitude: 37.6325 };

  const nearMeters = distanceMeters(a, near);
  const farMeters = distanceMeters(a, far);

  assert.ok(nearMeters > 5 && nearMeters < 10);
  assert.ok(farMeters > 200);
  assert.ok(farMeters > nearMeters);
});
