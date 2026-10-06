import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CAPITAL_ALLOCATION_POLICY_V1,
  optimizeDistrictPortfolio,
  scoreCapitalOption,
  verifyCapitalPortfolio
} from '../src/marketplace/districtPortfolioOptimizer.ts';
import {
  demoCapitalOptions,
  demoDistrictPortfolio
} from '../src/marketplace/districtPortfolioDemo.ts';

test('capital allocation policy weights sum to one', () => {
  const sum = Object.values(CAPITAL_ALLOCATION_POLICY_V1.weights)
    .reduce((acc, value) => acc + value, 0);
  assert.equal(sum, 1);
});

test('selected portfolio never exceeds budget', () => {
  assert.ok(demoDistrictPortfolio.totalCapitalRub <= demoDistrictPortfolio.budgetRub);
  assert.equal(
    demoDistrictPortfolio.budgetRemainingRub,
    demoDistrictPortfolio.budgetRub - demoDistrictPortfolio.totalCapitalRub
  );
});

test('optimizer remains recommendation-only', () => {
  assert.equal(demoDistrictPortfolio.claims.recommendationOnly, true);
  assert.equal(demoDistrictPortfolio.claims.procurementDecision, false);
  assert.equal(demoDistrictPortfolio.claims.investmentDecision, false);
  assert.equal(demoDistrictPortfolio.claims.causalityEstablished, false);
});

test('blocked or low-confidence options are not eligible', () => {
  const option = {
    ...demoCapitalOptions[0]!,
    id: 'low-confidence',
    evidenceConfidence: 0.1
  };
  const scored = scoreCapitalOption(option);
  assert.equal(scored.eligible, false);
  assert.ok(scored.blockers.includes('confidence-below-threshold'));
});

test('smaller budget yields a subset within the constraint', () => {
  const portfolio = optimizeDistrictPortfolio({
    id: 'small-budget',
    mode: 'demo',
    budgetRub: 100000000,
    options: demoCapitalOptions
  });
  assert.ok(portfolio.totalCapitalRub <= 100000000);
});

test('post-investment verification stays non-causal', () => {
  const verification = verifyCapitalPortfolio({
    portfolio: demoDistrictPortfolio,
    optionVerification: demoDistrictPortfolio.selected.map((item, index) => ({
      optionId: item.option.id,
      result: index === 0 ? 'VERIFIED_DIRECTIONALLY' as const : 'INSUFFICIENT' as const,
      actualCapitalRub: item.option.requiredCapitalRub
    }))
  });

  assert.equal(verification.causality, 'not-established');
  assert.ok(['DIRECTIONALLY_SUPPORTED','MIXED','INSUFFICIENT','DIRECTIONALLY_MISSED'].includes(verification.conclusion));
});
