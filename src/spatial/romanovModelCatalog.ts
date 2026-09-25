import type { RomanovEra } from './romanov-hotspots.ts';

export type RomanovTrustMode = 'documented' | 'public';
export type RomanovRuntimeMode = 'model3d' | 'ar' | 'vr';

export type RomanovModelCatalogEntry = {
  id: string;
  era: RomanovEra;
  trustMode: RomanovTrustMode;
  version: number;
  assetPath: string;
  repositoryBlobSha: string;
  assetSha256: string;
  byteSize: number;
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
    repositoryBlobSha: 'dc1184e023b2094926c98e5f5c3fe48d1eef9b40',
    assetSha256: '9431982ba3131cacd623890b6afde1de9e9b57df5aafa45b7f209bf62f71b24b',
    byteSize: 22920,
    sourceIds: ['timm-1857', 'shm-history', 'mos-archaeology', 'mos-plans'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  },
  {
    id: 'romanov-1857-public-v1',
    era: '1857',
    trustMode: 'public',
    version: 1,
    assetPath: 'assets/models/romanov-1857-public-v1.glb',
    repositoryBlobSha: '73dfeb9e1b301349bc7b72ac5d5d3c9566125baa',
    assetSha256: '9ea2490079edfb00a12819375848e76faf1aede6b35cf7ddcfc74ad79452f5e9',
    byteSize: 22940,
    sourceIds: ['timm-1857', 'shm-history', 'mos-archaeology', 'mos-plans'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  },
  {
    id: 'romanov-1859-documented-v1',
    era: '1859',
    trustMode: 'documented',
    version: 1,
    assetPath: 'assets/models/romanov-1859-documented-v1.glb',
    repositoryBlobSha: '6bb05f30b85c04b7fd70a4bee029a6c91205166e',
    assetSha256: '69ddc902cb000f83b5b320ba299f1c32d3cb7d539e426cbaa6ef56769720f8ed',
    byteSize: 7792,
    sourceIds: ['shm-history', 'mos-archaeology', 'mos-plans'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  },
  {
    id: 'romanov-1859-public-v1',
    era: '1859',
    trustMode: 'public',
    version: 1,
    assetPath: 'assets/models/romanov-1859-public-v1.glb',
    repositoryBlobSha: 'e1ad115505089dab312997be586e65e94d459efd',
    assetSha256: '7ab8ad9a456ae11fa84baef71aea0d4050d7fa84cc187e41cbc95cce05e0fc6e',
    byteSize: 86764,
    sourceIds: ['shm-history', 'mos-archaeology', 'mos-plans', 'shm-1859-graphic', 'naidenov-46'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  }
];

export function getRomanovModelCatalogEntry(era: RomanovEra, trustMode: RomanovTrustMode) {
  const entry = romanovModelCatalog.find((item) => item.era === era && item.trustMode === trustMode);
  if (!entry) throw new Error(`Romanov model catalog entry missing: ${era}/${trustMode}`);
  return entry;
}
