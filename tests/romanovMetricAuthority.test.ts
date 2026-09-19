import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentRomanovMetricBinding,
  getRomanovResearchEnvelope,
  isCurrentRomanovMetricBinding,
  ROMANOV_METRIC_AUTHORITY,
  romanovResearchPointToViro
} from '../src/spatial/romanovMetricAuthority.ts';

test('Romanov metric authority declares one model unit as one meter', () => {
  assert.equal(ROMANOV_METRIC_AUTHORITY.modelUnits, 'meters');
  assert.equal(ROMANOV_METRIC_AUTHORITY.metersPerModelUnit, 1);
  assert.equal(ROMANOV_METRIC_AUTHORITY.scaleStatus, 'provisional-pending-survey');
});

test('research x/depth/height coordinates map deterministically into Viro x/height/depth', () => {
  assert.deepEqual(romanovResearchPointToViro([2, -4.25, 6.35]), [2, 6.35, -4.25]);
});

test('metric binding is exact and versioned', () => {
  assert.equal(isCurrentRomanovMetricBinding(currentRomanovMetricBinding), true);
  assert.equal(isCurrentRomanovMetricBinding({ ...currentRomanovMetricBinding, metricAuthorityVersion: 999 as 1 }), false);
});

test('research envelopes remain explicit and era-specific until field survey replaces them', () => {
  assert.deepEqual(getRomanovResearchEnvelope('1857').max, [6.5, 4, 9.25]);
  assert.deepEqual(getRomanovResearchEnvelope('1859').max, [8.2, 3.8, 12.975]);
});
