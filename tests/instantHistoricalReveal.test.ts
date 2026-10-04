import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildInstantHistoricalReveal,
  type VisualRecognitionReleaseDecision
} from '../src/spatial/instantHistoricalReveal.ts';
import type { TemporalSceneRecord, TemporalSceneValidation } from '../src/spatial/temporalSceneAuthority.ts';
import type { VisualLandmarkDecision } from '../src/spatial/visualLandmarkReference.ts';

const validRegistry: TemporalSceneValidation = { valid: true, blockers: [] };
const released: VisualRecognitionReleaseDecision = { releasable: true, reasons: [] };

function visual(overrides: Partial<VisualLandmarkDecision> = {}): VisualLandmarkDecision {
  return {
    status: 'matched',
    siteId: 'site-a',
    referenceId: 'ref-a',
    confidence: 0.94,
    marginToSecond: 0.21,
    reason: 'strict-match',
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
    periodLabelRu: `Период ${index}`,
    periodLabelEn: `Period ${index}`,
    extent: { kind: 'exact-year', year: 1800 + index },
    confidence: 'medium',
    reconstructionStatus: 'mixed',
    interpretationMode: 'composite-research',
    sourceIds: [`source-${id}`],
    claimIds: [`claim-${id}`],
    evidenceElementIds: [`element-${id}`],
    assetBindings: [
      { kind: 'archive-image', id: `archive-${id}`, trustMode: 'documented' },
      { kind: 'iiif', id: `iiif-${id}`, trustMode: 'documented' },
      { kind: 'model3d', id: `model-${id}`, trustMode: 'public-research' },
      { kind: 'audio', id: `audio-${id}` }
    ],
    timeMachineIndexes: [index],
    publicationState: 'production-candidate',
    ...overrides
  };
}

test('strict released visual match + one production temporal scene yields evidence-bound reveal', () => {
  const temporal = scene('scene-a', 0);
  const result = buildInstantHistoricalReveal({
    visualDecision: visual(),
    recognitionRelease: released,
    temporalScenes: [temporal],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.reason, 'single-production-temporal-scene');
  assert.equal(result.payload?.siteId, 'site-a');
  assert.equal(result.payload?.contextSource, 'strict-visual-match');
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

test('visual decision cannot reveal when recognition release/quality gate is blocked', () => {
  const result = buildInstantHistoricalReveal({
    visualDecision: visual(),
    recognitionRelease: {
      releasable: false,
      reasons: ['false-positive-rate-above-threshold']
    },
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'blocked-recognition-quality');
  assert.equal(result.reason, 'visual-recognition-release-blocked');
  assert.deepEqual(result.blockingReasons, ['false-positive-rate-above-threshold']);
});

test('unverified visual site is blocked even if a temporal scene exists', () => {
  const result = buildInstantHistoricalReveal({
    visualDecision: visual({
      status: 'blocked-unverified-site',
      reason: 'candidate-site-not-field-verified'
    }),
    recognitionRelease: {
      releasable: false,
      reasons: ['site-not-field-verified', 'missing-evidence']
    },
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'blocked-unverified-site');
  assert.equal(result.payload, undefined);
});

test('not-sure recognition falls back to manual place selection instead of guessing', () => {
  const result = buildInstantHistoricalReveal({
    visualDecision: {
      status: 'not-sure',
      reason: 'no-eligible-candidate'
    },
    recognitionRelease: released,
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });

  assert.deepEqual(result, {
    status: 'fallback-manual-selection',
    reason: 'visual-recognition-not-sure'
  });
});

test('review-band visual candidate requires explicit same-site confirmation', () => {
  const candidate = visual({
    status: 'needs-user-confirmation',
    reason: 'ambiguous-or-review-band'
  });

  const pending = buildInstantHistoricalReveal({
    visualDecision: candidate,
    recognitionRelease: released,
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });
  assert.equal(pending.status, 'needs-user-confirmation');

  const wrong = buildInstantHistoricalReveal({
    visualDecision: candidate,
    recognitionRelease: released,
    confirmedSiteId: 'site-b',
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });
  assert.equal(wrong.status, 'blocked-site-mismatch');

  const confirmed = buildInstantHistoricalReveal({
    visualDecision: candidate,
    recognitionRelease: released,
    confirmedSiteId: 'site-a',
    temporalScenes: [scene('scene-a', 0)],
    temporalRegistryValidation: validRegistry
  });
  assert.equal(confirmed.status, 'ready');
  assert.equal(confirmed.payload?.contextSource, 'user-confirmed-visual');
});

test('invalid temporal registry blocks reveal regardless of visual confidence', () => {
  const result = buildInstantHistoricalReveal({
    visualDecision: visual({ confidence: 0.999 }),
    recognitionRelease: released,
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
    visualDecision: visual(),
    recognitionRelease: released,
    temporalScenes: scenes,
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'needs-period-selection');
  assert.deepEqual(result.sceneOptions?.map((option) => option.id), ['scene-a', 'scene-b']);
});

test('explicit time-machine index resolves the temporal scene without inventing a period', () => {
  const scenes = [scene('scene-a', 0), scene('scene-b', 1)];
  const result = buildInstantHistoricalReveal({
    visualDecision: visual(),
    recognitionRelease: released,
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
    visualDecision: visual(),
    recognitionRelease: released,
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
    visualDecision: visual(),
    recognitionRelease: released,
    temporalScenes: [draft, superseded],
    temporalRegistryValidation: validRegistry
  });

  assert.equal(result.status, 'blocked-scene-unavailable');
});

test('selected scene from another site is rejected rather than cross-wired', () => {
  const foreign = scene('foreign-scene', 0, { placeId: 'site-b' });
  const local = scene('local-scene', 1);

  const result = buildInstantHistoricalReveal({
    visualDecision: visual(),
    recognitionRelease: released,
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
    visualDecision: visual(),
    recognitionRelease: released,
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
    visualDecision: visual(),
    recognitionRelease: released,
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
