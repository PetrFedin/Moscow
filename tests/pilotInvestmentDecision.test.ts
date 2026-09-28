import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDistrictScaleModel,
  currentPilotInvestmentEvidence,
  getPilotDecisionReadiness,
  validatePilotInvestmentEvidence,
  type PilotInvestmentEvidence
} from '../src/government/pilotInvestmentDecision.ts';

function measuredEvidence(): PilotInvestmentEvidence {
  return {
    version: 1,
    proof: {
      romanovFieldVerified: true,
      oldEnglishCourtRepeatabilityVerified: true,
      visitorPilotReviewed: true,
      liveProviderAgreementReady: true
    },
    governance: {
      publicationRightsBlockers: 0,
      securityDataFlowReviewed: true,
      ipHandoverReviewed: true,
      operationsSlaReviewed: true
    },
    economics: {
      nextVerifiedObjectVariableCost: {
        amountRub: 1_200_000,
        basis: 'Measured Old English Court production and verification cost',
        evidenceRef: 'evidence/economics/oec-v1'
      },
      nextVerifiedObjectProductionTime: {
        days: 35,
        basis: 'Calendar days from approved brief to accepted package',
        evidenceRef: 'evidence/economics/oec-cycle-v1'
      },
      developerHoursPerObject: {
        hours: 24,
        basis: 'Tracked engineering time for second object',
        evidenceRef: 'evidence/economics/oec-dev-hours-v1'
      },
      institutionOperatorHoursPerObject: {
        hours: 42,
        basis: 'Tracked editor/reviewer/publisher time',
        evidenceRef: 'evidence/economics/oec-operator-hours-v1'
      },
      districtSharedSetupCost: {
        amountRub: 3_000_000,
        basis: 'Approved district setup work package',
        evidenceRef: 'evidence/economics/district-setup-v1'
      },
      districtIntegrationCost: {
        amountRub: 2_000_000,
        basis: 'Measured integration estimate backed by provider scope',
        evidenceRef: 'evidence/economics/district-integration-v1'
      },
      annualOperationsCost: {
        amountRub: 4_500_000,
        basis: 'Measured hosting/support/content operations plan',
        evidenceRef: 'evidence/economics/annual-ops-v1'
      }
    }
  };
}

test('current project is not investment-decision ready while physical and economic evidence is missing', () => {
  const readiness = getPilotDecisionReadiness(currentPilotInvestmentEvidence);

  assert.equal(readiness.proofReady, false);
  assert.equal(readiness.governanceReady, false);
  assert.equal(readiness.economicsReady, false);
  assert.equal(readiness.decisionPackReady, false);
  assert.ok(readiness.blockers.includes('romanov-field-proof-missing'));
  assert.ok(readiness.blockers.includes('next-object-cost-unmeasured'));
  assert.ok(readiness.blockers.includes('annual-operations-cost-unmeasured'));

  assert.throws(
    () => buildDistrictScaleModel(currentPilotInvestmentEvidence, 20),
    /requires measured economics/
  );
});

test('complete measured evidence makes the pack decision-ready without making the decision', () => {
  const evidence = measuredEvidence();
  const readiness = getPilotDecisionReadiness(evidence);

  assert.deepEqual(readiness, {
    proofReady: true,
    governanceReady: true,
    economicsReady: true,
    decisionPackReady: true,
    blockers: []
  });

  assert.equal('go' in readiness, false);
  assert.equal('recommendation' in readiness, false);
  assert.equal('roi' in readiness, false);
});

test('district model performs transparent arithmetic only from measured evidence', () => {
  const model = buildDistrictScaleModel(measuredEvidence(), 20);

  assert.equal(model.objectCount, 20);
  assert.equal(model.variableObjectProductionCostRub, 1_200_000);
  assert.equal(model.sharedSetupCostRub, 3_000_000);
  assert.equal(model.integrationCostRub, 2_000_000);
  assert.equal(model.initialDistrictDeliveryCostRub, 29_000_000);
  assert.equal(model.annualOperationsCostRub, 4_500_000);
  assert.equal(model.sequentialObjectProductionDays, 700);
  assert.equal(model.developerHoursForObjects, 480);
  assert.equal(model.institutionOperatorHoursForObjects, 840);
  assert.ok(model.caveats.some((item) => /not a procurement price/i.test(item)));
  assert.ok(model.caveats.some((item) => /ROI is not calculated/i.test(item)));
});

test('invalid or evidence-free money inputs are rejected rather than normalized', () => {
  const evidence = measuredEvidence();
  evidence.economics.nextVerifiedObjectVariableCost = {
    amountRub: -1,
    basis: '',
    evidenceRef: ''
  };

  const validation = validatePilotInvestmentEvidence(evidence);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('next-object-cost-amount-invalid'));
  assert.ok(validation.blockers.includes('next-object-cost-basis-missing'));
  assert.ok(validation.blockers.includes('next-object-cost-evidence-missing'));

  assert.throws(
    () => getPilotDecisionReadiness(evidence),
    /Invalid pilot investment evidence/
  );
});

test('district model refuses arbitrary scale counts outside the bounded contract', () => {
  const evidence = measuredEvidence();
  assert.throws(() => buildDistrictScaleModel(evidence, 0), /integer from 1 to 500/);
  assert.throws(() => buildDistrictScaleModel(evidence, 501), /integer from 1 to 500/);
});
