import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRomanovMeasuredResidual,
  transformRomanovModelPointToWorld
} from '../src/spatial/alignmentResidual.ts';
import { defaultRomanovCalibration, type CalibrationProfile } from '../src/spatial/calibration.ts';
import {
  createFieldSession,
  type FieldDistanceMeters,
  type RomanovFieldSession
} from '../src/spatial/fieldVerification.ts';
import {
  createPersistentAnchorRecord,
  markAnchorHostLocalized,
  markAnchorResolved,
  markAnchorVerified
} from '../src/spatial/persistentAnchor.ts';
import { modelWorldToAnchorFrame } from '../src/spatial/persistentAnchorFrame.ts';
import { romanovControlPoints } from '../src/spatial/romanovControlPoints.ts';
import {
  summarizeRomanovReleaseGate,
  verifyCalibration
} from '../src/spatial/romanovReleaseGate.ts';
import {
  createEmptyRomanovSurveyPacket,
  type RomanovSurveyPacket
} from '../src/spatial/romanovSurvey.ts';

function survey(): RomanovSurveyPacket {
  const value = createEmptyRomanovSurveyPacket();
  value.points = romanovControlPoints.map((point, index) => ({
    controlPointId: point.id,
    modelPointMeters: [index * 0.1, 0, 0] as [number, number, number],
    geodetic: {
      latitude: 55.75193 + index * 0.000001,
      longitude: 37.62845 + index * 0.000001,
      altitudeMeters: 150
    },
    method: 'total-station' as const,
    horizontalAccuracyCm: 2,
    verticalAccuracyCm: 3,
    measuredAt: '2026-09-19T10:00:00.000Z',
    measuredBy: 'surveyor',
    evidenceRef: `evidence-${index}`,
    status: 'verified' as const
  }));
  value.approvedAt = '2026-09-19T11:00:00.000Z';
  value.approvedBy = 'survey-lead';
  return value;
}

function calibration(
  version: number,
  sessionAnchorId: string,
  offset: number
): CalibrationProfile {
  return {
    ...defaultRomanovCalibration,
    version,
    sessionAnchorId,
    translation: [offset, offset * 0.1, -4 - offset] as [number, number, number],
    rotationEulerDeg: [0, offset, 0] as [number, number, number]
  };
}

function session(
  surveyPacketId: string,
  distance: FieldDistanceMeters,
  deviceLabel: string,
  platform: string,
  cal: CalibrationProfile
): RomanovFieldSession {
  const observations = romanovControlPoints.map((point, index) => {
    const modelPoint: [number, number, number] = [index * 0.1, 0, 0];
    const expected = transformRomanovModelPointToWorld(modelPoint, cal);
    const observed: [number, number, number] = [expected[0] + 0.1, expected[1], expected[2]];
    return buildRomanovMeasuredResidual({
      controlPointId: point.id,
      surveyPacketId,
      calibration: cal,
      modelPointMeters: modelPoint,
      observedWorldPointMeters: observed,
      cameraWorldPointMeters: [observed[0], observed[1], observed[2] + distance],
      distanceBucketMeters: distance,
      hitType: 'ExistingPlane'
    });
  });
  return createFieldSession({
    era: '1857',
    viewingDistanceMeters: distance,
    calibration: cal,
    devicePlatform: platform,
    deviceVersion: 'test-os',
    deviceLabel,
    surveyPacketId,
    observations
  });
}

function fullMatrix(surveyPacketId: string) {
  const devices = [
    { label: 'ios-a', platform: 'ios', cal: calibration(2, 'ios-a-anchor', 0.2) },
    { label: 'ios-b', platform: 'ios', cal: calibration(5, 'ios-b-anchor', 2.2) },
    { label: 'android-a', platform: 'android', cal: calibration(3, 'android-a-anchor', -1.3) },
    { label: 'android-b', platform: 'android', cal: calibration(8, 'android-b-anchor', 5.1) }
  ];
  return devices.flatMap((device) =>
    ([5, 10, 15] as FieldDistanceMeters[]).map((distance) =>
      session(surveyPacketId, distance, device.label, device.platform, device.cal)
    )
  );
}

test('verified portal stays blocked until independent persistent-anchor proof completes', () => {
  const measuredSurvey = survey();
  const sessions = fullMatrix(measuredSurvey.id);
  const hostLocalAnchorId = 'authority-host-local-anchor';
  const hostCalibration = calibration(11, hostLocalAnchorId, 0.7);
  const verifiedCalibration = verifyCalibration({
    calibration: hostCalibration,
    survey: measuredSurvey,
    sessions,
    localAnchorId: hostLocalAnchorId
  });

  const hostPose = {
    position: [0.25, 0.05, -2.5] as [number, number, number],
    rotationEulerDeg: [0, 8, 0] as [number, number, number]
  };
  let anchor = createPersistentAnchorRecord({
    provider: 'reactvision',
    providerAnchorId: 'cloud-anchor-release-gate',
    calibration: verifiedCalibration,
    hostSessionAnchorId: hostLocalAnchorId,
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: modelWorldToAnchorFrame(verifiedCalibration, hostPose),
    hostedByDeviceLabel: 'ios-authority'
  });

  let gate = summarizeRomanovReleaseGate({
    calibration: verifiedCalibration,
    survey: measuredSurvey,
    sessions,
    anchors: [anchor]
  });
  assert.equal(gate.state, 'production-candidate');
  assert.ok(gate.blockers.includes('persistent-anchor-frame-not-verified'));
  assert.ok(gate.blockers.includes('independent-anchor-resolve-not-verified'));

  anchor = markAnchorHostLocalized(anchor, {
    continuityResidualCm: 6,
    continuityRotationDeg: 0.4
  });
  gate = summarizeRomanovReleaseGate({
    calibration: verifiedCalibration,
    survey: measuredSurvey,
    sessions,
    anchors: [anchor]
  });
  assert.equal(gate.state, 'production-candidate');
  assert.equal(gate.persistentAnchorFrameVerified, true);
  assert.equal(gate.persistentAnchorVerified, false);

  anchor = markAnchorResolved(anchor, {
    resolvedByDeviceLabel: 'android-independent',
    resolveSessionId: 'resolve-independent-1'
  });
  gate = summarizeRomanovReleaseGate({
    calibration: verifiedCalibration,
    survey: measuredSurvey,
    sessions,
    anchors: [anchor]
  });
  assert.equal(gate.state, 'production-candidate');

  anchor = markAnchorVerified(anchor, { verifiedByDeviceLabel: 'android-independent' });
  gate = summarizeRomanovReleaseGate({
    calibration: verifiedCalibration,
    survey: measuredSurvey,
    sessions,
    anchors: [anchor]
  });
  assert.equal(gate.fieldMatrixComplete, true);
  assert.equal(gate.persistentAnchorVerified, true);
  assert.equal(gate.independentAnchorResolveVerified, true);
  assert.equal(gate.state, 'field-verified-spatial-scene');
  assert.deepEqual(gate.blockers, []);
});


test('release gate rejects a different calibration snapshot even when its local version collides', () => {
  const measuredSurvey = survey();
  const sessions = fullMatrix(measuredSurvey.id);
  const hostLocalAnchorId = 'snapshot-host-anchor';
  const verifiedCalibration = verifyCalibration({
    calibration: calibration(12, hostLocalAnchorId, 0.4),
    survey: measuredSurvey,
    sessions,
    localAnchorId: hostLocalAnchorId
  });
  const hostPose = {
    position: [0.1, 0.02, -2.2] as [number, number, number],
    rotationEulerDeg: [0, 4, 0] as [number, number, number]
  };
  let anchor = createPersistentAnchorRecord({
    provider: 'reactvision',
    providerAnchorId: 'cloud-anchor-snapshot',
    calibration: verifiedCalibration,
    hostSessionAnchorId: hostLocalAnchorId,
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: modelWorldToAnchorFrame(verifiedCalibration, hostPose),
    hostedByDeviceLabel: 'ios-host'
  });
  anchor = markAnchorHostLocalized(anchor, {
    continuityResidualCm: 4,
    continuityRotationDeg: 0.2
  });
  anchor = markAnchorResolved(anchor, {
    resolvedByDeviceLabel: 'android-independent',
    resolveSessionId: 'resolve-snapshot'
  });
  anchor = markAnchorVerified(anchor, { verifiedByDeviceLabel: 'android-independent' });

  const collidingCalibration: CalibrationProfile = {
    ...verifiedCalibration,
    translation: [
      verifiedCalibration.translation[0] + 0.5,
      verifiedCalibration.translation[1],
      verifiedCalibration.translation[2]
    ]
  };
  const gate = summarizeRomanovReleaseGate({
    calibration: collidingCalibration,
    survey: measuredSurvey,
    sessions,
    anchors: [anchor]
  });

  assert.equal(gate.state, 'production-candidate');
  assert.equal(gate.persistentAnchorFrameVerified, false);
  assert.equal(gate.persistentAnchorVerified, false);
  assert.ok(gate.blockers.includes('persistent-anchor-frame-not-verified'));
});
