import {
  validateOwnerAssignmentManifest,
  type OwnerAssignmentManifest
} from './ownerAssignmentManifest.ts';
import {
  validateFieldSessionPlan,
  type FieldSessionPlan
} from './fieldSessionPlan.ts';
import {
  validatePilotStudyManifest,
  type PilotStudyManifest
} from '../analytics/pilotStudy.ts';

export const PRE_PILOT_GATE_VERSION = 1 as const;

export type PrePilotGateInput = {
  owners: OwnerAssignmentManifest;
  romanovFieldPlan: FieldSessionPlan;
  visitorWave: PilotStudyManifest;
  siteAccessRef: string;
  frozenBuildRef: string;
  acceptanceMatrixRef: string;
  providerAccessPathRef: string;
  securityPrivacyReviewRouteRef: string;
  legalRightsReviewRouteRef: string;
  operationsSlaReviewRouteRef: string;
  fieldObservabilityPlanRef: string;
  sensorQualityGateIncluded: boolean;
  privacyBoundaryConfirmed: boolean;
  aprilTagMode: 'not-used' | 'auxiliary-only';
  streetLevelReferenceMode: 'not-used' | 'pre-field-hypothesis-only';
  signedDestinationPackageStatus: 'deferred-phase-1';
};

export type PrePilotGateResult = {
  version: typeof PRE_PILOT_GATE_VERSION;
  status: 'NO_GO' | 'GO_FOR_CONTROLLED_PILOT';
  blockers: string[];
  checks: {
    ownersComplete: boolean;
    romanovPlanValid: boolean;
    visitorWaveValid: boolean;
    siteAccessConfirmed: boolean;
    buildFrozen: boolean;
    acceptanceBound: boolean;
    providerPathKnown: boolean;
    securityPrivacyRouteKnown: boolean;
    legalRightsRouteKnown: boolean;
    operationsSlaRouteKnown: boolean;
    observabilityPlanned: boolean;
    sensorQualityGateIncluded: boolean;
    privacyBoundaryConfirmed: boolean;
    aprilTagCannotPromotePass: boolean;
    streetReferenceCannotPromotePass: boolean;
    packageSigningDeferredCorrectly: boolean;
  };
};

function hasRef(value: string) {
  return value.trim().length > 0;
}

export function evaluatePrePilotGate(input: PrePilotGateInput): PrePilotGateResult {
  const blockers:string[]=[];
  const ownerValidation=validateOwnerAssignmentManifest(input.owners);
  const fieldValidation=validateFieldSessionPlan(input.romanovFieldPlan);
  const visitorValidation=validatePilotStudyManifest(input.visitorWave);

  const checks={
    ownersComplete:ownerValidation.valid && ownerValidation.complete,
    romanovPlanValid:fieldValidation.valid,
    visitorWaveValid:visitorValidation.valid,
    siteAccessConfirmed:hasRef(input.siteAccessRef),
    buildFrozen:hasRef(input.frozenBuildRef),
    acceptanceBound:hasRef(input.acceptanceMatrixRef),
    providerPathKnown:hasRef(input.providerAccessPathRef),
    securityPrivacyRouteKnown:hasRef(input.securityPrivacyReviewRouteRef),
    legalRightsRouteKnown:hasRef(input.legalRightsReviewRouteRef),
    operationsSlaRouteKnown:hasRef(input.operationsSlaReviewRouteRef),
    observabilityPlanned:hasRef(input.fieldObservabilityPlanRef),
    sensorQualityGateIncluded:input.sensorQualityGateIncluded === true,
    privacyBoundaryConfirmed:input.privacyBoundaryConfirmed === true,
    aprilTagCannotPromotePass:
      input.aprilTagMode === 'not-used' || input.aprilTagMode === 'auxiliary-only',
    streetReferenceCannotPromotePass:
      input.streetLevelReferenceMode === 'not-used'
      || input.streetLevelReferenceMode === 'pre-field-hypothesis-only',
    packageSigningDeferredCorrectly:
      input.signedDestinationPackageStatus === 'deferred-phase-1'
  };

  if (!checks.ownersComplete) blockers.push(...ownerValidation.blockers, ...ownerValidation.unassignedRoles.map(r=>`owner-unassigned:${r}`));
  if (!checks.romanovPlanValid) blockers.push(...fieldValidation.blockers.map(b=>`field-plan:${b}`));
  if (!checks.visitorWaveValid) blockers.push(...visitorValidation.blockers.map(b=>`visitor-wave:${b}`));
  if (!checks.siteAccessConfirmed) blockers.push('site-access-ref-missing');
  if (!checks.buildFrozen) blockers.push('frozen-build-ref-missing');
  if (!checks.acceptanceBound) blockers.push('acceptance-matrix-ref-missing');
  if (!checks.providerPathKnown) blockers.push('provider-access-path-ref-missing');
  if (!checks.securityPrivacyRouteKnown) blockers.push('security-privacy-review-route-ref-missing');
  if (!checks.legalRightsRouteKnown) blockers.push('legal-rights-review-route-ref-missing');
  if (!checks.operationsSlaRouteKnown) blockers.push('operations-sla-review-route-ref-missing');
  if (!checks.observabilityPlanned) blockers.push('field-observability-plan-ref-missing');
  if (!checks.sensorQualityGateIncluded) blockers.push('sensor-quality-gate-not-included');
  if (!checks.privacyBoundaryConfirmed) blockers.push('privacy-boundary-not-confirmed');
  if (!checks.aprilTagCannotPromotePass) blockers.push('apriltag-mode-invalid');
  if (!checks.streetReferenceCannotPromotePass) blockers.push('street-reference-mode-invalid');
  if (!checks.packageSigningDeferredCorrectly) blockers.push('package-signing-sequencing-invalid');

  return {
    version:PRE_PILOT_GATE_VERSION,
    status:blockers.length===0 ? 'GO_FOR_CONTROLLED_PILOT' : 'NO_GO',
    blockers:[...new Set(blockers)],
    checks
  };
}
