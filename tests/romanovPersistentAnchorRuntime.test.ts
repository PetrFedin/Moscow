import assert from 'node:assert/strict';
import test from 'node:test';

import {
  anchorFrameModelToWorld,
  modelWorldToAnchorFrame
} from '../src/spatial/persistentAnchorFrame.ts';
import {
  createPersistentAnchorRecord,
  isIndependentAnchorResolve,
  markAnchorHostLocalized,
  markAnchorResolved,
  markAnchorVerified,
  parsePersistentAnchorPackage,
  serializePersistentAnchorPackage
} from '../src/spatial/persistentAnchor.ts';
import {
  getPersistentAnchorRuntimeConfig,
  parsePersistentAnchorProvider,
  parsePersistentAnchorTtlDays
} from '../src/spatial/persistentAnchorRuntime.ts';
import { defaultRomanovCalibration } from '../src/spatial/calibration.ts';

const verifiedCalibration = {
  ...defaultRomanovCalibration,
  verifiedAt: '2026-09-19T00:00:00.000Z',
  translation: [2.25, 1.1, -5.5] as [number, number, number],
  rotationEulerDeg: [4, 28, -3] as [number, number, number],
  scale: 1
};

test('anchor-frame transform reconstructs the original model pose', () => {
  const anchor = {
    position: [1.2, 0.4, -3.1] as [number, number, number],
    rotationEulerDeg: [2, -35, 1] as [number, number, number]
  };
  const relative = modelWorldToAnchorFrame(verifiedCalibration, anchor);
  const reconstructed = anchorFrameModelToWorld(anchor, relative);

  reconstructed.position.forEach((value, index) => {
    assert.ok(Math.abs(value - verifiedCalibration.translation[index]) < 1e-9);
  });
  const originalR = verifiedCalibration.rotationEulerDeg;
  reconstructed.rotationEulerDeg.forEach((value, index) => {
    assert.ok(Math.abs(value - originalR[index]) < 1e-7);
  });
  assert.equal(reconstructed.scale, 1);
});

test('runtime provider is fail-closed and TTL is bounded', () => {
  assert.equal(parsePersistentAnchorProvider('reactvision'), 'reactvision');
  assert.equal(parsePersistentAnchorProvider('arcore'), 'arcore');
  assert.equal(parsePersistentAnchorProvider('garbage'), 'none');
  assert.equal(parsePersistentAnchorTtlDays('0'), 1);
  assert.equal(parsePersistentAnchorTtlDays('500'), 365);
  assert.deepEqual(getPersistentAnchorRuntimeConfig({}), {
    provider: 'none',
    configured: false,
    ttlDays: 1
  });
});

test('persistent proof requires host continuity and an independent resolving device', () => {
  const hostPose = {
    position: [1, 0, -3] as [number, number, number],
    rotationEulerDeg: [0, 20, 0] as [number, number, number]
  };
  const relative = modelWorldToAnchorFrame(verifiedCalibration, hostPose);
  let anchor = createPersistentAnchorRecord({
    provider: 'reactvision',
    providerAnchorId: 'cloud-anchor-1',
    calibration: verifiedCalibration,
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: relative,
    hostedByDeviceLabel: 'iPhone 16 Pro #1'
  });

  assert.throws(() => markAnchorVerified(anchor, { verifiedByDeviceLabel: 'Pixel 10 Pro #1' }));

  anchor = markAnchorHostLocalized(anchor, { continuityResidualCm: 8 });
  anchor = markAnchorResolved(anchor, {
    resolvedByDeviceLabel: 'Pixel 10 Pro #1',
    resolveSessionId: 'resolve-1'
  });
  assert.equal(isIndependentAnchorResolve(anchor), true);
  anchor = markAnchorVerified(anchor, { verifiedByDeviceLabel: 'Pixel 10 Pro #1' });
  assert.equal(anchor.state, 'verified');

  const roundTrip = parsePersistentAnchorPackage(serializePersistentAnchorPackage(anchor));
  assert.equal(roundTrip.providerAnchorId, 'cloud-anchor-1');
  assert.equal(roundTrip.hostContinuityPassed, true);
  assert.equal(roundTrip.verifiedByDeviceLabel, 'Pixel 10 Pro #1');
});

test('same physical device cannot self-verify a persistent anchor', () => {
  const hostPose = {
    position: [0, 0, -3] as [number, number, number],
    rotationEulerDeg: [0, 0, 0] as [number, number, number]
  };
  let anchor = createPersistentAnchorRecord({
    provider: 'arcore',
    providerAnchorId: 'cloud-anchor-2',
    calibration: verifiedCalibration,
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: modelWorldToAnchorFrame(verifiedCalibration, hostPose),
    hostedByDeviceLabel: 'device-a'
  });
  anchor = markAnchorHostLocalized(anchor, { continuityResidualCm: 5 });
  anchor = markAnchorResolved(anchor, { resolvedByDeviceLabel: 'device-a' });
  assert.equal(isIndependentAnchorResolve(anchor), false);
  assert.throws(() => markAnchorVerified(anchor, { verifiedByDeviceLabel: 'device-a' }));
});
