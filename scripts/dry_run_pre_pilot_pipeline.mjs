#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildOwnerAssignmentTemplate } from '../src/government/ownerAssignmentManifest.ts';
import { buildRomanovFieldSessionPlan } from '../src/government/fieldSessionPlan.ts';
import { buildVisitorWaveManifest } from '../src/government/visitorWaveManifest.ts';
import { buildPrePilotConfigurationTemplate, configurationToPrePilotRefs, validatePrePilotConfigurationBundle } from '../src/government/prePilotConfigurationBundle.ts';
import { evaluatePrePilotGate } from '../src/government/prePilotGoNoGo.ts';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'moscow-pilot-dryrun-'));

try {
  const owners=buildOwnerAssignmentTemplate('2026-10-06T12:00:00Z');
  const assignedOwners={
    ...owners,
    assignments:owners.assignments.map((item)=>({
      ...item,
      status:'assigned',
      personName:`SYNTHETIC-${item.roleId}`,
      organization:'SYNTHETIC-DRY-RUN',
      authorityRef:`synthetic/${item.roleId}`
    }))
  };

  const field=buildRomanovFieldSessionPlan({
    plannedDate:'2026-10-10T08:00:00Z',
    surveyPacketRef:'synthetic/survey',
    calibrationRef:'synthetic/calibration',
    iosDevices:[
      {deviceLabel:'dry-ios-a',deviceVersion:'synthetic-ios-a',appBuild:'synthetic-build'},
      {deviceLabel:'dry-ios-b',deviceVersion:'synthetic-ios-b',appBuild:'synthetic-build'}
    ],
    androidDevices:[
      {deviceLabel:'dry-android-a',deviceVersion:'synthetic-android-a',appBuild:'synthetic-build'},
      {deviceLabel:'dry-android-b',deviceVersion:'synthetic-android-b',appBuild:'synthetic-build'}
    ]
  });

  const visitor=buildVisitorWaveManifest({
    studyId:'synthetic-dry-run',
    expectedContentVersion:'synthetic-content',
    participantCount:20
  });

  const bundle={
    ...buildPrePilotConfigurationTemplate('2026-10-06T12:00:00Z'),
    bundleId:'synthetic-dry-run',
    pilotSite:{
      siteId:'synthetic-site',
      displayName:'SYNTHETIC SITE',
      accessRef:'synthetic/site-access'
    },
    frozenBuild:{
      gitSha:'a'.repeat(40),
      buildRef:'synthetic/build',
      distributionRef:'synthetic/distribution'
    },
    provider:{
      providerId:'yclients',
      companyMode:'test-company',
      companyId:'SYNTHETIC-COMPANY',
      companyAuthorityRef:'synthetic/company-authority',
      accessPathRef:'synthetic/provider-route',
      webhookPermissionRef:'synthetic/webhook-permission'
    },
    reviews:{
      acceptanceMatrixRef:'synthetic/acceptance',
      securityPrivacyReviewRouteRef:'synthetic/security',
      legalRightsReviewRouteRef:'synthetic/legal',
      operationsSlaReviewRouteRef:'synthetic/sla'
    },
    observability:{
      decision:'disabled-with-reason',
      planRef:'synthetic/observability',
      reason:'Synthetic dry run only.'
    },
    runtimeSafety:{
      sensorQualityGateIncluded:true,
      privacyBoundaryConfirmed:true
    },
    masterPlanControls:{
      aprilTagMode:'not-used',
      streetLevelReferenceMode:'not-used',
      signedDestinationPackageStatus:'deferred-phase-1'
    }
  };

  const bundleValidation=validatePrePilotConfigurationBundle(bundle);
  if(!bundleValidation.valid) throw new Error(`bundle invalid: ${bundleValidation.blockers.join(',')}`);

  const refs=configurationToPrePilotRefs(bundle);
  const gate=evaluatePrePilotGate({
    owners:assignedOwners,
    romanovFieldPlan:field,
    visitorWave:visitor,
    ...refs
  });

  if(gate.status!=='GO_FOR_CONTROLLED_PILOT'){
    throw new Error(`dry-run pipeline failed: ${gate.blockers.join(',')}`);
  }

  const artifacts={
    owners:assignedOwners,
    field,
    visitor,
    bundle,
    gate
  };
  for(const [name,value] of Object.entries(artifacts)){
    fs.writeFileSync(path.join(root,`${name}.json`),JSON.stringify(value,null,2)+'\n');
  }

  console.log(JSON.stringify({
    status:'DRY_RUN_ONLY_NOT_PILOT_GO',
    pipelineFunctional:true,
    syntheticGateResult:gate.status,
    tempRoot:root,
    guardrail:'Synthetic values cannot be copied into real pilot manifests or used as evidence.'
  },null,2));
} finally {
  if(!process.env.KEEP_DRY_RUN_ARTIFACTS){
    fs.rmSync(root,{recursive:true,force:true});
  }
}
