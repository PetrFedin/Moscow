import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateOldEnglishCourtMetricScaleEvidence,
  validateOldEnglishCourtProvenanceEvidence,
  validateOldEnglishCourtRightsEvidence,
  validateOldEnglishCourtStructuredEvidence
} from '../src/spatial/oldEnglishCourtSubmissionEvidence.ts';

const identity = {
  modelId: 'old-english-court-current-restored-v1',
  modelVersion: 1,
  checksumSha256: 'a'.repeat(64)
};

function provenance() {
  return {
    kind: 'old-english-court-provenance-evidence' as const,
    version: 1 as const,
    ...identity,
    mappings: [
      {
        sourceId: 'zaryadye-old-english-court' as const,
        supports: ['current-restored massing reference'],
        evidenceClass: 'documented' as const
      },
      {
        sourceId: 'museum-of-moscow-history' as const,
        supports: ['historical use and restoration context'],
        evidenceClass: 'documented' as const
      },
      {
        sourceId: 'museum-of-moscow-restoration' as const,
        supports: ['restoration interpretation'],
        evidenceClass: 'reconstructed' as const
      }
    ],
    unresolvedGeometry: ['roof detail pending measured survey']
  };
}

function rights() {
  return {
    kind: 'old-english-court-rights-evidence' as const,
    version: 1 as const,
    ...identity,
    modelRightsBasis: 'commissioned' as const,
    rightsHolder: 'Test contractor',
    publicationUseVerified: true as const,
    thirdPartyInputs: []
  };
}

function metricScale() {
  return {
    kind: 'old-english-court-metric-scale-evidence' as const,
    version: 1 as const,
    ...identity,
    modelUnits: 'meters' as const,
    metersPerModelUnit: 1 as const,
    measuredReferences: [
      {
        label: 'Facade reference span',
        sourceRef: 'survey/reference-span-v1',
        measuredMeters: 8.4,
        modelDistanceMeters: 8.4
      }
    ]
  };
}

test('structured evidence accepts one coherent model identity', () => {
  const validation = validateOldEnglishCourtStructuredEvidence(
    {
      provenance: provenance(),
      rights: rights(),
      metricScale: metricScale()
    },
    identity
  );
  assert.deepEqual(validation, { valid: true, blockers: [] });
});

test('provenance requires every Old English Court source to be mapped', () => {
  const value = provenance();
  value.mappings = value.mappings.slice(0, 2);

  const validation = validateOldEnglishCourtProvenanceEvidence(value, identity);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.blockers.includes(
      'provenance-source-unmapped:museum-of-moscow-restoration'
    )
  );
});

test('rights evidence must explicitly permit publication use', () => {
  const value = { ...rights(), publicationUseVerified: false };

  const validation = validateOldEnglishCourtRightsEvidence(value, identity);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('rights-publication-use-unverified'));
});

test('metric evidence requires real positive measured references', () => {
  const value = metricScale();
  value.measuredReferences[0]!.measuredMeters = 0;

  const validation = validateOldEnglishCourtMetricScaleEvidence(value, identity);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('metric-evidence-measured-distance-invalid:0'));
});

test('evidence from another model version or checksum cannot be reused', () => {
  const wrong = provenance();
  wrong.modelVersion = 2;
  wrong.checksumSha256 = 'b'.repeat(64);

  const validation = validateOldEnglishCourtProvenanceEvidence(wrong, identity);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('provenance-model-version-mismatch'));
  assert.ok(validation.blockers.includes('provenance-checksum-mismatch'));
});
