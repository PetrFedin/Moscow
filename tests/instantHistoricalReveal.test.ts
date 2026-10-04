import assert from 'node:assert/strict';
import test from 'node:test';

import { buildInstantHistoricalReveal } from '../src/spatial/instantHistoricalReveal.ts';
import type { TemporalSceneRecord, TemporalSceneValidation } from '../src/spatial/temporalSceneAuthority.ts';
import type { VisualSensorFusionDecision } from '../src/spatial/visualSensorFusion.ts';

const validRegistry: TemporalSceneValidation = { valid: true, blockers: [] };

function fusion(
  overrides: Partial<VisualSensorFusionDecision> = {}
): VisualSensorFusionDecision {
  return {
    status: 'confirmed',
    confirmationMode: 'automatic',
    siteId: 'site-a',
    packageId: 'package-a',
    referenceSetId: 'set-a',
    referenceId: 'ref-a',
    visualConfidence: 0.96,
    sensorState: 'precise',
    locationCompatibility: 'compatible',
    headingCompatibility: 'compatible',
    reason: 'automatic-fusion',
    ...overrides
  };
}

function scene(
  id: string,
  index: number,
  overrides: Partial<TemporalSceneRecord> = {}
): TemporalSceneRecord {
  return {
    id,
    placeId: 'site-a',
    version: 1,
    periodLabelRu: 'Период ' + index,
    periodLabelEn: 'Period ' + index,
    extent: { kind: 'exact-year', year: 1800 + index },
    confidence: 'medium',
    reconstructionStatus: 'mixed',
    interpretationMode: 'composite-research',
    sourceIds: ['source-' + id],
    claimIds: ['claim-' + id],
    evidenceElementIds: ['element-' + id],
    assetBindings: [
      { kind: 'archive-image', id: 'archive-' + id, trustMode: 'documented' },
      { kind: 'iiif', id: 'iiif-' + id, trustMode: 'documented' },
      { kind: 'model3d', id: 'model-' + id, trustMode: 'public-research' },
      { kind: 'audio', id: 'audio-' + id }
    ],
    timeMachineIndexes: [index],
    publicationState: 'production-candidate',
    ...overrides
  };
}

test('confirmed automatic fusion + one production temporal scene yields evidence-bound reveal', () => {
  const temporal = scene('scene-a', 0);
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: [temporal],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.reason, 'single-production-temporal-scene');
  assert.equal(result.payload?.siteId, 'site-a');
  assert.equal(result.payload?.packageId, 'package-a');
  assert.equal(result.payload?.contextSource, 'sensor-fusion-automatic');
  assert.deepEqual(result.payload?.fusion, {
    referenceSetId: 'set-a',
    referenceId: 'ref-a',
    visualConfidence: 0.96,
    sensorState: 'precise',
    locationCompatibility: 'compatible',
    headingCompatibility: 'compatible'
  });
  assert.deepEqual(result.payload?.scene, {
    id: 'scene-a',
    version: 1,
    periodLabelRu: 'Период 0',
    periodLabelEn: 'Period 0',
    extent: { kind: 'exact-year', year: 1800 },
    confidence: 'medium',
    reconstructionStatus: 'mixed',
    interpretationMode: 'composite-research'
  });
  assert.deepEqual(result.payload?.evidence, {
    sourceIds: ['source-scene-a'],
    claimIds: ['claim-scene-a'],
    evidenceElementIds: ['element-scene-a']
  });
  assert.deepEqual(result.payload?.assets.overlays.map((asset) => asset.id), [
    'archive-scene-a',
    'iiif-scene-a'
  ]);
  assert.deepEqual(result.payload?.assets.reconstructions.map((asset) => asset.id), [
    'model-scene-a'
  ]);
  assert.deepEqual(result.payload?.assets.audio.map((asset) => asset.id), [
    'audio-scene-a'
  ]);
});

test('user-assisted fusion remains explicit in reveal disclosure', () => {
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion({
      confirmationMode: 'user-assisted',
      sensorState: 'degraded',
      locationCompatibility: 'unknown',
      reason: 'explicit-user-confirmation'
    }),
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.payload?.contextSource, 'sensor-fusion-user-assisted');
  assert.equal(result.payload?.fusion.sensorState, 'degraded');
  assert.equal(result.payload?.fusion.locationCompatibility, 'unknown');
});

test('unconfirmed sensor fusion cannot open historical reveal', () => {
  const pending = buildInstantHistoricalReveal({
    fusionDecision: fusion({
      status: 'needs-user-confirmation',
      confirmationMode: 'none',
      reason: 'sensor-or-context-degraded'
    }),
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  assert.deepEqual(pending, {
    status: 'needs-user-confirmation',
    reason: 'sensor-fusion-requires-user-confirmation'
  });
});

test('not-sure fusion falls back to manual place selection instead of guessing', () => {
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion({
      status: 'not-sure',
      confirmationMode: 'none',
      reason: 'visual-not-sure'
    }),
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  assert.deepEqual(result, {
    status: 'fallback-manual-selection',
    reason: 'sensor-fusion-not-sure'
  });
});

test('hard fusion blocker cannot be bypassed by valid historical content', () => {
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion({
      status: 'blocked',
      confirmationMode: 'none',
      reason: 'location-incompatible'
    }),
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  assert.deepEqual(result, {
    status: 'blocked-fusion-context',
    reason: 'sensor-fusion-blocked',
    blockingReasons: ['location-incompatible']
  });
});

test('confirmed fusion must carry complete canonical package and reference context', () => {
  const forged = fusion({
    packageId: undefined
  }) as VisualSensorFusionDecision;

  const result = buildInstantHistoricalReveal({
    fusionDecision: forged,
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'blocked-fusion-context');
  assert.equal(result.reason, 'confirmed-fusion-context-incomplete');
});

test('confirmed fusion cannot use confirmationMode none', () => {
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion({
      confirmationMode: 'none'
    }),
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'blocked-fusion-context');
  assert.equal(result.reason, 'confirmed-fusion-mode-invalid');
});

test('invalid temporal registry blocks reveal after context is confirmed', () => {
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: {
      valid: false,
      blockers: ['temporal-source-not-found:scene-a:source-a']
    }
  });

  assert.equal(result.status, 'blocked-temporal-authority');
  assert.deepEqual(result.blockingReasons, ['temporal-source-not-found:scene-a:source-a']);
});

test('multiple production temporal scenes require explicit period selection', () => {
  const scenes = [scene('scene-a', 0), scene('scene-b', 1)];
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: scenes,
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'needs-period-selection');
  assert.deepEqual(result.sceneOptions?.map((option) => option.id), ['scene-a', 'scene-b']);
});

test('explicit time-machine index resolves the temporal scene without inventing a period', () => {
  const scenes = [scene('scene-a', 0), scene('scene-b', 1)];
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: scenes,
    temporalRegistryValidation: validRegistry,
    selectedTimeMachineIndex: 1
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.reason, 'time-machine-scene-selected');
  assert.equal(result.payload?.scene.id, 'scene-b');
  assert.deepEqual(result.payload?.scene.extent, { kind: 'exact-year', year: 1801 });
});

test('scene ID and time-machine index cannot silently resolve to different periods', () => {
  const scenes = [scene('scene-a', 0), scene('scene-b', 1)];
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: scenes,
    temporalRegistryValidation: validRegistry,
    selectedSceneId: 'scene-a',
    selectedTimeMachineIndex: 1
  });

  assert.equal(result.status, 'blocked-scene-selection-conflict');
});

test('draft and superseded scenes are not revealable', () => {
  const draft = scene('draft-scene', 0, { publicationState: 'draft' });
  const superseded = scene('old-scene', 1, { publicationState: 'superseded' });

  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: [draft, superseded],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'blocked-scene-unavailable');
});

test('selected scene from another site is rejected rather than cross-wired', () => {
  const foreign = scene('foreign-scene', 0, { placeId: 'site-b' });
  const local = scene('local-scene', 1);

  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: [foreign, local],
    temporalRegistryValidation: validRegistry,
    selectedSceneId: 'foreign-scene'
  });

  assert.equal(result.status, 'blocked-site-mismatch');
  assert.equal(result.reason, 'selected-temporal-scene-belongs-to-different-site');
});

test('audio is optional and missing audio does not fabricate a narration asset', () => {
  const noAudio = scene('scene-no-audio', 0, {
    assetBindings: [
      { kind: 'archive-image', id: 'archive-no-audio', trustMode: 'documented' },
      { kind: 'model3d', id: 'model-no-audio', trustMode: 'public-research' }
    ]
  });

  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: [noAudio],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'ready');
  assert.deepEqual(result.payload?.assets.audio, []);
  assert.deepEqual(result.payload?.assets.overlays.map((asset) => asset.id), ['archive-no-audio']);
});

test('reveal payload is a defensive copy of Temporal Authority evidence and assets', () => {
  const temporal = scene('scene-copy', 0);
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: [temporal],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'ready');
  assert.ok(result.payload);
  result.payload!.evidence.sourceIds.push('forged-source');
  result.payload!.assets.overlays[0]!.id = 'forged-asset';

  assert.deepEqual(temporal.sourceIds, ['source-scene-copy']);
  assert.equal(temporal.assetBindings[0]?.id, 'archive-scene-copy');
});

test('reveal payload remains privacy-bounded', () => {
  const result = buildInstantHistoricalReveal({
    fusionDecision: fusion(),
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  const encoded = JSON.stringify(result);
  for (const forbidden of ['latitude', 'longitude', 'rawHeading', 'cameraFrame', 'faceRecognition']) {
    assert.equal(encoded.includes(forbidden), false);
  }
});
