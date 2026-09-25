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
  byteSize: number;
  sha256: string;
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
    allowedRuntimeModes: ['model3d', 'ar', 'vr'],
    byteSize: 22920,
    sha256: '9431982ba3131cacd623890b6afde1de9e9b57df5aafa45b7f209bf62f71b24b'
  },
  {
    id: 'romanov-1857-public-v1',
    era: '1857',
    trustMode: 'public',
    version: 1,
    assetPath: 'assets/models/romanov-1857-public-v1.glb',
    sourceIds: ['timm-1857'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr'],
    byteSize: 22940,
    sha256: '9ea2490079edfb00a12819375848e76faf1aede6b35cf7ddcfc74ad79452f5e9'
  },
  {
    id: 'romanov-1859-documented-v1',
    era: '1859',
    trustMode: 'documented',
    version: 1,
    assetPath: 'assets/models/romanov-1859-documented-v1.glb',
    sourceIds: ['naidenov-46', 'shm-history'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr'],
    byteSize: 7792,
    sha256: '69ddc902cb000f83b5b320ba299f1c32d3cb7d539e426cbaa6ef56769720f8ed'
  },
  {
    id: 'romanov-1859-public-v1',
    era: '1859',
    trustMode: 'public',
    version: 1,
    assetPath: 'assets/models/romanov-1859-public-v1.glb',
    sourceIds: ['naidenov-46', 'shm-history'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr'],
    byteSize: 86764,
    sha256: '7ab8ad9a456ae11fa84baef71aea0d4050d7fa84cc187e41cbc95cce05e0fc6e'
  }
];

export function getRomanovModelCatalogEntry(era: RomanovEra, trustMode: RomanovTrustMode) {
  const entry = romanovModelCatalog.find((item) => item.era === era && item.trustMode === trustMode);
  if (!entry) throw new Error(`Romanov model catalog entry missing: ${era}/${trustMode}`);
  return entry;
}
