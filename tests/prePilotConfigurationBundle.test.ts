import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPrePilotConfigurationTemplate,
  configurationToPrePilotRefs,
  validatePrePilotConfigurationBundle
} from '../src/government/prePilotConfigurationBundle.ts';

test('pre-pilot configuration template is intentionally incomplete', () => {
  const bundle=buildPrePilotConfigurationTemplate('2026-10-06T12:00:00Z');
  const validation=validatePrePilotConfigurationBundle(bundle);
  assert.equal(validation.valid,false);
  assert.ok(validation.blockers.includes('bundle-id-missing'));
  assert.ok(validation.blockers.includes('pilot-site-id-missing'));
  assert.ok(validation.blockers.includes('frozen-build-git-sha-invalid'));
  assert.ok(validation.blockers.includes('provider-company-id-missing'));
  assert.ok(validation.blockers.includes('privacy-boundary-not-confirmed'));
});

test('complete configuration bundle validates and preserves master-plan sequencing', () => {
  const bundle={
    ...buildPrePilotConfigurationTemplate('2026-10-06T12:00:00Z'),
    bundleId:'varvarka-prepilot-001',
    pilotSite:{
      siteId:'romanov-varvarka-pilot',
      displayName:'Varvarka / Zaryadye pilot area',
      accessRef:'site/access/approved'
    },
    frozenBuild:{
      gitSha:'a'.repeat(40),
      buildRef:'build/ios-android/pilot-001',
      distributionRef:'distribution/internal-pilot'
    },
    provider:{
      providerId:'yclients' as const,
      companyMode:'test-company' as const,
      companyId:'123456',
      companyAuthorityRef:'provider/company-authority',
      accessPathRef:'provider/access-route',
      webhookPermissionRef:'provider/webhook-permission'
    },
    reviews:{
      acceptanceMatrixRef:'acceptance/v1',
      securityPrivacyReviewRouteRef:'security/review-route',
      legalRightsReviewRouteRef:'legal/review-route',
      operationsSlaReviewRouteRef:'sla/review-route'
    },
    observability:{
      decision:'disabled-with-reason' as const,
      planRef:'observability/decision',
      reason:'Pilot owner explicitly chose disabled mode pending DSN approval.'
    },
    runtimeSafety:{
      sensorQualityGateIncluded:true,
      privacyBoundaryConfirmed:true
    },
    masterPlanControls:{
      aprilTagMode:'auxiliary-only' as const,
      streetLevelReferenceMode:'pre-field-hypothesis-only' as const,
      signedDestinationPackageStatus:'deferred-phase-1' as const
    }
  };

  const validation=validatePrePilotConfigurationBundle(bundle);
  assert.equal(validation.valid,true);
  assert.deepEqual(validation.blockers,[]);
  const refs=configurationToPrePilotRefs(bundle);
  assert.match(refs.frozenBuildRef,/^a{40}\|/);
  assert.equal(refs.signedDestinationPackageStatus,'deferred-phase-1');
});

test('configuration bundle never stores provider secrets', () => {
  const bundle=buildPrePilotConfigurationTemplate('2026-10-06T12:00:00Z') as unknown as Record<string,unknown>;
  const serialized=JSON.stringify(bundle);
  assert.equal(serialized.includes('YCLIENTS_PARTNER_TOKEN'),false);
  assert.equal(serialized.includes('YCLIENTS_USER_TOKEN'),false);
  assert.equal(serialized.includes('YCLIENTS_WEBHOOK_PATH_TOKEN'),false);
});
