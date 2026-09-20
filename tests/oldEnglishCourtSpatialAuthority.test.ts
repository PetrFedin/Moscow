import assert from 'node:assert/strict';
import test from 'node:test';

import { places } from '../src/data/places.ts';
import {
  OLD_ENGLISH_COURT_SOURCE_LEDGER,
  OLD_ENGLISH_COURT_SPATIAL_AUTHORITY,
  currentOldEnglishCourtReadiness,
  evaluateOldEnglishCourtModelCandidate,
  oldEnglishCourtHistoricalLayers
} from '../src/spatial/oldEnglishCourtSpatialAuthority.ts';
import { ROMANOV_METRIC_AUTHORITY } from '../src/spatial/romanovMetricAuthority.ts';
import {
  canOpenModel3d,
  canOpenSpatial,
  getPlaceExperienceCapabilities
} from '../src/spatial/placeExperienceRegistry.ts';

test('Old English Court has its own spatial authority and remains fail-closed without an asset', () => {
  const capabilities = getPlaceExperienceCapabilities('old-english-court');

  assert.equal(capabilities.spatialAuthorityId, OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.id);
  assert.notEqual(capabilities.spatialAuthorityId, ROMANOV_METRIC_AUTHORITY.id);
  assert.equal(currentOldEnglishCourtReadiness.modelCandidateAccepted, false);
  assert.deepEqual(currentOldEnglishCourtReadiness.blockers, ['model-asset-missing']);
  assert.equal(canOpenModel3d('old-english-court'), false);
  assert.equal(canOpenSpatial('old-english-court'), false);
});

test('Old English Court historical layers bind to real place periods with explicit evidence mode', () => {
  const place = places.find((item) => item.id === 'old-english-court');
  assert.ok(place);

  const periodIds = new Set(place.periods.map((period) => period.id));
  const placeSourceUrls = new Set(place.sources.map((source) => source.url));
  assert.equal(
    OLD_ENGLISH_COURT_SOURCE_LEDGER.every((source) => placeSourceUrls.has(source.url)),
    true
  );
  assert.equal(oldEnglishCourtHistoricalLayers.length, 3);
  assert.equal(oldEnglishCourtHistoricalLayers.every((layer) => periodIds.has(layer.periodId)), true);
  assert.deepEqual(
    oldEnglishCourtHistoricalLayers.map((layer) => layer.evidence),
    ['documented', 'reconstructed', 'documented']
  );
});

test('asset intake rejects unknown rights, non-metric scale, missing checksum and incomplete provenance', () => {
  const result = evaluateOldEnglishCourtModelCandidate({
    id: 'old-english-court-draft',
    version: 1,
    assetPath: 'assets/models/old-english-court-draft.glb',
    sourceIds: ['museum-of-moscow-history'],
    rightsStatus: 'unknown',
    modelUnits: 'unknown',
    metricScaleStatus: 'provisional'
  });

  assert.equal(result.modelCandidateAccepted, false);
  assert.ok(result.blockers.includes('model-rights-unverified'));
  assert.ok(result.blockers.includes('model-units-not-metric'));
  assert.ok(result.blockers.includes('model-scale-not-verified'));
  assert.ok(result.blockers.includes('model-checksum-missing'));
  assert.ok(result.blockers.includes('model-provenance-incomplete'));
});

test('a fully evidenced model can pass intake without falsely opening the spatial runtime', () => {
  const intake = evaluateOldEnglishCourtModelCandidate({
    id: 'old-english-court-model-v1',
    version: 1,
    assetPath: 'assets/models/old-english-court-model-v1.glb',
    sourceIds: [...OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.requiredSourceIds],
    rightsStatus: 'verified',
    rightsEvidenceRef: 'rights-ledger/oec-model-v1',
    modelUnits: 'meters',
    metricScaleStatus: 'verified',
    checksumSha256: 'a'.repeat(64)
  });

  assert.equal(intake.modelCandidateAccepted, true);
  assert.deepEqual(intake.blockers, []);
  assert.equal(canOpenModel3d('old-english-court'), false);
  assert.equal(canOpenSpatial('old-english-court'), false);
});
