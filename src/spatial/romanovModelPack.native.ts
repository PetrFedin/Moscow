import type { ImageSourcePropType } from 'react-native';
import type { RomanovEra } from './romanov-hotspots';
import {
  getRomanovModelCatalogEntry,
  romanovModelCatalog,
  type RomanovRuntimeMode,
  type RomanovTrustMode
} from './romanovModelCatalog';

export type { RomanovRuntimeMode, RomanovTrustMode } from './romanovModelCatalog';

export type RomanovModelVariant = {
  id: string;
  era: RomanovEra;
  trustMode: RomanovTrustMode;
  source: ImageSourcePropType;
  version: number;
  sourceIds: string[];
  allowedRuntimeModes: RomanovRuntimeMode[];
};

const bundledSources: Record<string, ImageSourcePropType> = {
  'romanov-1857-documented-v1': require('../../assets/models/romanov-1857-documented-v1.glb'),
  'romanov-1857-public-v1': require('../../assets/models/romanov-1857-public-v1.glb'),
  'romanov-1859-documented-v1': require('../../assets/models/romanov-1859-documented-v1.glb'),
  'romanov-1859-public-v1': require('../../assets/models/romanov-1859-public-v1.glb')
};

/**
 * Authoritative native model pack for the Romanov pilot.
 *
 * Metadata lives in romanovModelCatalog.ts so offline readiness, tests and native
 * rendering all refer to one catalog. Native-only require() calls stay here.
 */
export const romanovModelPack: RomanovModelVariant[] = romanovModelCatalog.map((entry) => {
  const source = bundledSources[entry.id];
  if (!source) throw new Error(`Bundled Romanov GLB missing for catalog entry: ${entry.id}`);
  return { ...entry, source };
});

export function getRomanovModelVariant(era: RomanovEra, trustMode: RomanovTrustMode): RomanovModelVariant {
  const catalogEntry = getRomanovModelCatalogEntry(era, trustMode);
  const variant = romanovModelPack.find((item) => item.id === catalogEntry.id);
  if (!variant) throw new Error(`Romanov model variant missing: ${era}/${trustMode}`);
  return variant;
}

export function getRomanovModelSource(era: RomanovEra, trustMode: RomanovTrustMode): ImageSourcePropType {
  return getRomanovModelVariant(era, trustMode).source;
}
