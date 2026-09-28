export type HeritageControlPointPurpose = 'alignment' | 'quality-check';
export type HeritageControlPointState = 'pending-survey' | 'measured' | 'verified';

export type HeritageControlPoint = {
  id: string;
  purpose: HeritageControlPointPurpose;
  state: HeritageControlPointState;
};

export type HeritageControlPointSet = {
  id: string;
  version: number;
  requiredPoints: number;
  requiredAlignmentPoints: number;
};

export type HeritageControlPointBinding = {
  controlPointSetId: string;
  controlPointSetVersion: number;
};

export function createControlPointBinding(
  set: Pick<HeritageControlPointSet, 'id' | 'version'>
): HeritageControlPointBinding {
  return {
    controlPointSetId: set.id,
    controlPointSetVersion: set.version
  };
}

export function isCurrentControlPointBinding(
  value: Partial<HeritageControlPointBinding> | null | undefined,
  current: HeritageControlPointBinding
) {
  return Boolean(
    value
    && value.controlPointSetId === current.controlPointSetId
    && value.controlPointSetVersion === current.controlPointSetVersion
  );
}

export function validateHeritageControlPointAuthority(
  set: HeritageControlPointSet,
  points: HeritageControlPoint[]
) {
  const blockers: string[] = [];
  if (!set.id.trim()) blockers.push('control-point-set-id-missing');
  if (!Number.isInteger(set.version) || set.version < 1) {
    blockers.push('control-point-set-version-invalid');
  }
  if (!Number.isInteger(set.requiredPoints) || set.requiredPoints < 1) {
    blockers.push('required-control-points-invalid');
  }
  if (
    !Number.isInteger(set.requiredAlignmentPoints)
    || set.requiredAlignmentPoints < 1
    || set.requiredAlignmentPoints > set.requiredPoints
  ) {
    blockers.push('required-alignment-points-invalid');
  }

  const ids = points.map((point) => point.id);
  if (ids.some((id) => !id.trim())) blockers.push('control-point-id-missing');
  if (new Set(ids).size !== ids.length) blockers.push('duplicate-control-point-id');
  if (points.length !== set.requiredPoints) {
    blockers.push(`control-point-count-mismatch:${points.length}:${set.requiredPoints}`);
  }
  const alignmentPoints = points.filter((point) => point.purpose === 'alignment').length;
  if (alignmentPoints < set.requiredAlignmentPoints) {
    blockers.push(`alignment-point-count-below-minimum:${alignmentPoints}:${set.requiredAlignmentPoints}`);
  }

  return { valid: blockers.length === 0, blockers };
}
