import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getGovernmentOwnerRouteCopy,
  governmentOwnerRouteDurationSeconds
} from '../src/government/governmentOwnerRoute.ts';

test('Government Owner Route fits the 10–12 minute target', () => {
  const seconds = governmentOwnerRouteDurationSeconds();
  assert.ok(seconds >= 600);
  assert.ok(seconds <= 720);
});

test('Government Owner Route covers the full executive story in twelve steps', () => {
  const copy = getGovernmentOwnerRouteCopy('ru');
  assert.equal(copy.steps.length, 12);
  assert.deepEqual(
    copy.steps.map((item) => item.id),
    [
      'city-problem',
      'traveler-utility',
      'city-buys',
      'partner-economics',
      'demand-marketplace',
      'district-opportunity',
      'digital-twin',
      'capital-portfolio',
      'committee-governance',
      'programme-control',
      'learning-model-risk',
      'audit-decision'
    ]
  );
});

test('route is localized for RU, EN and ZH with Russian as the canonical first route', () => {
  for (const language of ['ru','en','zh'] as const) {
    const copy = getGovernmentOwnerRouteCopy(language);
    assert.equal(copy.steps.length, 12);
    assert.ok(copy.title.length > 10);
    assert.ok(copy.finalDecisionBody.length > 10);
  }

  assert.match(getGovernmentOwnerRouteCopy('ru').title, /Москва/);
});

test('each executive step points to an existing proof destination', () => {
  const allowed = new Set([
    'control','product','deliverables','ecosystem','operations','money','acceptance','contract'
  ]);

  for (const step of getGovernmentOwnerRouteCopy('ru').steps) {
    assert.ok(allowed.has(step.destination));
    assert.ok(step.executiveQuestion.length > 10);
    assert.ok(step.answer.length > 20);
    assert.ok(step.cityValue.length > 10);
    assert.ok(step.travelerValue.length > 10);
    assert.ok(step.partnerValue.length > 10);
    assert.ok(step.proof.length > 10);
  }
});
