import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRomanovMeasuredResidual,
  transformRomanovModelPointToWorld
} from '../src/spatial/alignmentResidual.ts';
import { defaultRomanovCalibration, type CalibrationProfile } from '../src/spatial/calibration.ts';
import {
  parseFieldCampaignPackage,
  parseFieldSessionBundle,
  serializeFieldCampaignPackage,
  serializeFieldSessionBundle
} from '../src/spatial/fieldCampaign.ts';
import {
  createFieldSession,
  summarizeFieldMatrix,
  validateFieldSessionIntegrity,
  type FieldDistanceMeters,
  type RomanovFieldSession
} from '../src/spatial/fieldVerification.ts';
import { romanovControlPoints } from '../src/spatial/romanovControlPoints.ts';
import {
  createEmptyRomanovSurveyPacket,
  summarizeRomanovSurvey
} from '../src/spatial/romanovSurvey.ts';

function approvedSurvey() {
  const packet = createEmptyRomanovSurveyPacket();
  packet.points = romanovControlPoints.map((point, index) => ({
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
    measuredBy: 'field-surveyor',
    evidenceRef: `survey-photo-${index + 1}`,
    status: 'verified' as const
  }));
  packet.approvedAt = '2026-09-19T11:00:00.000Z';
  packet.approvedBy = 'survey-lead';
  assert.equal(summarizeRomanovSurvey(packet).complete, true);
  return packet;
}

function localCalibration(
  version: number,
  sessionAnchorId: string,
  worldOffset: number
): CalibrationProfile {
  return {
    ...defaultRomanovCalibration,
    version,
    sessionAnchorId,
    translation: [worldOffset, worldOffset * 0.15, -4 - worldOffset] as [number, number, number],
    rotationEulerDeg: [worldOffset * 0.3, 5 + worldOffset, 0] as [number, number, number]
  };
}

function measuredSession(
  surveyId: string,
  distance: FieldDistanceMeters,
  deviceLabel = 'iPhone 16 Pro #1',
  platform = 'ios',
  calibration = localCalibration(2, 'anchor-device-1', 0)
): RomanovFieldSession {
  const observations = romanovControlPoints.map((point, index) => {
    const modelPoint: [number, number, number] = [index * 0.1, 0, 0];
    const expected = transformRomanovModelPointToWorld(modelPoint, calibration);
    const observed: [number, number, number] = [expected[0] + 0.1, expected[1], expected[2]];
    return buildRomanovMeasuredResidual({
      controlPointId: point.id,
      surveyPacketId: surveyId,
      calibration,
      modelPointMeters: modelPoint,
      observedWorldPointMeters: observed,
      cameraWorldPointMeters: [observed[0], observed[1], observed[2] + distance],
      distanceBucketMeters: distance,
      hitType: 'ExistingPlane',
      capturedAt: '2026-09-19T12:00:00.000Z'
    });
  });

  return createFieldSession({
    era: '1857',
    viewingDistanceMeters: distance,
    calibration,
    devicePlatform: platform,
    deviceVersion: 'test-os',
    deviceLabel,
    appBuild: 'field-build-1',
    surveyPacketId: surveyId,
    observations
  });
}

test('approved survey round-trips as shared field campaign without AR world calibration', () => {
  const survey = approvedSurvey();
  const raw = serializeFieldCampaignPackage(survey);
  const parsed = parseFieldCampaignPackage(raw);

  assert.equal(parsed.survey.id, survey.id);
  assert.equal('calibration' in parsed, false);
});

test('three measured distances from one physical device round-trip as one local-calibration bundle', () => {
  const survey = approvedSurvey();
  const calibration = localCalibration(4, 'iphone-anchor', 2.7);
  const sessions = ([5, 10, 15] as FieldDistanceMeters[]).map((distance) =>
    measuredSession(survey.id, distance, 'iPhone 16 Pro #1', 'ios', calibration)
  );

  assert.equal(sessions.every(validateFieldSessionIntegrity), true);
  const raw = serializeFieldSessionBundle(sessions);
  const parsed = parseFieldSessionBundle(raw);

  assert.equal(parsed.sessions.length, 3);
  assert.equal(parsed.deviceLabel, 'iPhone 16 Pro #1');
  assert.equal(parsed.calibrationVersion, 4);
  assert.deepEqual(parsed.sessions.map((item) => item.viewingDistanceMeters), [5, 10, 15]);
});

test('cross-device matrix accepts different AR world origins and local calibration versions', () => {
  const survey = approvedSurvey();
  const devices = [
    { label: 'ios-a', platform: 'ios', calibration: localCalibration(2, 'a', 0.3) },
    { label: 'ios-b', platform: 'ios', calibration: localCalibration(7, 'b', 4.2) },
    { label: 'android-a', platform: 'android', calibration: localCalibration(3, 'c', -2.1) },
    { label: 'android-b', platform: 'android', calibration: localCalibration(9, 'd', 7.4) }
  ];
  const sessions = devices.flatMap((device) =>
    ([5, 10, 15] as FieldDistanceMeters[]).map((distance) =>
      measuredSession(survey.id, distance, device.label, device.platform, device.calibration)
    )
  );

  const matrix = summarizeFieldMatrix(sessions, { surveyPacketId: survey.id });
  assert.equal(matrix.iosCompleteDevices, 2);
  assert.equal(matrix.androidCompleteDevices, 2);
  assert.equal(matrix.crossPlatformReady, true);
  assert.equal(matrix.surveyPacketId, survey.id);
});

test('one physical device cannot combine distances from different local calibration versions', () => {
  const survey = approvedSurvey();
  const sessions = [
    measuredSession(survey.id, 5, 'device-a', 'ios', localCalibration(2, 'a-v2', 0)),
    measuredSession(survey.id, 10, 'device-a', 'ios', localCalibration(3, 'a-v3', 1)),
    measuredSession(survey.id, 15, 'device-a', 'ios', localCalibration(3, 'a-v3', 1))
  ];
  const matrix = summarizeFieldMatrix(sessions, { surveyPacketId: survey.id });
  assert.equal(matrix.completeDevices.length, 0);
});

test('tampered aggregate residual is rejected during field bundle import', () => {
  const survey = approvedSurvey();
  const session = measuredSession(survey.id, 5);
  const tampered = { ...session, meanResidualCm: session.meanResidualCm + 7 };

  assert.equal(validateFieldSessionIntegrity(tampered), false);
  assert.throws(() => serializeFieldSessionBundle([tampered]), /integrity/);
});

test('duplicate facade point cannot impersonate a five-point measured session', () => {
  const survey = approvedSurvey();
  const session = measuredSession(survey.id, 5);
  const duplicate = {
    ...session,
    observations: session.observations.map(() => session.observations[0]!)
  };

  assert.equal(validateFieldSessionIntegrity(duplicate), false);
});

test('bundle rejects mixed device labels, local calibration versions and survey IDs', () => {
  const survey = approvedSurvey();
  const calA = localCalibration(2, 'a', 0);
  const a = measuredSession(survey.id, 5, 'device-a', 'ios', calA);
  const b = measuredSession(survey.id, 10, 'device-b', 'ios', calA);
  assert.throws(() => serializeFieldSessionBundle([a, b]), /one physical device/);

  const otherVersion = measuredSession(
    survey.id,
    10,
    'device-a',
    'ios',
    localCalibration(3, 'a-v3', 1)
  );
  assert.throws(() => serializeFieldSessionBundle([a, otherVersion]), /one calibration version/);

  const otherSurvey = measuredSession('another-survey', 10, 'device-a', 'ios', calA);
  assert.throws(() => serializeFieldSessionBundle([a, otherSurvey]), /one survey/);
});

test('parsed field bundle revalidates device identity instead of trusting top-level metadata', () => {
  const survey = approvedSurvey();
  const calibration = localCalibration(2, 'a', 0);
  const sessions = ([5, 10, 15] as FieldDistanceMeters[]).map((distance) =>
    measuredSession(survey.id, distance, 'device-a', 'ios', calibration)
  );
  const parsed = JSON.parse(serializeFieldSessionBundle(sessions));
  parsed.deviceLabel = 'device-b';

  assert.throws(() => parseFieldSessionBundle(JSON.stringify(parsed)), /device identity mismatch/);
});


test('same local calibration version cannot combine different placements into one device matrix or bundle', () => {
  const survey = approvedSurvey();
  const placementA = localCalibration(6, 'device-a-anchor-1', 0);
  const placementB = localCalibration(6, 'device-a-anchor-2', 1.5);
  const sessions = [
    measuredSession(survey.id, 5, 'device-a', 'ios', placementA),
    measuredSession(survey.id, 10, 'device-a', 'ios', placementB),
    measuredSession(survey.id, 15, 'device-a', 'ios', placementB)
  ];

  const matrix = summarizeFieldMatrix(sessions, { surveyPacketId: survey.id });
  assert.equal(matrix.completeDevices.length, 0);
  assert.throws(
    () => serializeFieldSessionBundle(sessions),
    /one exact calibration placement/
  );
});

test('parsed bundle rejects geometry tampering even when calibration version is unchanged', () => {
  const survey = approvedSurvey();
  const calibration = localCalibration(6, 'device-a-anchor', 0);
  const sessions = ([5, 10, 15] as FieldDistanceMeters[]).map((distance) =>
    measuredSession(survey.id, distance, 'device-a', 'ios', calibration)
  );
  const parsed = JSON.parse(serializeFieldSessionBundle(sessions));
  parsed.sessions[1].calibration.translation[0] += 0.5;

  assert.throws(
    () => parseFieldSessionBundle(JSON.stringify(parsed)),
    /calibration placement mismatch|integrity validation failed/
  );
});
