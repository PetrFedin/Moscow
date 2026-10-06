import test from 'node:test';
import assert from 'node:assert/strict';

import { currentCommercialOperatingEvidence } from '../src/government/partnerInvestorOperatingModel.ts';
import { demoCommercialOperatingEvidence } from '../src/government/partnerConsoleSandbox.ts';
import { buildInvestorPortfolioSnapshot } from '../src/government/investorPortfolioModel.ts';

test('actual investor portfolio remains empty without real commercial evidence', () => {
  const actual = buildInvestorPortfolioSnapshot(currentCommercialOperatingEvidence, 'actual');
  assert.equal(actual.totalRecognizedRevenueRub, null);
  assert.equal(actual.totalRecurringRevenueRub, null);
  assert.equal(actual.signedCommercialContracts, 0);
  assert.ok(actual.revenueMix.every((bucket) => bucket.evidenceState === 'none'));
});

test('demo portfolio is explicitly modelled and never marked actual', () => {
  const demo = buildInvestorPortfolioSnapshot(demoCommercialOperatingEvidence, 'demo');
  assert.equal(demo.signedCommercialContracts, 1);
  assert.ok((demo.totalRecognizedRevenueRub ?? 0) > 0);
  assert.ok(demo.revenueMix.some((bucket) => bucket.evidenceState === 'modelled'));
  assert.ok(demo.revenueMix.every((bucket) => bucket.evidenceState !== 'actual'));
});

test('demo revenue is isolated from actual evidence', () => {
  assert.equal(currentCommercialOperatingEvidence.ledger.length, 0);
  assert.ok(demoCommercialOperatingEvidence.ledger.length > 0);
  assert.notEqual(currentCommercialOperatingEvidence, demoCommercialOperatingEvidence);
});
