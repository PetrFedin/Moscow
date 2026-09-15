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
  modelElementIds: string[];
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

export type SpatialFieldVerification = {
  required: boolean;
  calibrationVersion?: number;
  surveyVerified?: boolean;
  multiDeviceMatrixPassed?: boolean;
  persistentAnchorVerified?: boolean;
  verifiedAt?: string;
};

export type PublishedSpatialPackage = {
  schemaVersion: 1;
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
  fieldVerification: SpatialFieldVerification;
  languages: string[];
  offlineEligible: boolean;
};

export type SpatialPackageValidation = {
  valid: boolean;
  blockers: string[];
  warnings: string[];
};

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

  for (const claim of pkg.claims) {
    if (claim.sourceIds.length === 0) blockers.push(`claim-source-missing:${claim.id}`);
    for (const sourceId of claim.sourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`claim-source-not-found:${claim.id}:${sourceId}`);
    }
  }

  for (const model of pkg.models) {
    for (const sourceId of model.sourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`model-source-not-found:${model.id}:${sourceId}`);
    }
    if (!model.runtimeModes.includes('model3d')) warnings.push(`model3d-runtime-not-enabled:${model.id}`);
  }

  if (modelIds.size !== pkg.models.length) blockers.push('duplicate-model-id');
  if (sourceIds.size !== pkg.sources.length) blockers.push('duplicate-source-id');

  if (pkg.releaseState === 'field-verified') {
    if (!pkg.fieldVerification.required) blockers.push('field-verification-not-required');
    if (!pkg.fieldVerification.surveyVerified) blockers.push('survey-not-verified');
    if (!pkg.fieldVerification.multiDeviceMatrixPassed) blockers.push('multi-device-field-matrix-not-passed');
    if (!pkg.fieldVerification.persistentAnchorVerified) blockers.push('persistent-anchor-not-verified');
    if (!pkg.fieldVerification.verifiedAt) blockers.push('field-verified-at-missing');
  }

  if (pkg.releaseState === 'draft' && pkg.publishedAt) warnings.push('draft-has-published-at');
  if (pkg.releaseState !== 'draft' && !pkg.publisher) warnings.push('publisher-missing');

  return { valid: blockers.length === 0, blockers, warnings };
}
