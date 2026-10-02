import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateSensorQuality } from '../src/spatial/sensorQualityGate.ts';

const preciseBase = {
  arAvailable: true,
  arTracking: 'normal' as const,
  modelState: 'ready' as const,
  packageState: 'ready' as const,
  orientationAvailable: true,
  locationPermission: 'granted' as const,
  locationAccuracyMeters: 8,
  headingAccuracyLevel: 3 as const
};

test('precise state requires healthy tracking, verified package and good sensor quality', () => {
  const result = evaluateSensorQuality(preciseBase);
  assert.equal(result.state, 'precise');
  assert.equal(result.precisePlacementAllowed, true);
  assert.equal(result.manualAlignmentAllowed, true);
  assert.equal(result.fallbackRequired, false);
  assert.deepEqual(result.reasons, []);
});

test('unknown location and heading degrade to manual alignment rather than claiming precision', () => {
  const result = evaluateSensorQuality({
    ...preciseBase,
    locationPermission: 'unknown',
    locationAccuracyMeters: null,
    headingAccuracyLevel: null
  });
  assert.equal(result.state, 'degraded');
  assert.equal(result.precisePlacementAllowed, false);
  assert.equal(result.manualAlignmentAllowed, true);
  assert.ok(result.reasons.includes('location-permission-not-checked'));
  assert.ok(result.reasons.includes('heading-accuracy-unknown'));
});

test('coarse location or weak compass calibration stays degraded', () => {
  const result = evaluateSensorQuality({
    ...preciseBase,
    locationAccuracyMeters: 75,
    headingAccuracyLevel: 1
  });
  assert.equal(result.state, 'degraded');
  assert.equal(result.manualAlignmentAllowed, true);
  assert.ok(result.reasons.includes('location-accuracy-degraded'));
  assert.ok(result.reasons.includes('heading-accuracy-degraded'));
});

test('model loading blocks anchor placement until the scene is ready', () => {
  const result = evaluateSensorQuality({
    ...preciseBase,
    modelState: 'loading'
  });
  assert.equal(result.state, 'insufficient');
  assert.equal(result.manualAlignmentAllowed, false);
  assert.equal(result.fallbackRequired, true);
  assert.ok(result.reasons.includes('model-not-ready'));
});

test('unverified or missing package cannot present a spatial placement as ready', () => {
  const unverified = evaluateSensorQuality({
    ...preciseBase,
    packageState: 'unverified'
  });
  assert.equal(unverified.state, 'insufficient');
  assert.ok(unverified.reasons.includes('destination-package-unverified'));

  const missing = evaluateSensorQuality({
    ...preciseBase,
    packageState: 'missing'
  });
  assert.equal(missing.state, 'insufficient');
  assert.ok(missing.reasons.includes('destination-package-missing'));
});

test('tracking not ready blocks placement even when GPS and compass are good', () => {
  const result = evaluateSensorQuality({
    ...preciseBase,
    arTracking: 'unknown'
  });
  assert.equal(result.state, 'insufficient');
  assert.equal(result.precisePlacementAllowed, false);
  assert.equal(result.manualAlignmentAllowed, false);
  assert.ok(result.reasons.includes('ar-tracking-not-ready'));
});
