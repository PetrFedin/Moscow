import type { RomanovEra } from './romanov-hotspots.ts';

export type RomanovTrustMode = 'documented' | 'public';
export type RomanovRuntimeMode = 'model3d' | 'ar' | 'vr';

export type RomanovModelCatalogEntry = {
  id: string;
  era: RomanovEra;
  trustMode: RomanovTrustMode;
  version: number;
  assetPath: string;
  sourceIds: string[];
  allowedRuntimeModes: RomanovRuntimeMode[];
};

export const ROMANOV_MODEL_PACK_VERSION = 'romanov-v1';

export const romanovModelCatalog: RomanovModelCatalogEntry[] = [
  {
    id: 'romanov-1857-documented-v1',
    era: '1857',
    trustMode: 'documented',
    version: 1,
    assetPath: 'assets/models/romanov-1857-documented-v1.glb',
    sourceIds: ['timm-1857'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  },
  {
    id: 'romanov-1857-public-v1',
    era: '1857',
    trustMode: 'public',
    version: 1,
    assetPath: 'assets/models/romanov-1857-public-v1.glb',
    sourceIds: ['timm-1857'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  },
  {
    id: 'romanov-1859-documented-v1',
    era: '1859',
    trustMode: 'documented',
    version: 1,
    assetPath: 'assets/models/romanov-1859-documented-v1.glb',
    sourceIds: ['naidenov-46', 'shm-history'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  },
  {
    id: 'romanov-1859-public-v1',
    era: '1859',
    trustMode: 'public',
    version: 1,
    assetPath: 'assets/models/romanov-1859-public-v1.glb',
    sourceIds: ['naidenov-46', 'shm-history'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  }
];

export function getRomanovModelCatalogEntry(era: RomanovEra, trustMode: RomanovTrustMode) {
  const entry = romanovModelCatalog.find((item) => item.era === era && item.trustMode === trustMode);
  if (!entry) throw new Error(`Romanov model catalog entry missing: ${era}/${trustMode}`);
  return entry;
}
