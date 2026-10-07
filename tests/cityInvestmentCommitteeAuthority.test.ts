import test from 'node:test';
import assert from 'node:assert/strict';

import {
  approvalStageCanStart,
  committeeApprovalReadiness,
  createCapitalCommitment,
  executionCanStart,
  investmentCommitteeWorkspaceState,
  validateInvestmentBusinessCase
} from '../src/marketplace/cityInvestmentCommitteeAuthority.ts';
import {
  demoInvestmentCommitteeWorkspace
} from '../src/marketplace/cityInvestmentCommitteeDemo.ts';

test('demo investment committee workspace is fully governed', () => {
  const validation = validateInvestmentBusinessCase(
    demoInvestmentCommitteeWorkspace.businessCase
  );
  assert.equal(validation.valid, true);

  const readiness = committeeApprovalReadiness(
    demoInvestmentCommitteeWorkspace.businessCase,
    demoInvestmentCommitteeWorkspace.approvals
  );
  assert.equal(readiness.readyToCommit, true);
  assert.equal(investmentCommitteeWorkspaceState(demoInvestmentCommitteeWorkspace), 'BENEFITS_REVIEWED');
});

test('capital commitment is blocked when required evidence is missing', () => {
  const brokenCase = {
    ...demoInvestmentCommitteeWorkspace.businessCase,
    evidencePackage: demoInvestmentCommitteeWorkspace.businessCase.evidencePackage.map((item, index) =>
      index === 0 ? { ...item, accepted: false } : item
    )
  };

  assert.throws(
    () => createCapitalCommitment({
      businessCase: brokenCase,
      approvals: demoInvestmentCommitteeWorkspace.approvals,
      amountRub: brokenCase.requestedCapitalRub,
      committedAt: '2026-10-06T12:00:00+03:00',
      authorityRef: 'AUTH'
    }),
    /capital-commitment-blocked/
  );
});

test('approval stages cannot start before earlier required stages are approved', () => {
  const approvals = demoInvestmentCommitteeWorkspace.approvals.map((stage) => ({
    ...stage,
    status: stage.id === 'finance' ? 'NOT_STARTED' as const : stage.status,
    decisionRef: stage.id === 'finance' ? null : stage.decisionRef,
    decidedAt: stage.id === 'finance' ? null : stage.decidedAt
  }));

  assert.equal(approvalStageCanStart('procurement-legal', approvals), false);
  assert.equal(approvalStageCanStart('finance', approvals), true);
});

test('execution requires committed capital', () => {
  assert.equal(executionCanStart(null), false);
  assert.equal(executionCanStart(demoInvestmentCommitteeWorkspace.commitment), true);
});

test('benefits review does not establish causality', () => {
  assert.equal(
    demoInvestmentCommitteeWorkspace.benefitsReview?.causality,
    'not-established'
  );
});
