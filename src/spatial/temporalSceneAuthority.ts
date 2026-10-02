export type TemporalConfidence = 'not-assessed' | 'high' | 'medium' | 'low';
export type TemporalReconstructionStatus =
  | 'documented'
  | 'reconstructed'
  | 'hypothesis'
  | 'mixed';
export type TemporalPublicationState =
  | 'draft'
  | 'production-candidate'
  | 'superseded';
export type TemporalInterpretationMode =
  | 'documented-only'
  | 'public-research'
  | 'composite-research';

export type TemporalDate = {
  year: number;
  month?: number;
  day?: number;
};

export type TemporalExtent =
  | { kind: 'exact-date'; date: TemporalDate }
  | { kind: 'exact-year'; year: number }
  | { kind: 'bounded-range'; from: TemporalDate; to: TemporalDate }
  | { kind: 'approximate-range'; from: TemporalDate; to: TemporalDate }
  | { kind: 'reference-points'; years: number[] }
  | { kind: 'undated' };

export type TemporalAssetBinding = {
  kind: 'model3d' | 'archive-image' | 'iiif' | 'audio' | 'other';
  id: string;
  trustMode?: 'documented' | 'public-research';
};

export type TemporalSceneRecord = {
  id: string;
  placeId: string;
  version: number;
  periodLabelRu: string;
  periodLabelEn: string;
  extent: TemporalExtent;
  confidence: TemporalConfidence;
  reconstructionStatus: TemporalReconstructionStatus;
  interpretationMode: TemporalInterpretationMode;
  sourceIds: string[];
  claimIds: string[];
  evidenceElementIds: string[];
  assetBindings: TemporalAssetBinding[];
  experiencePeriodIds?: string[];
  runtimeEraId?: string;
  timeMachineIndexes?: number[];
  publicationState: TemporalPublicationState;
  alternativeGroupId?: string;
  supersedes?: string[];
};

export type TemporalSceneValidation = {
  valid: boolean;
  blockers: string[];
};

export type TemporalSceneRegistryAuthority = {
  sourceIds: ReadonlySet<string>;
  claimIds: ReadonlySet<string>;
  evidenceElementIds: ReadonlySet<string>;
  assetIds: ReadonlySet<string>;
  experiencePeriodIds?: ReadonlySet<string>;
};

function isFiniteInteger(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);
}

function validYear(value: unknown) {
  return isFiniteInteger(value) && (value as number) >= 1 && (value as number) <= 9999;
}

function leapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number) {
  if (month === 2) return leapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function validTemporalDate(value: TemporalDate, exactDate = false) {
  if (!value || !validYear(value.year)) return false;
  if (value.month === undefined && value.day !== undefined) return false;
  if (value.month !== undefined && (!isFiniteInteger(value.month) || value.month < 1 || value.month > 12)) {
    return false;
  }
  if (value.day !== undefined) {
    if (
      !isFiniteInteger(value.day)
      || value.month === undefined
      || value.day < 1
      || value.day > daysInMonth(value.year, value.month)
    ) return false;
  }
  if (exactDate && (value.month === undefined || value.day === undefined)) return false;
  return true;
}

function dateOrdinal(year: number, month: number, day: number) {
  return year * 10000 + month * 100 + day;
}

function dateFloor(value: TemporalDate) {
  return dateOrdinal(value.year, value.month ?? 1, value.day ?? 1);
}

function dateCeil(value: TemporalDate) {
  if (value.day !== undefined && value.month !== undefined) {
    return dateOrdinal(value.year, value.month, value.day);
  }
  if (value.month !== undefined) {
    return dateOrdinal(value.year, value.month, daysInMonth(value.year, value.month));
  }
  return dateOrdinal(value.year, 12, 31);
}

function uniqueNonEmpty(values: string[] | undefined) {
  return Boolean(
    values
    && values.length > 0
    && values.every((value) => typeof value === 'string' && value.trim())
    && new Set(values).size === values.length
  );
}

function extentBounds(extent: TemporalExtent): { start: number; end: number } | null {
  switch (extent.kind) {
    case 'exact-date': {
      if (!validTemporalDate(extent.date, true)) return null;
      const exact = dateFloor(extent.date);
      return { start: exact, end: exact };
    }
    case 'exact-year':
      if (!validYear(extent.year)) return null;
      return {
        start: dateOrdinal(extent.year, 1, 1),
        end: dateOrdinal(extent.year, 12, 31)
      };
    case 'bounded-range':
    case 'approximate-range':
      if (!validTemporalDate(extent.from) || !validTemporalDate(extent.to)) return null;
      return { start: dateFloor(extent.from), end: dateCeil(extent.to) };
    case 'reference-points': {
      if (
        extent.years.length < 2
        || extent.years.some((year) => !validYear(year))
        || new Set(extent.years).size !== extent.years.length
      ) return null;
      const years = [...extent.years].sort((a, b) => a - b);
      return { start: dateOrdinal(years[0]!, 1, 1), end: dateOrdinal(years.at(-1)!, 12, 31) };
    }
    case 'undated':
      return null;
  }
}

function validateExtent(extent: TemporalExtent, blockers: string[]) {
  switch (extent.kind) {
    case 'exact-date':
      if (!validTemporalDate(extent.date, true)) blockers.push('temporal-exact-date-invalid');
      break;
    case 'exact-year':
      if (!validYear(extent.year)) blockers.push('temporal-exact-year-invalid');
      break;
    case 'bounded-range':
    case 'approximate-range': {
      if (!validTemporalDate(extent.from) || !validTemporalDate(extent.to)) {
        blockers.push('temporal-range-date-invalid');
        break;
      }
      if (dateFloor(extent.from) > dateCeil(extent.to)) blockers.push('temporal-range-inverted');
      break;
    }
    case 'reference-points': {
      if (extent.years.length < 2) blockers.push('temporal-reference-points-too-few');
      if (extent.years.some((year) => !validYear(year))) blockers.push('temporal-reference-year-invalid');
      if (new Set(extent.years).size !== extent.years.length) blockers.push('temporal-reference-year-duplicate');
      const sorted = [...extent.years].sort((a, b) => a - b);
      if (extent.years.some((year, index) => year !== sorted[index])) {
        blockers.push('temporal-reference-years-not-ordered');
      }
      break;
    }
    case 'undated':
      break;
  }
}

export function validateTemporalSceneRecord(scene: TemporalSceneRecord): TemporalSceneValidation {
  const blockers: string[] = [];

  if (!scene.id?.trim()) blockers.push('temporal-scene-id-missing');
  if (!scene.placeId?.trim()) blockers.push('temporal-place-id-missing');
  if (!isFiniteInteger(scene.version) || scene.version < 1) blockers.push('temporal-scene-version-invalid');
  if (!scene.periodLabelRu?.trim()) blockers.push('temporal-label-ru-missing');
  if (!scene.periodLabelEn?.trim()) blockers.push('temporal-label-en-missing');

  validateExtent(scene.extent, blockers);

  if (
    scene.confidence !== 'not-assessed'
    && scene.confidence !== 'high'
    && scene.confidence !== 'medium'
    && scene.confidence !== 'low'
  ) blockers.push('temporal-confidence-invalid');

  if (
    scene.reconstructionStatus !== 'documented'
    && scene.reconstructionStatus !== 'reconstructed'
    && scene.reconstructionStatus !== 'hypothesis'
    && scene.reconstructionStatus !== 'mixed'
  ) blockers.push('temporal-reconstruction-status-invalid');

  if (
    scene.interpretationMode !== 'documented-only'
    && scene.interpretationMode !== 'public-research'
    && scene.interpretationMode !== 'composite-research'
  ) blockers.push('temporal-interpretation-mode-invalid');

  if (!uniqueNonEmpty(scene.sourceIds)) blockers.push('temporal-source-ids-invalid');
  if (!uniqueNonEmpty(scene.claimIds)) blockers.push('temporal-claim-ids-invalid');
  if (!uniqueNonEmpty(scene.evidenceElementIds)) blockers.push('temporal-element-ids-invalid');

  if (!scene.assetBindings.length) blockers.push('temporal-asset-bindings-missing');
  const assetKeys = scene.assetBindings.map((asset) => `${asset.kind}:${asset.id}`);
  if (
    scene.assetBindings.some((asset) =>
      !asset.id?.trim()
      || (
        asset.trustMode !== undefined
        && asset.trustMode !== 'documented'
        && asset.trustMode !== 'public-research'
      )
    )
    || new Set(assetKeys).size !== assetKeys.length
  ) blockers.push('temporal-asset-bindings-invalid');

  if (
    scene.experiencePeriodIds !== undefined
    && !uniqueNonEmpty(scene.experiencePeriodIds)
  ) blockers.push('temporal-experience-period-ids-invalid');

  if (scene.timeMachineIndexes !== undefined) {
    if (
      scene.timeMachineIndexes.length === 0
      || scene.timeMachineIndexes.some((index) => !isFiniteInteger(index) || index < 0)
      || new Set(scene.timeMachineIndexes).size !== scene.timeMachineIndexes.length
    ) blockers.push('temporal-time-machine-index-invalid');
  }

  if (
    scene.publicationState !== 'draft'
    && scene.publicationState !== 'production-candidate'
    && scene.publicationState !== 'superseded'
  ) blockers.push('temporal-publication-state-invalid');

  if (scene.supersedes?.includes(scene.id)) blockers.push('temporal-scene-self-supersedes');
  if (scene.supersedes && new Set(scene.supersedes).size !== scene.supersedes.length) {
    blockers.push('temporal-supersedes-duplicate');
  }
  if (scene.alternativeGroupId !== undefined && !scene.alternativeGroupId.trim()) {
    blockers.push('temporal-alternative-group-id-invalid');
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)] };
}

function overlap(left: TemporalExtent, right: TemporalExtent) {
  if (left.kind === 'undated' || right.kind === 'undated') return false;

  if (left.kind === 'reference-points') {
    const years = new Set(left.years);
    if (right.kind === 'reference-points') return right.years.some((year) => years.has(year));
    const bounds = extentBounds(right);
    return left.years.some((year) => {
      const yearStart = dateOrdinal(year, 1, 1);
      const yearEnd = dateOrdinal(year, 12, 31);
      return Boolean(bounds && yearStart <= bounds.end && bounds.start <= yearEnd);
    });
  }
  if (right.kind === 'reference-points') return overlap(right, left);

  const a = extentBounds(left);
  const b = extentBounds(right);
  return Boolean(a && b && a.start <= b.end && b.start <= a.end);
}

export function validateTemporalSceneRegistry(
  scenes: TemporalSceneRecord[],
  authority: TemporalSceneRegistryAuthority
): TemporalSceneValidation {
  const blockers: string[] = [];
  const ids = new Set<string>();

  for (const scene of scenes) {
    const validation = validateTemporalSceneRecord(scene);
    blockers.push(...validation.blockers.map((blocker) => `${scene.id || 'unknown'}:${blocker}`));

    if (ids.has(scene.id)) blockers.push(`duplicate-temporal-scene-id:${scene.id}`);
    ids.add(scene.id);

    for (const sourceId of scene.sourceIds) {
      if (!authority.sourceIds.has(sourceId)) blockers.push(`temporal-source-not-found:${scene.id}:${sourceId}`);
    }
    for (const claimId of scene.claimIds) {
      if (!authority.claimIds.has(claimId)) blockers.push(`temporal-claim-not-found:${scene.id}:${claimId}`);
    }
    for (const elementId of scene.evidenceElementIds) {
      if (!authority.evidenceElementIds.has(elementId)) {
        blockers.push(`temporal-element-not-found:${scene.id}:${elementId}`);
      }
    }
    for (const asset of scene.assetBindings) {
      if (!authority.assetIds.has(asset.id)) blockers.push(`temporal-asset-not-found:${scene.id}:${asset.id}`);
    }
    for (const periodId of scene.experiencePeriodIds ?? []) {
      if (authority.experiencePeriodIds && !authority.experiencePeriodIds.has(periodId)) {
        blockers.push(`temporal-experience-period-not-found:${scene.id}:${periodId}`);
      }
    }
  }

  for (const scene of scenes) {
    for (const supersededId of scene.supersedes ?? []) {
      if (!ids.has(supersededId)) blockers.push(`temporal-supersedes-not-found:${scene.id}:${supersededId}`);
    }
  }

  const active = scenes.filter((scene) => scene.publicationState !== 'superseded');
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const left = active[i]!;
      const right = active[j]!;
      if (left.placeId !== right.placeId || !overlap(left.extent, right.extent)) continue;

      const explicitAlternative = Boolean(
        left.alternativeGroupId
        && right.alternativeGroupId
        && left.alternativeGroupId === right.alternativeGroupId
        && left.interpretationMode !== right.interpretationMode
      );
      if (!explicitAlternative) {
        blockers.push(`temporal-overlap-not-explicit:${left.id}:${right.id}`);
      }
    }
  }

  const indexOwner = new Map<string, string>();
  for (const scene of active) {
    for (const index of scene.timeMachineIndexes ?? []) {
      const key = `${scene.placeId}:${index}`;
      const existing = indexOwner.get(key);
      if (existing && existing !== scene.id) {
        blockers.push(`temporal-time-machine-index-conflict:${key}:${existing}:${scene.id}`);
      } else {
        indexOwner.set(key, scene.id);
      }
    }
  }

  return { valid: blockers.length === 0, blockers: [...new Set(blockers)] };
}

export function temporalSceneAtTimeMachineIndex(
  scenes: TemporalSceneRecord[],
  placeId: string,
  index: number
) {
  const rounded = Math.max(0, Math.round(index));
  return scenes.find((scene) =>
    scene.placeId === placeId
    && scene.publicationState !== 'superseded'
    && scene.timeMachineIndexes?.includes(rounded)
  ) ?? null;
}
