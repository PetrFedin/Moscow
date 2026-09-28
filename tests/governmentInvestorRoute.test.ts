import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getGovernmentInvestorRouteState,
  governmentInvestorRoute
} from '../src/government/governmentInvestorRoute.ts';

test('guided government route is a bounded 7-10 minute decision journey', () => {
  assert.equal(governmentInvestorRoute.durationMinutes, '7–10');
  assert.equal(governmentInvestorRoute.steps.length, 8);
  assert.deepEqual(
    governmentInvestorRoute.steps.map((step) => step.id),
    [
      'problem',
      'pilot',
      'proof',
      'city-ask',
      'city-value',
      'funding',
      'scale',
      'next-decision'
    ]
  );
});

test('first meeting asks for a bounded pilot process rather than total project financing', () => {
  assert.match(governmentInvestorRoute.firstMeetingGoal, /владельца задачи/i);
  assert.match(governmentInvestorRoute.firstMeetingGoal, /пилот/i);
  assert.match(governmentInvestorRoute.firstMeetingDoNotAsk, /не просить финансирование всей платформы/i);
  assert.match(governmentInvestorRoute.cityNextAction, /пилотную площадку/i);
});

test('investment and federal actions remain gated after Moscow proof', () => {
  assert.match(governmentInvestorRoute.investorNextAction, /после physical proof/i);
  assert.match(governmentInvestorRoute.investorNextAction, /unit economics/i);
  assert.match(governmentInvestorRoute.federalNextAction, /после Moscow reference city/i);
  assert.match(governmentInvestorRoute.federalNextAction, /первого внешнего региона/i);
});

test('guided route cannot silently convert current blockers into readiness', () => {
  const state = getGovernmentInvestorRouteState();
  assert.equal(state.pilotProven, false);
  assert.equal(state.decisionPackReady, false);
  assert.ok(state.blockerCount > 0);
});

test('guided route contains no guaranteed public or investment funding claim', () => {
  const serialized = JSON.stringify(governmentInvestorRoute).toLowerCase();
  for (const forbidden of [
    'финансирование одобрено',
    'инвестиции одобрены',
    'субсидия гарантирована',
    'бюджет утверждён',
    'бюджет утвержден',
    'закупка гарантирована'
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});
