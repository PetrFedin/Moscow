import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAprilTagCalibrationEvidence,
  reviewAprilTagCalibrationEvidence,
  validateAprilTagCalibrationEvidence,
  type AprilTagDetectorObservation,
  type AprilTagMarkerAuthority
} from '../src/spatial/aprilTagCalibrationEvidence.ts';

const marker: AprilTagMarkerAuthority = {
  markerSetId: 'romanov-cal-set-a',
  markerSetVersion: 1,
  tagFamily: 'tagStandard41h12',
  tagId: 7,
  physicalSizeMeters: 0.2,
  surveyPacketId: 'romanov-survey-field-1',
  expectedPose: {
    frameId: 'romanov-site-frame-v1',
    positionMeters: [1, 2, 3],
    rotationEulerDeg: [0, 0, 0]
  },
  sourceEvidenceRef: 'evidence://romanov/tag-set-a'
};

const observation: AprilTagDetectorObservation = {
  detectorId: 'test-apriltag-normalizer',
  detectorVersion: 'test-v1',
  tagFamily: 'tagStandard41h12',
  tagId: 7,
  physicalSizeMeters: 0.2,
  normalizedPose: {
    frameId: 'romanov-site-frame-v1',
    positionMeters: [1.1, 2, 3],
    rotationEulerDeg: [0, 5, 0]
  },
  detectedAt: '2026-10-02T00:00:00Z',
  deviceLabel: 'field-device-a',
  appBuild: 'field-build-1',
  confidence: 'high',
  evidenceRef: 'evidence://romanov/detection-7'
};

test('builds calibration evidence with deterministic translation and rotation error', () => {
  const evidence = buildAprilTagCalibrationEvidence({ marker, observation });
  assert.ok(Math.abs(evidence.translationErrorCm - 10) < 1e-9);
  assert.ok(Math.abs(evidence.rotationErrorDeg - 5) < 1e-9);
  assert.equal(evidence.reviewerStatus, 'pending');
  assert.equal('passed' in evidence, false);
  assert.equal(validateAprilTagCalibrationEvidence(evidence).valid, true);
});

test('rejects detector observation for a different tag authority', () => {
  assert.throws(
    () => buildAprilTagCalibrationEvidence({
      marker,
      observation: { ...observation, tagId: 8 }
    }),
    /does not match marker authority/
  );
});

test('rejects mismatched physical marker size', () => {
  assert.throws(
    () => buildAprilTagCalibrationEvidence({
      marker,
      observation: { ...observation, physicalSizeMeters: 0.25 }
    }),
    /physical size does not match/
  );
});

test('requires normalized expected and observed poses in the same frame', () => {
  assert.throws(
    () => buildAprilTagCalibrationEvidence({
      marker,
      observation: {
        ...observation,
        normalizedPose: {
          ...observation.normalizedPose,
          frameId: 'camera-local-frame'
        }
      }
    }),
    /must use the same frame/
  );
});

test('detects tampered derived error values', () => {
  const evidence = buildAprilTagCalibrationEvidence({ marker, observation });
  const result = validateAprilTagCalibrationEvidence({
    ...evidence,
    translationErrorCm: evidence.translationErrorCm + 5,
    rotationErrorDeg: evidence.rotationErrorDeg + 2
  });
  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('apriltag-translation-error-tampered'));
  assert.ok(result.blockers.includes('apriltag-rotation-error-tampered'));
});

test('review adds reviewer authority but still does not create a field PASS', () => {
  const evidence = buildAprilTagCalibrationEvidence({ marker, observation });
  const reviewed = reviewAprilTagCalibrationEvidence(evidence, {
    status: 'accepted',
    reviewedBy: 'field-reviewer',
    reviewedAt: '2026-10-02T00:10:00Z'
  });
  assert.equal(reviewed.reviewerStatus, 'accepted');
  assert.equal(reviewed.reviewedBy, 'field-reviewer');
  assert.equal(validateAprilTagCalibrationEvidence(reviewed).valid, true);
  assert.equal('passed' in reviewed, false);
});


test('review is write-once and cannot silently rewrite an accepted decision', () => {
  const evidence = buildAprilTagCalibrationEvidence({ marker, observation });
  const accepted = reviewAprilTagCalibrationEvidence(evidence, {
    status: 'accepted',
    reviewedBy: 'field-reviewer',
    reviewedAt: '2026-10-02T00:10:00Z'
  });

  assert.throws(
    () => reviewAprilTagCalibrationEvidence(accepted, {
      status: 'rejected',
      reviewedBy: 'other-reviewer',
      reviewedAt: '2026-10-02T00:20:00Z'
    }),
    /write-once/
  );
});

test('invalid marker geometry is rejected before evidence can be created', () => {
  assert.throws(
    () => buildAprilTagCalibrationEvidence({
      marker: { ...marker, physicalSizeMeters: 0 },
      observation
    }),
    /physical size must be measured/
  );
});
