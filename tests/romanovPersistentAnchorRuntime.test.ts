import assert from 'node:assert/strict';
import test from 'node:test';

import {
  anchorFrameModelToWorld,
  modelWorldToAnchorFrame,
  rotationMatrixAngularDistanceDeg
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
import {
  advanceCalibrationVersionForSave,
  defaultRomanovCalibration,
  isCalibrationBoundToSession
} from '../src/spatial/calibration.ts';

const HOST_LOCAL_ANCHOR = 'local-anchor-host';
const verifiedCalibration = {
  ...defaultRomanovCalibration,
  sessionAnchorId: HOST_LOCAL_ANCHOR,
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
    const expected = verifiedCalibration.translation[index];
    assert.notEqual(expected, undefined);
    assert.ok(Math.abs(value - expected!) < 1e-9);
  });
  assert.ok(rotationMatrixAngularDistanceDeg(
    reconstructed.rotationEulerDeg,
    verifiedCalibration.rotationEulerDeg
  ) < 1e-7);
  assert.equal(reconstructed.scale, 1);
});

test('calibration save binds to one local AR session anchor', () => {
  const next = advanceCalibrationVersionForSave(defaultRomanovCalibration, 'session-anchor-a');
  assert.equal(isCalibrationBoundToSession(next, 'session-anchor-a'), true);
  assert.equal(isCalibrationBoundToSession(next, 'session-anchor-b'), false);
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
    hostSessionAnchorId: HOST_LOCAL_ANCHOR,
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: relative,
    hostedByDeviceLabel: 'iPhone 16 Pro #1'
  });

  assert.throws(() => markAnchorVerified(anchor, { verifiedByDeviceLabel: 'Pixel 10 Pro #1' }));

  anchor = markAnchorHostLocalized(anchor, {
    continuityResidualCm: 8,
    continuityRotationDeg: 0.7
  });
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
  assert.equal(roundTrip.hostContinuityRotationDeg, 0.7);
  assert.equal(roundTrip.verifiedByDeviceLabel, 'Pixel 10 Pro #1');
});

test('angular host drift blocks persistent verification even when position is good', () => {
  const hostPose = {
    position: [0, 0, -3] as [number, number, number],
    rotationEulerDeg: [0, 0, 0] as [number, number, number]
  };
  let anchor = createPersistentAnchorRecord({
    provider: 'reactvision',
    providerAnchorId: 'cloud-anchor-angle-fail',
    calibration: verifiedCalibration,
    hostSessionAnchorId: HOST_LOCAL_ANCHOR,
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: modelWorldToAnchorFrame(verifiedCalibration, hostPose),
    hostedByDeviceLabel: 'device-a'
  });
  anchor = markAnchorHostLocalized(anchor, {
    continuityResidualCm: 5,
    continuityRotationDeg: 4
  });
  assert.equal(anchor.hostContinuityPassed, false);
  anchor = markAnchorResolved(anchor, { resolvedByDeviceLabel: 'device-b' });
  assert.throws(() => markAnchorVerified(anchor, { verifiedByDeviceLabel: 'device-b' }), /continuity/);
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
    hostSessionAnchorId: HOST_LOCAL_ANCHOR,
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: modelWorldToAnchorFrame(verifiedCalibration, hostPose),
    hostedByDeviceLabel: 'device-a'
  });
  anchor = markAnchorHostLocalized(anchor, {
    continuityResidualCm: 5,
    continuityRotationDeg: 0.5
  });
  anchor = markAnchorResolved(anchor, { resolvedByDeviceLabel: 'device-a' });
  assert.equal(isIndependentAnchorResolve(anchor), false);
  assert.throws(() => markAnchorVerified(anchor, { verifiedByDeviceLabel: 'device-a' }));
});

test('cloud host rejects calibration from a different AR session anchor', () => {
  const hostPose = {
    position: [0, 0, -3] as [number, number, number],
    rotationEulerDeg: [0, 0, 0] as [number, number, number]
  };
  assert.throws(() => createPersistentAnchorRecord({
    provider: 'reactvision',
    providerAnchorId: 'bad-session',
    calibration: verifiedCalibration,
    hostSessionAnchorId: 'other-local-anchor',
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: modelWorldToAnchorFrame(verifiedCalibration, hostPose),
    hostedByDeviceLabel: 'device-a'
  }), /hosting AR session/);
});
