import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMetricBinding,
  isCurrentMetricBinding,
  isMetricScaleAuthoritative,
  validateHeritageMetricAuthority,
  type HeritageMetricAuthority
} from '../src/spatial/heritageMetricAuthority.ts';
import {
  createControlPointBinding,
  isCurrentControlPointBinding,
  validateHeritageControlPointAuthority
} from '../src/spatial/heritageControlPointAuthority.ts';

test('generic metric authority creates a stable versioned binding', () => {
  const authority: HeritageMetricAuthority = {
    id: 'heritage-object-metric-v1',
    version: 1,
    modelPackVersion: 'heritage-object-model-v3',
    modelUnits: 'meters',
    metersPerModelUnit: 1,
    scaleStatus: 'verified',
    verifiedScaleTolerance: 0.01
  };

  assert.deepEqual(validateHeritageMetricAuthority(authority), {
    valid: true,
    blockers: []
  });

  const binding = createMetricBinding(authority);
  assert.equal(isCurrentMetricBinding(binding, binding), true);
  assert.equal(
    isCurrentMetricBinding({ ...binding, modelPackVersion: 'old-pack' }, binding),
    false
  );
  assert.equal(isMetricScaleAuthoritative(1.005, authority), true);
  assert.equal(isMetricScaleAuthoritative(1.05, authority), false);
});

test('generic metric authority rejects non-positive scale and invalid tolerance', () => {
  const validation = validateHeritageMetricAuthority({
    id: 'metric',
    version: 1,
    modelPackVersion: 'model-v1',
    modelUnits: 'meters',
    metersPerModelUnit: 0,
    scaleStatus: 'verified',
    verifiedScaleTolerance: -1
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('meters-per-model-unit-invalid'));
  assert.ok(validation.blockers.includes('metric-scale-tolerance-invalid'));
});

test('generic control-point authority enforces exact point count and alignment minimum', () => {
  const set = {
    id: 'heritage-facade-points-v1',
    version: 1,
    requiredPoints: 5,
    requiredAlignmentPoints: 3
  };
  const points = [
    { id: 'a', purpose: 'alignment' as const, state: 'pending-survey' as const },
    { id: 'b', purpose: 'alignment' as const, state: 'pending-survey' as const },
    { id: 'c', purpose: 'alignment' as const, state: 'pending-survey' as const },
    { id: 'd', purpose: 'quality-check' as const, state: 'pending-survey' as const },
    { id: 'e', purpose: 'quality-check' as const, state: 'pending-survey' as const }
  ];

  const binding = createControlPointBinding(set);
  assert.equal(isCurrentControlPointBinding(binding, binding), true);
  assert.deepEqual(validateHeritageControlPointAuthority(set, points), {
    valid: true,
    blockers: []
  });

  const tooFewAlignment = points.map((point, index) =>
    index === 2 ? { ...point, purpose: 'quality-check' as const } : point
  );
  const validation = validateHeritageControlPointAuthority(set, tooFewAlignment);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('alignment-point-count-below-minimum:2:3'));
});

test('generic control-point authority rejects duplicate IDs', () => {
  const validation = validateHeritageControlPointAuthority(
    {
      id: 'heritage-facade-points-v1',
      version: 1,
      requiredPoints: 2,
      requiredAlignmentPoints: 1
    },
    [
      { id: 'same', purpose: 'alignment', state: 'pending-survey' },
      { id: 'same', purpose: 'quality-check', state: 'pending-survey' }
    ]
  );

  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('duplicate-control-point-id'));
});
