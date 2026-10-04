import assert from 'node:assert/strict';
import test from 'node:test';

import type { OnDeviceVisualMatchDecision } from '../src/spatial/onDeviceVisualRecognition.ts';
import {
  fuseVisualAndSensorContext
} from '../src/spatial/visualSensorFusion.ts';
import type { SensorQualityInput } from '../src/spatial/sensorQualityGate.ts';

function visual(
  overrides: Partial<OnDeviceVisualMatchDecision> = {}
): OnDeviceVisualMatchDecision {
  return {
    status: 'strong-candidate',
    siteId: 'site-a',
    packageId: 'package-a',
    referenceSetId: 'set-a',
    referenceId: 'ref-a',
    confidence: 0.96,
    marginToSecond: 0.2,
    reason: 'strict-local-candidate',
    ...overrides
  };
}

function sensor(overrides: Partial<SensorQualityInput> = {}): SensorQualityInput {
  return {
    arAvailable: true,
    arTracking: 'normal',
    modelState: 'ready',
    packageState: 'ready',
    orientationAvailable: true,
    locationPermission: 'granted',
    locationAccuracyMeters: 7,
    headingAccuracyLevel: 3,
    ...overrides
  };
}

function base() {
  return {
    visual: visual(),
    sensor: sensor(),
    locationCompatibility: 'compatible' as const,
    headingCompatibility: 'compatible' as const,
    activePackage: {
      state: 'verified-active' as const,
      packageId: 'package-a'
    }
  };
}

test('strong visual + precise compatible sensors auto-confirms canonical candidate', () => {
  const result = fuseVisualAndSensorContext(base());

  assert.deepEqual(result, {
    status: 'confirmed',
    confirmationMode: 'automatic',
    siteId: 'site-a',
    packageId: 'package-a',
    referenceSetId: 'set-a',
    referenceId: 'ref-a',
    visualConfidence: 0.96,
    sensorState: 'precise',
    locationCompatibility: 'compatible',
    headingCompatibility: 'compatible',
    reason: 'automatic-fusion'
  });
});

test('geographically impossible candidate is blocked even with strong visual confidence', () => {
  const result = fuseVisualAndSensorContext({
    ...base(),
    locationCompatibility: 'incompatible'
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'location-incompatible');
  assert.equal(result.confirmationMode, 'none');
});

test('heading-incompatible candidate is blocked', () => {
  const result = fuseVisualAndSensorContext({
    ...base(),
    headingCompatibility: 'incompatible'
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'heading-incompatible');
});

test('active package must be verified and exactly match the visual candidate package', () => {
  const unverified = fuseVisualAndSensorContext({
    ...base(),
    activePackage: { state: 'unverified', packageId: 'package-a' }
  });
  assert.equal(unverified.status, 'blocked');
  assert.equal(unverified.reason, 'active-package-not-verified');

  const mismatch = fuseVisualAndSensorContext({
    ...base(),
    activePackage: { state: 'verified-active', packageId: 'package-b' }
  });
  assert.equal(mismatch.status, 'blocked');
  assert.equal(mismatch.reason, 'active-package-mismatch');
});

test('insufficient sensor state blocks and cannot be overridden by user confirmation', () => {
  const result = fuseVisualAndSensorContext({
    ...base(),
    sensor: sensor({ arAvailable: false }),
    userConfirmed: true
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'sensor-insufficient');
});

test('degraded sensor state never auto-confirms', () => {
  const result = fuseVisualAndSensorContext({
    ...base(),
    sensor: sensor({ headingAccuracyLevel: 1 })
  });

  assert.equal(result.status, 'needs-user-confirmation');
  assert.equal(result.reason, 'sensor-or-context-degraded');
  assert.equal(result.sensorState, 'degraded');
});

test('unknown coarse context requires confirmation instead of automatic fusion', () => {
  const result = fuseVisualAndSensorContext({
    ...base(),
    locationCompatibility: 'unknown'
  });

  assert.equal(result.status, 'needs-user-confirmation');
  assert.equal(result.reason, 'sensor-or-context-degraded');
});

test('ambiguous visual candidate requires explicit user confirmation', () => {
  const pending = fuseVisualAndSensorContext({
    ...base(),
    visual: visual({
      status: 'needs-user-confirmation',
      reason: 'ambiguous-local-candidate'
    })
  });
  assert.equal(pending.status, 'needs-user-confirmation');
  assert.equal(pending.reason, 'visual-needs-confirmation');

  const confirmed = fuseVisualAndSensorContext({
    ...base(),
    visual: visual({
      status: 'needs-user-confirmation',
      reason: 'ambiguous-local-candidate'
    }),
    userConfirmed: true
  });
  assert.equal(confirmed.status, 'confirmed');
  assert.equal(confirmed.confirmationMode, 'user-assisted');
  assert.equal(confirmed.reason, 'explicit-user-confirmation');
});

test('user confirmation may resolve degraded/unknown context but never an incompatibility', () => {
  const degraded = fuseVisualAndSensorContext({
    ...base(),
    sensor: sensor({ locationAccuracyMeters: 45 }),
    locationCompatibility: 'unknown',
    userConfirmed: true
  });
  assert.equal(degraded.status, 'confirmed');
  assert.equal(degraded.confirmationMode, 'user-assisted');

  const impossible = fuseVisualAndSensorContext({
    ...base(),
    locationCompatibility: 'incompatible',
    userConfirmed: true
  });
  assert.equal(impossible.status, 'blocked');
  assert.equal(impossible.reason, 'location-incompatible');
});

test('visual not-sure cannot be promoted by user confirmation', () => {
  const result = fuseVisualAndSensorContext({
    ...base(),
    visual: visual({
      status: 'not-sure',
      reason: 'low-confidence',
      siteId: 'site-a',
      packageId: 'package-a',
      referenceSetId: 'set-a',
      referenceId: 'ref-a',
      confidence: 0.5
    }),
    userConfirmed: true
  });

  assert.equal(result.status, 'not-sure');
  assert.equal(result.reason, 'visual-not-sure');
});

test('blocked visual recognition stays blocked before sensor fusion', () => {
  const result = fuseVisualAndSensorContext({
    ...base(),
    visual: {
      status: 'blocked',
      reason: 'privacy-contract-violation'
    }
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'visual-blocked');
});

test('fusion output contains bounded states and IDs only', () => {
  const result = fuseVisualAndSensorContext(base());
  const encoded = JSON.stringify(result);

  for (const forbidden of ['latitude', 'longitude', 'rawHeading', 'frame', 'camera']) {
    assert.equal(encoded.includes(forbidden), false);
  }
});
