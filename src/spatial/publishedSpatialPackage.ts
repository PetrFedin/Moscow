export type SpatialTrustClass = 'documented' | 'reconstructed' | 'hypothesis' | 'artistic';
export type SpatialRuntimeMode = 'model3d' | 'ar' | 'vr' | 'web-preview';
export type SpatialPackageReleaseState = 'draft' | 'production-candidate' | 'field-verified';
export type SpatialRightsStatus = 'cleared' | 'public-domain' | 'restricted' | 'review-required';

export type SpatialSourceReference = {
  id: string;
  institution?: string;
  title: string;
  creator?: string;
  dateLabel?: string;
  sourceUrl: string;
  iiifManifestUrl?: string;
  rights: SpatialRightsStatus;
  licenseLabel?: string;
  accessedAt: string;
};

export type SpatialClaim = {
  id: string;
  summary: string;
  trust: Exclude<SpatialTrustClass, 'artistic'>;
  sourceIds: string[];
  modelIds: string[];
  reviewer?: string;
  reviewedAt?: string;
};

export type SpatialModelArtifact = {
  id: string;
  format: 'glb';
  version: number;
  eraId: string;
  trustMode: 'documented' | 'public-research';
  runtimeModes: SpatialRuntimeMode[];
  sourceIds: string[];
  checksum?: string;
  byteSize?: number;
};

export type SpatialMetricAuthority = {
  id: string;
  version: number;
  modelPackVersion: string;
  modelUnits: 'meters';
  metersPerModelUnit: number;
  scaleStatus: 'provisional-pending-survey' | 'survey-verified';
  verifiedScaleTolerance: number;
};

export type SpatialControlPointAuthority = {
  id: string;
  version: number;
  requiredPoints: number;
  requiredAlignmentPoints: number;
  surveyPacketId?: string;
  surveyApprovedAt?: string;
  surveyApprovedBy?: string;
};

export type SpatialCalibrationAuthority = {
  version: number;
  metricAuthorityId: string;
  metricAuthorityVersion: number;
  modelPackVersion: string;
  verifiedAt?: string;
};

export type SpatialFieldEvidenceAuthority = {
  surveyPacketId?: string;
  totalSessions: number;
  passedSessions: number;
  completeDevices: number;
  iosCompleteDevices: number;
  androidCompleteDevices: number;
  crossPlatformReady: boolean;
};

export type SpatialAnchorAuthority = {
  provider?: string;
  anchorId?: string;
  calibrationVersion?: number;
  hostContinuityPassed: boolean;
  independentResolvePassed: boolean;
  verifiedAt?: string;
};

export type SpatialAudioAuthority = {
  expectedTracks: number;
  productionReadyTracks: number;
  complete: boolean;
};

export type SpatialFieldVerification = {
  required: boolean;
  calibrationVersion?: number;
  surveyVerified?: boolean;
  multiDeviceMatrixPassed?: boolean;
  persistentAnchorVerified?: boolean;
  verifiedAt?: string;
};

export type PublishedSpatialPackage = {
  schemaVersion: 2;
  id: string;
  placeId: string;
  titleRu: string;
  titleEn: string;
  version: number;
  releaseState: SpatialPackageReleaseState;
  publishedAt?: string;
  publisher?: string;
  eras: Array<{
    id: string;
    yearLabel: string;
    titleRu: string;
    titleEn: string;
  }>;
  sources: SpatialSourceReference[];
  claims: SpatialClaim[];
  models: SpatialModelArtifact[];
  metricAuthority?: SpatialMetricAuthority;
  controlPointAuthority?: SpatialControlPointAuthority;
  calibrationAuthority?: SpatialCalibrationAuthority;
  fieldEvidenceAuthority?: SpatialFieldEvidenceAuthority;
  anchorAuthority?: SpatialAnchorAuthority;
  audioAuthority?: SpatialAudioAuthority;
  fieldVerification: SpatialFieldVerification;
  languages: string[];
  offlineEligible: boolean;
};

export type SpatialPackageValidation = {
  valid: boolean;
  blockers: string[];
  warnings: string[];
};

const SHA256_HEX = /^[a-f0-9]{64}$/i;

export function validatePublishedSpatialPackage(pkg: PublishedSpatialPackage): SpatialPackageValidation {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const sourceIds = new Set(pkg.sources.map((source) => source.id));
  const modelIds = new Set(pkg.models.map((model) => model.id));

  if (!pkg.id.trim()) blockers.push('package-id-missing');
  if (!pkg.placeId.trim()) blockers.push('place-id-missing');
  if (pkg.eras.length === 0) blockers.push('era-missing');
  if (pkg.sources.length === 0) blockers.push('sources-missing');
  if (pkg.models.length === 0) blockers.push('models-missing');
  if (!pkg.languages.includes('ru')) blockers.push('russian-localization-missing');

  for (const source of pkg.sources) {
    if (!source.sourceUrl.trim()) blockers.push(`source-url-missing:${source.id}`);
    if (source.rights === 'review-required') blockers.push(`rights-review-required:${source.id}`);
    if (source.rights === 'restricted') warnings.push(`restricted-source:${source.id}`);
  }

  if (pkg.releaseState !== 'draft' && pkg.claims.length === 0) blockers.push('claims-missing');

  for (const claim of pkg.claims) {
    if (claim.sourceIds.length === 0) blockers.push(`claim-source-missing:${claim.id}`);
    if (claim.modelIds.length === 0) blockers.push(`claim-model-missing:${claim.id}`);
    for (const sourceId of claim.sourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`claim-source-not-found:${claim.id}:${sourceId}`);
    }
    for (const modelId of claim.modelIds) {
      if (!modelIds.has(modelId)) blockers.push(`claim-model-not-found:${claim.id}:${modelId}`);
    }
  }

  const claimedModelIds = new Set(pkg.claims.flatMap((claim) => claim.modelIds));
  if (pkg.releaseState !== 'draft') {
    for (const model of pkg.models) {
      if (!claimedModelIds.has(model.id)) blockers.push(`model-claim-missing:${model.id}`);
    }
  }

  for (const model of pkg.models) {
    for (const sourceId of model.sourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`model-source-not-found:${model.id}:${sourceId}`);
    }
    if (!model.runtimeModes.includes('model3d')) warnings.push(`model3d-runtime-not-enabled:${model.id}`);
    if (model.checksum !== undefined && !SHA256_HEX.test(model.checksum)) blockers.push(`model-checksum-invalid:${model.id}`);
    if (model.byteSize !== undefined && (!Number.isInteger(model.byteSize) || model.byteSize <= 0)) blockers.push(`model-byte-size-invalid:${model.id}`);
    if (pkg.releaseState === 'production-candidate' && !model.checksum) warnings.push(`model-checksum-pending:${model.id}`);
  }

  if (modelIds.size !== pkg.models.length) blockers.push('duplicate-model-id');
  if (sourceIds.size !== pkg.sources.length) blockers.push('duplicate-source-id');

  if (pkg.releaseState === 'field-verified') {
    if (!pkg.fieldVerification.required) blockers.push('field-verification-not-required');
    if (!pkg.fieldVerification.surveyVerified) blockers.push('survey-not-verified');
    if (!pkg.fieldVerification.multiDeviceMatrixPassed) blockers.push('multi-device-field-matrix-not-passed');
    if (!pkg.fieldVerification.persistentAnchorVerified) blockers.push('persistent-anchor-not-verified');
    if (!pkg.fieldVerification.verifiedAt) blockers.push('field-verified-at-missing');

    if (!pkg.metricAuthority) blockers.push('metric-authority-missing');
    if (pkg.metricAuthority?.scaleStatus !== 'survey-verified') blockers.push('metric-scale-not-survey-verified');
    if (!pkg.controlPointAuthority) blockers.push('control-point-authority-missing');
    if (!pkg.calibrationAuthority?.verifiedAt) blockers.push('calibration-authority-not-verified');
    if (!pkg.fieldEvidenceAuthority?.crossPlatformReady) blockers.push('field-evidence-not-cross-platform-ready');
    if (!pkg.anchorAuthority?.hostContinuityPassed) blockers.push('anchor-host-continuity-not-passed');
    if (!pkg.anchorAuthority?.independentResolvePassed) blockers.push('anchor-independent-resolve-not-passed');
    if (!pkg.anchorAuthority?.verifiedAt) blockers.push('anchor-authority-not-verified');
    if (pkg.audioAuthority && !pkg.audioAuthority.complete) blockers.push('audio-authority-incomplete');
    for (const model of pkg.models) {
      if (!model.checksum) blockers.push(`field-verified-model-checksum-missing:${model.id}`);
      if (!model.byteSize) blockers.push(`field-verified-model-byte-size-missing:${model.id}`);
    }

    if (pkg.metricAuthority && pkg.calibrationAuthority) {
      if (pkg.calibrationAuthority.metricAuthorityId !== pkg.metricAuthority.id
        || pkg.calibrationAuthority.metricAuthorityVersion !== pkg.metricAuthority.version
        || pkg.calibrationAuthority.modelPackVersion !== pkg.metricAuthority.modelPackVersion) {
        blockers.push('calibration-metric-binding-mismatch');
      }
    }
    if (pkg.fieldEvidenceAuthority && pkg.controlPointAuthority?.surveyPacketId
      && pkg.fieldEvidenceAuthority.surveyPacketId !== pkg.controlPointAuthority.surveyPacketId) {
      blockers.push('field-survey-binding-mismatch');
    }
  }

  if (pkg.releaseState === 'draft' && pkg.publishedAt) warnings.push('draft-has-published-at');
  if (pkg.releaseState !== 'draft' && !pkg.publisher) warnings.push('publisher-missing');

  return { valid: blockers.length === 0, blockers, warnings };
}
