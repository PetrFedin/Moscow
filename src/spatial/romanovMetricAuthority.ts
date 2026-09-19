import { ROMANOV_MODEL_PACK_VERSION } from './romanovModelCatalog.ts';

export type RomanovMetricBinding = {
  metricAuthorityId: string;
  metricAuthorityVersion: number;
  modelPackVersion: string;
};

export const ROMANOV_METRIC_AUTHORITY = {
  id: 'romanov-metric-authority-v1',
  version: 1,
  modelPackVersion: ROMANOV_MODEL_PACK_VERSION,
  modelUnits: 'meters' as const,
  metersPerModelUnit: 1,
  researchCoordinateOrder: ['x', 'depth', 'height'] as const,
  viroCoordinateOrder: ['x', 'height', 'depth'] as const,
  sourceManifestPath: 'assets/models/romanov-production-candidate-v1.manifest.json',
  scaleStatus: 'provisional-pending-survey' as const
};

export const currentRomanovMetricBinding: RomanovMetricBinding = {
  metricAuthorityId: ROMANOV_METRIC_AUTHORITY.id,
  metricAuthorityVersion: ROMANOV_METRIC_AUTHORITY.version,
  modelPackVersion: ROMANOV_METRIC_AUTHORITY.modelPackVersion
};

export function isCurrentRomanovMetricBinding(value?: Partial<RomanovMetricBinding> | null) {
  return Boolean(
    value
    && value.metricAuthorityId === currentRomanovMetricBinding.metricAuthorityId
    && value.metricAuthorityVersion === currentRomanovMetricBinding.metricAuthorityVersion
    && value.modelPackVersion === currentRomanovMetricBinding.modelPackVersion
  );
}

export function romanovResearchPointToViro(
  [x, depth, height]: [number, number, number]
): [number, number, number] {
  return [x, height, depth];
}
