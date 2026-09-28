import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOldEnglishCourtModelCandidateFromSubmission,
  parseOldEnglishCourtModelSubmissionManifest,
  validateOldEnglishCourtModelSubmissionManifest,
  type OldEnglishCourtModelSubmissionManifest
} from '../src/spatial/oldEnglishCourtModelSubmission.ts';

function manifest(): OldEnglishCourtModelSubmissionManifest {
  return {
    kind: 'old-english-court-model-submission',
    version: 2,
    id: 'old-english-court-current-restored-v1',
    modelVersion: 1,
    assetPath: 'old-english-court-current-restored-v1.glb',
    binaryReportPath: 'binary-report.json',
    sourceIds: [
      'zaryadye-old-english-court',
      'museum-of-moscow-history',
      'museum-of-moscow-restoration'
    ],
    provenanceEvidenceRef: 'provenance.json',
    rightsStatus: 'verified',
    rightsEvidenceRef: 'rights.json',
    modelUnits: 'meters',
    metricScaleStatus: 'verified',
    metricScaleEvidenceRef: 'metric-scale.json',
    checksumSha256: 'a'.repeat(64)
  };
}

function report() {
  return {
    schemaVersion: 1 as const,
    format: 'glb' as const,
    filename: 'old-english-court-current-restored-v1.glb',
    sha256: 'a'.repeat(64),
    bytes: 900_000,
    glbVersion: 2,
    declaredLengthMatches: true,
    nodes: 120,
    meshes: 80,
    primitives: 100,
    triangles: 80_000,
    materials: 20,
    textures: 12,
    images: 12,
    animations: 0,
    skins: 0,
    externalBuffers: 0,
    externalImages: 0
  };
}

test('Old English Court submission manifest parses into an accepted model candidate', () => {
  const input = manifest();
  const parsed = parseOldEnglishCourtModelSubmissionManifest(JSON.stringify(input));
  assert.deepEqual(parsed, input);

  const candidate = buildOldEnglishCourtModelCandidateFromSubmission(parsed, report());
  assert.equal(candidate.id, input.id);
  assert.equal(candidate.assetPath, input.assetPath);
  assert.equal(candidate.checksumSha256, input.checksumSha256);
});

test('submission manifest requires exactly the Old English Court source ledger', () => {
  const input = manifest();
  input.sourceIds = ['museum-of-moscow-history'];

  const validation = validateOldEnglishCourtModelSubmissionManifest(input);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('submission-source-ledger-mismatch'));
});

test('submission manifest rejects unverified rights and metric scale', () => {
  const input = {
    ...manifest(),
    rightsStatus: 'unknown',
    metricScaleStatus: 'provisional'
  };

  const validation = validateOldEnglishCourtModelSubmissionManifest(input);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('submission-rights-not-verified'));
  assert.ok(validation.blockers.includes('submission-scale-not-verified'));
});

test('candidate builder rejects binary report checksum drift', () => {
  const input = manifest();
  const binary = report();
  binary.sha256 = 'b'.repeat(64);

  assert.throws(
    () => buildOldEnglishCourtModelCandidateFromSubmission(input, binary),
    /model-binary-checksum-mismatch/
  );
});

test('submission parser rejects malformed JSON rather than normalizing it', () => {
  assert.throws(
    () => parseOldEnglishCourtModelSubmissionManifest('{broken'),
    /not valid JSON/
  );
});


test('submission manifest rejects paths outside the bundle', () => {
  const input = manifest();
  input.assetPath = '../outside.glb';
  input.provenanceEvidenceRef = '/tmp/provenance.json';

  const validation = validateOldEnglishCourtModelSubmissionManifest(input);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('submission-asset-path-invalid'));
  assert.ok(validation.blockers.includes('submission-provenance-evidence-missing'));
});

test('submission manifest requires structured JSON evidence files', () => {
  const input = manifest();
  input.rightsEvidenceRef = 'rights.md';
  input.metricScaleEvidenceRef = 'metric-scale.pdf';

  const validation = validateOldEnglishCourtModelSubmissionManifest(input);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('submission-rights-evidence-missing'));
  assert.ok(validation.blockers.includes('submission-scale-evidence-missing'));
});
