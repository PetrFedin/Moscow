import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMoscowIntegrationRoadmap,
  evaluateMoscowIntegrationPhase0,
  validateOldEnglishCourtRepeatabilityProof
} from '../src/spatial/integrationMasterPlanGate.ts';

test('current master plan stays fail-closed without physical evidence', () => {
  const gate = evaluateMoscowIntegrationPhase0();
  assert.equal(gate.status, 'blocked');
  assert.equal(gate.evidence.romanovFieldExperience, false);
  assert.equal(gate.evidence.physicalSpatialAccuracy, false);
  assert.equal(gate.evidence.oldEnglishCourtRepeatability, false);
  assert.equal(gate.evidence.supervisedUserPilot, false);
  assert.equal(gate.guardrails.massIngestionAllowed, false);
  assert.equal(gate.guardrails.spatialScalingAllowed, false);
  assert.equal(gate.guardrails.yandexMapKitPrimaryRenderer, true);
});

test('all later integration phases are locked while phase 0 is blocked', () => {
  const roadmap = buildMoscowIntegrationRoadmap();
  const later = roadmap.phases.filter((phase) => phase.id !== 'MOSCOW-INT-00');
  assert.ok(later.length === 9);
  assert.ok(later.every((phase) => phase.status === 'locked-by-phase-0'));
  assert.equal(roadmap.nextPhase, 'MOSCOW-INT-00');
});

test('Old English Court repeatability rejects Romanov evidence reuse', () => {
  const result = validateOldEnglishCourtRepeatabilityProof({
    version: 1,
    placeId: 'old-english-court',
    releaseState: 'field-verified-spatial-scene',
    authorityNamespace: 'old-english-court',
    romanovEvidenceReused: true as false,
    modelEvidenceRef: 'evidence/oec/model.json',
    metricAuthorityRef: 'evidence/oec/metric.json',
    controlPointAuthorityRef: 'evidence/oec/control-points.json',
    surveyEvidenceRef: 'evidence/oec/survey.json',
    fieldMatrixEvidenceRef: 'evidence/oec/field-matrix.json',
    persistentAnchorEvidenceRef: 'evidence/oec/anchor.json'
  });
  assert.equal(result.valid, false);
  assert.ok(result.blockers.includes('old-english-court-romanov-evidence-reuse-forbidden'));
});

test('phase completion cannot jump over prerequisites', () => {
  const passedPhase0 = {
    ...evaluateMoscowIntegrationPhase0(),
    status: 'pass' as const,
    blockers: [],
    guardrails: {
      massIngestionAllowed: true,
      spatialScalingAllowed: true,
      yandexMapKitPrimaryRenderer: true as const,
      externalProviderProofIndependent: true as const
    }
  };

  assert.throws(() => buildMoscowIntegrationRoadmap({
    phase0: passedPhase0,
    completedPhaseIds: ['MOSCOW-INT-02']
  }), /contiguous/);
});

test('after phase 0 passes, only destination package v2 becomes available first', () => {
  const passedPhase0 = {
    ...evaluateMoscowIntegrationPhase0(),
    status: 'pass' as const,
    blockers: [],
    guardrails: {
      massIngestionAllowed: true,
      spatialScalingAllowed: true,
      yandexMapKitPrimaryRenderer: true as const,
      externalProviderProofIndependent: true as const
    }
  };
  const roadmap = buildMoscowIntegrationRoadmap({ phase0: passedPhase0 });
  assert.equal(roadmap.nextPhase, 'MOSCOW-INT-01');
  assert.equal(roadmap.phases.find((phase) => phase.id === 'MOSCOW-INT-01')?.status, 'available');
  assert.equal(roadmap.phases.find((phase) => phase.id === 'MOSCOW-INT-02')?.status, 'locked-by-prerequisite');
});
