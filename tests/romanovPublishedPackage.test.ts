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
import { validatePublishedSpatialPackage } from '../src/spatial/publishedSpatialPackage.ts';
import { romanovControlPoints } from '../src/spatial/romanovControlPoints.ts';
import { buildRomanovPublishedPackageFromEvidence } from '../src/spatial/romanovPublishedPackage.ts';
import { verifyCalibration } from '../src/spatial/romanovReleaseGate.ts';
import {
  createEmptyRomanovSurveyPacket,
  type RomanovSurveyPacket
} from '../src/spatial/romanovSurvey.ts';

function approvedSurvey(): RomanovSurveyPacket {
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
    measuredAt: '2026-09-25T10:00:00.000Z',
    measuredBy: 'survey-authority',
    evidenceRef: `survey-evidence-${index}`,
    status: 'verified' as const
  }));
  value.approvedAt = '2026-09-25T11:00:00.000Z';
  value.approvedBy = 'survey-lead';
  return value;
}

function localCalibration(
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

function measuredSession(
  surveyPacketId: string,
  distance: FieldDistanceMeters,
  deviceLabel: string,
  platform: string,
  calibration: CalibrationProfile
): RomanovFieldSession {
  const observations = romanovControlPoints.map((point, index) => {
    const modelPoint: [number, number, number] = [index * 0.1, 0, 0];
    const expected = transformRomanovModelPointToWorld(modelPoint, calibration);
    const observed: [number, number, number] = [
      expected[0] + 0.1,
      expected[1],
      expected[2]
    ];

    return buildRomanovMeasuredResidual({
      controlPointId: point.id,
      surveyPacketId,
      calibration,
      modelPointMeters: modelPoint,
      observedWorldPointMeters: observed,
      cameraWorldPointMeters: [observed[0], observed[1], observed[2] + distance],
      distanceBucketMeters: distance,
      hitType: 'ExistingPlane',
      capturedAt: '2026-09-25T12:00:00.000Z'
    });
  });

  return createFieldSession({
    era: '1857',
    viewingDistanceMeters: distance,
    calibration,
    devicePlatform: platform,
    deviceVersion: 'test-os',
    deviceLabel,
    appBuild: 'package-proof-test',
    surveyPacketId,
    observations
  });
}

function fullMatrix(
  surveyPacketId: string,
  host: { label: string; platform: string; calibration: CalibrationProfile }
) {
  const devices = [
    host,
    {
      label: 'ios-b',
      platform: 'ios',
      calibration: localCalibration(5, 'ios-b-anchor', 2.2)
    },
    {
      label: 'android-a',
      platform: 'android',
      calibration: localCalibration(3, 'android-a-anchor', -1.3)
    },
    {
      label: 'android-b',
      platform: 'android',
      calibration: localCalibration(8, 'android-b-anchor', 5.1)
    }
  ];

  return devices.flatMap((device) =>
    ([5, 10, 15] as FieldDistanceMeters[]).map((distance) =>
      measuredSession(
        surveyPacketId,
        distance,
        device.label,
        device.platform,
        device.calibration
      )
    )
  );
}

function completeReleaseEvidence() {
  const survey = approvedSurvey();
  const hostLocalAnchorId = 'published-package-host-anchor';
  const hostCalibration = localCalibration(11, hostLocalAnchorId, 0.7);
  const sessions = fullMatrix(survey.id, {
    label: 'ios-authority',
    platform: 'ios',
    calibration: hostCalibration
  });

  const calibration = verifyCalibration({
    calibration: hostCalibration,
    survey,
    sessions,
    localAnchorId: hostLocalAnchorId,
    deviceLabel: 'ios-authority',
    devicePlatform: 'ios'
  });

  const hostPose = {
    position: [0.25, 0.05, -2.5] as [number, number, number],
    rotationEulerDeg: [0, 8, 0] as [number, number, number]
  };

  let anchor = createPersistentAnchorRecord({
    provider: 'reactvision',
    providerAnchorId: 'cloud-anchor-published-package-test',
    calibration,
    hostSessionAnchorId: hostLocalAnchorId,
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: modelWorldToAnchorFrame(calibration, hostPose),
    hostedByDeviceLabel: 'ios-authority'
  });

  anchor = markAnchorHostLocalized(anchor, {
    continuityResidualCm: 6,
    continuityRotationDeg: 0.4
  });
  anchor = markAnchorResolved(anchor, {
    resolvedByDeviceLabel: 'android-independent',
    resolveSessionId: 'published-package-resolve-1'
  });
  anchor = markAnchorVerified(anchor, {
    verifiedByDeviceLabel: 'android-independent'
  });

  return { survey, sessions, calibration, anchors: [anchor] };
}

test('Romanov promotion builder stays production-candidate when field evidence is incomplete', () => {
  const survey = createEmptyRomanovSurveyPacket();
  const pkg = buildRomanovPublishedPackageFromEvidence({
    survey,
    sessions: [],
    calibration: defaultRomanovCalibration,
    anchors: []
  });

  assert.equal(pkg.releaseState, 'production-candidate');
  assert.equal(pkg.fieldVerification.releaseGateState, 'production-candidate');
  assert.equal(pkg.fieldVerification.surveyVerified, false);
  assert.equal(pkg.fieldVerification.multiDeviceMatrixPassed, false);
  assert.equal(pkg.fieldVerification.persistentAnchorVerified, false);
  assert.ok(pkg.fieldVerification.releaseBlockers?.includes('survey-packet-incomplete'));
  assert.ok(pkg.fieldVerification.releaseBlockers?.includes('cross-device-field-matrix-incomplete'));

  const validation = validatePublishedSpatialPackage(pkg);
  assert.equal(validation.valid, true);
});

test('Romanov promotion builder derives field-verified only from the complete release gate', () => {
  const evidence = completeReleaseEvidence();
  const pkg = buildRomanovPublishedPackageFromEvidence({
    ...evidence,
    publishedAt: '2026-09-25T15:00:00.000Z',
    publisher: 'Moscow in Time'
  });

  assert.equal(pkg.releaseState, 'field-verified');
  assert.equal(pkg.fieldVerification.releaseGateState, 'field-verified-spatial-scene');
  assert.equal(pkg.fieldVerification.surveyVerified, true);
  assert.equal(pkg.fieldVerification.multiDeviceMatrixPassed, true);
  assert.equal(pkg.fieldVerification.fieldSessionIds?.length, 12);
  assert.equal(pkg.fieldVerification.calibrationVersion, evidence.calibration.version);
  assert.deepEqual(pkg.fieldVerification.calibrationMetricBinding, {
    metricAuthorityId: pkg.authority.metric.id,
    metricAuthorityVersion: pkg.authority.metric.version,
    modelPackVersion: pkg.authority.metric.modelPackVersion
  });
  assert.equal(pkg.fieldVerification.persistentAnchorVerified, true);
  assert.deepEqual(pkg.fieldVerification.persistentAnchorProofIds, [evidence.anchors[0]!.id]);
  assert.deepEqual(pkg.fieldVerification.releaseBlockers, []);
  assert.ok(pkg.fieldVerification.verifiedAt);

  const validation = validatePublishedSpatialPackage(pkg);
  assert.equal(validation.valid, true);
  assert.equal(
    validation.publishable,
    false,
    'field proof must not silently override unresolved source-rights review'
  );
  assert.ok(validation.publicationBlockers.includes('rights-review-required:naidenov-46'));
});

test('field-verified promotion requires an explicit publication timestamp', () => {
  const evidence = completeReleaseEvidence();

  assert.throws(
    () => buildRomanovPublishedPackageFromEvidence(evidence),
    /publishedAt is required/
  );
});


test('field-session ids bind physical device identity instead of timestamp and distance alone', () => {
  const survey = approvedSurvey();
  const ios = measuredSession(
    survey.id,
    5,
    'iPhone 16 Pro #1',
    'ios',
    localCalibration(2, 'ios-anchor', 0)
  );
  const android = measuredSession(
    survey.id,
    5,
    'Pixel 10 Pro #1',
    'android',
    localCalibration(3, 'android-anchor', 1)
  );

  assert.match(ios.id, /ios-iphone-16-pro-1-5m$/);
  assert.match(android.id, /android-pixel-10-pro-1-5m$/);
  assert.notEqual(ios.id, android.id);
});


test('malformed verified anchor proof cannot promote or become package verification authority', () => {
  const evidence = completeReleaseEvidence();
  const validAnchor = evidence.anchors[0]!;
  const tamperedAnchor = {
    ...validAnchor,
    verifiedByDeviceLabel: 'device-that-did-not-resolve'
  };

  const pkg = buildRomanovPublishedPackageFromEvidence({
    ...evidence,
    anchors: [tamperedAnchor],
    publishedAt: '2026-09-25T16:00:00.000Z'
  });

  assert.equal(pkg.releaseState, 'production-candidate');
  assert.equal(pkg.fieldVerification.persistentAnchorVerified, false);
  assert.deepEqual(pkg.fieldVerification.persistentAnchorProofIds, []);
  assert.ok(pkg.fieldVerification.releaseBlockers?.includes('persistent-anchor-not-verified'));
});

test('serialized field package rejects calibration metric binding drift', () => {
  const evidence = completeReleaseEvidence();
  const pkg = buildRomanovPublishedPackageFromEvidence({
    ...evidence,
    publishedAt: '2026-09-25T16:10:00.000Z'
  });
  assert.equal(pkg.releaseState, 'field-verified');
  assert.ok(pkg.fieldVerification.calibrationMetricBinding);

  const tampered = structuredClone(pkg);
  tampered.fieldVerification.calibrationMetricBinding = {
    metricAuthorityId: 'stale-metric-authority',
    metricAuthorityVersion: 999,
    modelPackVersion: 'stale-pack'
  };

  const validation = validatePublishedSpatialPackage(tampered);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('calibration-metric-binding-mismatch'));
});
