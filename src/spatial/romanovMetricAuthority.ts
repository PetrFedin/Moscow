import { ROMANOV_MODEL_PACK_VERSION } from './romanovModelCatalog.ts';
import type { RomanovEra } from './romanov-hotspots.ts';

export type RomanovResearchPointMeters = [number, number, number];
export type RomanovViroPointMeters = [number, number, number];

export const ROMANOV_METRIC_AUTHORITY = {
  id: 'romanov-metric-authority-v1',
  version: 1,
  modelPackVersion: ROMANOV_MODEL_PACK_VERSION,
  modelUnits: 'meters' as const,
  metersPerModelUnit: 1,
  researchCoordinateOrder: ['x', 'depth', 'height'] as const,
  viroCoordinateOrder: ['x', 'height', 'depth'] as const,
  scaleStatus: 'provisional-pending-survey' as const,
  researchEnvelopeMeters: {
    '1857': {
      min: [-9.7, -4.0, 0] as RomanovResearchPointMeters,
      max: [6.5, 4.0, 9.25] as RomanovResearchPointMeters
    },
    '1859': {
      min: [-10.5, -4.25, 0] as RomanovResearchPointMeters,
      max: [8.2, 3.8, 12.975] as RomanovResearchPointMeters
    }
  } satisfies Record<RomanovEra, { min: RomanovResearchPointMeters; max: RomanovResearchPointMeters }>
};

export type RomanovMetricBinding = {
  metricAuthorityId: typeof ROMANOV_METRIC_AUTHORITY.id;
  metricAuthorityVersion: typeof ROMANOV_METRIC_AUTHORITY.version;
  modelPackVersion: typeof ROMANOV_MODEL_PACK_VERSION;
};

export const currentRomanovMetricBinding: RomanovMetricBinding = {
  metricAuthorityId: ROMANOV_METRIC_AUTHORITY.id,
  metricAuthorityVersion: ROMANOV_METRIC_AUTHORITY.version,
  modelPackVersion: ROMANOV_MODEL_PACK_VERSION
};

export function romanovResearchPointToViro(
  [x, depth, height]: RomanovResearchPointMeters
): RomanovViroPointMeters {
  return [x, height, depth];
}

export function isCurrentRomanovMetricBinding(value: Partial<RomanovMetricBinding> | null | undefined) {
  return Boolean(
    value
    && value.metricAuthorityId === currentRomanovMetricBinding.metricAuthorityId
    && value.metricAuthorityVersion === currentRomanovMetricBinding.metricAuthorityVersion
    && value.modelPackVersion === currentRomanovMetricBinding.modelPackVersion
  );
}

export function getRomanovResearchEnvelope(era: RomanovEra) {
  return ROMANOV_METRIC_AUTHORITY.researchEnvelopeMeters[era];
}
