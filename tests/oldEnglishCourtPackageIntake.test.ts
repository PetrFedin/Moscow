import assert from 'node:assert/strict';
import test from 'node:test';

import { places } from '../src/data/places.ts';
import { varvarkaAudioCatalog } from '../src/features/audio/varvarkaAudioCatalog.ts';
import {
  OLD_ENGLISH_COURT_SPATIAL_AUTHORITY,
  evaluateOldEnglishCourtModelCandidate
} from '../src/spatial/oldEnglishCourtSpatialAuthority.ts';
import {
  evaluateOldEnglishCourtPackageIntake,
  oldEnglishCourtPackageIntake,
  oldEnglishCourtPackageIntakeValidation
} from '../src/spatial/oldEnglishCourtPackageIntake.ts';
import { romanovSources } from '../src/spatial/romanov-sources.ts';
import { ROMANOV_METRIC_AUTHORITY } from '../src/spatial/romanovMetricAuthority.ts';
import {
  canOpenModel3d,
  canOpenSpatial
} from '../src/spatial/placeExperienceRegistry.ts';
import {
  validateSpatialPackageIntake
} from '../src/spatial/spatialPackageIntake.ts';

test('Old English Court intake is structurally valid while promotion stays honestly blocked', () => {
  assert.equal(oldEnglishCourtPackageIntakeValidation.valid, true);
  assert.equal(oldEnglishCourtPackageIntakeValidation.promotionReady, false);
  assert.equal(oldEnglishCourtPackageIntakeValidation.fieldReleaseReady, false);
  assert.equal(oldEnglishCourtPackageIntakeValidation.touristExperienceReady, false);

  assert.ok(
    oldEnglishCourtPackageIntakeValidation.promotionBlockers.some((item) =>
      item.includes('oec-model-asset:missing')
    )
  );
  assert.ok(
    oldEnglishCourtPackageIntakeValidation.promotionBlockers.some((item) =>
      item.includes('oec-model-rights:missing')
    )
  );
  assert.ok(
    oldEnglishCourtPackageIntakeValidation.promotionBlockers.some((item) =>
      item.includes('oec-metric-authority:missing')
    )
  );
  assert.ok(
    oldEnglishCourtPackageIntakeValidation.promotionBlockers.some((item) =>
      item.includes('oec-control-point-authority:missing')
    )
  );
});

test('Old English Court intake reuses the existing bilingual place history instead of duplicating another narrative', () => {
  const place = places.find((item) => item.id === 'old-english-court');
  assert.ok(place);

  assert.equal(oldEnglishCourtPackageIntake.layers.length, 3);
  assert.deepEqual(
    oldEnglishCourtPackageIntake.layers.map((layer) => layer.periodId),
    place.periods.map((period) => period.id)
  );
  assert.deepEqual(
    oldEnglishCourtPackageIntake.layers.map((layer) => layer.claimRu),
    place.periods.map((period) => period.summary)
  );
  assert.deepEqual(
    oldEnglishCourtPackageIntake.layers.map((layer) => layer.trust),
    ['documented', 'reconstructed', 'documented']
  );
});

test('second-object intake has no Romanov provenance or metric-authority borrowing', () => {
  const oldEnglishSourceIds = new Set(oldEnglishCourtPackageIntake.sources.map((source) => source.id));
  const romanovSourceIds = new Set(romanovSources.map((source) => source.id));

  assert.equal(
    [...oldEnglishSourceIds].some((id) => romanovSourceIds.has(id)),
    false
  );
  assert.equal(oldEnglishCourtPackageIntake.authorityNamespace, 'old-english-court');
  assert.notEqual(OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.id, ROMANOV_METRIC_AUTHORITY.id);

  const serialized = JSON.stringify(oldEnglishCourtPackageIntake);
  assert.equal(serialized.includes(ROMANOV_METRIC_AUTHORITY.id), false);
  assert.equal(serialized.includes('romanov-facade-control-points'), false);
});

test('a model backed only by Romanov provenance cannot pass Old English Court model intake', () => {
  const borrowed = {
    id: 'borrowed-romanov-model',
    version: 1,
    assetPath: 'assets/models/borrowed.glb',
    sourceIds: romanovSources.map((source) => source.id),
    rightsStatus: 'verified' as const,
    rightsEvidenceRef: 'test-only-rights-proof',
    modelUnits: 'meters' as const,
    metricScaleStatus: 'verified' as const,
    checksumSha256: 'a'.repeat(64)
  };

  const readiness = evaluateOldEnglishCourtModelCandidate(
    borrowed as Parameters<typeof evaluateOldEnglishCourtModelCandidate>[0]
  );

  assert.equal(readiness.modelCandidateAccepted, false);
  assert.ok(readiness.blockers.includes('model-provenance-incomplete'));
});

test('an accepted model clears only model intake and cannot invent metric or control-point authority', () => {
  const candidate = {
    id: 'old-english-court-model-v1',
    version: 1,
    assetPath: 'assets/models/old-english-court-model-v1.glb',
    sourceIds: [...OLD_ENGLISH_COURT_SPATIAL_AUTHORITY.requiredSourceIds],
    rightsStatus: 'verified' as const,
    rightsEvidenceRef: 'test-only/oec-model-rights-v1',
    modelUnits: 'meters' as const,
    metricScaleStatus: 'verified' as const,
    checksumSha256: 'b'.repeat(64)
  };

  const result = evaluateOldEnglishCourtPackageIntake(candidate);

  assert.equal(result.modelReadiness.modelCandidateAccepted, true);
  assert.equal(result.validation.valid, true);
  assert.equal(result.validation.promotionReady, false);

  const modelRequirement = result.intake.requirements.find((item) => item.id === 'oec-model-asset');
  const rightsRequirement = result.intake.requirements.find((item) => item.id === 'oec-model-rights');
  assert.equal(modelRequirement?.status, 'ready');
  assert.equal(rightsRequirement?.status, 'ready');

  assert.ok(
    result.validation.promotionBlockers.some((item) =>
      item.includes('oec-metric-authority:missing')
    )
  );
  assert.ok(
    result.validation.promotionBlockers.some((item) =>
      item.includes('oec-control-point-authority:missing')
    )
  );

  assert.equal(canOpenModel3d('old-english-court'), false);
  assert.equal(canOpenSpatial('old-english-court'), false);
});

test('Old English Court audio authority is visible but does not masquerade as a human master', () => {
  const tracks = varvarkaAudioCatalog.filter((track) => track.placeId === 'old-english-court');
  const requirement = oldEnglishCourtPackageIntake.requirements.find((item) => item.id === 'oec-human-audio');

  assert.equal(tracks.length, 2);
  assert.equal(tracks.every((track) => track.status === 'recording-pending'), true);
  assert.equal(requirement?.status, 'recording-pending');
  assert.equal(requirement?.required, false);
});

test('intake validator rejects a ready promotion requirement with no evidence reference', () => {
  const tampered = structuredClone(oldEnglishCourtPackageIntake);
  const metric = tampered.requirements.find((item) => item.id === 'oec-metric-authority');
  assert.ok(metric);
  metric.status = 'ready';
  metric.evidenceRefs = undefined;

  const validation = validateSpatialPackageIntake(tampered);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('ready-requirement-evidence-missing:oec-metric-authority'));
});
