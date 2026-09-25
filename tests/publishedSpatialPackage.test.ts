import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { defaultRomanovCalibration } from '../src/spatial/calibration.ts';
import {
  validatePublishedSpatialPackage,
  type PublishedSpatialPackage
} from '../src/spatial/publishedSpatialPackage.ts';
import { buildRomanovPublishedSpatialPackage } from '../src/spatial/romanovPublishedPackage.ts';
import { createEmptyRomanovSurveyPacket } from '../src/spatial/romanovSurvey.ts';
import { romanovModelCatalog } from '../src/spatial/romanovModelCatalog.ts';

test('Romanov bundled GLBs match the immutable catalog hashes and byte sizes', () => {
  for (const model of romanovModelCatalog) {
    const bytes = readFileSync(model.assetPath);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    assert.equal(bytes.byteLength, model.byteSize, `byte size drift: ${model.id}`);
    assert.equal(sha256, model.sha256, `SHA-256 drift: ${model.id}`);
  }
});

test('current Romanov package is honestly blocked from field verification', () => {
  const built = buildRomanovPublishedSpatialPackage({
    calibration: defaultRomanovCalibration,
    survey: createEmptyRomanovSurveyPacket(),
    sessions: [],
    anchors: []
  });

  assert.equal(built.package.schemaVersion, 2);
  assert.equal(built.package.releaseState, 'production-candidate');
  assert.equal(built.package.models.length, 4);
  assert.equal(built.package.claims.length >= 3, true);
  assert.equal(built.package.audioAuthority?.expectedTracks, 2);
  assert.equal(built.package.audioAuthority?.productionReadyTracks, 0);
  assert.equal(built.package.audioAuthority?.complete, false);

  assert.ok(built.promotionBlockers.includes('survey-packet-incomplete'));
  assert.ok(built.promotionBlockers.includes('cross-device-field-matrix-incomplete'));
  assert.ok(built.promotionBlockers.includes('calibration-not-verified'));
  assert.ok(built.promotionBlockers.includes('persistent-anchor-not-verified'));
  assert.ok(built.promotionBlockers.includes('independent-anchor-resolve-not-verified'));
  assert.ok(built.promotionBlockers.includes('metric-scale-not-survey-verified'));
  assert.ok(built.promotionBlockers.includes('audio-authority-incomplete'));
  assert.ok(built.promotionBlockers.includes('rights-review-required:naidenov-46'));
});

test('every published Romanov model is traceable to at least one sourced claim', () => {
  const built = buildRomanovPublishedSpatialPackage({
    calibration: defaultRomanovCalibration,
    survey: createEmptyRomanovSurveyPacket(),
    sessions: [],
    anchors: []
  });
  const claimed = new Set(built.package.claims.flatMap((claim) => claim.modelIds));

  for (const model of built.package.models) {
    assert.equal(claimed.has(model.id), true, `model has no historical claim: ${model.id}`);
    assert.ok(model.sourceIds.length > 0, `model has no source provenance: ${model.id}`);
  }
});

test('field-verified package fails closed when calibration is bound to another metric authority', () => {
  const synthetic: PublishedSpatialPackage = {
    schemaVersion: 2,
    id: 'synthetic',
    placeId: 'romanov-chambers',
    titleRu: 'Палаты',
    titleEn: 'Chambers',
    version: 2,
    releaseState: 'field-verified',
    publisher: 'Moscow in Time',
    eras: [{ id: '1857', yearLabel: '1857', titleRu: '1857', titleEn: '1857' }],
    sources: [{
      id: 'source',
      title: 'Source',
      sourceUrl: 'https://example.com/source',
      rights: 'public-domain',
      accessedAt: '2026-09-25'
    }],
    claims: [{
      id: 'claim',
      summary: 'Claim',
      trust: 'documented',
      sourceIds: ['source'],
      modelIds: ['model']
    }],
    models: [{
      id: 'model',
      format: 'glb',
      version: 1,
      eraId: '1857',
      trustMode: 'documented',
      runtimeModes: ['model3d', 'ar'],
      sourceIds: ['source'],
      checksum: 'a'.repeat(64),
      byteSize: 100
    }],
    metricAuthority: {
      id: 'metric-v2',
      version: 2,
      modelPackVersion: 'pack-v2',
      modelUnits: 'meters',
      metersPerModelUnit: 1,
      scaleStatus: 'survey-verified',
      verifiedScaleTolerance: 0.02
    },
    controlPointAuthority: {
      id: 'points-v1',
      version: 1,
      requiredPoints: 5,
      requiredAlignmentPoints: 3,
      surveyPacketId: 'survey-1',
      surveyApprovedAt: '2026-09-25T12:00:00.000Z',
      surveyApprovedBy: 'surveyor'
    },
    calibrationAuthority: {
      version: 3,
      metricAuthorityId: 'metric-v1',
      metricAuthorityVersion: 1,
      modelPackVersion: 'pack-v1',
      verifiedAt: '2026-09-25T12:10:00.000Z'
    },
    fieldEvidenceAuthority: {
      surveyPacketId: 'survey-1',
      totalSessions: 12,
      passedSessions: 12,
      completeDevices: 4,
      iosCompleteDevices: 2,
      androidCompleteDevices: 2,
      crossPlatformReady: true
    },
    anchorAuthority: {
      provider: 'reactvision',
      anchorId: 'anchor-1',
      calibrationVersion: 3,
      hostContinuityPassed: true,
      independentResolvePassed: true,
      verifiedAt: '2026-09-25T12:20:00.000Z'
    },
    audioAuthority: {
      expectedTracks: 2,
      productionReadyTracks: 2,
      complete: true
    },
    fieldVerification: {
      required: true,
      calibrationVersion: 3,
      surveyVerified: true,
      multiDeviceMatrixPassed: true,
      persistentAnchorVerified: true,
      verifiedAt: '2026-09-25T12:20:00.000Z'
    },
    languages: ['ru', 'en'],
    offlineEligible: true
  };

  const validation = validatePublishedSpatialPackage(synthetic);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('calibration-metric-binding-mismatch'));
});
