import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRomanovMeasuredResidual } from '../src/spatial/alignmentResidual.ts';
import { defaultRomanovCalibration } from '../src/spatial/calibration.ts';
import {
  parseFieldCampaignPackage,
  parseFieldSessionBundle,
  serializeFieldCampaignPackage,
  serializeFieldSessionBundle
} from '../src/spatial/fieldCampaign.ts';
import {
  createFieldSession,
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

function measuredSession(
  surveyId: string,
  distance: FieldDistanceMeters,
  deviceLabel = 'iPhone 16 Pro #1',
  platform = 'ios'
): RomanovFieldSession {
  const observations = romanovControlPoints.map((point, index) => {
    const modelX = index * 0.1;
    return buildRomanovMeasuredResidual({
      controlPointId: point.id,
      surveyPacketId: surveyId,
      calibration: defaultRomanovCalibration,
      modelPointMeters: [modelX, 0, 0],
      observedWorldPointMeters: [modelX + 0.1, 0, -4],
      cameraWorldPointMeters: [modelX + 0.1, 0, -4 + distance],
      distanceBucketMeters: distance,
      hitType: 'ExistingPlane',
      capturedAt: '2026-09-19T12:00:00.000Z'
    });
  });

  return createFieldSession({
    era: '1857',
    viewingDistanceMeters: distance,
    calibration: defaultRomanovCalibration,
    devicePlatform: platform,
    deviceVersion: 'test-os',
    deviceLabel,
    appBuild: 'field-build-1',
    surveyPacketId: surveyId,
    observations
  });
}

test('approved survey and metric-authoritative calibration round-trip as one field campaign', () => {
  const survey = approvedSurvey();
  const raw = serializeFieldCampaignPackage(defaultRomanovCalibration, survey);
  const parsed = parseFieldCampaignPackage(raw);

  assert.equal(parsed.survey.id, survey.id);
  assert.equal(parsed.calibration.version, defaultRomanovCalibration.version);
});

test('three measured distances from one physical device round-trip as one session bundle', () => {
  const survey = approvedSurvey();
  const sessions = ([5, 10, 15] as FieldDistanceMeters[]).map((distance) =>
    measuredSession(survey.id, distance)
  );

  assert.equal(sessions.every(validateFieldSessionIntegrity), true);
  const raw = serializeFieldSessionBundle(sessions);
  const parsed = parseFieldSessionBundle(raw);

  assert.equal(parsed.sessions.length, 3);
  assert.equal(parsed.deviceLabel, 'iPhone 16 Pro #1');
  assert.deepEqual(parsed.sessions.map((item) => item.viewingDistanceMeters), [5, 10, 15]);
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

test('bundle rejects mixed device labels, calibration versions and survey IDs', () => {
  const survey = approvedSurvey();
  const a = measuredSession(survey.id, 5, 'device-a');
  const b = measuredSession(survey.id, 10, 'device-b');
  assert.throws(() => serializeFieldSessionBundle([a, b]), /one physical device/);

  const otherVersion = {
    ...measuredSession(survey.id, 10, 'device-a'),
    calibration: { ...defaultRomanovCalibration, version: defaultRomanovCalibration.version + 1 }
  };
  assert.throws(() => serializeFieldSessionBundle([a, otherVersion]), /integrity|calibration/);

  const otherSurvey = measuredSession('another-survey', 10, 'device-a');
  assert.throws(() => serializeFieldSessionBundle([a, otherSurvey]), /one survey/);
});

test('parsed field bundle revalidates device identity instead of trusting top-level metadata', () => {
  const survey = approvedSurvey();
  const sessions = ([5, 10, 15] as FieldDistanceMeters[]).map((distance) =>
    measuredSession(survey.id, distance, 'device-a')
  );
  const parsed = JSON.parse(serializeFieldSessionBundle(sessions));
  parsed.deviceLabel = 'device-b';

  assert.throws(() => parseFieldSessionBundle(JSON.stringify(parsed)), /device identity mismatch/);
});
