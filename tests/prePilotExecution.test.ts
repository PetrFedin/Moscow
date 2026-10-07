import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildOwnerAssignmentTemplate,
  validateOwnerAssignmentManifest
} from '../src/government/ownerAssignmentManifest.ts';
import {
  buildRomanovFieldSessionPlan,
  validateFieldSessionPlan
} from '../src/government/fieldSessionPlan.ts';
import {
  buildVisitorWaveManifest
} from '../src/government/visitorWaveManifest.ts';
import {
  evaluatePrePilotGate
} from '../src/government/prePilotGoNoGo.ts';

function assignedOwners() {
  const manifest=buildOwnerAssignmentTemplate('2026-10-06T12:00:00Z');
  return {
    ...manifest,
    assignments:manifest.assignments.map((item)=>({
      ...item,
      status:'assigned' as const,
      personName:`Person ${item.roleId}`,
      organization:'Assigned organisation',
      authorityRef:`authority/${item.roleId}`
    }))
  };
}

function fieldPlan() {
  return buildRomanovFieldSessionPlan({
    plannedDate:'2026-10-10T08:00:00Z',
    surveyPacketRef:'survey/current',
    calibrationRef:'calibration/current',
    iosDevices:[
      {deviceLabel:'ios-a',deviceVersion:'iPhone A',appBuild:'build-1'},
      {deviceLabel:'ios-b',deviceVersion:'iPhone B',appBuild:'build-1'}
    ],
    androidDevices:[
      {deviceLabel:'android-a',deviceVersion:'Android A',appBuild:'build-1'},
      {deviceLabel:'android-b',deviceVersion:'Android B',appBuild:'build-1'}
    ]
  });
}

function visitorWave() {
  return buildVisitorWaveManifest({
    studyId:'varvarka-wave-01',
    expectedContentVersion:'varvarka-pilot-v1',
    participantCount:20
  });
}

test('owner assignment template is fail-closed until real assignments exist',()=>{
  const result=validateOwnerAssignmentManifest(buildOwnerAssignmentTemplate('2026-10-06T12:00:00Z'));
  assert.equal(result.valid,true);
  assert.equal(result.complete,false);
  assert.equal(result.unassignedRoles.length,12);
});

test('field session generator creates the required 4-device x 3-distance matrix',()=>{
  const plan=fieldPlan();
  const validation=validateFieldSessionPlan(plan);
  assert.equal(validation.valid,true);
  assert.equal(validation.plannedSessionCount,12);
});

test('visitor wave generator creates bounded non-identifying slots',()=>{
  const wave=visitorWave();
  assert.equal(wave.slots.length,20);
  assert.equal(wave.slots[0]?.slotId,'P001');
  assert.equal(wave.slots[19]?.slotId,'P020');
  assert.ok(wave.slots.every(slot=>slot.reportStatus==='missing' && slot.observerStatus==='missing'));
});

test('pre-pilot gate stays NO_GO with unassigned owners',()=>{
  const result=evaluatePrePilotGate({
    owners:buildOwnerAssignmentTemplate('2026-10-06T12:00:00Z'),
    romanovFieldPlan:fieldPlan(),
    visitorWave:visitorWave(),
    siteAccessRef:'site/access',
    frozenBuildRef:'build/1',
    acceptanceMatrixRef:'acceptance/v1',
    providerAccessPathRef:'provider/route',
    securityPrivacyReviewRouteRef:'security/route',
    legalRightsReviewRouteRef:'legal/route',
    operationsSlaReviewRouteRef:'sla/route',
    fieldObservabilityPlanRef:'observability/plan',
    sensorQualityGateIncluded:true,
    privacyBoundaryConfirmed:true,
    aprilTagMode:'auxiliary-only',
    streetLevelReferenceMode:'pre-field-hypothesis-only',
    signedDestinationPackageStatus:'deferred-phase-1'
  });
  assert.equal(result.status,'NO_GO');
  assert.ok(result.blockers.some(b=>b.startsWith('owner-unassigned:')));
});

test('pre-pilot gate can open only when every required preparation is explicit',()=>{
  const result=evaluatePrePilotGate({
    owners:assignedOwners(),
    romanovFieldPlan:fieldPlan(),
    visitorWave:visitorWave(),
    siteAccessRef:'site/access',
    frozenBuildRef:'build/1',
    acceptanceMatrixRef:'acceptance/v1',
    providerAccessPathRef:'provider/route',
    securityPrivacyReviewRouteRef:'security/route',
    legalRightsReviewRouteRef:'legal/route',
    operationsSlaReviewRouteRef:'sla/route',
    fieldObservabilityPlanRef:'observability/plan',
    sensorQualityGateIncluded:true,
    privacyBoundaryConfirmed:true,
    aprilTagMode:'auxiliary-only',
    streetLevelReferenceMode:'pre-field-hypothesis-only',
    signedDestinationPackageStatus:'deferred-phase-1'
  });
  assert.equal(result.status,'GO_FOR_CONTROLLED_PILOT');
});

test('master-plan auxiliary tools cannot be used to fake readiness',()=>{
  const base={
    owners:assignedOwners(),
    romanovFieldPlan:fieldPlan(),
    visitorWave:visitorWave(),
    siteAccessRef:'site/access',
    frozenBuildRef:'build/1',
    acceptanceMatrixRef:'acceptance/v1',
    providerAccessPathRef:'provider/route',
    securityPrivacyReviewRouteRef:'security/route',
    legalRightsReviewRouteRef:'legal/route',
    operationsSlaReviewRouteRef:'sla/route',
    fieldObservabilityPlanRef:'observability/plan',
    sensorQualityGateIncluded:true,
    privacyBoundaryConfirmed:true,
    signedDestinationPackageStatus:'deferred-phase-1' as const
  };
  assert.equal(evaluatePrePilotGate({...base,aprilTagMode:'auxiliary-only',streetLevelReferenceMode:'pre-field-hypothesis-only'}).status,'GO_FOR_CONTROLLED_PILOT');
  const badSigning=evaluatePrePilotGate({...base,aprilTagMode:'not-used',streetLevelReferenceMode:'not-used',signedDestinationPackageStatus:'deferred-phase-1'});
  assert.equal(badSigning.checks.packageSigningDeferredCorrectly,true);
});
