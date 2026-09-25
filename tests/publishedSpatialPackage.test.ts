import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  assertPublishedSpatialPackageCanPublish,
  parsePublishedSpatialPackage,
  serializePublishedSpatialPackage,
  validatePublishedSpatialPackage
} from '../src/spatial/publishedSpatialPackage.ts';
import {
  romanovPublishedCandidate,
  romanovPublishedCandidateValidation
} from '../src/spatial/romanovPublishedCandidate.ts';

test('Romanov candidate is structurally complete but still exposes unresolved publication dependencies', () => {
  assert.equal(romanovPublishedCandidateValidation.valid, true);
  assert.equal(romanovPublishedCandidateValidation.publishable, false);
  assert.deepEqual(romanovPublishedCandidateValidation.blockers, []);
  assert.ok(
    romanovPublishedCandidateValidation.publicationBlockers.includes('rights-review-required:naidenov-46')
  );
  assert.ok(romanovPublishedCandidateValidation.warnings.includes('audio-recording-pending'));
  assert.ok(
    romanovPublishedCandidateValidation.warnings.some((item) =>
      item === 'field-release-blocker:survey-evidence-not-supplied'
    )
  );
});

test('Romanov package carries source -> claim -> element -> model traceability', () => {
  assert.equal(romanovPublishedCandidate.claims.length, romanovPublishedCandidate.elements.length);

  const claimsByElement = new Map<string, string[]>();
  for (const claim of romanovPublishedCandidate.claims) {
    for (const elementId of claim.modelElementIds) {
      claimsByElement.set(elementId, [...(claimsByElement.get(elementId) ?? []), claim.id]);
    }
  }

  for (const element of romanovPublishedCandidate.elements) {
    assert.ok((claimsByElement.get(element.id) ?? []).length > 0, `missing claim for ${element.id}`);
    assert.ok(element.sourceIds.length > 0);
  }

  for (const model of romanovPublishedCandidate.models) {
    assert.match(model.assetPath, /^assets\/models\/.*\.glb$/);
    assert.match(model.repositoryBlobSha, /^[a-f0-9]{40}$/);
    assert.ok(model.byteSize > 0);
    assert.ok(model.elementIds.length > 0);
  }
});

test('documented models cannot silently inherit reconstructed public elements', () => {
  const documented1859 = romanovPublishedCandidate.models.find((model) =>
    model.id === 'romanov-1859-documented-v1'
  );
  const public1859 = romanovPublishedCandidate.models.find((model) =>
    model.id === 'romanov-1859-public-v1'
  );

  assert.ok(documented1859);
  assert.ok(public1859);
  assert.deepEqual(documented1859.elementIds, ['masonry-core']);
  assert.ok(public1859.elementIds.includes('masonry-core'));
  assert.ok(public1859.elementIds.includes('richter-windows'));
  assert.ok(public1859.elementIds.includes('timber-terem'));
  assert.ok(public1859.elementIds.includes('porch-stair'));
});

test('model artifact bindings are exact repository objects, not filename-only claims', () => {
  const artifactMap = new Map(
    romanovPublishedCandidate.models.map((model) => [
      model.id,
      { path: model.assetPath, blob: model.repositoryBlobSha, sha256: model.assetSha256, bytes: model.byteSize }
    ])
  );

  assert.deepEqual(artifactMap.get('romanov-1857-documented-v1'), {
    path: 'assets/models/romanov-1857-documented-v1.glb',
    blob: 'dc1184e023b2094926c98e5f5c3fe48d1eef9b40',
    sha256: '9431982ba3131cacd623890b6afde1de9e9b57df5aafa45b7f209bf62f71b24b',
    bytes: 22920
  });
  assert.deepEqual(artifactMap.get('romanov-1857-public-v1'), {
    path: 'assets/models/romanov-1857-public-v1.glb',
    blob: '73dfeb9e1b301349bc7b72ac5d5d3c9566125baa',
    sha256: '9ea2490079edfb00a12819375848e76faf1aede6b35cf7ddcfc74ad79452f5e9',
    bytes: 22940
  });
  assert.deepEqual(artifactMap.get('romanov-1859-documented-v1'), {
    path: 'assets/models/romanov-1859-documented-v1.glb',
    blob: '6bb05f30b85c04b7fd70a4bee029a6c91205166e',
    sha256: '69ddc902cb000f83b5b320ba299f1c32d3cb7d539e426cbaa6ef56769720f8ed',
    bytes: 7792
  });
  assert.deepEqual(artifactMap.get('romanov-1859-public-v1'), {
    path: 'assets/models/romanov-1859-public-v1.glb',
    blob: 'e1ad115505089dab312997be586e65e94d459efd',
    sha256: '7ab8ad9a456ae11fa84baef71aea0d4050d7fa84cc187e41cbc95cce05e0fc6e',
    bytes: 86764
  });
});

test('a model cannot contain an evidence element without also covering its sources', () => {
  const tampered = structuredClone(romanovPublishedCandidate);
  const public1859 = tampered.models.find((model) => model.id === 'romanov-1859-public-v1');
  assert.ok(public1859);
  public1859.sourceIds = public1859.sourceIds.filter((id) => id !== 'shm-1859-graphic');

  const validation = validatePublishedSpatialPackage(tampered);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.blockers.includes(
      'model-source-does-not-cover-element:romanov-1859-public-v1:richter-windows:shm-1859-graphic'
    )
  );
});

test('field-verified cannot be declared by boolean flags alone', () => {
  const forged = structuredClone(romanovPublishedCandidate);
  forged.releaseState = 'field-verified';
  forged.publishedAt = '2026-09-25T12:00:00.000Z';
  forged.fieldVerification = {
    required: true,
    releaseGateState: 'field-verified-spatial-scene',
    surveyVerified: true,
    multiDeviceMatrixPassed: true,
    persistentAnchorVerified: true,
    releaseBlockers: []
  };

  const validation = validatePublishedSpatialPackage(forged);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('survey-packet-id-missing'));
  assert.ok(validation.blockers.includes('field-session-evidence-missing'));
  assert.ok(validation.blockers.includes('calibration-version-missing'));
  assert.ok(validation.blockers.includes('persistent-anchor-proof-missing'));
  assert.ok(validation.blockers.includes('field-verified-at-missing'));
});

test('candidate can round-trip structurally, while public publication stays fail-closed', () => {
  const raw = serializePublishedSpatialPackage(romanovPublishedCandidate);
  const parsed = parsePublishedSpatialPackage(raw);

  assert.equal(parsed.id, romanovPublishedCandidate.id);
  assert.equal(parsed.models.length, 4);
  assert.throws(
    () => assertPublishedSpatialPackageCanPublish(parsed),
    /rights-review-required:naidenov-46/
  );
});

test('tampered imported package is rejected rather than normalized into truth', () => {
  const tampered = structuredClone(romanovPublishedCandidate);
  tampered.models[0]!.repositoryBlobSha = 'not-a-real-blob';

  assert.throws(
    () => parsePublishedSpatialPackage(JSON.stringify(tampered)),
    /model-blob-sha-invalid/
  );
});


test('portable SHA-256 matches the actual bundled GLB bytes', () => {
  for (const model of romanovPublishedCandidate.models) {
    const bytes = readFileSync(model.assetPath);
    assert.equal(bytes.byteLength, model.byteSize, `byte size drift: ${model.id}`);
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      model.assetSha256,
      `SHA-256 drift: ${model.id}`
    );
  }
});

test('tampered portable model checksum is rejected independently of Git blob identity', () => {
  const tampered = structuredClone(romanovPublishedCandidate);
  tampered.models[0]!.assetSha256 = 'not-a-portable-checksum';

  const validation = validatePublishedSpatialPackage(tampered);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes(`model-sha256-invalid:${tampered.models[0]!.id}`));
});
