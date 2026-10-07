import test from 'node:test';
import assert from 'node:assert/strict';

import { currentPilotReadinessDossier } from '../src/government/pilotReadinessDossier.ts';

test('pilot readiness dossier keeps external and field gates blocked', () => {
  const d = currentPilotReadinessDossier;
  assert.equal(d.summary.decisionPackReady, false);
  assert.equal(d.summary.phase0Status, 'blocked');
  assert.ok(d.items.some((item) => item.id === 'romanov-field-proof-missing' && item.status === 'blocked-field'));
  assert.ok(d.items.some((item) => item.id === 'live-provider-agreement-missing' && item.status === 'blocked-external'));
});

test('every readiness blocker has owner input evidence and acceptance gate', () => {
  for (const item of currentPilotReadinessDossier.items) {
    assert.ok(item.requiredOwner.trim().length > 0);
    assert.ok(item.requiredInput.trim().length > 0);
    assert.ok(item.evidenceRequired.length > 0);
    assert.ok(item.acceptanceGate.trim().length > 0);
    assert.ok(item.canPrepareNow.length > 0);
  }
});

test('readiness dossier does not invent external proof', () => {
  const prohibited = currentPilotReadinessDossier.items.filter(
    (item) => item.status === 'ready' && item.blockedUntil
  );
  assert.equal(prohibited.length, 0);
});
