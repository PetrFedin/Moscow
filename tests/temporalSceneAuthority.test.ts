import assert from 'node:assert/strict';
import test from 'node:test';

import {
  temporalSceneAtTimeMachineIndex,
  validateTemporalSceneRecord,
  validateTemporalSceneRegistry,
  type TemporalSceneRecord
} from '../src/spatial/temporalSceneAuthority.ts';
import {
  getRomanovRuntimeEraAtTimeIndex,
  romanovTemporalScenes,
  romanovTemporalSceneValidation
} from '../src/spatial/romanovTemporalScenes.ts';

const base: TemporalSceneRecord = {
  id: 'scene-a',
  placeId: 'place-a',
  version: 1,
  periodLabelRu: 'Состояние A',
  periodLabelEn: 'State A',
  extent: { kind: 'exact-year', year: 1900 },
  confidence: 'not-assessed',
  reconstructionStatus: 'documented',
  interpretationMode: 'documented-only',
  sourceIds: ['source-a'],
  claimIds: ['claim-a'],
  evidenceElementIds: ['element-a'],
  assetBindings: [{ kind: 'model3d', id: 'model-a', trustMode: 'documented' }],
  experiencePeriodIds: ['period-a'],
  runtimeEraId: 'era-a',
  timeMachineIndexes: [0],
  publicationState: 'production-candidate'
};

const authority = {
  sourceIds: new Set(['source-a', 'source-b']),
  claimIds: new Set(['claim-a', 'claim-b']),
  evidenceElementIds: new Set(['element-a', 'element-b']),
  assetIds: new Set(['model-a', 'model-b']),
  experiencePeriodIds: new Set(['period-a', 'period-b'])
};

test('exact-date refuses false precision when month/day are absent', () => {
  const result = validateTemporalSceneRecord({
    ...base,
    extent: { kind: 'exact-date', date: { year: 1900 } }
  });
  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('temporal-exact-date-invalid'));
});

test('range validation rejects inverted historical bounds', () => {
  const result = validateTemporalSceneRecord({
    ...base,
    extent: {
      kind: 'bounded-range',
      from: { year: 1905 },
      to: { year: 1900 }
    }
  });
  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('temporal-range-inverted'));
});

test('reference-points preserve non-contiguous evidence dates without inventing continuity', () => {
  const result = validateTemporalSceneRecord({
    ...base,
    extent: { kind: 'reference-points', years: [1859, 1883] }
  });
  assert.equal(result.valid, true);
});

test('reference-points reject duplicate, unordered or single-year pseudo-ranges', () => {
  const duplicate = validateTemporalSceneRecord({
    ...base,
    extent: { kind: 'reference-points', years: [1859, 1859] }
  });
  assert.equal(duplicate.valid, false);
  assert.ok(duplicate.blockers.includes('temporal-reference-year-duplicate'));

  const unordered = validateTemporalSceneRecord({
    ...base,
    extent: { kind: 'reference-points', years: [1883, 1859] }
  });
  assert.equal(unordered.valid, false);
  assert.ok(unordered.blockers.includes('temporal-reference-years-not-ordered'));

  const one = validateTemporalSceneRecord({
    ...base,
    extent: { kind: 'reference-points', years: [1859] }
  });
  assert.equal(one.valid, false);
  assert.ok(one.blockers.includes('temporal-reference-points-too-few'));
});

test('registry fails closed when source, claim, element, asset or experience period is missing', () => {
  const result = validateTemporalSceneRegistry([
    {
      ...base,
      sourceIds: ['missing-source'],
      claimIds: ['missing-claim'],
      evidenceElementIds: ['missing-element'],
      assetBindings: [{ kind: 'model3d', id: 'missing-model' }],
      experiencePeriodIds: ['missing-period']
    }
  ], authority);

  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('temporal-source-not-found:scene-a:missing-source'));
  assert.ok(result.blockers.includes('temporal-claim-not-found:scene-a:missing-claim'));
  assert.ok(result.blockers.includes('temporal-element-not-found:scene-a:missing-element'));
  assert.ok(result.blockers.includes('temporal-asset-not-found:scene-a:missing-model'));
  assert.ok(result.blockers.includes('temporal-experience-period-not-found:scene-a:missing-period'));
});

test('overlapping active scenes require an explicit alternative group with distinct interpretation modes', () => {
  const implicit = validateTemporalSceneRegistry([
    base,
    {
      ...base,
      id: 'scene-b',
      claimIds: ['claim-b'],
      evidenceElementIds: ['element-b'],
      assetBindings: [{ kind: 'model3d', id: 'model-b' }],
      experiencePeriodIds: ['period-b'],
      timeMachineIndexes: [1]
    }
  ], authority);
  assert.equal(implicit.valid, false);
  assert.ok(implicit.blockers.includes('temporal-overlap-not-explicit:scene-a:scene-b'));

  const explicit = validateTemporalSceneRegistry([
    { ...base, alternativeGroupId: 'alt-1900' },
    {
      ...base,
      id: 'scene-b',
      interpretationMode: 'public-research',
      alternativeGroupId: 'alt-1900',
      claimIds: ['claim-b'],
      evidenceElementIds: ['element-b'],
      assetBindings: [{ kind: 'model3d', id: 'model-b', trustMode: 'public-research' }],
      experiencePeriodIds: ['period-b'],
      timeMachineIndexes: [1]
    }
  ], authority);
  assert.equal(explicit.valid, true);
});

test('time-machine index ownership is deterministic and conflict-free', () => {
  const scene = temporalSceneAtTimeMachineIndex([base], 'place-a', 0.4);
  assert.equal(scene?.id, 'scene-a');

  const conflict = validateTemporalSceneRegistry([
    base,
    {
      ...base,
      id: 'scene-b',
      extent: { kind: 'exact-year', year: 1901 },
      claimIds: ['claim-b'],
      evidenceElementIds: ['element-b'],
      assetBindings: [{ kind: 'model3d', id: 'model-b' }],
      experiencePeriodIds: ['period-b'],
      timeMachineIndexes: [0]
    }
  ], authority);
  assert.equal(conflict.valid, false);
  assert.ok(conflict.blockers.some((item) => item.startsWith('temporal-time-machine-index-conflict:')));
});

test('Romanov temporal registry resolves all current sources, claims, elements, models and period IDs', () => {
  assert.equal(romanovTemporalSceneValidation.valid, true);
  assert.deepEqual(romanovTemporalSceneValidation.blockers, []);
});

test('Romanov 1857 stays exact-year while restoration state remains non-contiguous reference points', () => {
  const pre = romanovTemporalScenes.find((scene) => scene.id === 'romanov-pre-restoration-1857');
  const restoration = romanovTemporalScenes.find((scene) => scene.id === 'romanov-restoration-reference-state');

  assert.deepEqual(pre?.extent, { kind: 'exact-year', year: 1857 });
  assert.deepEqual(restoration?.extent, { kind: 'reference-points', years: [1859, 1883] });
  assert.equal(restoration?.reconstructionStatus, 'mixed');
  assert.equal(restoration?.confidence, 'not-assessed');
});

test('existing Romanov runtime era mapping is now derived from temporal authority', () => {
  assert.equal(getRomanovRuntimeEraAtTimeIndex(0), '1857');
  assert.equal(getRomanovRuntimeEraAtTimeIndex(1), '1859');
  assert.equal(getRomanovRuntimeEraAtTimeIndex(2), '1859');
  assert.equal(getRomanovRuntimeEraAtTimeIndex(-5), '1857');
  assert.equal(getRomanovRuntimeEraAtTimeIndex(99), '1859');
});


test('date validation supports historical years below 100 without JavaScript Date.UTC century coercion', () => {
  const valid = validateTemporalSceneRecord({
    ...base,
    extent: { kind: 'exact-date', date: { year: 50, month: 2, day: 28 } }
  });
  assert.equal(valid.valid, true);

  const invalidLeapDay = validateTemporalSceneRecord({
    ...base,
    extent: { kind: 'exact-date', date: { year: 50, month: 2, day: 29 } }
  });
  assert.equal(invalidLeapDay.valid, false);
  assert.ok(invalidLeapDay.blockers.includes('temporal-exact-date-invalid'));
});

test('temporal scene source set must cover every source declared by its bound asset', () => {
  const result = validateTemporalSceneRegistry([
    { ...base, sourceIds: ['source-a'] }
  ], {
    ...authority,
    assetSourceIds: new Map([
      ['model-a', ['source-a', 'source-b']]
    ])
  });

  assert.equal(result.valid, false);
  assert.ok(
    result.blockers.includes(
      'temporal-scene-source-does-not-cover-asset:scene-a:model-a:source-b'
    )
  );
});

test('temporal authority cannot self-declare spatial field verification', () => {
  const forged = {
    ...base,
    publicationState: 'field-verified'
  } as unknown as TemporalSceneRecord;

  const result = validateTemporalSceneRecord(forged);
  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('temporal-publication-state-invalid'));
});
