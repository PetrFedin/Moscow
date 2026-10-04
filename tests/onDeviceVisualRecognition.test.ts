import assert from 'node:assert/strict';
import test from 'node:test';

import {
  decideOnDeviceVisualMatch,
  validateOnDeviceVisualObservation,
  type OnDeviceVisualInferenceObservation
} from '../src/spatial/onDeviceVisualRecognition.ts';
import type {
  RecognitionQualityEvidence,
  VisualLandmarkReferenceSet
} from '../src/spatial/visualLandmarkReference.ts';

const checksum = 'a'.repeat(64);

function referenceSet(): VisualLandmarkReferenceSet {
  return {
    schemaVersion: 1,
    id: 'visual-set-site-a',
    siteId: 'site-a',
    packageId: 'package-site-a-v1',
    version: 1,
    createdAt: '2026-10-04T12:00:00.000Z',
    references: [
      {
        id: 'front',
        viewpointId: 'front',
        sourceImageRef: 'asset:front',
        sourceImageVersion: 'v1',
        captureDate: '2026-10-01',
        rightsRef: 'rights:front',
        descriptor: {
          engine: 'opencv',
          modelId: 'moscow-landmark-local',
          modelVersion: '1',
          descriptorVersion: '1',
          checksumSha256: checksum
        }
      },
      {
        id: 'side',
        viewpointId: 'side',
        sourceImageRef: 'asset:side',
        sourceImageVersion: 'v1',
        captureDate: '2026-10-01',
        rightsRef: 'rights:side',
        descriptor: {
          engine: 'opencv',
          modelId: 'moscow-landmark-local',
          modelVersion: '1',
          descriptorVersion: '1'
        }
      }
    ]
  };
}

function quality(): RecognitionQualityEvidence {
  return {
    siteId: 'site-a',
    evidenceRef: 'quality:site-a:001',
    measuredAt: '2026-10-04T12:30:00.000Z',
    buildId: 'pilot-build-1',
    sampleCount: 120,
    trueMatchRate: 0.95,
    falsePositiveRate: 0.01,
    unknownRate: 0.08,
    viewpointCoverage: 0.85,
    lightingCoverage: 0.75,
    deviceClassCount: 3,
    p95LatencyMs: 640
  };
}

function observation(
  overrides: Partial<OnDeviceVisualInferenceObservation> = {}
): OnDeviceVisualInferenceObservation {
  return {
    schemaVersion: 1,
    id: 'local-observation-1',
    capturedAt: '2026-10-04T13:00:00.000Z',
    processing: 'on-device',
    framePersisted: false,
    frameUploaded: false,
    faceRecognitionUsed: false,
    engine: 'opencv',
    modelId: 'moscow-landmark-local',
    modelVersion: '1',
    descriptorVersion: '1',
    inferenceLatencyMs: 210,
    candidates: [
      {
        referenceSetId: 'visual-set-site-a',
        referenceId: 'front',
        confidence: 0.95
      }
    ],
    ...overrides
  };
}

function baseInput(obs = observation()) {
  return {
    observation: obs,
    referenceSets: [referenceSet()],
    fieldVerifiedSiteIds: ['site-a'],
    qualityEvidenceBySite: {
      'site-a': quality()
    }
  };
}

test('on-device observation rejects persisted/uploaded frames and face recognition', () => {
  assert.deepEqual(
    validateOnDeviceVisualObservation(observation()),
    []
  );

  const persisted = validateOnDeviceVisualObservation(observation({
    framePersisted: true
  }));
  assert.ok(persisted.includes('frame-persisted'));

  const uploaded = validateOnDeviceVisualObservation(observation({
    frameUploaded: true
  }));
  assert.ok(uploaded.includes('frame-uploaded'));

  const biometric = validateOnDeviceVisualObservation(observation({
    faceRecognitionUsed: true
  }));
  assert.ok(biometric.includes('face-recognition'));
});

test('privacy violation blocks local recognition decision', () => {
  const result = decideOnDeviceVisualMatch(baseInput(observation({
    frameUploaded: true
  })));

  assert.deepEqual(result, {
    status: 'blocked',
    reason: 'privacy-contract-violation'
  });
});

test('unreleased reference set cannot produce even a strong candidate', () => {
  const result = decideOnDeviceVisualMatch({
    ...baseInput(),
    fieldVerifiedSiteIds: []
  });

  assert.deepEqual(result, {
    status: 'blocked',
    reason: 'reference-set-not-released'
  });
});

test('missing recognition quality evidence blocks reference-set use', () => {
  const result = decideOnDeviceVisualMatch({
    ...baseInput(),
    qualityEvidenceBySite: {}
  });

  assert.deepEqual(result, {
    status: 'blocked',
    reason: 'reference-set-not-released'
  });
});

test('descriptor engine/model/version contract must match exact approved reference', () => {
  const result = decideOnDeviceVisualMatch(baseInput(observation({
    modelVersion: '2'
  })));

  assert.deepEqual(result, {
    status: 'blocked',
    reason: 'descriptor-contract-mismatch'
  });
});

test('unknown set/reference fails closed', () => {
  const result = decideOnDeviceVisualMatch(baseInput(observation({
    candidates: [{
      referenceSetId: 'visual-set-site-a',
      referenceId: 'unknown',
      confidence: 0.99
    }]
  })));

  assert.deepEqual(result, {
    status: 'blocked',
    reason: 'reference-not-found'
  });
});

test('empty local result becomes not-sure rather than fabricated recognition', () => {
  const result = decideOnDeviceVisualMatch(baseInput(observation({
    candidates: []
  })));

  assert.deepEqual(result, {
    status: 'not-sure',
    reason: 'no-candidates'
  });
});

test('low confidence result remains not-sure', () => {
  const result = decideOnDeviceVisualMatch(baseInput(observation({
    candidates: [{
      referenceSetId: 'visual-set-site-a',
      referenceId: 'front',
      confidence: 0.55
    }]
  })));

  assert.equal(result.status, 'not-sure');
  assert.equal(result.reason, 'low-confidence');
  assert.equal(result.siteId, 'site-a');
  assert.equal(result.packageId, 'package-site-a-v1');
});

test('ambiguous candidates require user confirmation', () => {
  const result = decideOnDeviceVisualMatch(baseInput(observation({
    candidates: [
      {
        referenceSetId: 'visual-set-site-a',
        referenceId: 'front',
        confidence: 0.91
      },
      {
        referenceSetId: 'visual-set-site-a',
        referenceId: 'side',
        confidence: 0.87
      }
    ]
  })));

  assert.equal(result.status, 'needs-user-confirmation');
  assert.equal(result.reason, 'ambiguous-local-candidate');
  assert.equal(result.marginToSecond, 0.040000000000000036);
});

test('strict local inference resolves canonical site and package but not reveal authority', () => {
  const result = decideOnDeviceVisualMatch(baseInput());

  assert.deepEqual(result, {
    status: 'strong-candidate',
    siteId: 'site-a',
    packageId: 'package-site-a-v1',
    referenceSetId: 'visual-set-site-a',
    referenceId: 'front',
    confidence: 0.95,
    marginToSecond: 1,
    reason: 'strict-local-candidate'
  });
});

test('invalid thresholds fail closed instead of lowering recognition safety', () => {
  const result = decideOnDeviceVisualMatch({
    ...baseInput(),
    strictConfidence: 0.5,
    reviewConfidence: 0.7
  });

  assert.deepEqual(result, {
    status: 'blocked',
    reason: 'invalid-observation'
  });
});
