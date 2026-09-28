import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentGovernmentDeliveryManifest,
  evaluateGovernmentDeliveryReadiness,
  validateGovernmentDeliveryManifest,
  type GovernmentDeliveryManifest
} from '../src/government/governmentDeliveryManifest.ts';
import type { PilotInvestmentEvidence } from '../src/government/pilotInvestmentDecision.ts';

function allArtifactsReady(): GovernmentDeliveryManifest {
  return {
    version: 1,
    artifacts: currentGovernmentDeliveryManifest.artifacts.map((artifact) => ({
      ...artifact,
      status: 'ready',
      refs: artifact.refs.length > 0
        ? [...artifact.refs]
        : [`evidence/government/${artifact.id}`]
    }))
  };
}

function completeInvestmentEvidence(): PilotInvestmentEvidence {
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
        amountRub: 1,
        basis: 'measured',
        evidenceRef: 'evidence/object-cost'
      },
      nextVerifiedObjectProductionTime: {
        days: 1,
        basis: 'measured',
        evidenceRef: 'evidence/object-time'
      },
      developerHoursPerObject: {
        hours: 1,
        basis: 'measured',
        evidenceRef: 'evidence/developer-hours'
      },
      institutionOperatorHoursPerObject: {
        hours: 1,
        basis: 'measured',
        evidenceRef: 'evidence/operator-hours'
      },
      districtSharedSetupCost: {
        amountRub: 1,
        basis: 'measured',
        evidenceRef: 'evidence/setup'
      },
      districtIntegrationCost: {
        amountRub: 1,
        basis: 'measured',
        evidenceRef: 'evidence/integration'
      },
      annualOperationsCost: {
        amountRub: 1,
        basis: 'measured',
        evidenceRef: 'evidence/operations'
      }
    }
  };
}

test('current package is demo-ready but not falsely approval or investment ready', () => {
  const readiness = evaluateGovernmentDeliveryReadiness();
  const byId = new Map(readiness.stages.map((stage) => [stage.id, stage]));

  assert.equal(byId.get('demo')?.ready, true);
  assert.equal(byId.get('intro-pack')?.ready, false);
  assert.deepEqual(
    byId.get('intro-pack')?.artifactBlockers,
    ['executive-one-pager']
  );

  assert.equal(byId.get('technical-pilot-approval')?.ready, false);
  assert.ok(
    byId.get('technical-pilot-approval')?.artifactBlockers.includes('security-data-flow')
  );
  assert.ok(
    byId.get('technical-pilot-approval')?.artifactBlockers.includes('operations-sla')
  );

  assert.equal(byId.get('verified-pilot-report')?.ready, false);
  assert.ok(
    byId.get('verified-pilot-report')?.evidenceBlockers.includes('romanov-field-proof-missing')
  );

  assert.equal(byId.get('scale-investment-decision')?.ready, false);
  assert.equal(byId.get('federal-expansion')?.ready, false);
});

test('technical pilot approval depends on formal artifacts, not on pretending field proof already exists', () => {
  const readiness = evaluateGovernmentDeliveryReadiness({
    manifest: allArtifactsReady()
  });
  const byId = new Map(readiness.stages.map((stage) => [stage.id, stage]));

  assert.equal(byId.get('technical-pilot-approval')?.ready, true);
  assert.deepEqual(byId.get('technical-pilot-approval')?.evidenceBlockers, []);

  assert.equal(byId.get('verified-pilot-report')?.ready, false);
  assert.ok(
    byId.get('verified-pilot-report')?.evidenceBlockers.includes('romanov-field-proof-missing')
  );
});

test('scale decision can become ready from complete measured evidence without making federal expansion ready', () => {
  const readiness = evaluateGovernmentDeliveryReadiness({
    manifest: allArtifactsReady(),
    investmentEvidence: completeInvestmentEvidence(),
    firstExternalRegionVerified: false
  });
  const byId = new Map(readiness.stages.map((stage) => [stage.id, stage]));

  assert.equal(byId.get('verified-pilot-report')?.ready, true);
  assert.equal(byId.get('scale-investment-decision')?.ready, true);
  assert.equal(byId.get('federal-expansion')?.ready, false);
  assert.ok(
    byId.get('federal-expansion')?.evidenceBlockers.includes(
      'first-external-region-proof-missing'
    )
  );
});

test('federal expansion requires both Moscow decision readiness and first external region proof', () => {
  const readiness = evaluateGovernmentDeliveryReadiness({
    manifest: allArtifactsReady(),
    investmentEvidence: completeInvestmentEvidence(),
    firstExternalRegionVerified: true
  });
  const federal = readiness.stages.find((stage) => stage.id === 'federal-expansion');

  assert.equal(federal?.ready, true);
  assert.deepEqual(federal?.artifactBlockers, []);
  assert.deepEqual(federal?.evidenceBlockers, []);
});

test('manifest rejects ready artifacts without inspectable references', () => {
  const manifest: GovernmentDeliveryManifest = {
    version: 1,
    artifacts: currentGovernmentDeliveryManifest.artifacts.map((artifact) => ({
      ...artifact,
      refs: [...artifact.refs]
    }))
  };
  const demo = manifest.artifacts.find((artifact) => artifact.id === 'city-pilot-demo');
  assert.ok(demo);
  demo!.refs = [];

  const validation = validateGovernmentDeliveryManifest(manifest);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.blockers.includes(
      'ready-government-artifact-has-no-ref:city-pilot-demo'
    )
  );
});

test('current manifest explicitly distinguishes ready, draft and missing artifacts', () => {
  const readiness = evaluateGovernmentDeliveryReadiness();

  assert.ok(readiness.readyArtifactCount > 0);
  assert.ok(readiness.draftArtifactCount > 0);
  assert.ok(readiness.missingArtifactCount > 0);
  assert.equal(
    readiness.readyArtifactCount
      + readiness.draftArtifactCount
      + readiness.missingArtifactCount,
    currentGovernmentDeliveryManifest.artifacts.length
  );
});
