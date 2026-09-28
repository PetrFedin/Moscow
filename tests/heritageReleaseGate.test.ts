import assert from 'node:assert/strict';
import test from 'node:test';

import {
  summarizeHeritageSpatialReleaseGate,
  type HeritageSpatialReleaseEvidence
} from '../src/spatial/heritageReleaseGate.ts';

const complete: HeritageSpatialReleaseEvidence = {
  surveyComplete: true,
  fieldMatrixComplete: true,
  fieldConditionsComplete: true,
  daylightEvidence: true,
  calibrationVerified: true,
  calibrationPlacementMeasured: true,
  metricAuthorityCurrent: true,
  metricScaleAuthoritative: true,
  persistentAnchorFrameVerified: true,
  persistentAnchorVerified: true,
  independentAnchorResolveVerified: true,
  restartRecoveryVerified: true
};

test('generic heritage release gate promotes only complete evidence', () => {
  const gate = summarizeHeritageSpatialReleaseGate(complete);
  assert.equal(gate.state, 'field-verified-spatial-scene');
  assert.deepEqual(gate.blockers, []);
});

test('generic heritage release gate is fail-closed for every missing proof class', () => {
  for (const key of Object.keys(complete) as Array<keyof HeritageSpatialReleaseEvidence>) {
    const gate = summarizeHeritageSpatialReleaseGate({
      ...complete,
      [key]: false
    });
    assert.equal(gate.state, 'production-candidate', key);
    assert.ok(gate.blockers.length > 0, key);
  }
});

test('restart recovery is an independent gate after anchor verification', () => {
  const gate = summarizeHeritageSpatialReleaseGate({
    ...complete,
    restartRecoveryVerified: false
  });

  assert.equal(gate.persistentAnchorVerified, true);
  assert.equal(gate.independentAnchorResolveVerified, true);
  assert.equal(gate.restartRecoveryVerified, false);
  assert.equal(gate.state, 'production-candidate');
  assert.deepEqual(gate.blockers, ['restart-recovery-resolve-not-verified']);
});

test('field conditions and daylight remain separate evidence gates', () => {
  const gate = summarizeHeritageSpatialReleaseGate({
    ...complete,
    fieldConditionsComplete: false,
    daylightEvidence: false
  });

  assert.equal(gate.state, 'production-candidate');
  assert.deepEqual(gate.blockers, [
    'field-conditions-incomplete',
    'daylight-evidence-missing'
  ]);
});
