export const PRE_PILOT_CONFIGURATION_BUNDLE_VERSION = 1 as const;

export type PrePilotConfigurationBundle = {
  kind: 'moscow-pre-pilot-configuration';
  version: typeof PRE_PILOT_CONFIGURATION_BUNDLE_VERSION;
  pilotId: 'varvarka-zaryadye-pilot';
  bundleId: string;
  updatedAt: string;

  manifests: {
    ownerAssignmentPath: string;
    romanovFieldPlanPath: string;
    visitorWavePath: string;
  };

  pilotSite: {
    siteId: string;
    displayName: string;
    accessRef: string;
  };

  frozenBuild: {
    gitSha: string;
    buildRef: string;
    distributionRef: string;
  };

  provider: {
    providerId: 'yclients';
    companyMode: 'test-company' | 'controlled-real-company';
    companyId: string;
    companyAuthorityRef: string;
    accessPathRef: string;
    webhookPermissionRef: string;
  };

  reviews: {
    acceptanceMatrixRef: string;
    securityPrivacyReviewRouteRef: string;
    legalRightsReviewRouteRef: string;
    operationsSlaReviewRouteRef: string;
  };

  observability: {
    decision: 'enabled' | 'disabled-with-reason';
    planRef: string;
    reason?: string;
  };

  runtimeSafety: {
    sensorQualityGateIncluded: boolean;
    privacyBoundaryConfirmed: boolean;
  };

  masterPlanControls: {
    aprilTagMode: 'not-used' | 'auxiliary-only';
    streetLevelReferenceMode: 'not-used' | 'pre-field-hypothesis-only';
    signedDestinationPackageStatus: 'deferred-phase-1';
  };
};

export type PrePilotConfigurationValidation = {
  valid: boolean;
  blockers: string[];
};

function text(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function safeRelativeJsonPath(value: unknown) {
  if (!text(value)) return false;
  const normalized = String(value).replace(/\\/g,'/');
  if (!normalized.toLowerCase().endsWith('.json')) return false;
  if (normalized.startsWith('/') || /^[a-zA-Z]:\//.test(normalized)) return false;
  return !normalized.split('/').includes('..');
}

function iso(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function sha40(value: unknown) {
  return typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value.trim());
}

export function buildPrePilotConfigurationTemplate(
  updatedAt = new Date().toISOString()
): PrePilotConfigurationBundle {
  return {
    kind:'moscow-pre-pilot-configuration',
    version:PRE_PILOT_CONFIGURATION_BUNDLE_VERSION,
    pilotId:'varvarka-zaryadye-pilot',
    bundleId:'TBD',
    updatedAt,
    manifests:{
      ownerAssignmentPath:'evidence/pre-pilot/owner-assignment.json',
      romanovFieldPlanPath:'evidence/pre-pilot/romanov-field-session-plan.json',
      visitorWavePath:'evidence/pre-pilot/visitor-wave-manifest.json'
    },
    pilotSite:{
      siteId:'TBD',
      displayName:'TBD',
      accessRef:''
    },
    frozenBuild:{
      gitSha:'',
      buildRef:'',
      distributionRef:''
    },
    provider:{
      providerId:'yclients',
      companyMode:'test-company',
      companyId:'',
      companyAuthorityRef:'',
      accessPathRef:'',
      webhookPermissionRef:''
    },
    reviews:{
      acceptanceMatrixRef:'',
      securityPrivacyReviewRouteRef:'',
      legalRightsReviewRouteRef:'',
      operationsSlaReviewRouteRef:''
    },
    observability:{
      decision:'disabled-with-reason',
      planRef:'',
      reason:'TBD'
    },
    runtimeSafety:{
      sensorQualityGateIncluded:true,
      privacyBoundaryConfirmed:false
    },
    masterPlanControls:{
      aprilTagMode:'not-used',
      streetLevelReferenceMode:'not-used',
      signedDestinationPackageStatus:'deferred-phase-1'
    }
  };
}

export function validatePrePilotConfigurationBundle(
  bundle: PrePilotConfigurationBundle
): PrePilotConfigurationValidation {
  const blockers:string[]=[];

  if (bundle.kind !== 'moscow-pre-pilot-configuration') blockers.push('bundle-kind-invalid');
  if (bundle.version !== PRE_PILOT_CONFIGURATION_BUNDLE_VERSION) blockers.push('bundle-version-invalid');
  if (bundle.pilotId !== 'varvarka-zaryadye-pilot') blockers.push('bundle-pilot-invalid');
  if (!text(bundle.bundleId) || bundle.bundleId === 'TBD') blockers.push('bundle-id-missing');
  if (!iso(bundle.updatedAt)) blockers.push('bundle-updated-at-invalid');

  if (!safeRelativeJsonPath(bundle.manifests.ownerAssignmentPath)) blockers.push('owner-manifest-path-invalid');
  if (!safeRelativeJsonPath(bundle.manifests.romanovFieldPlanPath)) blockers.push('field-plan-path-invalid');
  if (!safeRelativeJsonPath(bundle.manifests.visitorWavePath)) blockers.push('visitor-wave-path-invalid');

  if (!text(bundle.pilotSite.siteId) || bundle.pilotSite.siteId === 'TBD') blockers.push('pilot-site-id-missing');
  if (!text(bundle.pilotSite.displayName) || bundle.pilotSite.displayName === 'TBD') blockers.push('pilot-site-name-missing');
  if (!text(bundle.pilotSite.accessRef)) blockers.push('pilot-site-access-ref-missing');

  if (!sha40(bundle.frozenBuild.gitSha)) blockers.push('frozen-build-git-sha-invalid');
  if (!text(bundle.frozenBuild.buildRef)) blockers.push('frozen-build-ref-missing');
  if (!text(bundle.frozenBuild.distributionRef)) blockers.push('frozen-build-distribution-ref-missing');

  if (bundle.provider.providerId !== 'yclients') blockers.push('provider-id-invalid');
  if (
    bundle.provider.companyMode !== 'test-company'
    && bundle.provider.companyMode !== 'controlled-real-company'
  ) blockers.push('provider-company-mode-invalid');
  if (!text(bundle.provider.companyId)) blockers.push('provider-company-id-missing');
  if (!text(bundle.provider.companyAuthorityRef)) blockers.push('provider-company-authority-ref-missing');
  if (!text(bundle.provider.accessPathRef)) blockers.push('provider-access-path-ref-missing');
  if (!text(bundle.provider.webhookPermissionRef)) blockers.push('provider-webhook-permission-ref-missing');

  if (!text(bundle.reviews.acceptanceMatrixRef)) blockers.push('acceptance-matrix-ref-missing');
  if (!text(bundle.reviews.securityPrivacyReviewRouteRef)) blockers.push('security-privacy-review-route-ref-missing');
  if (!text(bundle.reviews.legalRightsReviewRouteRef)) blockers.push('legal-rights-review-route-ref-missing');
  if (!text(bundle.reviews.operationsSlaReviewRouteRef)) blockers.push('operations-sla-review-route-ref-missing');

  if (
    bundle.observability.decision !== 'enabled'
    && bundle.observability.decision !== 'disabled-with-reason'
  ) blockers.push('observability-decision-invalid');
  if (!text(bundle.observability.planRef)) blockers.push('observability-plan-ref-missing');
  if (
    bundle.observability.decision === 'disabled-with-reason'
    && (!text(bundle.observability.reason) || bundle.observability.reason === 'TBD')
  ) blockers.push('observability-disabled-reason-missing');

  if (!bundle.runtimeSafety.sensorQualityGateIncluded) blockers.push('sensor-quality-gate-not-included');
  if (!bundle.runtimeSafety.privacyBoundaryConfirmed) blockers.push('privacy-boundary-not-confirmed');

  if (
    bundle.masterPlanControls.aprilTagMode !== 'not-used'
    && bundle.masterPlanControls.aprilTagMode !== 'auxiliary-only'
  ) blockers.push('apriltag-mode-invalid');

  if (
    bundle.masterPlanControls.streetLevelReferenceMode !== 'not-used'
    && bundle.masterPlanControls.streetLevelReferenceMode !== 'pre-field-hypothesis-only'
  ) blockers.push('street-reference-mode-invalid');

  if (bundle.masterPlanControls.signedDestinationPackageStatus !== 'deferred-phase-1') {
    blockers.push('signed-package-sequencing-invalid');
  }

  return {valid:blockers.length===0,blockers:[...new Set(blockers)]};
}

export function configurationToPrePilotRefs(bundle: PrePilotConfigurationBundle) {
  return {
    siteAccessRef:bundle.pilotSite.accessRef,
    frozenBuildRef:`${bundle.frozenBuild.gitSha}|${bundle.frozenBuild.buildRef}|${bundle.frozenBuild.distributionRef}`,
    acceptanceMatrixRef:bundle.reviews.acceptanceMatrixRef,
    providerAccessPathRef:[
      bundle.provider.providerId,
      bundle.provider.companyMode,
      bundle.provider.companyId,
      bundle.provider.companyAuthorityRef,
      bundle.provider.accessPathRef,
      bundle.provider.webhookPermissionRef
    ].join('|'),
    securityPrivacyReviewRouteRef:bundle.reviews.securityPrivacyReviewRouteRef,
    legalRightsReviewRouteRef:bundle.reviews.legalRightsReviewRouteRef,
    operationsSlaReviewRouteRef:bundle.reviews.operationsSlaReviewRouteRef,
    fieldObservabilityPlanRef:`${bundle.observability.decision}|${bundle.observability.planRef}|${bundle.observability.reason ?? ''}`,
    sensorQualityGateIncluded:bundle.runtimeSafety.sensorQualityGateIncluded,
    privacyBoundaryConfirmed:bundle.runtimeSafety.privacyBoundaryConfirmed,
    aprilTagMode:bundle.masterPlanControls.aprilTagMode,
    streetLevelReferenceMode:bundle.masterPlanControls.streetLevelReferenceMode,
    signedDestinationPackageStatus:bundle.masterPlanControls.signedDestinationPackageStatus
  };
}
