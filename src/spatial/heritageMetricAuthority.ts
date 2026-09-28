export type HeritageMetricBinding = {
  metricAuthorityId: string;
  metricAuthorityVersion: number;
  modelPackVersion: string;
};

export type HeritageMetricAuthority = {
  id: string;
  version: number;
  modelPackVersion: string;
  modelUnits: 'meters';
  metersPerModelUnit: number;
  scaleStatus: string;
  verifiedScaleTolerance: number;
};

export function createMetricBinding(
  authority: Pick<HeritageMetricAuthority, 'id' | 'version' | 'modelPackVersion'>
): HeritageMetricBinding {
  return {
    metricAuthorityId: authority.id,
    metricAuthorityVersion: authority.version,
    modelPackVersion: authority.modelPackVersion
  };
}

export function isCurrentMetricBinding(
  value: Partial<HeritageMetricBinding> | null | undefined,
  current: HeritageMetricBinding
) {
  return Boolean(
    value
    && value.metricAuthorityId === current.metricAuthorityId
    && value.metricAuthorityVersion === current.metricAuthorityVersion
    && value.modelPackVersion === current.modelPackVersion
  );
}

export function isMetricScaleAuthoritative(
  scale: number,
  authority: Pick<HeritageMetricAuthority, 'metersPerModelUnit' | 'verifiedScaleTolerance'>
) {
  return Number.isFinite(scale)
    && Number.isFinite(authority.metersPerModelUnit)
    && authority.metersPerModelUnit > 0
    && Number.isFinite(authority.verifiedScaleTolerance)
    && authority.verifiedScaleTolerance >= 0
    && Math.abs(scale - authority.metersPerModelUnit) <= authority.verifiedScaleTolerance;
}

export function validateHeritageMetricAuthority(
  authority: HeritageMetricAuthority
) {
  const blockers: string[] = [];
  if (!authority.id.trim()) blockers.push('metric-authority-id-missing');
  if (!Number.isInteger(authority.version) || authority.version < 1) {
    blockers.push('metric-authority-version-invalid');
  }
  if (!authority.modelPackVersion.trim()) blockers.push('metric-model-pack-version-missing');
  if (authority.modelUnits !== 'meters') blockers.push('metric-units-not-meters');
  if (!Number.isFinite(authority.metersPerModelUnit) || authority.metersPerModelUnit <= 0) {
    blockers.push('meters-per-model-unit-invalid');
  }
  if (!authority.scaleStatus.trim()) blockers.push('metric-scale-status-missing');
  if (!Number.isFinite(authority.verifiedScaleTolerance) || authority.verifiedScaleTolerance < 0) {
    blockers.push('metric-scale-tolerance-invalid');
  }
  return { valid: blockers.length === 0, blockers };
}
