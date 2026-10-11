import assert from 'node:assert/strict';
import test from 'node:test';

import {
  admitVisualLandmarkReferenceSet,
  decideVisualLandmarkCandidate,
  evaluateRecognitionQuality,
  evaluateVisualRecognitionRelease,
  validateVisualLandmarkReferenceSet,
  type RecognitionQualityEvidence,
  type VisualLandmarkReferenceSet
} from '../src/spatial/visualLandmarkReference.ts';

const checksum = 'a'.repeat(64);

function set(siteId = 'site-a'): VisualLandmarkReferenceSet {
  return {
    schemaVersion: 1,
    id: 'reference-set-a',
    siteId,
    packageId: 'package-a',
    version: 1,
    createdAt: '2026-10-02T12:00:00.000Z',
    references: [
      {
        id: 'ref-front',
        viewpointId: 'front',
        sourceImageRef: 'asset:front',
        sourceImageVersion: 'v1',
        captureDate: '2026-09-20',
        rightsRef: 'rights:front',
        headingDeg: 180,
        headingToleranceDeg: 35,
        descriptor: {
          engine: 'opencv',
          modelId: 'landmark-local',
          modelVersion: '1',
          descriptorVersion: '1',
          checksumSha256: checksum
        }
      },
      {
        id: 'ref-side',
        viewpointId: 'side',
        sourceImageRef: 'asset:side',
        sourceImageVersion: 'v1',
        captureDate: '2026-09-20',
        rightsRef: 'rights:side',
        descriptor: {
          engine: 'mediapipe',
          modelId: 'landmark-local',
          modelVersion: '1',
          descriptorVersion: '1'
        }
      }
    ]
  };
}

function quality(overrides: Partial<RecognitionQualityEvidence> = {}): RecognitionQualityEvidence {
  return {
    siteId: 'site-a',
    evidenceRef: 'quality-run:001',
    measuredAt: '2026-10-02T13:00:00.000Z',
    buildId: 'ios-pilot-1',
    sampleCount: 120,
    trueMatchRate: 0.95,
    falsePositiveRate: 0.01,
    unknownRate: 0.08,
    viewpointCoverage: 0.85,
    lightingCoverage: 0.75,
    deviceClassCount: 3,
    p95LatencyMs: 640,
    ...overrides
  };
}

test('reference set requires source, rights, descriptor and unique viewpoints', () => {
  assert.doesNotThrow(() => validateVisualLandmarkReferenceSet(set()));

  const duplicate = set();
  duplicate.references[1] = {
    ...duplicate.references[1]!,
    viewpointId: 'front'
  };
  assert.throws(
    () => validateVisualLandmarkReferenceSet(duplicate),
    /Duplicate visual landmark viewpoint/
  );

  const noRights = set();
  noRights.references[0] = {
    ...noRights.references[0]!,
    rightsRef: ''
  };
  assert.throws(
    () => validateVisualLandmarkReferenceSet(noRights),
    /rights ref is required/
  );
});

test('reference set cannot self-admit without external field verification', () => {
  const blocked = admitVisualLandmarkReferenceSet({
    set: set(),
    fieldVerifiedSiteIds: []
  });
  assert.equal(blocked.admitted, false);
  assert.equal(blocked.reason, 'site-not-field-verified');

  const admitted = admitVisualLandmarkReferenceSet({
    set: set(),
    fieldVerifiedSiteIds: ['site-a']
  });
  assert.equal(admitted.admitted, true);
});

test('geographically impossible high-confidence candidate cannot match', () => {
  const decision = decideVisualLandmarkCandidate({
    referenceSets: [set()],
    fieldVerifiedSiteIds: ['site-a'],
    candidates: [{
      referenceSetId: 'reference-set-a',
      referenceId: 'ref-front',
      siteId: 'site-a',
      confidence: 0.99,
      geoCompatible: false,
      headingCompatible: true
    }]
  });

  assert.equal(decision.status, 'not-sure');
  assert.equal(decision.reason, 'no-eligible-candidate');
});

test('heading-incompatible candidate is rejected instead of forced into a match', () => {
  const decision = decideVisualLandmarkCandidate({
    referenceSets: [set()],
    fieldVerifiedSiteIds: ['site-a'],
    candidates: [{
      referenceSetId: 'reference-set-a',
      referenceId: 'ref-front',
      siteId: 'site-a',
      confidence: 0.98,
      geoCompatible: true,
      headingCompatible: false
    }]
  });

  assert.equal(decision.status, 'not-sure');
});

test('strong separated candidate can match only for a field-verified site', () => {
  const decision = decideVisualLandmarkCandidate({
    referenceSets: [set()],
    fieldVerifiedSiteIds: ['site-a'],
    candidates: [
      {
        referenceSetId: 'reference-set-a',
        referenceId: 'ref-front',
        siteId: 'site-a',
        confidence: 0.94,
        geoCompatible: true,
        headingCompatible: true
      },
      {
        referenceSetId: 'reference-set-a',
        referenceId: 'ref-side',
        siteId: 'site-a',
        confidence: 0.72,
        geoCompatible: true,
        headingCompatible: 'unknown'
      }
    ]
  });

  assert.equal(decision.status, 'matched');
  assert.equal(decision.siteId, 'site-a');
  assert.equal(decision.referenceId, 'ref-front');
});

test('high-confidence candidate on unverified site remains blocked', () => {
  const decision = decideVisualLandmarkCandidate({
    referenceSets: [set()],
    fieldVerifiedSiteIds: [],
    candidates: [{
      referenceSetId: 'reference-set-a',
      referenceId: 'ref-front',
      siteId: 'site-a',
      confidence: 0.97,
      geoCompatible: true,
      headingCompatible: true
    }]
  });

  assert.equal(decision.status, 'blocked-unverified-site');
  assert.equal(decision.reason, 'candidate-site-not-field-verified');
});

test('ambiguous top candidates require user confirmation', () => {
  const decision = decideVisualLandmarkCandidate({
    referenceSets: [set()],
    fieldVerifiedSiteIds: ['site-a'],
    candidates: [
      {
        referenceSetId: 'reference-set-a',
        referenceId: 'ref-front',
        siteId: 'site-a',
        confidence: 0.91,
        geoCompatible: true,
        headingCompatible: true
      },
      {
        referenceSetId: 'reference-set-a',
        referenceId: 'ref-side',
        siteId: 'site-a',
        confidence: 0.87,
        geoCompatible: true,
        headingCompatible: true
      }
    ]
  });

  assert.equal(decision.status, 'needs-user-confirmation');
  assert.equal(decision.reason, 'ambiguous-or-review-band');
});

test('review-band match requires user confirmation even when it is unique', () => {
  const decision = decideVisualLandmarkCandidate({
    referenceSets: [set()],
    fieldVerifiedSiteIds: ['site-a'],
    candidates: [{
      referenceSetId: 'reference-set-a',
      referenceId: 'ref-front',
      siteId: 'site-a',
      confidence: 0.8,
      geoCompatible: true,
      headingCompatible: true
    }]
  });

  assert.equal(decision.status, 'needs-user-confirmation');
});

test('recognition quality gate fails closed without measured evidence', () => {
  assert.deepEqual(
    evaluateRecognitionQuality({}),
    { status: 'blocked', reasons: ['missing-evidence'] }
  );
});

test('recognition quality gate blocks high false-positive rate', () => {
  const result = evaluateRecognitionQuality({
    evidence: quality({ falsePositiveRate: 0.06 })
  });

  assert.equal(result.status, 'blocked');
  assert.ok(result.reasons.includes('false-positive-rate-above-threshold'));
});

test('recognition quality gate can pass measured pilot evidence', () => {
  const result = evaluateRecognitionQuality({
    evidence: quality()
  });

  assert.equal(result.status, 'pass');
  assert.deepEqual(result.reasons, []);
});

test('release requires both field verification and quality evidence for the same site', () => {
  const blocked = evaluateVisualRecognitionRelease({
    set: set(),
    fieldVerifiedSiteIds: ['site-a']
  });
  assert.equal(blocked.releasable, false);
  assert.ok(blocked.reasons.includes('missing-evidence'));

  const mismatch = evaluateVisualRecognitionRelease({
    set: set(),
    fieldVerifiedSiteIds: ['site-a'],
    qualityEvidence: quality({ siteId: 'site-b' })
  });
  assert.equal(mismatch.releasable, false);
  assert.ok(mismatch.reasons.includes('quality-evidence-site-mismatch'));

  const passed = evaluateVisualRecognitionRelease({
    set: set(),
    fieldVerifiedSiteIds: ['site-a'],
    qualityEvidence: quality()
  });
  assert.equal(passed.siteId, 'site-a');
  assert.equal(passed.releasable, true);
  assert.deepEqual(passed.reasons, []);
});
