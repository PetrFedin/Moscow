import test from 'node:test';
import assert from 'node:assert/strict';

import { revenueEngines, stakeholderValues } from '../src/government/stakeholderValueModel.ts';

test('stakeholder value model covers all six core stakeholder groups', () => {
  const ids = stakeholderValues.map((item) => item.id);
  assert.deepEqual(
    ids,
    ['traveler','city','heritage','commercial-partner','integration-partner','financial-investor']
  );
  for (const item of stakeholderValues) {
    assert.ok(item.currentValue.length > 0);
    assert.ok(item.futureValue.length > 0);
    assert.ok(item.givesPlatform.length > 0);
    assert.ok(item.successEvidence.length > 0);
  }
});

test('every revenue engine declares payer, charge basis, proof gate and guardrail', () => {
  assert.equal(revenueEngines.length, 9);
  for (const engine of revenueEngines) {
    assert.ok(engine.payer);
    assert.ok(engine.chargeBasis.trim());
    assert.ok(engine.valueCreated.trim());
    assert.ok(engine.evidenceRequiredBeforePricing.length > 0);
    assert.ok(engine.guardrails.length > 0);
  }
});

test('future revenue engines are not mislabelled as MVP revenue', () => {
  const mvp = revenueEngines.filter((item) => item.maturity === 'mvp').map((item) => item.id);
  assert.deepEqual(mvp, ['government-pilot']);
});
