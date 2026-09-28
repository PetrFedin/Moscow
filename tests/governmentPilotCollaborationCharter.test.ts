import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getGovernmentPilotCharterReadiness,
  governmentPilotCollaborationCharter
} from '../src/government/governmentPilotCollaborationCharter.ts';

test('collaboration charter defines five gated phases from scope to separate next-stage decision', () => {
  assert.equal(governmentPilotCollaborationCharter.version, 1);
  assert.equal(governmentPilotCollaborationCharter.status, 'proposed-working-model');
  assert.deepEqual(
    governmentPilotCollaborationCharter.phases.map((phase) => phase.id),
    ['scope', 'pre-pilot', 'evidence', 'review', 'next-stage']
  );
});

test('current charter readiness stops at scope until external owner and site are confirmed', () => {
  const readiness = getGovernmentPilotCharterReadiness();

  assert.equal(readiness.workingModelReady, true);
  assert.equal(readiness.currentGate, 'scope');
  assert.equal(readiness.cityOwnerConfirmed, false);
  assert.equal(readiness.pilotSiteConfirmed, false);
  assert.equal(readiness.buyerReviewCompleted, false);
  assert.equal(readiness.physicalEvidenceCompleted, false);
  assert.equal(readiness.visitorEvidenceCompleted, false);
  assert.equal(readiness.providerAccessConfirmed, false);
  assert.equal(readiness.nextStageDecisionMade, false);
});

test('roles keep city owner pilot operator project team and content authority separate', () => {
  const byId = new Map(
    governmentPilotCollaborationCharter.roles.map((role) => [role.id, role])
  );

  assert.match(
    byId.get('city-owner')?.mustNotBeAssumed ?? '',
    /не обязательно является конечным бюджетодержателем/i
  );
  assert.match(
    byId.get('pilot-operator')?.mustNotBeAssumed ?? '',
    /не означает автоматическую финансовую поддержку/i
  );
  assert.match(
    byId.get('project-team')?.mustNotBeAssumed ?? '',
    /не является historical, legal, procurement или city-budget authority/i
  );
  assert.match(
    byId.get('heritage-authority')?.mustNotBeAssumed ?? '',
    /не определяется продуктовой командой/i
  );
});

test('evidence phase cannot be closed by presentation mock or manual green status', () => {
  const evidence = governmentPilotCollaborationCharter.phases.find(
    (phase) => phase.id === 'evidence'
  );

  assert.ok(evidence);
  assert.match(evidence!.requiredInputs.join(' '), /Romanov field day/i);
  assert.match(evidence!.requiredInputs.join(' '), /20–50 supervised visitor sessions/i);
  assert.match(evidence!.gate, /нельзя закрывать презентацией, mock или ручным green status/i);
});

test('next-stage decision never auto-converts pilot into procurement investment or federal funding', () => {
  const nextStage = governmentPilotCollaborationCharter.phases.find(
    (phase) => phase.id === 'next-stage'
  );

  assert.ok(nextStage);
  assert.match(
    nextStage!.gate,
    /не конвертируется автоматически в закупку, инвестиции, региональное или федеральное финансирование/i
  );
});

test('charter explicitly separates project contribution city contribution and shared decisions', () => {
  assert.ok(governmentPilotCollaborationCharter.projectProvides.length >= 5);
  assert.ok(governmentPilotCollaborationCharter.cityOrPartnersProvide.length >= 5);
  assert.ok(governmentPilotCollaborationCharter.sharedDecisions.length >= 5);
  assert.match(
    governmentPilotCollaborationCharter.cityOrPartnersProvide.join(' '),
    /Профильного владельца городской задачи/i
  );
  assert.match(
    governmentPilotCollaborationCharter.sharedDecisions.join(' '),
    /Какие evidence являются достаточными/i
  );
});
