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

export type SpatialEvidenceElement = {
  id: string;
  titleRu: string;
  titleEn: string;
  trust: Exclude<SpatialTrustClass, 'artistic'>;
  eraIds: string[];
  sourceIds: string[];
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
  elementIds: string[];
  assetPath: string;
  repositoryBlobSha: string;
  byteSize: number;
};

export type SpatialAuthorityBindings = {
  modelPackVersion: string;
  metric: {
    id: string;
    version: number;
    modelPackVersion: string;
    modelUnits: 'meters';
    scaleStatus: string;
  };
  controlPoints: {
    id: string;
    version: number;
    requiredPoints: number;
    requiredAlignmentPoints: number;
  };
};

export type SpatialAudioAuthority = {
  expectedTracks: number;
  productionReadyTracks: number;
  trackIds: string[];
  status: 'not-applicable' | 'recording-pending' | 'production-ready';
  requiredForPublication: boolean;
};

export type SpatialFieldVerification = {
  required: boolean;
  minimumFieldSessions?: number;
  releaseGateState?: 'production-candidate' | 'field-verified-spatial-scene';
  calibrationVersion?: number;
  surveyVerified?: boolean;
  surveyPacketId?: string;
  multiDeviceMatrixPassed?: boolean;
  fieldSessionIds?: string[];
  persistentAnchorVerified?: boolean;
  persistentAnchorProofIds?: string[];
  verifiedAt?: string;
  releaseBlockers?: string[];
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
  elements: SpatialEvidenceElement[];
  claims: SpatialClaim[];
  models: SpatialModelArtifact[];
  authority: SpatialAuthorityBindings;
  fieldVerification: SpatialFieldVerification;
  audioAuthority?: SpatialAudioAuthority;
  languages: string[];
  offlineEligible: boolean;
};

export type SpatialPackageValidation = {
  valid: boolean;
  publishable: boolean;
  blockers: string[];
  publicationBlockers: string[];
  warnings: string[];
};

function duplicateIds(values: Array<{ id: string }>) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value.id)) duplicates.add(value.id);
    seen.add(value.id);
  }
  return [...duplicates];
}

function isHttps(value: string) {
  return /^https:\/\//i.test(value);
}

function uniqueNonEmpty(values: string[] | undefined) {
  return Boolean(values && values.length > 0 && new Set(values).size === values.length && values.every((value) => value.trim()));
}

export function validatePublishedSpatialPackage(pkg: PublishedSpatialPackage): SpatialPackageValidation {
  const blockers: string[] = [];
  const publicationBlockers: string[] = [];
  const warnings: string[] = [];

  const sourceIds = new Set(pkg.sources.map((source) => source.id));
  const elementIds = new Set(pkg.elements.map((element) => element.id));
  const eraIds = new Set(pkg.eras.map((era) => era.id));

  if (pkg.schemaVersion !== 1) blockers.push('unsupported-schema-version');
  if (!pkg.id.trim()) blockers.push('package-id-missing');
  if (!pkg.placeId.trim()) blockers.push('place-id-missing');
  if (!Number.isInteger(pkg.version) || pkg.version < 1) blockers.push('package-version-invalid');
  if (!pkg.titleRu.trim()) blockers.push('title-ru-missing');
  if (!pkg.titleEn.trim()) blockers.push('title-en-missing');
  if (pkg.eras.length === 0) blockers.push('era-missing');
  if (pkg.sources.length === 0) blockers.push('sources-missing');
  if (pkg.models.length === 0) blockers.push('models-missing');
  if (pkg.releaseState !== 'draft' && pkg.elements.length === 0) blockers.push('evidence-elements-missing');
  if (pkg.releaseState !== 'draft' && pkg.claims.length === 0) blockers.push('claims-missing');
  if (!pkg.languages.includes('ru')) blockers.push('russian-localization-missing');
  if (!pkg.languages.includes('en')) warnings.push('english-localization-missing');
  if (pkg.releaseState !== 'draft' && !pkg.publisher?.trim()) blockers.push('publisher-missing');

  for (const duplicate of duplicateIds(pkg.sources)) blockers.push(`duplicate-source-id:${duplicate}`);
  for (const duplicate of duplicateIds(pkg.elements)) blockers.push(`duplicate-element-id:${duplicate}`);
  for (const duplicate of duplicateIds(pkg.claims)) blockers.push(`duplicate-claim-id:${duplicate}`);
  for (const duplicate of duplicateIds(pkg.models)) blockers.push(`duplicate-model-id:${duplicate}`);
  for (const duplicate of duplicateIds(pkg.eras)) blockers.push(`duplicate-era-id:${duplicate}`);

  for (const source of pkg.sources) {
    if (!source.id.trim()) blockers.push('source-id-missing');
    if (!source.title.trim()) blockers.push(`source-title-missing:${source.id}`);
    if (!source.sourceUrl.trim()) blockers.push(`source-url-missing:${source.id}`);
    else if (!isHttps(source.sourceUrl)) blockers.push(`source-url-not-https:${source.id}`);
    if (!source.accessedAt.trim()) blockers.push(`source-accessed-at-missing:${source.id}`);
    if (source.rights === 'review-required') publicationBlockers.push(`rights-review-required:${source.id}`);
    if (source.rights === 'restricted') warnings.push(`restricted-source:${source.id}`);
  }

  const claimedElementIds = new Set<string>();
  for (const claim of pkg.claims) {
    if (!claim.id.trim()) blockers.push('claim-id-missing');
    if (!claim.summary.trim()) blockers.push(`claim-summary-missing:${claim.id}`);
    if (!uniqueNonEmpty(claim.sourceIds)) blockers.push(`claim-source-missing:${claim.id}`);
    if (!uniqueNonEmpty(claim.modelElementIds)) blockers.push(`claim-element-missing:${claim.id}`);
    for (const sourceId of claim.sourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`claim-source-not-found:${claim.id}:${sourceId}`);
    }
    for (const elementId of claim.modelElementIds) {
      claimedElementIds.add(elementId);
      if (!elementIds.has(elementId)) blockers.push(`claim-element-not-found:${claim.id}:${elementId}`);
    }
  }

  for (const element of pkg.elements) {
    if (!element.id.trim()) blockers.push('element-id-missing');
    if (!element.titleRu.trim() || !element.titleEn.trim()) blockers.push(`element-title-missing:${element.id}`);
    if (!uniqueNonEmpty(element.eraIds)) blockers.push(`element-era-missing:${element.id}`);
    if (!uniqueNonEmpty(element.sourceIds)) blockers.push(`element-source-missing:${element.id}`);
    for (const eraId of element.eraIds) {
      if (!eraIds.has(eraId)) blockers.push(`element-era-not-found:${element.id}:${eraId}`);
    }
    for (const sourceId of element.sourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`element-source-not-found:${element.id}:${sourceId}`);
    }
    if (!claimedElementIds.has(element.id)) blockers.push(`element-without-claim:${element.id}`);
  }

  const artifactPaths = new Set<string>();
  const blobShas = new Set<string>();
  for (const model of pkg.models) {
    if (!eraIds.has(model.eraId)) blockers.push(`model-era-not-found:${model.id}:${model.eraId}`);
    if (!uniqueNonEmpty(model.sourceIds)) blockers.push(`model-source-missing:${model.id}`);
    if (!uniqueNonEmpty(model.elementIds)) blockers.push(`model-element-missing:${model.id}`);
    for (const sourceId of model.sourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`model-source-not-found:${model.id}:${sourceId}`);
    }
    for (const elementId of model.elementIds) {
      if (!elementIds.has(elementId)) blockers.push(`model-element-not-found:${model.id}:${elementId}`);
    }
    if (!model.runtimeModes.includes('model3d')) warnings.push(`model3d-runtime-not-enabled:${model.id}`);
    if (!model.assetPath.trim() || !model.assetPath.endsWith('.glb')) blockers.push(`model-asset-path-invalid:${model.id}`);
    if (!/^[a-f0-9]{40}$/i.test(model.repositoryBlobSha)) blockers.push(`model-blob-sha-invalid:${model.id}`);
    if (!Number.isInteger(model.byteSize) || model.byteSize <= 0) blockers.push(`model-byte-size-invalid:${model.id}`);
    if (artifactPaths.has(model.assetPath)) blockers.push(`duplicate-model-asset-path:${model.assetPath}`);
    artifactPaths.add(model.assetPath);
    if (blobShas.has(model.repositoryBlobSha)) warnings.push(`shared-model-blob-sha:${model.repositoryBlobSha}`);
    blobShas.add(model.repositoryBlobSha);
  }

  if (!pkg.authority.modelPackVersion.trim()) blockers.push('model-pack-version-missing');
  if (!pkg.authority.metric.id.trim() || pkg.authority.metric.version < 1) blockers.push('metric-authority-invalid');
  if (pkg.authority.metric.modelUnits !== 'meters') blockers.push('metric-authority-not-metric');
  if (pkg.authority.metric.modelPackVersion !== pkg.authority.modelPackVersion) blockers.push('metric-model-pack-binding-mismatch');
  if (!pkg.authority.controlPoints.id.trim() || pkg.authority.controlPoints.version < 1) blockers.push('control-point-authority-invalid');
  if (pkg.authority.controlPoints.requiredPoints < 1) blockers.push('control-point-required-points-invalid');
  if (
    pkg.authority.controlPoints.requiredAlignmentPoints < 1
    || pkg.authority.controlPoints.requiredAlignmentPoints > pkg.authority.controlPoints.requiredPoints
  ) {
    blockers.push('control-point-alignment-requirement-invalid');
  }

  if (pkg.releaseState === 'field-verified') {
    const field = pkg.fieldVerification;
    if (!field.required) blockers.push('field-verification-not-required');
    if (field.releaseGateState !== 'field-verified-spatial-scene') blockers.push('release-gate-not-field-verified');
    if (!field.surveyVerified) blockers.push('survey-not-verified');
    if (!field.surveyPacketId?.trim()) blockers.push('survey-packet-id-missing');
    if (!field.multiDeviceMatrixPassed) blockers.push('multi-device-field-matrix-not-passed');
    if (!uniqueNonEmpty(field.fieldSessionIds)) blockers.push('field-session-evidence-missing');
    if (
      field.minimumFieldSessions !== undefined
      && (field.fieldSessionIds?.length ?? 0) < field.minimumFieldSessions
    ) {
      blockers.push('field-session-evidence-below-minimum');
    }
    if (!Number.isInteger(field.calibrationVersion) || (field.calibrationVersion ?? 0) < 1) {
      blockers.push('calibration-version-missing');
    }
    if (!field.persistentAnchorVerified) blockers.push('persistent-anchor-not-verified');
    if (!uniqueNonEmpty(field.persistentAnchorProofIds)) blockers.push('persistent-anchor-proof-missing');
    if (!field.verifiedAt?.trim()) blockers.push('field-verified-at-missing');
    if ((field.releaseBlockers ?? []).length > 0) blockers.push('field-release-blockers-present');
    if (!pkg.publishedAt?.trim()) blockers.push('published-at-missing');
  } else if (pkg.fieldVerification.releaseGateState === 'field-verified-spatial-scene') {
    blockers.push('release-state-understates-field-gate');
  }

  if (pkg.releaseState === 'draft' && pkg.publishedAt) warnings.push('draft-has-published-at');

  if (pkg.audioAuthority) {
    if (pkg.audioAuthority.expectedTracks < 0 || pkg.audioAuthority.productionReadyTracks < 0) {
      blockers.push('audio-track-count-invalid');
    }
    if (pkg.audioAuthority.productionReadyTracks > pkg.audioAuthority.expectedTracks) {
      blockers.push('audio-ready-count-exceeds-expected');
    }
    if (pkg.audioAuthority.trackIds.length !== pkg.audioAuthority.expectedTracks) {
      blockers.push('audio-track-id-count-mismatch');
    }
    if (new Set(pkg.audioAuthority.trackIds).size !== pkg.audioAuthority.trackIds.length) {
      blockers.push('duplicate-audio-track-id');
    }
    if (
      pkg.audioAuthority.status === 'production-ready'
      && pkg.audioAuthority.productionReadyTracks !== pkg.audioAuthority.expectedTracks
    ) {
      blockers.push('audio-status-does-not-match-ready-count');
    }
    if (
      pkg.audioAuthority.requiredForPublication
      && pkg.audioAuthority.status !== 'production-ready'
    ) {
      publicationBlockers.push('audio-authority-not-production-ready');
    }
    if (
      !pkg.audioAuthority.requiredForPublication
      && pkg.audioAuthority.status === 'recording-pending'
    ) {
      warnings.push('audio-recording-pending');
    }
  }

  for (const releaseBlocker of pkg.fieldVerification.releaseBlockers ?? []) {
    warnings.push(`field-release-blocker:${releaseBlocker}`);
  }

  const valid = blockers.length === 0;
  return {
    valid,
    publishable: valid && publicationBlockers.length === 0,
    blockers,
    publicationBlockers,
    warnings
  };
}

export function assertPublishedSpatialPackageCanPublish(pkg: PublishedSpatialPackage) {
  const validation = validatePublishedSpatialPackage(pkg);
  if (!validation.valid) {
    throw new Error(`Spatial package is structurally invalid: ${validation.blockers.join('; ')}`);
  }
  if (!validation.publishable) {
    throw new Error(`Spatial package is not publishable: ${validation.publicationBlockers.join('; ')}`);
  }
  return pkg;
}

export function serializePublishedSpatialPackage(pkg: PublishedSpatialPackage) {
  const validation = validatePublishedSpatialPackage(pkg);
  if (!validation.valid) {
    throw new Error(`Cannot serialize structurally invalid spatial package: ${validation.blockers.join('; ')}`);
  }
  return JSON.stringify(pkg);
}

export function parsePublishedSpatialPackage(raw: string) {
  const parsed = JSON.parse(raw) as PublishedSpatialPackage;
  const validation = validatePublishedSpatialPackage(parsed);
  if (!validation.valid) {
    throw new Error(`Spatial package import failed validation: ${validation.blockers.join('; ')}`);
  }
  return parsed;
}
