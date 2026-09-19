import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentRomanovMetricBinding,
  isCurrentRomanovMetricBinding,
  isRomanovVerifiedScaleAuthoritative,
  ROMANOV_METRIC_AUTHORITY,
  romanovResearchPointToViro
} from '../src/spatial/romanovMetricAuthority.ts';
import {
  createFieldSession,
  summarizeFieldMatrix
} from '../src/spatial/fieldVerification.ts';
import {
  createEmptyRomanovSurveyPacket,
  summarizeRomanovSurvey
} from '../src/spatial/romanovSurvey.ts';
import { defaultRomanovCalibration } from '../src/spatial/calibration.ts';

const observations = [
  'main-volume-left-corner',
  'main-volume-right-corner',
  'stable-window-opening',
  'plinth-reference-line',
  'roof-reference-edge'
].map((controlPointId) => ({ controlPointId, residualCm: 10 }));

test('Romanov metric authority is explicit, metric and versioned', () => {
  assert.equal(ROMANOV_METRIC_AUTHORITY.modelUnits, 'meters');
  assert.equal(ROMANOV_METRIC_AUTHORITY.metersPerModelUnit, 1);
  assert.equal(ROMANOV_METRIC_AUTHORITY.scaleStatus, 'provisional-pending-survey');
  assert.equal(isCurrentRomanovMetricBinding(currentRomanovMetricBinding), true);
  assert.equal(isCurrentRomanovMetricBinding({ ...currentRomanovMetricBinding, modelPackVersion: 'old-pack' }), false);
  assert.equal(isRomanovVerifiedScaleAuthoritative(1), true);
  assert.equal(isRomanovVerifiedScaleAuthoritative(1.019), true);
  assert.equal(isRomanovVerifiedScaleAuthoritative(1.05), false);
});

test('research coordinates map deterministically into Viro axes', () => {
  assert.deepEqual(romanovResearchPointToViro([2, -4.25, 6.35]), [2, 6.35, -4.25]);
});

test('new survey and field records bind to the current metric authority', () => {
  const survey = createEmptyRomanovSurveyPacket();
  assert.equal(isCurrentRomanovMetricBinding(survey.metricBinding), true);

  const session = createFieldSession({
    era: '1857',
    viewingDistanceMeters: 5,
    calibration: defaultRomanovCalibration,
    devicePlatform: 'ios',
    deviceVersion: 'test',
    deviceLabel: 'iPhone test #1',
    observations
  });
  assert.equal(isCurrentRomanovMetricBinding(session.metricBinding), true);
});

test('stale or unversioned field sessions cannot satisfy the release matrix', () => {
  const valid = createFieldSession({
    era: '1857',
    viewingDistanceMeters: 5,
    calibration: defaultRomanovCalibration,
    devicePlatform: 'ios',
    deviceVersion: 'test',
    deviceLabel: 'iPhone test #1',
    observations
  });
  const stale = { ...valid, id: 'stale', metricBinding: undefined };

  const matrix = summarizeFieldMatrix([stale]);
  assert.equal(matrix.passedSessions, 0);
  assert.equal(matrix.staleMetricSessions, 1);
  assert.equal(matrix.crossPlatformReady, false);
});

test('survey packet without the current authority is explicitly blocked', () => {
  const survey = createEmptyRomanovSurveyPacket();
  survey.metricBinding = undefined;
  const gate = summarizeRomanovSurvey(survey);
  assert.ok(gate.blockers.includes('metric-authority-stale'));
});
