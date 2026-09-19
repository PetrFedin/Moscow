import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRomanovMeasuredResidual,
  isReleaseEligibleMeasuredResidual,
  transformRomanovModelPointToWorld
} from '../src/spatial/alignmentResidual.ts';
import {
  advanceCalibrationVersionForSave,
  defaultRomanovCalibration
} from '../src/spatial/calibration.ts';
import {
  createFieldSession,
  summarizeFieldMatrix
} from '../src/spatial/fieldVerification.ts';
import {
  currentRomanovControlPointBinding
} from '../src/spatial/romanovControlPoints.ts';
import {
  createEmptyRomanovSurveyPacket,
  summarizeRomanovSurvey
} from '../src/spatial/romanovSurvey.ts';

test('model point transform follows calibration translation and yaw', () => {
  const calibration = {
    ...defaultRomanovCalibration,
    translation: [1, 2, 3] as [number, number, number],
    rotationEulerDeg: [0, 90, 0] as [number, number, number],
    scale: 1
  };
  const world = transformRomanovModelPointToWorld([1, 0, 0], calibration);
  assert.ok(Math.abs(world[0] - 1) < 1e-9);
  assert.ok(Math.abs(world[1] - 2) < 1e-9);
  assert.ok(Math.abs(world[2] - 2) < 1e-9);
});

test('AR-world measurement derives residual instead of accepting a typed number', () => {
  const residual = buildRomanovMeasuredResidual({
    controlPointId: 'main-volume-left-corner',
    surveyPacketId: 'survey-1',
    calibration: defaultRomanovCalibration,
    modelPointMeters: [0, 0, 0],
    observedWorldPointMeters: [0.1, 0, -4],
    cameraWorldPointMeters: [0, 0, 1],
    distanceBucketMeters: 5,
    hitType: 'DepthPoint',
    capturedAt: '2026-09-19T00:00:00.000Z'
  });

  assert.ok(Math.abs(residual.residualCm - 10) < 1e-9);
  assert.equal(residual.evidence?.controlPointBinding.controlPointSetId, currentRomanovControlPointBinding.controlPointSetId);
  assert.equal(isReleaseEligibleMeasuredResidual(residual, {
    calibrationVersion: defaultRomanovCalibration.version,
    distanceBucketMeters: 5,
    surveyPacketId: 'survey-1'
  }), true);

  assert.equal(isReleaseEligibleMeasuredResidual({
    ...residual,
    residualCm: 1
  }, {
    calibrationVersion: defaultRomanovCalibration.version,
    distanceBucketMeters: 5,
    surveyPacketId: 'survey-1'
  }), false);
});

test('manual residuals remain auditable but cannot pass field release gate', () => {
  const observations = [
    'main-volume-left-corner',
    'main-volume-right-corner',
    'stable-window-opening',
    'plinth-reference-line',
    'roof-reference-edge'
  ].map((controlPointId) => ({ controlPointId, residualCm: 10 }));

  const session = createFieldSession({
    era: '1857',
    viewingDistanceMeters: 5,
    calibration: defaultRomanovCalibration,
    devicePlatform: 'ios',
    deviceVersion: 'test',
    deviceLabel: 'iPhone test #1',
    observations
  });

  assert.equal(session.meanResidualCm, 10);
  assert.equal(session.passed, false);
  assert.equal(session.measurementEligiblePoints, 0);

  const matrix = summarizeFieldMatrix([session]);
  assert.equal(matrix.unmeasuredSessions, 1);
  assert.equal(matrix.passedSessions, 0);
});

test('five measured control points can pass arithmetic and evidence authority together', () => {
  const ids = [
    'main-volume-left-corner',
    'main-volume-right-corner',
    'stable-window-opening',
    'plinth-reference-line',
    'roof-reference-edge'
  ];
  const observations = ids.map((controlPointId, index) => buildRomanovMeasuredResidual({
    controlPointId,
    surveyPacketId: 'survey-verified-1',
    calibration: defaultRomanovCalibration,
    modelPointMeters: [index * 0.1, 0, 0],
    observedWorldPointMeters: [index * 0.1 + 0.1, 0, -4],
    cameraWorldPointMeters: [0, 0, 1],
    distanceBucketMeters: 5,
    hitType: 'ExistingPlane',
    capturedAt: '2026-09-19T00:00:00.000Z'
  }));

  const session = createFieldSession({
    era: '1857',
    viewingDistanceMeters: 5,
    calibration: defaultRomanovCalibration,
    devicePlatform: 'ios',
    deviceVersion: 'test',
    deviceLabel: 'iPhone test #1',
    observations
  });

  assert.equal(session.measurementEligiblePoints, 5);
  assert.equal(session.passed, true);
  assert.equal(session.surveyPacketId, 'survey-verified-1');
});

test('survey packet is bound to the current control-point authority', () => {
  const survey = createEmptyRomanovSurveyPacket();
  assert.equal(survey.controlPointBinding?.controlPointSetId, currentRomanovControlPointBinding.controlPointSetId);
  survey.controlPointBinding = undefined;
  assert.ok(summarizeRomanovSurvey(survey).blockers.includes('control-point-authority-stale'));
});


test('saving a new calibration version invalidates field evidence from the previous transform', () => {
  const ids = [
    'main-volume-left-corner',
    'main-volume-right-corner',
    'stable-window-opening',
    'plinth-reference-line',
    'roof-reference-edge'
  ];
  const observations = ids.map((controlPointId, index) => buildRomanovMeasuredResidual({
    controlPointId,
    surveyPacketId: 'survey-calibration-version',
    calibration: defaultRomanovCalibration,
    modelPointMeters: [index * 0.1, 0, 0],
    observedWorldPointMeters: [index * 0.1 + 0.1, 0, -4],
    cameraWorldPointMeters: [0, 0, 1],
    distanceBucketMeters: 5,
    hitType: 'DepthPoint'
  }));
  const session = createFieldSession({
    era: '1857',
    viewingDistanceMeters: 5,
    calibration: defaultRomanovCalibration,
    devicePlatform: 'ios',
    deviceVersion: 'test',
    deviceLabel: 'iPhone test #1',
    observations
  });
  const nextCalibration = advanceCalibrationVersionForSave(defaultRomanovCalibration);
  const matrix = summarizeFieldMatrix([session], nextCalibration.version);

  assert.equal(nextCalibration.version, defaultRomanovCalibration.version + 1);
  assert.equal(matrix.staleCalibrationSessions, 1);
  assert.equal(matrix.passedSessions, 0);
});
