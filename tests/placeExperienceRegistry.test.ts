import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canOpenArchiveLens,
  canOpenModel3d,
  canOpenSpatial,
  getPlaceExperienceCapabilities,
  modelEraFromTimeIndex
} from '../src/spatial/placeExperienceRegistry.ts';

test('Romanov keeps the current documented spatial candidate pipeline', () => {
  const capabilities = getPlaceExperienceCapabilities('romanov-chambers');

  assert.equal(capabilities.timeMachine, 'ready');
  assert.equal(capabilities.archiveLens, 'ready');
  assert.equal(capabilities.runtime, 'romanov-v1');
  assert.equal(canOpenArchiveLens('romanov-chambers'), true);
  assert.equal(canOpenModel3d('romanov-chambers'), true);
  assert.equal(canOpenSpatial('romanov-chambers'), true);
  assert.equal(modelEraFromTimeIndex('romanov-chambers', 0), '1857');
  assert.equal(modelEraFromTimeIndex('romanov-chambers', 1), '1859');
  assert.equal(modelEraFromTimeIndex('romanov-chambers', 2), '1859');
});

test('Old English Court has a real Time Machine but cannot borrow Romanov assets', () => {
  const capabilities = getPlaceExperienceCapabilities('old-english-court');

  assert.equal(capabilities.timeMachine, 'ready');
  assert.equal(capabilities.archiveLens, 'needs-asset');
  assert.equal(capabilities.model3d, 'needs-asset');
  assert.equal(capabilities.spatial, 'needs-asset');
  assert.equal(capabilities.runtime, null);
  assert.equal(canOpenArchiveLens('old-english-court'), false);
  assert.equal(canOpenModel3d('old-english-court'), false);
  assert.equal(canOpenSpatial('old-english-court'), false);
  assert.equal(modelEraFromTimeIndex('old-english-court', 1), null);
});

test('unknown and future places fail closed instead of opening another object runtime', () => {
  assert.equal(canOpenArchiveLens('unknown-place'), false);
  assert.equal(canOpenModel3d('unknown-place'), false);
  assert.equal(canOpenSpatial('unknown-place'), false);
  assert.equal(modelEraFromTimeIndex('unknown-place', 0), null);

  const gates = getPlaceExperienceCapabilities('varvarka-gates');
  assert.equal(gates.timeMachine, 'future');
  assert.equal(canOpenModel3d('varvarka-gates'), false);
  assert.equal(canOpenSpatial('varvarka-gates'), false);
});
