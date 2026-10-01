import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertMoscowPhase0EvidenceManifest,
  validateMoscowPhase0EvidenceManifest
} from '../src/spatial/integrationPhase0EvidenceManifest.ts';

const validManifest = {
  kind: 'moscow-integration-phase0-evidence',
  version: 1,
  createdAt: '2026-10-01T15:30:00Z',
  romanovEvidencePackage: {
    path: 'romanov/romanov-p0-evidence-package.json',
    sha256: 'a'.repeat(64)
  },
  oldEnglishCourtRepeatabilityProof: {
    path: 'old-english-court/repeatability-proof.json',
    sha256: 'b'.repeat(64)
  },
  visitorPilotReport: {
    path: 'pilot/final-study-report.json',
    sha256: 'c'.repeat(64)
  }
};

test('accepts versioned Phase 0 evidence manifest with unique checksummed JSON refs', () => {
  const result = validateMoscowPhase0EvidenceManifest(validManifest);
  assert.equal(result.valid, true);
  assert.deepEqual(result.blockers, []);
});

test('rejects path traversal in Phase 0 evidence manifest', () => {
  const result = validateMoscowPhase0EvidenceManifest({
    ...validManifest,
    romanovEvidencePackage: {
      path: '../romanov.json',
      sha256: 'a'.repeat(64)
    }
  });
  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('romanov-path-invalid'));
});

test('rejects duplicate evidence paths', () => {
  const result = validateMoscowPhase0EvidenceManifest({
    ...validManifest,
    visitorPilotReport: {
      path: validManifest.romanovEvidencePackage.path,
      sha256: 'c'.repeat(64)
    }
  });
  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('phase0-manifest-evidence-path-duplicate'));
});

test('assertion refuses invalid checksum shape', () => {
  assert.throws(
    () => assertMoscowPhase0EvidenceManifest({
      ...validManifest,
      oldEnglishCourtRepeatabilityProof: {
        path: 'old-english-court/repeatability-proof.json',
        sha256: 'not-a-sha'
      }
    }),
    /old-english-court-sha256-invalid/
  );
});
