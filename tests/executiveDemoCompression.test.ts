import test from 'node:test';
import assert from 'node:assert/strict';

import {
  executiveCompressedDurationSeconds,
  getExecutiveCompressedSteps,
  validateExecutiveCompression
} from '../src/government/executiveDemoCompression.ts';
import {
  INVESTOR_MVP_FREEZE,
  investorMvpFeatureChangesAllowed,
  isInvestorMvpMaintenanceChange
} from '../src/government/investorMvpFreeze.ts';

test('compressed executive demo is twelve steps and exactly 10m40s', () => {
  const steps = getExecutiveCompressedSteps('ru');
  assert.equal(steps.length, 12);
  assert.equal(executiveCompressedDurationSeconds(), 640);
  assert.ok(steps.every((step) => step.durationSeconds <= 60));
});

test('every compressed step follows thesis proof objection answer next', () => {
  const validation = validateExecutiveCompression();
  assert.equal(validation.stepCount, 12);
  assert.equal(validation.durationSeconds, 640);
  assert.equal(validation.inTargetWindow, true);
  assert.equal(validation.allHaveSingleSpine, true);

  for (const language of ['ru','en','zh'] as const) {
    for (const step of getExecutiveCompressedSteps(language)) {
      assert.ok(step.thesis.trim().length > 0);
      assert.ok(step.proof.trim().length > 0);
      assert.ok(step.objection.trim().length > 0);
      assert.ok(step.answer.trim().length > 0);
      assert.ok(step.next.trim().length > 0);
    }
  }
});

test('Investor MVP is feature-frozen after compression', () => {
  assert.equal(INVESTOR_MVP_FREEZE.state, 'FEATURE_FROZEN');
  assert.equal(investorMvpFeatureChangesAllowed(), false);
  assert.equal(isInvestorMvpMaintenanceChange('bugfix'), true);
  assert.equal(isInvestorMvpMaintenanceChange('pilot-readiness'), true);
  assert.equal(isInvestorMvpMaintenanceChange('new-investor-module'), false);
});
