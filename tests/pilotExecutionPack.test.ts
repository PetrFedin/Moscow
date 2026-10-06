import test from 'node:test';
import assert from 'node:assert/strict';

import {
  pilotExecutionRoles,
  pilotRaci,
  romanovFieldDayRequirements,
  oldEnglishCourtFieldDayRequirements,
  visitorPilotExecution,
  yclientsProviderActivation,
  governmentMeetingAsk,
  validatePilotExecutionPack
} from '../src/government/pilotExecutionPack.ts';
import {
  emptyPilotEconomicsCapture,
  validatePilotEconomicsCapture
} from '../src/government/measuredEconomicsCapture.ts';

test('pilot execution pack has complete role and RACI ownership', () => {
  const result = validatePilotExecutionPack();
  assert.equal(result.raciRolesValid, true);
  assert.equal(result.everyWorkstreamOwned, true);
  assert.equal(pilotExecutionRoles.length, 12);
  assert.equal(pilotRaci.length, 8);
});

test('Romanov field day preserves current code authority thresholds', () => {
  assert.equal(romanovFieldDayRequirements.minimumIosDevices, 2);
  assert.equal(romanovFieldDayRequirements.minimumAndroidDevices, 2);
  assert.deepEqual(romanovFieldDayRequirements.distanceBucketsMeters, [5, 10, 15]);
  assert.equal(romanovFieldDayRequirements.controlPointsPerSession, 5);
  assert.equal(romanovFieldDayRequirements.minimumCompleteSessions, 12);
  assert.equal(romanovFieldDayRequirements.meanResidualTargetCm, 35);
  assert.equal(romanovFieldDayRequirements.maxResidualTargetCm, 60);
});

test('Old English Court cannot reuse Romanov evidence', () => {
  assert.equal(oldEnglishCourtFieldDayRequirements.mustBeIndependentFromRomanovEvidence, true);
  assert.ok(oldEnglishCourtFieldDayRequirements.requiredArtifacts.length >= 6);
});

test('visitor pilot remains bounded and privacy-safe', () => {
  assert.equal(visitorPilotExecution.minimumParticipants, 20);
  assert.equal(visitorPilotExecution.maximumParticipants, 50);
  assert.ok(visitorPilotExecution.privacyRules.some((rule) => rule.includes('no names')));
});

test('provider activation enumerates required YCLIENTS runtime secrets and fail-closed rules', () => {
  assert.deepEqual(
    yclientsProviderActivation.requiredRuntimeSecrets,
    [
      'YCLIENTS_PARTNER_TOKEN',
      'YCLIENTS_USER_TOKEN',
      'YCLIENTS_COMPANY_ID',
      'YCLIENTS_WEBHOOK_PATH_TOKEN',
      'YCLIENTS_EVIDENCE_RETRIEVAL_TOKEN'
    ]
  );
  assert.ok(yclientsProviderActivation.guardrails.some((rule) => rule.includes('no mock or synthetic receipt')));
});

test('government ask requests bounded pilot enablement rather than citywide scale', () => {
  assert.ok(governmentMeetingAsk.decisionsRequired.length >= 8);
  assert.ok(governmentMeetingAsk.explicitNonAsks.includes('no citywide rollout approval'));
});

test('empty measured economics capture stays incomplete', () => {
  const validation = validatePilotEconomicsCapture(emptyPilotEconomicsCapture);
  assert.equal(validation.valid, false);
  assert.equal(validation.complete, false);
  assert.equal(validation.measured, 0);
  assert.equal(validation.total, 7);
});

test('complete measured economics capture requires basis and evidence for all seven inputs', () => {
  const capture = {
    ...emptyPilotEconomicsCapture,
    capturedAt: '2026-10-06T12:00:00Z',
    preparedBy: 'finance-owner',
    nextVerifiedObjectVariableCost: { amountRub: 1, basis: 'actual invoice', evidenceRef: 'evidence/cost' },
    nextVerifiedObjectProductionTime: { days: 1, basis: 'actual cycle', evidenceRef: 'evidence/time' },
    developerHoursPerObject: { hours: 1, basis: 'time log', evidenceRef: 'evidence/dev' },
    institutionOperatorHoursPerObject: { hours: 1, basis: 'time log', evidenceRef: 'evidence/operator' },
    districtSharedSetupCost: { amountRub: 1, basis: 'actual allocation', evidenceRef: 'evidence/setup' },
    districtIntegrationCost: { amountRub: 1, basis: 'actual integration', evidenceRef: 'evidence/integration' },
    annualOperationsCost: { amountRub: 1, basis: 'contract/run-rate', evidenceRef: 'evidence/run' }
  };

  const validation = validatePilotEconomicsCapture(capture);
  assert.equal(validation.valid, true);
  assert.equal(validation.complete, true);
  assert.equal(validation.measured, 7);
});
