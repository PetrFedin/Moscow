import { ROMANOV_MODEL_PACK_VERSION } from './romanovModelCatalog.ts';
import {
  createMetricBinding,
  isCurrentMetricBinding,
  isMetricScaleAuthoritative,
  validateHeritageMetricAuthority,
  type HeritageMetricAuthority,
  type HeritageMetricBinding
} from './heritageMetricAuthority.ts';

export type RomanovMetricBinding = HeritageMetricBinding;

export const ROMANOV_METRIC_AUTHORITY = {
  id: 'romanov-metric-authority-v1',
  version: 1,
  modelPackVersion: ROMANOV_MODEL_PACK_VERSION,
  modelUnits: 'meters' as const,
  metersPerModelUnit: 1,
  researchCoordinateOrder: ['x', 'depth', 'height'] as const,
  viroCoordinateOrder: ['x', 'height', 'depth'] as const,
  sourceManifestPath: 'assets/models/romanov-production-candidate-v1.manifest.json',
  scaleStatus: 'provisional-pending-survey' as const,
  verifiedScaleTolerance: 0.02
} satisfies HeritageMetricAuthority & {
  researchCoordinateOrder: readonly ['x', 'depth', 'height'];
  viroCoordinateOrder: readonly ['x', 'height', 'depth'];
  sourceManifestPath: string;
};

export const romanovMetricAuthorityValidation =
  validateHeritageMetricAuthority(ROMANOV_METRIC_AUTHORITY);

export const currentRomanovMetricBinding: RomanovMetricBinding =
  createMetricBinding(ROMANOV_METRIC_AUTHORITY);

export function isCurrentRomanovMetricBinding(value?: Partial<RomanovMetricBinding> | null) {
  return isCurrentMetricBinding(value, currentRomanovMetricBinding);
}

export function romanovResearchPointToViro(
  [x, depth, height]: [number, number, number]
): [number, number, number] {
  return [x, height, depth];
}


export function isRomanovVerifiedScaleAuthoritative(scale: number) {
  return isMetricScaleAuthoritative(scale, ROMANOV_METRIC_AUTHORITY);
}
