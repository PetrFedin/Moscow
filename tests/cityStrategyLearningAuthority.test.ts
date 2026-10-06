import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LEARNING_ACCEPTANCE_POLICY_V1,
  acceptCalibrationProposal,
  activateLearningPolicy,
  calibrationAcceptanceReadiness,
  learningCanAutoActivate,
  learningPolicyFromAcceptedCalibration,
  nextCycleConfidence,
  proposeCalibrationUpdate
} from '../src/marketplace/cityStrategyLearningAuthority.ts';
import {
  demoAcceptedCalibration,
  demoActiveLearningPolicy,
  demoLearningErrors,
  demoLearningSegments,
  demoNextCycleConfidence
} from '../src/marketplace/cityStrategyLearningDemo.ts';
import { demoTwinAssumptions } from '../src/marketplace/districtEconomicTwinDemo.ts';

test('systematic forecast error can reduce next-cycle confidence', () => {
  assert.ok(demoNextCycleConfidence.addSupplyHeritageCore < 0.75);
});

test('unknown learning segment is conservatively discounted', () => {
  const confidence = nextCycleConfidence({
    baseConfidence: 0.8,
    archetype: 'evening-route',
    districtContext: 'other',
    segments: demoLearningSegments
  });
  assert.equal(confidence, 0.64);
});

test('draft calibration cannot become production policy', () => {
  const draft = proposeCalibrationUpdate({
    id: 'draft',
    mode: 'demo',
    sourcePolicyVersion: '1.0.0',
    proposedPolicyVersion: '1.1.0',
    sourceAssumptions: {
      ...demoTwinAssumptions,
      provenance: 'measured',
      calibratedAt: '2026-09-01T00:00:00+03:00',
      evidenceRefs: ['BASE']
    },
    errors: demoLearningErrors,
    segments: demoLearningSegments,
    createdAt: '2026-10-06T15:00:00+03:00'
  });

  assert.equal(calibrationAcceptanceReadiness(draft).ready, false);
  assert.throws(
    () => learningPolicyFromAcceptedCalibration({
      id: 'policy',
      proposal: draft,
      acceptedAt: '2026-10-06T16:00:00+03:00'
    }),
    /calibration-not-accepted/
  );
});

test('accepted calibration requires holdout and evidence gates', () => {
  assert.equal(demoAcceptedCalibration.state, 'ACCEPTED');
  assert.ok(
    (demoAcceptedCalibration.holdoutDirectionalHitRate ?? 0)
      >= LEARNING_ACCEPTANCE_POLICY_V1.minimumHoldoutDirectionalHitRate
  );
  assert.ok(
    demoAcceptedCalibration.supportingRecordIds.length
      >= LEARNING_ACCEPTANCE_POLICY_V1.minimumSupportingRecords
  );
});

test('policy activation is separate from calibration acceptance', () => {
  const acceptedPolicy = learningPolicyFromAcceptedCalibration({
    id: 'policy-accepted',
    proposal: demoAcceptedCalibration,
    acceptedAt: '2026-10-06T15:30:00+03:00'
  });
  assert.equal(acceptedPolicy.status, 'ACCEPTED');

  const active = activateLearningPolicy({
    acceptedPolicy,
    activationRef: 'ACTIVATION-REF'
  });
  assert.equal(active.status, 'ACTIVE');
  assert.equal(demoActiveLearningPolicy.status, 'ACTIVE');
});

test('learning loop never auto-activates production policy', () => {
  assert.equal(learningCanAutoActivate(), false);
});
