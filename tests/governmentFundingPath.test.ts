import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getGovernmentFundingPathState,
  governmentFundingPath
} from '../src/government/governmentFundingPath.ts';

test('funding path separates pilot deployment investment and federal mechanisms', () => {
  assert.equal(governmentFundingPath.version, 1);
  assert.deepEqual(
    governmentFundingPath.mechanisms.map((item) => item.id),
    [
      'moscow-pilot-support',
      'moscow-deployment',
      'investment-scale',
      'regional-federal'
    ]
  );
  assert.deepEqual(
    governmentFundingPath.mechanisms.map((item) => item.stage),
    ['pilot', 'deployment', 'investment', 'regional-federal']
  );
});

test('current state opens only the candidate Moscow pilot-support contour', () => {
  const state = getGovernmentFundingPathState();
  const byId = new Map(state.mechanisms.map((item) => [item.id, item]));

  assert.equal(state.currentFocus, 'moscow-pilot-support');
  assert.equal(byId.get('moscow-pilot-support')?.unlocked, true);
  assert.equal(byId.get('moscow-deployment')?.unlocked, false);
  assert.equal(byId.get('investment-scale')?.unlocked, false);
  assert.equal(byId.get('regional-federal')?.unlocked, false);
  assert.equal(state.deploymentUnlocked, false);
  assert.equal(state.investmentReviewUnlocked, false);
  assert.equal(state.federalDialogueUnlocked, false);
});

test('funding path does not imply automatic budget procurement subsidy or investment', () => {
  const serialized = JSON.stringify(governmentFundingPath).toLowerCase();

  for (const forbidden of [
    'финансирование одобрено',
    'бюджет утверждён',
    'бюджет утвержден',
    'закупка гарантирована',
    'субсидия гарантирована',
    'инвестиции одобрены',
    'федеральное финансирование гарантировано'
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }

  assert.match(
    governmentFundingPath.mechanisms[0]!.boundary,
    /не означает одобрение финансовой поддержки/i
  );
  assert.match(
    governmentFundingPath.mechanisms[3]!.boundary,
    /не получает федеральное финансирование автоматически/i
  );
});

test('deployment and investment gates require real buyer and measured evidence', () => {
  const deployment = governmentFundingPath.mechanisms.find(
    (item) => item.id === 'moscow-deployment'
  );
  const investment = governmentFundingPath.mechanisms.find(
    (item) => item.id === 'investment-scale'
  );

  assert.ok(deployment);
  assert.ok(investment);
  assert.match(deployment!.entryGate, /buyer\/budget owner/i);
  assert.match(deployment!.entryGate, /IP\/hosting\/security\/SLA/i);
  assert.match(investment!.entryGate, /Physical proof/i);
  assert.match(investment!.entryGate, /измеренная стоимость\/срок/i);
});

test('federal stage is explicitly gated by Moscow reference and first external region', () => {
  const federal = governmentFundingPath.mechanisms.find(
    (item) => item.id === 'regional-federal'
  );

  assert.ok(federal);
  assert.match(federal!.entryGate, /Москва как reference city/i);
  assert.match(federal!.entryGate, /первый внешний регион/i);
  assert.match(federal!.projectUse, /стандарт подключения региона/i);
});
