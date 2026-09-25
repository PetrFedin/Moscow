export type SpatialIntakeTrust = 'documented' | 'reconstructed' | 'hypothesis';
export type SpatialIntakeSourceReuseRights =
  | 'public-domain'
  | 'cleared'
  | 'reference-only'
  | 'review-required';

export type SpatialIntakeRequirementKind =
  | 'model-asset'
  | 'model-rights'
  | 'metric-authority'
  | 'control-point-authority'
  | 'archive-asset'
  | 'survey-evidence'
  | 'field-matrix'
  | 'persistent-anchor'
  | 'human-audio';

export type SpatialIntakeRequirementStage =
  | 'package-promotion'
  | 'field-release'
  | 'tourist-experience';

export type SpatialIntakeRequirementStatus =
  | 'missing'
  | 'pending-review'
  | 'recording-pending'
  | 'ready';

export type SpatialPackageIntakeSource = {
  id: string;
  label: string;
  url: string;
  reuseRights: SpatialIntakeSourceReuseRights;
};

export type SpatialPackageIntakeLayer = {
  id: string;
  periodId: string;
  trust: SpatialIntakeTrust;
  titleRu: string;
  titleEn: string;
  claimRu: string;
  claimEn: string;
  sourceIds: string[];
};

export type SpatialPackageIntakeRequirement = {
  id: string;
  kind: SpatialIntakeRequirementKind;
  stage: SpatialIntakeRequirementStage;
  status: SpatialIntakeRequirementStatus;
  required: boolean;
  evidenceRefs?: string[];
  note?: string;
};

export type SpatialPackageIntake = {
  schemaVersion: 1;
  id: string;
  placeId: string;
  titleRu: string;
  titleEn: string;
  version: number;
  authorityNamespace: string;
  status: 'asset-intake';
  sources: SpatialPackageIntakeSource[];
  layers: SpatialPackageIntakeLayer[];
  requirements: SpatialPackageIntakeRequirement[];
  languages: string[];
};

export type SpatialPackageIntakeValidation = {
  valid: boolean;
  promotionReady: boolean;
  fieldReleaseReady: boolean;
  touristExperienceReady: boolean;
  blockers: string[];
  promotionBlockers: string[];
  fieldReleaseBlockers: string[];
  touristExperienceBlockers: string[];
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

function nonEmptyUnique(values: string[]) {
  return values.length > 0
    && values.every((value) => value.trim().length > 0)
    && new Set(values).size === values.length;
}

function stageBlockers(
  intake: SpatialPackageIntake,
  stage: SpatialIntakeRequirementStage
) {
  return intake.requirements
    .filter((requirement) =>
      requirement.stage === stage
      && requirement.required
      && requirement.status !== 'ready'
    )
    .map((requirement) => `${stage}-requirement-not-ready:${requirement.id}:${requirement.status}`);
}

export function validateSpatialPackageIntake(
  intake: SpatialPackageIntake
): SpatialPackageIntakeValidation {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const sourceIds = new Set(intake.sources.map((source) => source.id));
  const periodIds = new Set<string>();

  if (intake.schemaVersion !== 1) blockers.push('unsupported-schema-version');
  if (!intake.id.trim()) blockers.push('intake-id-missing');
  if (!intake.placeId.trim()) blockers.push('place-id-missing');
  if (!intake.titleRu.trim()) blockers.push('title-ru-missing');
  if (!intake.titleEn.trim()) blockers.push('title-en-missing');
  if (!Number.isInteger(intake.version) || intake.version < 1) blockers.push('intake-version-invalid');
  if (!intake.authorityNamespace.trim()) blockers.push('authority-namespace-missing');
  if (intake.status !== 'asset-intake') blockers.push('unsupported-intake-status');
  if (intake.sources.length === 0) blockers.push('sources-missing');
  if (intake.layers.length === 0) blockers.push('historical-layers-missing');
  if (intake.requirements.length === 0) blockers.push('requirements-missing');
  if (!intake.languages.includes('ru')) blockers.push('russian-localization-missing');
  if (!intake.languages.includes('en')) warnings.push('english-localization-missing');

  for (const duplicate of duplicateIds(intake.sources)) blockers.push(`duplicate-source-id:${duplicate}`);
  for (const duplicate of duplicateIds(intake.layers)) blockers.push(`duplicate-layer-id:${duplicate}`);
  for (const duplicate of duplicateIds(intake.requirements)) blockers.push(`duplicate-requirement-id:${duplicate}`);

  for (const source of intake.sources) {
    if (!source.id.trim()) blockers.push('source-id-missing');
    if (!source.label.trim()) blockers.push(`source-label-missing:${source.id}`);
    if (!/^https:\/\//i.test(source.url)) blockers.push(`source-url-not-https:${source.id}`);
    if (source.reuseRights === 'review-required') {
      warnings.push(`source-reuse-rights-review-required:${source.id}`);
    }
  }

  for (const layer of intake.layers) {
    if (!layer.id.trim()) blockers.push('layer-id-missing');
    if (!layer.periodId.trim()) blockers.push(`layer-period-id-missing:${layer.id}`);
    if (periodIds.has(layer.periodId)) blockers.push(`duplicate-layer-period-id:${layer.periodId}`);
    periodIds.add(layer.periodId);
    if (!layer.titleRu.trim() || !layer.titleEn.trim()) blockers.push(`layer-title-missing:${layer.id}`);
    if (!layer.claimRu.trim()) blockers.push(`layer-claim-ru-missing:${layer.id}`);
    if (!layer.claimEn.trim()) blockers.push(`layer-claim-en-missing:${layer.id}`);
    if (!nonEmptyUnique(layer.sourceIds)) blockers.push(`layer-source-missing:${layer.id}`);
    for (const sourceId of layer.sourceIds) {
      if (!sourceIds.has(sourceId)) blockers.push(`layer-source-not-found:${layer.id}:${sourceId}`);
    }
  }

  for (const requirement of intake.requirements) {
    if (!requirement.id.trim()) blockers.push('requirement-id-missing');
    if (requirement.status === 'ready' && requirement.required && !nonEmptyUnique(requirement.evidenceRefs ?? [])) {
      blockers.push(`ready-requirement-evidence-missing:${requirement.id}`);
    }
    if (requirement.status !== 'ready' && (requirement.evidenceRefs?.length ?? 0) > 0) {
      warnings.push(`nonready-requirement-has-evidence:${requirement.id}`);
    }
  }

  const promotionBlockers = stageBlockers(intake, 'package-promotion');
  const fieldReleaseBlockers = stageBlockers(intake, 'field-release');
  const touristExperienceBlockers = stageBlockers(intake, 'tourist-experience');

  const valid = blockers.length === 0;
  return {
    valid,
    promotionReady: valid && promotionBlockers.length === 0,
    fieldReleaseReady: valid && promotionBlockers.length === 0 && fieldReleaseBlockers.length === 0,
    touristExperienceReady: valid && touristExperienceBlockers.length === 0,
    blockers,
    promotionBlockers,
    fieldReleaseBlockers,
    touristExperienceBlockers,
    warnings
  };
}

export function assertSpatialPackageIntakeValid(intake: SpatialPackageIntake) {
  const validation = validateSpatialPackageIntake(intake);
  if (!validation.valid) {
    throw new Error(`Spatial package intake is invalid: ${validation.blockers.join('; ')}`);
  }
  return intake;
}

export function assertSpatialPackageIntakePromotionReady(intake: SpatialPackageIntake) {
  const validation = validateSpatialPackageIntake(intake);
  if (!validation.valid) {
    throw new Error(`Spatial package intake is invalid: ${validation.blockers.join('; ')}`);
  }
  if (!validation.promotionReady) {
    throw new Error(`Spatial package intake is not promotion-ready: ${validation.promotionBlockers.join('; ')}`);
  }
  return intake;
}
